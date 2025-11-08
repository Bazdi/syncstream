
export interface Video {
    title: string;
    url: string; // This is the YouTube video ID
}

export interface Message {
    id: number | string;
    author: 'user' | 'ai';
    text: string;
    avatar: string;
}

// From SponsorBlock API
export interface SkipSegment {
    category: string;
    segment: [number, number];
    UUID: string;
}

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
