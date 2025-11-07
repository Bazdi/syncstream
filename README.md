<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# SyncStream - Multi-User Watch Together Platform

A real-time, multi-user "Watch Together" platform with synchronized video playback, persistent rooms, and AI-powered search.

## Features

- **Real-Time Synchronization**: Watch videos together with perfect sync across all users
- **Persistent Rooms**: Create and save rooms with video queues
- **User Authentication**: Secure JWT-based authentication
- **AI-Powered Search**: Search YouTube using Gemini AI or YouTube Data API
- **WebSocket Communication**: Real-time updates using Socket.io
- **PostgreSQL Database**: Reliable data persistence with Prisma ORM

## Tech Stack

### Frontend
- React 19 + TypeScript
- Vite
- Socket.io Client
- TailwindCSS

### Backend
- Node.js + Express
- Socket.io (WebSockets)
- Prisma ORM
- PostgreSQL
- JWT Authentication

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Gemini API key (for AI search)
- YouTube Data API key (optional, for enhanced search)

## Setup

### 1. Frontend Setup

```bash
# Install frontend dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and add your API keys
# VITE_API_URL=http://localhost:3001/api
# VITE_SOCKET_URL=http://localhost:3001
# VITE_GEMINI_API_KEY=your-gemini-api-key
```

### 2. Backend Setup

```bash
# Navigate to server directory
cd server

# Install backend dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and configure:
# DATABASE_URL="postgresql://user:password@localhost:5432/syncstream"
# JWT_SECRET="your-super-secret-jwt-key"
# YOUTUBE_API_KEY="your-youtube-api-key"
# PORT=3001
# FRONTEND_URL="http://localhost:5173"
```

### 3. Database Setup

```bash
# From the server directory
cd server

# Run Prisma migrations
npm run migrate

# Generate Prisma client
npm run generate
```

## Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:3001`.

### Production Build

**Frontend:**
```bash
npm run build
npm run preview
```

**Backend:**
```bash
cd server
npm run build
npm start
```

## API Documentation

See [server/README.md](server/README.md) for detailed API and WebSocket event documentation.

## Project Structure

```
syncstream/
├── components/          # React components
├── services/           # API and Socket services
├── server/             # Backend server
│   ├── src/
│   │   ├── routes/     # API routes
│   │   └── socket/     # WebSocket handlers
│   └── prisma/         # Database schema
├── types.ts            # TypeScript types
└── App.tsx             # Main app component
```

## Future Enhancements

See [todo.md](todo.md) for the complete roadmap including:
- Stripe payment integration for premium features
- Advanced room permissions
- Chat functionality
- Video recommendations
- And more!

## Original App

View the original app in AI Studio: https://ai.studio/apps/drive/1Ka3v1NRgUYDz_WJ6SN1eaZUN5rSxlpzy
