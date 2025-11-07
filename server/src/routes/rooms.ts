import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

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
});

// Create a new room
router.post('/', authenticate, async (req: any, res) => {
  try {
    const { name } = createRoomSchema.parse(req.body);

    const room = await prisma.room.create({
      data: {
        name,
        ownerId: req.userId,
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
          }
        },
        queue: {
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
        queue: {
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

export default router;
