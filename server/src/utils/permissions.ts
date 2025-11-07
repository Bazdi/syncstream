import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type Role = 'owner' | 'moderator' | 'member' | 'viewer';
export type PermissionLevel = 'everyone' | 'members' | 'moderators' | 'owner';

const roleHierarchy: Record<Role, number> = {
  viewer: 0,
  member: 1,
  moderator: 2,
  owner: 3,
};

const permissionLevelToRole: Record<PermissionLevel, number> = {
  everyone: 0,
  members: 1,
  moderators: 2,
  owner: 3,
};

/**
 * Get user's role in a room
 */
export async function getUserRoleInRoom(
  userId: string,
  roomId: string
): Promise<Role | null> {
  // Check if user is the room owner
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { ownerId: true }
  });

  if (!room) return null;
  if (room.ownerId === userId) return 'owner';

  // Check membership
  const membership = await prisma.roomMember.findUnique({
    where: {
      roomId_userId: {
        roomId,
        userId,
      }
    }
  });

  return membership ? (membership.role as Role) : null;
}

/**
 * Check if a user has permission to perform an action
 */
export async function hasPermission(
  userId: string,
  roomId: string,
  action: keyof Omit<
    import('@prisma/client').RoomPermissions,
    'id' | 'roomId' | 'createdAt' | 'updatedAt'
  >
): Promise<boolean> {
  // Get user's role
  const userRole = await getUserRoleInRoom(userId, roomId);

  // If user is not in the room, check if room is public and action allows everyone
  if (!userRole) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { permissions: true }
    });

    if (!room) return false;
    if (!room.isPublic) return false;

    const permissions = room.permissions;
    if (!permissions) return true; // No permissions set, allow by default

    const requiredLevel = permissions[action] as PermissionLevel;
    return requiredLevel === 'everyone';
  }

  // Get room permissions
  const permissions = await prisma.roomPermissions.findUnique({
    where: { roomId }
  });

  // If no permissions set, allow by default
  if (!permissions) return true;

  const requiredLevel = permissions[action] as PermissionLevel;
  const userLevel = roleHierarchy[userRole];
  const requiredRoleLevel = permissionLevelToRole[requiredLevel];

  return userLevel >= requiredRoleLevel;
}

/**
 * Check if user can modify room settings (owner only)
 */
export async function canModifyRoom(userId: string, roomId: string): Promise<boolean> {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { ownerId: true }
  });

  return room?.ownerId === userId;
}

/**
 * Check if room is premium tier
 */
export async function isRoomPremium(roomId: string): Promise<boolean> {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { tier: true }
  });

  return room?.tier === 'premium';
}

/**
 * Get default permissions for room tier
 */
export function getDefaultPermissions(tier: 'free' | 'premium') {
  if (tier === 'free') {
    return {
      canPlay: 'everyone',
      canPause: 'everyone',
      canSeek: 'everyone',
      canChangeVideo: 'everyone',
      canAddToQueue: 'everyone',
      canRemoveFromQueue: 'members',
      canReorderQueue: 'moderators',
      canClearQueue: 'owner',
      canInviteUsers: 'members',
      canKickUsers: 'moderators',
      canChangeSettings: 'owner',
    };
  }

  // Premium rooms have more restrictive defaults for better control
  return {
    canPlay: 'members',
    canPause: 'members',
    canSeek: 'members',
    canChangeVideo: 'members',
    canAddToQueue: 'members',
    canRemoveFromQueue: 'members',
    canReorderQueue: 'moderators',
    canClearQueue: 'owner',
    canInviteUsers: 'members',
    canKickUsers: 'moderators',
    canChangeSettings: 'owner',
  };
}

/**
 * Initialize default permissions for a room
 */
export async function initializeRoomPermissions(roomId: string, tier: 'free' | 'premium') {
  const defaults = getDefaultPermissions(tier);

  return await prisma.roomPermissions.create({
    data: {
      roomId,
      ...defaults,
    }
  });
}
