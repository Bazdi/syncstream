import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

interface RoomState {
  currentVideoId: string | null;
  currentTimestamp: number;
  isPlaying: boolean;
  queue: Array<{ videoId: string; videoTitle: string; order: number }>;
}

export class SocketService {
  private socket: Socket | null = null;
  private currentRoomId: string | null = null;

  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });
  }

  disconnect() {
    if (this.currentRoomId) {
      this.leaveRoom(this.currentRoomId);
    }
    this.socket?.disconnect();
    this.socket = null;
  }

  joinRoom(roomId: string) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }

    this.currentRoomId = roomId;
    this.socket.emit('join_room', { roomId });
  }

  leaveRoom(roomId: string) {
    if (!this.socket) return;

    this.socket.emit('leave_room', { roomId });
    this.currentRoomId = null;
  }

  // Event emitters
  play(roomId: string, timestamp: number) {
    this.socket?.emit('play', { roomId, timestamp });
  }

  pause(roomId: string, timestamp: number) {
    this.socket?.emit('pause', { roomId, timestamp });
  }

  seek(roomId: string, timestamp: number) {
    this.socket?.emit('seek', { roomId, timestamp });
  }

  changeVideo(roomId: string, videoId: string, timestamp: number = 0) {
    this.socket?.emit('change_video', { roomId, videoId, timestamp });
  }

  updateQueue(roomId: string, queue: Array<{ videoId: string; videoTitle: string }>) {
    this.socket?.emit('update_queue', { roomId, queue });
  }

  // Event listeners
  onRoomState(callback: (state: RoomState) => void) {
    this.socket?.on('room_state', callback);
  }

  onPlay(callback: (data: { timestamp: number }) => void) {
    this.socket?.on('play', callback);
  }

  onPause(callback: (data: { timestamp: number }) => void) {
    this.socket?.on('pause', callback);
  }

  onSeek(callback: (data: { timestamp: number }) => void) {
    this.socket?.on('seek', callback);
  }

  onChangeVideo(callback: (data: { videoId: string; timestamp: number }) => void) {
    this.socket?.on('change_video', callback);
  }

  onUpdateQueue(callback: (data: { queue: Array<{ videoId: string; videoTitle: string; order: number }> }) => void) {
    this.socket?.on('update_queue', callback);
  }

  onUserJoined(callback: (data: { userId: string }) => void) {
    this.socket?.on('user_joined', callback);
  }

  onUserLeft(callback: (data: { userId: string }) => void) {
    this.socket?.on('user_left', callback);
  }

  // Remove listeners
  off(event: string) {
    this.socket?.off(event);
  }
}

export const socketService = new SocketService();
