import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

interface RoomState {
  currentVideoId: string | null;
  currentTimestamp: number;
  isPlaying: boolean;
  queue: Array<{ videoId: string; videoTitle: string; order: number }>;
}

// Store active room states in memory
const roomStates = new Map<string, RoomState>();

export function setupSocketHandlers(io: Server) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as { userId: string };
      (socket as any).userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join a room
    socket.on('join_room', async (data: { roomId: string }) => {
      try {
        const { roomId } = data;
        const userId = (socket as any).userId;

        // Verify room exists
        const room = await prisma.room.findUnique({
          where: { id: roomId },
          include: {
            queue: {
              orderBy: { order: 'asc' }
            }
          }
        });

        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Join the socket room
        socket.join(roomId);
        console.log(`User ${userId} joined room ${roomId}`);

        // Initialize room state if not exists
        if (!roomStates.has(roomId)) {
          roomStates.set(roomId, {
            currentVideoId: room.currentVideoId,
            currentTimestamp: room.currentTimestamp,
            isPlaying: room.isPlaying,
            queue: room.queue.map(q => ({
              videoId: q.videoId,
              videoTitle: q.videoTitle,
              order: q.order
            }))
          });
        }

        // Send current room state to the joining user
        const currentState = roomStates.get(roomId)!;
        socket.emit('room_state', currentState);

        // Notify others in the room
        socket.to(roomId).emit('user_joined', { userId });
      } catch (error) {
        console.error('Join room error:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Leave a room
    socket.on('leave_room', (data: { roomId: string }) => {
      const { roomId } = data;
      socket.leave(roomId);
      socket.to(roomId).emit('user_left', { userId: (socket as any).userId });
      console.log(`User left room ${roomId}`);
    });

    // Play event
    socket.on('play', async (data: { roomId: string; timestamp: number }) => {
      const { roomId, timestamp } = data;

      const state = roomStates.get(roomId);
      if (state) {
        state.isPlaying = true;
        state.currentTimestamp = timestamp;
      }

      // Update database
      await prisma.room.update({
        where: { id: roomId },
        data: { isPlaying: true, currentTimestamp: timestamp }
      });

      // Broadcast to all users in the room except sender
      socket.to(roomId).emit('play', { timestamp });
    });

    // Pause event
    socket.on('pause', async (data: { roomId: string; timestamp: number }) => {
      const { roomId, timestamp } = data;

      const state = roomStates.get(roomId);
      if (state) {
        state.isPlaying = false;
        state.currentTimestamp = timestamp;
      }

      // Update database
      await prisma.room.update({
        where: { id: roomId },
        data: { isPlaying: false, currentTimestamp: timestamp }
      });

      socket.to(roomId).emit('pause', { timestamp });
    });

    // Seek event
    socket.on('seek', async (data: { roomId: string; timestamp: number }) => {
      const { roomId, timestamp } = data;

      const state = roomStates.get(roomId);
      if (state) {
        state.currentTimestamp = timestamp;
      }

      // Update database
      await prisma.room.update({
        where: { id: roomId },
        data: { currentTimestamp: timestamp }
      });

      socket.to(roomId).emit('seek', { timestamp });
    });

    // Change video event
    socket.on('change_video', async (data: { roomId: string; videoId: string; timestamp?: number }) => {
      const { roomId, videoId, timestamp = 0 } = data;

      const state = roomStates.get(roomId);
      if (state) {
        state.currentVideoId = videoId;
        state.currentTimestamp = timestamp;
      }

      // Update database
      await prisma.room.update({
        where: { id: roomId },
        data: { currentVideoId: videoId, currentTimestamp: timestamp }
      });

      socket.to(roomId).emit('change_video', { videoId, timestamp });
    });

    // Update queue event
    socket.on('update_queue', async (data: {
      roomId: string;
      queue: Array<{ videoId: string; videoTitle: string }>
    }) => {
      const { roomId, queue } = data;

      try {
        // Delete existing queue items
        await prisma.queueItem.deleteMany({
          where: { roomId }
        });

        // Create new queue items
        const queueItems = queue.map((item, index) => ({
          roomId,
          videoId: item.videoId,
          videoTitle: item.videoTitle,
          order: index
        }));

        await prisma.queueItem.createMany({
          data: queueItems
        });

        // Update in-memory state
        const state = roomStates.get(roomId);
        if (state) {
          state.queue = queue.map((item, index) => ({
            videoId: item.videoId,
            videoTitle: item.videoTitle,
            order: index
          }));
        }

        // Broadcast to all users in the room including sender
        io.to(roomId).emit('update_queue', { queue });
      } catch (error) {
        console.error('Update queue error:', error);
        socket.emit('error', { message: 'Failed to update queue' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
}
