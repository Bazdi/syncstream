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
  async createRoom(name: string) {
    return this.request<{ room: any }>('/rooms', {
      method: 'POST',
      body: JSON.stringify({ name }),
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

  // YouTube endpoints
  async searchYouTube(query: string, maxResults: number = 10) {
    return this.request<{ videos: any[] }>(
      `/youtube/search?q=${encodeURIComponent(query)}&maxResults=${maxResults}`
    );
  }
}

export const apiService = new ApiService();
