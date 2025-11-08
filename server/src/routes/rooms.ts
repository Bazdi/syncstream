import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { initializeRoomPermissions, canModifyRoom, getUserRoleInRoom } from '../utils/permissions.js';

const router = express.Router();
const prisma = new PrismaClient();

// Auth middleware
const authenticate = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const createRoomSchema = z.object({
  name: z.string().min(1).max(50),
  tier: z.enum(['free', 'premium']).optional().default('free'),
  isPublic: z.boolean().optional().default(true),
});

// Create a new room
router.post('/', authenticate, async (req: any, res) => {
  try {
    const { name, tier, isPublic } = createRoomSchema.parse(req.body);

    // Check if user can create premium rooms
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { subscriptionStatus: true }
    });

    if (tier === 'premium' && user?.subscriptionStatus !== 'premium') {
      return res.status(403).json({ error: 'Premium subscription required to create premium rooms' });
    }

    const room = await prisma.room.create({
      data: {
        name,
        ownerId: req.userId,
        tier,
        isPublic,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
          }
        },
        queue: true,
        permissions: true,
      }
    });

    // Initialize default permissions
    await initializeRoomPermissions(room.id, tier as 'free' | 'premium');

    // Add owner as member
    await prisma.roomMember.create({
      data: {
        roomId: room.id,
        userId: req.userId,
        role: 'owner',
      }
    });

    res.json({ room });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get room by ID
router.get('/:roomId', authenticate, async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
            subscriptionStatus: true,
          }
        },
        queue: {
          include: {
            addedByUser: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
                subscriptionStatus: true,
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json({ room });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's rooms
router.get('/user/my-rooms', authenticate, async (req: any, res) => {
  try {
    const rooms = await prisma.room.findMany({
      where: {
        ownerId: req.userId,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            subscriptionStatus: true,
          }
        },
        queue: {
          include: {
            addedByUser: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
                subscriptionStatus: true,
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    res.json({ rooms });
  } catch (error) {
    console.error('Get user rooms error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete room
router.delete('/:roomId', authenticate, async (req: any, res) => {
  try {
    const { roomId } = req.params;

    const room = await prisma.room.findUnique({
      where: { id: roomId }
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this room' });
    }

    await prisma.room.delete({
      where: { id: roomId }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get room members
router.get('/:roomId/members', authenticate, async (req, res) => {
  try {
    const { roomId } = req.params;

    const members = await prisma.roomMember.findMany({
      where: { roomId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
          }
        }
      },
      orderBy: {
        joinedAt: 'asc'
      }
    });

    res.json({ members });
  } catch (error) {
    console.error('Get room members error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add member to room
const addMemberSchema = z.object({
  userId: z.string(),
  role: z.enum(['viewer', 'member', 'moderator']).optional().default('viewer'),
});

router.post('/:roomId/members', authenticate, async (req: any, res) => {
  try {
    const { roomId } = req.params;
    const { userId, role } = addMemberSchema.parse(req.body);

    // Check if requester can invite users
    const canInvite = await canModifyRoom(req.userId, roomId);
    if (!canInvite) {
      return res.status(403).json({ error: 'Not authorized to invite users' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already a member
    const existing = await prisma.roomMember.findUnique({
      where: {
        roomId_userId: { roomId, userId }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'User is already a member' });
    }

    const member = await prisma.roomMember.create({
      data: {
        roomId,
        userId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
          }
        }
      }
    });

    res.json({ member });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update member role
const updateRoleSchema = z.object({
  role: z.enum(['viewer', 'member', 'moderator']),
});

router.patch('/:roomId/members/:userId', authenticate, async (req: any, res) => {
  try {
    const { roomId, userId } = req.params;
    const { role } = updateRoleSchema.parse(req.body);

    // Only room owner can change roles
    if (!(await canModifyRoom(req.userId, roomId))) {
      return res.status(403).json({ error: 'Only room owner can change roles' });
    }

    const member = await prisma.roomMember.update({
      where: {
        roomId_userId: { roomId, userId }
      },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
          }
        }
      }
    });

    res.json({ member });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove member from room
router.delete('/:roomId/members/:userId', authenticate, async (req: any, res) => {
  try {
    const { roomId, userId } = req.params;

    // Check if requester can kick users
    const requesterRole = await getUserRoleInRoom(req.userId, roomId);
    if (requesterRole !== 'owner' && requesterRole !== 'moderator') {
      return res.status(403).json({ error: 'Not authorized to remove users' });
    }

    // Can't remove owner
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (room?.ownerId === userId) {
      return res.status(400).json({ error: 'Cannot remove room owner' });
    }

    await prisma.roomMember.delete({
      where: {
        roomId_userId: { roomId, userId }
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get room permissions
router.get('/:roomId/permissions', authenticate, async (req, res) => {
  try {
    const { roomId } = req.params;

    const permissions = await prisma.roomPermissions.findUnique({
      where: { roomId }
    });

    res.json({ permissions });
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update room permissions
const updatePermissionsSchema = z.object({
  canPlay: z.enum(['everyone', 'members', 'moderators', 'owner']).optional(),
  canPause: z.enum(['everyone', 'members', 'moderators', 'owner']).optional(),
  canSeek: z.enum(['everyone', 'members', 'moderators', 'owner']).optional(),
  canChangeVideo: z.enum(['everyone', 'members', 'moderators', 'owner']).optional(),
  canAddToQueue: z.enum(['everyone', 'members', 'moderators', 'owner']).optional(),
  canRemoveFromQueue: z.enum(['everyone', 'members', 'moderators', 'owner']).optional(),
  canReorderQueue: z.enum(['everyone', 'members', 'moderators', 'owner']).optional(),
  canClearQueue: z.enum(['everyone', 'members', 'moderators', 'owner']).optional(),
  canInviteUsers: z.enum(['everyone', 'members', 'moderators', 'owner']).optional(),
  canKickUsers: z.enum(['everyone', 'members', 'moderators', 'owner']).optional(),
  canChangeSettings: z.enum(['everyone', 'members', 'moderators', 'owner']).optional(),
});

router.patch('/:roomId/permissions', authenticate, async (req: any, res) => {
  try {
    const { roomId } = req.params;
    const updates = updatePermissionsSchema.parse(req.body);

    // Only room owner can change permissions
    if (!(await canModifyRoom(req.userId, roomId))) {
      return res.status(403).json({ error: 'Only room owner can change permissions' });
    }

    const permissions = await prisma.roomPermissions.update({
      where: { roomId },
      data: updates,
    });

    res.json({ permissions });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update permissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upgrade room to premium
router.post('/:roomId/upgrade', authenticate, async (req: any, res) => {
  try {
    const { roomId } = req.params;

    // Only room owner can upgrade
    if (!(await canModifyRoom(req.userId, roomId))) {
      return res.status(403).json({ error: 'Only room owner can upgrade room' });
    }

    // Check user subscription
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { subscriptionStatus: true }
    });

    if (user?.subscriptionStatus !== 'premium') {
      return res.status(403).json({ error: 'Premium subscription required' });
    }

    const room = await prisma.room.update({
      where: { id: roomId },
      data: { tier: 'premium' },
      include: {
        permissions: true,
      }
    });

    res.json({ room });
  } catch (error) {
    console.error('Upgrade room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
