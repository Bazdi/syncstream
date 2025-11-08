# RBAC UI Components Implementation

This document describes the complete RBAC (Role-Based Access Control) UI implementation for the SyncStream Watch Together platform.

## Overview

The UI components have been fully integrated with the existing backend RBAC system, providing a complete multi-user room management experience with granular permission controls.

## New Components Created

### 1. RoomCreation Component (`components/RoomCreation.tsx`)

A modal dialog for creating new rooms with advanced tier selection.

**Features:**
- Room name input with validation
- Tier selection (Free vs Premium)
- Visual tier comparison
- Privacy settings (Public/Private)
- Premium features preview
- Subscription requirement validation
- Premium users can create premium rooms
- Free users limited to free tier rooms

**Props:**
- `currentUser: User` - The logged-in user
- `onClose: () => void` - Close modal callback
- `onCreate: (roomId: string) => void` - Success callback with new room ID

### 2. RoomSettings Component (`components/RoomSettings.tsx`)

A comprehensive modal for managing room permissions (owner only).

**Features:**
- Displays current room tier badge (Free/Premium)
- Full permission configuration interface
- 11 granular permission settings across 3 categories:
  - **Playback Controls**: Play, Pause, Seek, Change Video
  - **Queue Management**: Add, Remove, Reorder, Clear Queue
  - **Room Management**: Invite Users, Kick Users, Change Settings
- Each permission has 4 levels: Everyone, Members, Moderators, Owner Only
- Read-only mode for non-owners
- Real-time save with success/error feedback
- Auto-close after successful save

**Props:**
- `room: Room` - The current room
- `currentUser: User` - The logged-in user
- `onClose: () => void` - Close modal callback
- `onUpdate: () => void` - Refresh data callback

### 3. MemberList Component (`components/MemberList.tsx`)

A sophisticated member management panel with role-based controls.

**Features:**
- Displays all room members with avatars
- Role badges with visual hierarchy (Owner 👑, Moderator 🛡️, Member 👤, Viewer 👁️)
- Premium user badges
- Role change dropdowns (moderator+ only)
- Kick member functionality (moderator+ only)
- Sort members by role hierarchy
- Owner cannot be modified or kicked
- Moderators can only kick members/viewers (not other moderators)
- Owner can modify all members including moderators
- "You" indicator for current user

**Props:**
- `room: Room` - The current room
- `currentUser: User` - The logged-in user
- `onUpdate: () => void` - Refresh data callback

## Updated Components

### 4. VideoQueue Component (Updated)

Enhanced with permission checks and user attribution.

**New Features:**
- Shows who added each video ("Added by username")
- Permission-based UI disabling
- Permission error messages with auto-dismiss
- Tooltips explaining permission requirements
- Visual feedback for disabled actions
- Changed from `Video[]` to `QueueItem[]` type

**New Props:**
- `currentUser: User | null` - Current logged-in user
- `canRemoveFromQueue: boolean` - Permission check
- `canClearQueue: boolean` - Permission check
- `canChangeVideo: boolean` - Permission check

### 5. SearchBar Component (Updated)

Enhanced with AI search toggle and permission validation.

**New Features:**
- AI/Direct search mode toggle (🤖 AI Search / 🔍 Direct Search)
- Permission check before adding videos
- Permission error messages
- Visual feedback for disabled add actions
- Dynamic placeholder text based on search mode
- Separate loading messages for AI vs Direct search

**New Props:**
- `onSearch: (query: string, useAI: boolean) => void` - Updated signature
- `canAddToQueue: boolean` - Permission check

### 6. App.tsx (Completely Rewritten)

Fully integrated room-based architecture with real-time sync.

**New Features:**
- Room selection screen
- Socket.io connection management
- Real-time room synchronization
- Permission loading and caching
- User role determination
- Permission checking utility function
- Room creation workflow
- Room settings access
- Member list access
- Room switcher in header
- Room tier badge display
- Improved header with room info

**State Management:**
- Room state (rooms, currentRoom, permissions, userRole)
- Modal visibility (roomCreation, roomSettings, memberList)
- Video state (queue as QueueItem[], currentVideoId, search)
- WebSocket event handlers

## Type Definitions (types.ts)

Added comprehensive TypeScript interfaces:

```typescript
export interface User {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string;
    subscriptionStatus: 'free' | 'premium';
}

export type Role = 'owner' | 'moderator' | 'member' | 'viewer';
export type PermissionLevel = 'everyone' | 'members' | 'moderators' | 'owner';
export type RoomTier = 'free' | 'premium';

export interface RoomMember {
    id: string;
    userId: string;
    roomId: string;
    role: Role;
    joinedAt: string;
    user: User;
}

export interface RoomPermissions {
    id: string;
    roomId: string;
    // Playback controls
    canPlay: PermissionLevel;
    canPause: PermissionLevel;
    canSeek: PermissionLevel;
    canChangeVideo: PermissionLevel;
    // Queue management
    canAddToQueue: PermissionLevel;
    canRemoveFromQueue: PermissionLevel;
    canReorderQueue: PermissionLevel;
    canClearQueue: PermissionLevel;
    // Room management
    canInviteUsers: PermissionLevel;
    canKickUsers: PermissionLevel;
    canChangeSettings: PermissionLevel;
}

export interface QueueItem {
    id: string;
    roomId: string;
    videoId: string;
    videoTitle: string;
    order: number;
    addedBy?: string;
    addedByUser?: User;
}

export interface Room {
    id: string;
    name: string;
    ownerId: string;
    tier: RoomTier;
    isPublic: boolean;
    currentVideoId?: string;
    currentTimestamp: number;
    isPlaying: boolean;
    owner?: User;
    members?: RoomMember[];
    queue?: QueueItem[];
    permissions?: RoomPermissions;
}
```

## User Flow

### 1. Login
- User logs in via Auth.tsx
- Token stored and API service initialized

### 2. Room Selection
- App loads user's rooms
- Displays room cards with tier and privacy badges
- Shows owner status
- "Create New Room" button

### 3. Room Creation
- Click "Create New Room"
- Choose room name
- Select tier (Free/Premium)
- Set privacy (Public/Private)
- See premium features preview
- Create room and auto-join

### 4. In-Room Experience
- Header shows room name and tier badge
- Search bar with AI toggle (respects canAddToQueue permission)
- Member list button (👥)
- Settings button (⚙️) - owner gets full control, others see read-only
- Rooms button to switch rooms
- Video queue shows who added each video
- Permission checks on all interactions
- Real-time sync via WebSocket

### 5. Room Settings (Owner)
- Click ⚙️ button
- Modify all 11 permissions
- Each permission has 4 levels
- Save changes
- Changes immediately reflected for all users

### 6. Member Management (Moderator+)
- Click 👥 button
- See all members with roles
- Change member roles (if owner)
- Kick members (if moderator+)
- Cannot kick owner or modify self

## Permission Hierarchy

### Roles (ascending power):
1. **Viewer** (Level 0) - Can only watch
2. **Member** (Level 1) - Basic participation
3. **Moderator** (Level 2) - Moderation powers
4. **Owner** (Level 3) - Full control

### Permission Levels (ascending restriction):
1. **Everyone** (Level 0) - All users including non-members
2. **Members** (Level 1) - Requires member role or higher
3. **Moderators** (Level 2) - Requires moderator or owner
4. **Owner** (Level 3) - Owner only

### Permission Check Logic:
```typescript
canPerformAction = (userRoleLevel >= permissionRequiredLevel)
```

## Default Permissions

### Free Tier Rooms:
- Open and collaborative
- Most playback controls: Everyone
- Queue add: Everyone
- Queue remove: Members
- Queue reorder: Moderators
- Moderation: Moderators+

### Premium Tier Rooms:
- More restrictive
- Most playback controls: Members
- Queue management: Members+
- Better moderation control
- Suitable for private viewing parties

## Visual Design

### Color Scheme:
- **Free Tier**: Purple accent (`bg-purple-600`)
- **Premium Tier**: Gold accent (`bg-yellow-600`, `text-yellow-400`)
- **Roles**:
  - Owner: Gold (`bg-yellow-500`)
  - Moderator: Purple (`bg-purple-500`)
  - Member: Blue (`bg-blue-500`)
  - Viewer: Gray (`bg-gray-500`)

### UI Patterns:
- Modal overlays with backdrop blur
- Dark theme (gray-800/900)
- Consistent border radius (rounded-lg)
- Smooth transitions
- Toast notifications for feedback
- Permission error messages (red alert boxes)
- Disabled states for restricted actions

## Integration Points

### Backend APIs Used:
- `POST /api/rooms` - Create room
- `GET /api/rooms/:id` - Get room details
- `GET /api/rooms/user/my-rooms` - List user's rooms
- `GET /api/rooms/:id/members` - List members
- `PATCH /api/rooms/:id/members/:userId` - Update member role
- `DELETE /api/rooms/:id/members/:userId` - Kick member
- `GET /api/rooms/:id/permissions` - Get permissions
- `PATCH /api/rooms/:id/permissions` - Update permissions
- `GET /api/youtube/search` - Search with AI toggle

### WebSocket Events:
- `join_room` - Join room on selection
- `leave_room` - Leave on room change
- `room_state` - Receive playback state
- `queue_updated` - Receive queue changes
- `add_to_queue` - Add video
- `remove_from_queue` - Remove video
- `update_queue` - Clear/reorder queue
- `change_video` - Switch video
- `error` - Permission denied messages

## Key Features Implemented

✅ Room creation with tier selection
✅ Room selection interface
✅ Permission settings panel (11 permissions)
✅ Member list with role badges
✅ Role assignment dropdowns
✅ Member kick functionality
✅ Search mode toggle (AI/Direct)
✅ Permission checks on all UI controls
✅ Permission error messages
✅ Room tier badges throughout UI
✅ Video adder attribution in queue
✅ Public/private room indicators
✅ Premium user badges
✅ Real-time synchronization
✅ Responsive design
✅ Toast notifications

## Testing Recommendations

1. **Create rooms** as free and premium users
2. **Test permissions** at each role level
3. **Verify role changes** reflect immediately
4. **Test member kicks** and re-joins
5. **Try AI vs Direct search** modes
6. **Verify queue attributions** show correct usernames
7. **Test permission errors** appear when restricted
8. **Verify real-time sync** across multiple browser windows
9. **Test room switching** and state persistence
10. **Verify premium features** are gated correctly

## Future Enhancements

- [ ] Invite members by username/email
- [ ] Room search/browse for public rooms
- [ ] Room analytics (view counts, popular videos)
- [ ] Custom room themes/backgrounds
- [ ] Scheduled watch parties
- [ ] Video playback synchronization controls
- [ ] Chat integration with room
- [ ] Reaction/emojis during playback
- [ ] Room announcements/MOTD
- [ ] Advanced moderation (mute, ban)

## Files Modified/Created

### Created:
- `components/RoomCreation.tsx` (169 lines)
- `components/RoomSettings.tsx` (254 lines)
- `components/MemberList.tsx` (166 lines)

### Modified:
- `types.ts` - Added RBAC types
- `App.tsx` - Complete rewrite with room integration (440 lines)
- `components/VideoQueue.tsx` - Added permissions and user attribution
- `components/SearchBar.tsx` - Added AI toggle and permissions
- `components/RoomManager.tsx` - Updated prop types

### Documentation:
- `RBAC_UI_IMPLEMENTATION.md` (this file)

## Summary

The RBAC UI implementation is complete and fully integrated with the backend. Users can now:

1. Create rooms with tier selection
2. Manage room permissions (owners)
3. Manage members and roles (moderators+)
4. See permission-based UI restrictions
5. Toggle between AI and direct search
6. See who added each video
7. Experience real-time multi-user synchronization

The implementation follows best practices for React/TypeScript, maintains consistent design patterns, and provides comprehensive user feedback through toasts and error messages.
