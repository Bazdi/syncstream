const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Request failed' };
      }

      return { data };
    } catch (error) {
      console.error('API request error:', error);
      return { error: 'Network error' };
    }
  }

  // Auth endpoints
  async register(username: string, email: string, password: string) {
    return this.request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  }

  async login(email: string, password: string) {
    return this.request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getCurrentUser() {
    return this.request<{ user: any }>('/auth/me');
  }

  // Room endpoints
  async createRoom(name: string, tier: 'free' | 'premium' = 'free', isPublic: boolean = true) {
    return this.request<{ room: any }>('/rooms', {
      method: 'POST',
      body: JSON.stringify({ name, tier, isPublic }),
    });
  }

  async getRoom(roomId: string) {
    return this.request<{ room: any }>(`/rooms/${roomId}`);
  }

  async getUserRooms() {
    return this.request<{ rooms: any[] }>('/rooms/user/my-rooms');
  }

  async deleteRoom(roomId: string) {
    return this.request<{ success: boolean }>(`/rooms/${roomId}`, {
      method: 'DELETE',
    });
  }

  async upgradeRoom(roomId: string) {
    return this.request<{ room: any }>(`/rooms/${roomId}/upgrade`, {
      method: 'POST',
    });
  }

  // Room member endpoints
  async getRoomMembers(roomId: string) {
    return this.request<{ members: any[] }>(`/rooms/${roomId}/members`);
  }

  async addRoomMember(roomId: string, userId: string, role: 'viewer' | 'member' | 'moderator' = 'viewer') {
    return this.request<{ member: any }>(`/rooms/${roomId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId, role }),
    });
  }

  async updateMemberRole(roomId: string, userId: string, role: 'viewer' | 'member' | 'moderator') {
    return this.request<{ member: any }>(`/rooms/${roomId}/members/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  async removeMember(roomId: string, userId: string) {
    return this.request<{ success: boolean }>(`/rooms/${roomId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  // Permission endpoints
  async getRoomPermissions(roomId: string) {
    return this.request<{ permissions: any }>(`/rooms/${roomId}/permissions`);
  }

  async updateRoomPermissions(roomId: string, permissions: Partial<{
    canPlay: string;
    canPause: string;
    canSeek: string;
    canChangeVideo: string;
    canAddToQueue: string;
    canRemoveFromQueue: string;
    canReorderQueue: string;
    canClearQueue: string;
    canInviteUsers: string;
    canKickUsers: string;
    canChangeSettings: string;
  }>) {
    return this.request<{ permissions: any }>(`/rooms/${roomId}/permissions`, {
      method: 'PATCH',
      body: JSON.stringify(permissions),
    });
  }

  // YouTube endpoints
  async searchYouTube(query: string, maxResults: number = 10, useAI: boolean = false) {
    return this.request<{ videos: any[]; useAI?: boolean; message?: string }>(
      `/youtube/search?q=${encodeURIComponent(query)}&maxResults=${maxResults}&useAI=${useAI}`
    );
  }
}

export const apiService = new ApiService();
