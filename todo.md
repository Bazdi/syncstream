---
# Backend & Advanced Features: TODO Roadmap

This document outlines the necessary backend features to transform this single-user, frontend-only application into a full-fledged, multi-user "Watch Together" service. The current app brilliantly simulates a persistent experience using `localStorage`, but the features below require a server to manage shared state, user data, and real-time communication.

---

## 1. Core Feature: Real-Time Room Synchronization (High Priority)

This is the most critical feature for a shared viewing experience. The goal is to ensure that when one user plays, pauses, or seeks the video, the same action happens for everyone else in the room in near real-time.

### Technology Stack:
-   **Backend Server:** Node.js with a framework like Express.js or Fastify is a great choice.
-   **Real-Time Communication:** WebSockets are essential. Libraries like `Socket.io` or `ws` simplify this immensely.

### Implementation Steps:
1.  **Room Management:**
    -   Create API endpoints for creating, joining, and leaving rooms (e.g., `POST /api/rooms`, `POST /api/rooms/:roomId/join`).
    -   Each room needs a unique ID that can be shared via a URL.
2.  **WebSocket Events:** When a client connects, they should join a specific room's WebSocket channel.
    -   **Server-Side Logic:** The server listens for events from clients in a room and broadcasts them to all other clients in the same room.
    -   **Essential Events to Broadcast:**
        -   `PLAY`: Sent when a user clicks the play button. The server broadcasts this to all clients.
        -   `PAUSE`: Sent when a user clicks the pause button.
        -   `SEEK`: Sent when a user scrubs the timeline. The payload must include the new timestamp (e.g., `{ timestamp: 123.45 }`).
        -   `CHANGE_VIDEO`: Sent when a new video is selected from the queue. The payload must include the new video ID.
        -   `UPDATE_QUEUE`: Sent when a video is added or removed from the queue. The payload should be the entire new queue to ensure consistency.
3.  **State Authority (Server Authority):**
    -   To prevent conflicts (e.g., two users pausing/playing at the same time), the server should be the single source of truth.
    -   When a user joins a room, the server should send them the current state of the player (current video ID, timestamp, playing status, and the full queue).

---

## 2. User Accounts & Authentication (Medium Priority)

To have persistent rooms, user profiles, and saved playlists, you need user accounts.

### Technology Stack:
-   **Database:** A relational database like PostgreSQL or a NoSQL database like MongoDB.
-   **Authentication Strategy:** JWT (JSON Web Tokens) is a standard, stateless way to handle authentication for APIs. Libraries like `Passport.js` can streamline this.

### Implementation Steps:
1.  **User Model:** Define a user schema in your database (e.g., `id`, `username`, `email`, `password_hash`, `avatar_url`).
2.  **API Endpoints:**
    -   `POST /api/auth/register`: For new user registration.
    -   `POST /api/auth/login`: To authenticate users and issue a JWT.
    -   `GET /api/users/me`: A protected route to fetch the current user's profile.
3.  **Client-Side:** Store the JWT securely (e.g., in an HttpOnly cookie or `localStorage`) and send it in the `Authorization` header for all protected API requests.

---

## 3. Persistent Rooms & Playlists

Once you have user accounts, you can save rooms and their state to the database.

### Implementation Steps:
1.  **Database Schema:**
    -   Create a `Rooms` table (`id`, `name`, `owner_id`).
    -   Create a `Playlists` or `Queues` table that links videos to a room (`id`, `room_id`, `video_id`, `order`).
2.  **API Logic:**
    -   When a user creates a room, save it to the database and associate it with their user ID.
    -   The `UPDATE_QUEUE` WebSocket event should now also trigger a database update to keep the queue persistent.

---

## 4. Monetization (Paid Options)

This is a long-term goal that builds upon user accounts.

### Technology Stack:
-   **Payment Gateway:** Stripe is the industry standard and has excellent developer tools and documentation.

### Implementation Steps:
1.  **Backend Integration:**
    -   Integrate the Stripe Node.js library.
    -   Create API endpoints to handle creating payment intents/subscriptions.
    -   Implement a webhook endpoint (`/api/stripe-webhooks`) to listen for events from Stripe (e.g., `checkout.session.completed`, `invoice.payment_succeeded`) to update the user's subscription status in your database.
2.  **Feature Gating:**
    -   On the frontend and backend, protect premium features (e.g., persistent rooms, ad-free experience) by checking the user's subscription status.

---

## 5. Proper YouTube Data API Integration

The current AI-based search is a clever workaround, but for more robust and reliable search results, using the official API is better.

### Implementation Steps:
1.  **Backend Proxy:** The YouTube API key must be kept secret on the server. Create a backend endpoint (e.g., `/api/search/youtube`).
2.  **Server-Side Request:** This endpoint will take a user's query, make a request to the YouTube Data API using the secret key, and then forward the formatted results back to the client. This prevents exposing your API key in the frontend code.
