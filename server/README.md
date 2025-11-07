# SyncStream Backend Server

This is the backend server for SyncStream, providing real-time room synchronization, user authentication, and persistent storage.

## Features

- **Real-Time Synchronization**: WebSocket-based room synchronization using Socket.io
- **User Authentication**: JWT-based authentication system
- **Persistent Rooms**: PostgreSQL database with Prisma ORM
- **YouTube API Proxy**: Secure YouTube Data API integration

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database
- YouTube Data API key (optional, for enhanced search)

### Installation

1. Install dependencies:
```bash
cd server
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up the database:
```bash
# Run Prisma migrations
npm run migrate

# Generate Prisma client
npm run generate
```

### Environment Variables

Required variables in `.env`:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `YOUTUBE_API_KEY`: YouTube Data API key (optional)
- `PORT`: Server port (default: 3001)
- `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:5173)

### Running

Development mode with hot reload:
```bash
npm run dev
```

Production build:
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### Rooms
- `POST /api/rooms` - Create room (requires auth)
- `GET /api/rooms/:roomId` - Get room details (requires auth)
- `GET /api/rooms/user/my-rooms` - Get user's rooms (requires auth)
- `DELETE /api/rooms/:roomId` - Delete room (requires auth, owner only)

### YouTube
- `GET /api/youtube/search?q=query` - Search YouTube videos

## WebSocket Events

### Client → Server
- `join_room` - Join a room
- `leave_room` - Leave a room
- `play` - Play video
- `pause` - Pause video
- `seek` - Seek to timestamp
- `change_video` - Change current video
- `update_queue` - Update video queue

### Server → Client
- `room_state` - Initial room state on join
- `play` - Broadcast play event
- `pause` - Broadcast pause event
- `seek` - Broadcast seek event
- `change_video` - Broadcast video change
- `update_queue` - Broadcast queue update
- `user_joined` - User joined notification
- `user_left` - User left notification

## Database Schema

- **User**: User accounts with authentication
- **Room**: Watch rooms with state
- **QueueItem**: Video queue for each room

## Tech Stack

- Express.js - Web framework
- Socket.io - WebSocket library
- Prisma - ORM
- PostgreSQL - Database
- JWT - Authentication
- TypeScript - Type safety
