# SyncStream Advanced Features

This document details the advanced features implemented for granular permission control, room management, and enhanced search capabilities.

## Table of Contents
- [Granular Permission System](#granular-permission-system)
- [Room Tiers (Free vs Premium)](#room-tiers-free-vs-premium)
- [Room Member Management](#room-member-management)
- [Search Toggle (AI vs YouTube API)](#search-toggle-ai-vs-youtube-api)
- [API Reference](#api-reference)

---

## Granular Permission System

### Overview
Each room has fine-grained permissions that control who can perform specific actions. Room owners can customize these permissions to create the perfect viewing experience.

### Permission Levels
- `everyone` - Anyone in the room (including non-members)
- `members` - Only room members
- `moderators` - Only moderators and above
- `owner` - Only the room owner

### Available Permissions

#### Playback Controls
- **canPlay** - Who can play videos (default: `everyone` for free, `members` for premium)
- **canPause** - Who can pause videos (default: `everyone` for free, `members` for premium)
- **canSeek** - Who can seek/scrub the timeline (default: `everyone` for free, `members` for premium)
- **canChangeVideo** - Who can switch to a different video (default: `everyone` for free, `members` for premium)

#### Queue Management
- **canAddToQueue** - Who can add videos to the queue (default: `everyone`)
- **canRemoveFromQueue** - Who can remove videos from the queue (default: `members`)
- **canReorderQueue** - Who can reorder the queue (default: `moderators`)
- **canClearQueue** - Who can clear the entire queue (default: `owner`)

#### Room Settings
- **canInviteUsers** - Who can invite new users (default: `members`)
- **canKickUsers** - Who can remove users from the room (default: `moderators`)
- **canChangeSettings** - Who can modify room settings (default: `owner`)

### Use Cases

#### Example 1: Presentation Mode (Premium)
Perfect for watch parties where the host wants full control:
```json
{
  "canPlay": "owner",
  "canPause": "owner",
  "canSeek": "owner",
  "canChangeVideo": "owner",
  "canAddToQueue": "moderators",
  "canRemoveFromQueue": "moderators"
}
```

#### Example 2: Collaborative Playlist (Free)
Everyone can contribute and control playback:
```json
{
  "canPlay": "everyone",
  "canPause": "everyone",
  "canSeek": "members",
  "canChangeVideo": "members",
  "canAddToQueue": "everyone",
  "canRemoveFromQueue": "members"
}
```

#### Example 3: Curated Viewing (Premium)
Moderators control playback, members can add to queue:
```json
{
  "canPlay": "moderators",
  "canPause": "moderators",
  "canSeek": "moderators",
  "canChangeVideo": "moderators",
  "canAddToQueue": "members",
  "canRemoveFromQueue": "moderators"
}
```

---

## Room Tiers (Free vs Premium)

### Free Rooms
- **Default permissions**: Open and collaborative
- **Public by default**: Anyone can join
- **Best for**: Casual watch parties, open collaboration
- **Limitations**: More permissive defaults

### Premium Rooms
- **Default permissions**: More restrictive for better control
- **Private option**: Can be made invite-only
- **Best for**: Professional presentations, moderated viewing sessions
- **Features**:
  - Granular permission customization
  - Private room option
  - Advanced moderation tools
  - Better control over viewer experience

### Upgrading to Premium
Requirements:
1. User must have premium subscription status
2. User must be the room owner
3. Use the upgrade endpoint: `POST /api/rooms/:roomId/upgrade`

---

## Room Member Management

### User Roles

#### Owner
- Full control over the room
- Can modify all settings and permissions
- Can upgrade/downgrade room tier
- Cannot be removed from the room
- Automatically assigned to room creator

#### Moderator
- Can manage members (invite/kick)
- Can reorder queue (by default)
- Can enforce room rules
- Assigned by owner

#### Member
- Regular room participant
- Has more privileges than viewers
- Can be assigned by owner or moderators

#### Viewer
- Basic participant
- Limited permissions
- Default role for new joiners in public rooms

### Member Management Operations

#### Adding Members
```
POST /api/rooms/:roomId/members
Body: { userId: string, role: 'viewer' | 'member' | 'moderator' }
```

#### Changing Roles
```
PATCH /api/rooms/:roomId/members/:userId
Body: { role: 'viewer' | 'member' | 'moderator' }
```
*Note: Only owners can change roles*

#### Removing Members
```
DELETE /api/rooms/:roomId/members/:userId
```
*Note: Moderators and owners can remove members, but cannot remove the owner*

#### Viewing Members
```
GET /api/rooms/:roomId/members
Returns: List of all members with their roles and join dates
```

---

## Search Toggle (AI vs YouTube API)

### Overview
SyncStream supports two search methods that can be toggled based on user preference or API availability:

### YouTube Data API
- **Pros**:
  - Fast and accurate results
  - Rich metadata (thumbnails, channel info, descriptions)
  - Structured data
- **Cons**:
  - Requires API key
  - Daily quota limits
  - Cost implications for high usage

### AI-Powered Search (Gemini)
- **Pros**:
  - No YouTube API quota usage
  - Natural language processing
  - Smart recommendations
  - Contextual understanding
- **Cons**:
  - Requires parsing AI response
  - May be slower than API
  - Results depend on AI model accuracy

### Implementation

#### Backend Endpoint
```
GET /api/youtube/search?q=query&maxResults=10&useAI=false
```

Parameters:
- `q`: Search query (required)
- `maxResults`: Number of results (default: 10)
- `useAI`: Force AI search mode (default: false)

#### Response Format
```json
{
  "videos": [...],
  "useAI": false,
  "message": "Optional message about API status"
}
```

#### Auto-Fallback Behavior
The backend automatically suggests AI mode when:
1. YouTube API key is not configured
2. API quota is exceeded (403/429 errors)
3. API request fails

#### Frontend Integration
The frontend should:
1. Try YouTube API first (if configured)
2. Fall back to AI search if API is unavailable
3. Allow users to toggle between modes
4. Display appropriate loading states for each mode

---

## API Reference

### Room Management

#### Create Room
```
POST /api/rooms
Headers: Authorization: Bearer <token>
Body: {
  name: string,
  tier: 'free' | 'premium' (optional, default: 'free'),
  isPublic: boolean (optional, default: true)
}
```

#### Get Room
```
GET /api/rooms/:roomId
Headers: Authorization: Bearer <token>
```

#### Get User's Rooms
```
GET /api/rooms/user/my-rooms
Headers: Authorization: Bearer <token>
```

#### Delete Room
```
DELETE /api/rooms/:roomId
Headers: Authorization: Bearer <token>
Note: Must be room owner
```

#### Upgrade Room to Premium
```
POST /api/rooms/:roomId/upgrade
Headers: Authorization: Bearer <token>
Note: Requires premium subscription
```

### Permission Management

#### Get Room Permissions
```
GET /api/rooms/:roomId/permissions
Headers: Authorization: Bearer <token>
```

#### Update Room Permissions
```
PATCH /api/rooms/:roomId/permissions
Headers: Authorization: Bearer <token>
Body: {
  canPlay: 'everyone' | 'members' | 'moderators' | 'owner',
  canPause: ...,
  // ... other permissions (all optional)
}
Note: Must be room owner
```

### Member Management

#### Get Room Members
```
GET /api/rooms/:roomId/members
Headers: Authorization: Bearer <token>
```

#### Add Member
```
POST /api/rooms/:roomId/members
Headers: Authorization: Bearer <token>
Body: {
  userId: string,
  role: 'viewer' | 'member' | 'moderator' (optional, default: 'viewer')
}
```

#### Update Member Role
```
PATCH /api/rooms/:roomId/members/:userId
Headers: Authorization: Bearer <token>
Body: { role: 'viewer' | 'member' | 'moderator' }
Note: Must be room owner
```

#### Remove Member
```
DELETE /api/rooms/:roomId/members/:userId
Headers: Authorization: Bearer <token>
Note: Must be owner or moderator
```

### WebSocket Events

#### New Events

**add_to_queue**
```javascript
socket.emit('add_to_queue', {
  roomId: string,
  video: { videoId: string, videoTitle: string }
});
```

**remove_from_queue**
```javascript
socket.emit('remove_from_queue', {
  roomId: string,
  videoId: string
});
```

**queue_updated** (received)
```javascript
socket.on('queue_updated', (data) => {
  // data.queue contains the updated queue
});
```

#### Permission Errors
All WebSocket events now emit permission errors:
```javascript
socket.on('error', (data) => {
  console.error(data.message);
  // Example: "You do not have permission to pause videos"
});
```

---

## Implementation Examples

### Example 1: Creating a Premium Presentation Room

```javascript
// 1. Create premium room
const response = await apiService.createRoom('My Presentation', 'premium', false);
const roomId = response.data.room.id;

// 2. Set strict permissions
await apiService.updateRoomPermissions(roomId, {
  canPlay: 'owner',
  canPause: 'owner',
  canSeek: 'owner',
  canChangeVideo: 'owner',
  canAddToQueue: 'moderators',
  canRemoveFromQueue: 'moderators',
  canReorderQueue: 'moderators',
});

// 3. Add moderators
await apiService.addMember(roomId, moderatorUserId, 'moderator');

// 4. Invite viewers
await apiService.addMember(roomId, viewerUserId, 'viewer');
```

### Example 2: Collaborative Free Room

```javascript
// 1. Create free public room
const response = await apiService.createRoom('Watch Party', 'free', true);
const roomId = response.data.room.id;

// 2. Set collaborative permissions
await apiService.updateRoomPermissions(roomId, {
  canPlay: 'everyone',
  canPause: 'members',
  canSeek: 'members',
  canChangeVideo: 'members',
  canAddToQueue: 'everyone',
  canRemoveFromQueue: 'members',
});
```

### Example 3: Smart Search with AI Fallback

```javascript
async function searchVideos(query) {
  // Try YouTube API first
  const response = await apiService.searchYouTube(query);

  if (response.data.useAI) {
    // Fallback to AI search
    console.log('Using AI search:', response.data.message);
    return await searchWithAI(query);
  }

  return response.data.videos;
}
```

---

## Best Practices

### For Room Owners

1. **Start with defaults**: Test default permissions before customizing
2. **Gradual restrictions**: Start open, then restrict as needed
3. **Clear communication**: Inform members about permission changes
4. **Role assignment**: Assign moderators to help manage large rooms
5. **Regular audits**: Review member list and permissions periodically

### For Developers

1. **Handle permission errors**: Always listen for error events from WebSocket
2. **UI feedback**: Disable buttons/controls that users don't have permission to use
3. **Graceful degradation**: Fall back to AI search when YouTube API is unavailable
4. **Optimistic updates**: Update UI optimistically, rollback on errors
5. **Real-time sync**: Listen for queue_updated events to stay in sync

### For Premium Features

1. **Validate subscription**: Check user subscription status before offering premium features
2. **Upgrade prompts**: Show helpful prompts for premium features
3. **Feature gates**: Clearly indicate which features require premium
4. **Value proposition**: Communicate benefits of premium tier

---

## Troubleshooting

### Permission Errors
**Problem**: "You do not have permission to..."
**Solution**:
- Check your role in the room
- Ask room owner to adjust permissions
- Verify you're a member (not just a viewer)

### YouTube API Issues
**Problem**: "YouTube API not configured" or quota exceeded
**Solution**:
- Switch to AI search mode
- Contact admin to add YouTube API key
- Wait for quota reset (happens daily)

### Member Management Issues
**Problem**: Can't add/remove members
**Solution**:
- Verify you have appropriate role (owner/moderator)
- Check if room is private (requires proper invite permissions)
- Ensure user exists and is not already a member

---

## Future Enhancements

Potential features for future versions:

1. **Temporary Permissions**: Time-limited permission grants
2. **Permission Templates**: Save and reuse permission configurations
3. **Advanced Roles**: Custom roles with specific permission sets
4. **Audit Log**: Track who made changes and when
5. **Bulk Operations**: Add/remove multiple members at once
6. **Invitation Links**: Generate shareable invite links with expiration
7. **Room Categories**: Tag rooms by genre/type
8. **Analytics**: Track viewing patterns and member engagement

---

For more information, see:
- [API Documentation](server/README.md)
- [Setup Guide](SETUP.md)
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md)
