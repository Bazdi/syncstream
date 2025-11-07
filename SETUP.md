# SyncStream Setup Guide

Complete step-by-step guide to set up and run SyncStream locally.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
  - OR **Docker** (for running PostgreSQL in a container)
- **Git** - [Download](https://git-scm.com/)

## Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd syncstream
```

## Step 2: Set Up PostgreSQL

### Option A: Using Docker (Recommended for Development)

1. Make sure Docker is installed and running
2. Start PostgreSQL using docker-compose:

```bash
docker-compose up -d
```

This will start PostgreSQL on `localhost:5432` with:
- Database: `syncstream`
- Username: `syncstream`
- Password: `syncstream_dev_password`

### Option B: Using Local PostgreSQL

1. Install PostgreSQL on your system
2. Create a database:

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE syncstream;

# Create user (optional)
CREATE USER syncstream WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE syncstream TO syncstream;
```

## Step 3: Backend Setup

### 3.1 Install Backend Dependencies

```bash
cd server
npm install
```

### 3.2 Configure Backend Environment

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `server/.env` with your configuration:

```env
# Database - Use one of these connection strings:
# For Docker setup:
DATABASE_URL="postgresql://syncstream:syncstream_dev_password@localhost:5432/syncstream"

# For local PostgreSQL:
DATABASE_URL="postgresql://your_username:your_password@localhost:5432/syncstream"

# JWT Secret - Change this to a random secure string
JWT_SECRET="change-this-to-a-random-secure-secret-key-12345"

# YouTube Data API (Optional - for YouTube search)
# Get your key from: https://console.cloud.google.com/apis/credentials
YOUTUBE_API_KEY="your-youtube-api-key-here"

# Server Configuration
PORT=3001
NODE_ENV="development"

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:5173"
```

### 3.3 Run Database Migrations

```bash
# Still in the server directory
npm run migrate

# Generate Prisma client
npm run generate
```

You should see output indicating the migrations were successful.

### 3.4 Start the Backend Server

```bash
npm run dev
```

You should see:
```
🚀 Server running on port 3001
📡 WebSocket server ready
```

## Step 4: Frontend Setup

Open a new terminal window/tab:

### 4.1 Install Frontend Dependencies

```bash
# From the root directory
npm install
```

### 4.2 Configure Frontend Environment

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Backend API URL
VITE_API_URL=http://localhost:3001/api

# Socket.io URL
VITE_SOCKET_URL=http://localhost:3001

# Gemini API Key (for AI-powered search)
# Get your key from: https://aistudio.google.com/app/apikey
VITE_GEMINI_API_KEY=your-gemini-api-key-here
```

### 4.3 Start the Frontend

```bash
npm run dev
```

The app should now be running at `http://localhost:5173`

## Step 5: Test the Application

1. Open your browser to `http://localhost:5173`
2. Register a new account
3. Create a room
4. Search for videos and add them to the queue
5. Play videos and test synchronization

### Testing Real-Time Sync

1. Open the app in two different browser windows
2. Register/login with different accounts in each window
3. Join the same room in both windows
4. Test play/pause/seek actions - they should sync across both windows!

## Troubleshooting

### Database Connection Issues

**Error:** `Can't reach database server`

Solution:
- Verify PostgreSQL is running: `docker ps` (for Docker) or check your PostgreSQL service
- Check your DATABASE_URL is correct
- Ensure PostgreSQL is accessible on port 5432

### Backend Won't Start

**Error:** `Port 3001 is already in use`

Solution:
- Kill the process using port 3001: `lsof -ti:3001 | xargs kill -9` (macOS/Linux)
- Or change the PORT in `server/.env`

### Prisma Migration Errors

**Error:** `Migration failed`

Solution:
```bash
# Reset the database (WARNING: This deletes all data)
cd server
npx prisma migrate reset

# Then run migrations again
npm run migrate
```

### WebSocket Connection Failed

**Error:** `WebSocket connection failed` in browser console

Solution:
- Verify backend is running on port 3001
- Check VITE_SOCKET_URL in frontend `.env` matches backend URL
- Ensure CORS is configured correctly in backend

### Authentication Issues

**Error:** `Invalid token` or `No token provided`

Solution:
- Clear browser localStorage: Open DevTools → Application → Local Storage → Clear
- Logout and login again
- Verify JWT_SECRET is set in backend `.env`

## Development Tips

### Useful Commands

```bash
# Backend (from server directory)
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm start            # Run production build
npm run migrate      # Run database migrations
npm run generate     # Generate Prisma client

# Frontend (from root directory)
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Database Management

```bash
# View database in Prisma Studio (from server directory)
npx prisma studio
# Opens a GUI at http://localhost:5555
```

### API Testing

You can test the API using curl or tools like Postman:

```bash
# Health check
curl http://localhost:3001/api/health

# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Next Steps

Once everything is working:

1. Read [server/README.md](server/README.md) for API documentation
2. Check [todo.md](todo.md) for future feature plans
3. Explore the code structure in `server/src` and `components/`
4. Consider adding:
   - Stripe integration for payments
   - More advanced room permissions
   - Chat functionality
   - Video recommendations

## Production Deployment

For production deployment, you'll need to:

1. Set up a production PostgreSQL database (e.g., on Railway, Supabase, or AWS RDS)
2. Deploy the backend to a hosting service (e.g., Railway, Render, or Heroku)
3. Deploy the frontend to a static hosting service (e.g., Vercel, Netlify, or Cloudflare Pages)
4. Update environment variables with production URLs
5. Set strong JWT secrets and secure passwords
6. Enable HTTPS for both frontend and backend

## Support

If you encounter any issues not covered here, please:
1. Check the console for error messages
2. Review the logs in your terminal
3. Open an issue on GitHub with:
   - Description of the problem
   - Steps to reproduce
   - Error messages
   - Your environment (OS, Node version, etc.)

Happy coding! 🚀
