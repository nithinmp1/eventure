import 'dotenv/config'; // Load environment variables from .env file
import express from 'express';
import http from 'http';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { PrismaClient } from '@prisma/client';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';

// Initialize Prisma Client
const prisma = new PrismaClient();

// Define your GraphQL Schema
const typeDefs = `#graphql
  type User {
    id: ID!
    name: String!
    email: String!
    events: [Event!]!
  }

  type Event {
    id: ID!
    name: String!
    location: String!
    startTime: String!
    attendees: [User!]!
  }

  type Query {
    events: [Event!]!
    me: User
  }

  type Query {
    events: [Event!]!
    event(id: ID!): Event
  }

  type Mutation {
    joinEvent(eventId: ID!): Event
    login(email: String!, password: String!): String # Returns JWT token
  }
`;

// Mock User Data (for initial setup and authentication)
// In a real application, you would manage user registration and secure password hashing.
// For this example, we'll pre-populate some users.
const MOCK_USERS = [
  { id: 'user1', name: 'Alice', email: 'alice@example.com', password: 'password123' },
  { id: 'user2', name: 'Bob', email: 'bob@example.com', password: 'password123' },
];

// GraphQL Resolvers
const resolvers = {
  Query: {
    // Fetch all events from the database, including their attendees
    events: async () => {
      const events = await prisma.event.findMany({
        include: { attendees: true },
        orderBy: {
          startTime: 'asc', // Order events by start time
        },
      });
      return events;
    },
    //  Fetch single event by ID
    event: async (parent: any, { id }: { id: string }) => {
      const event = await prisma.event.findUnique({
        where: { id },
        include: { attendees: true },
      });
      if (!event) throw new Error('Event not found');
      return event;
    },
    // Return the logged-in user based on the authentication context
    me: async (parent: any, args: any, context: any) => {
      if (!context.user) {
        // If no user is in context (e.g., no valid token), return null or throw an error
        return null; // Or throw new Error('Authentication required');
      }
      // Fetch the user from the database using the ID from the decoded token
      return await prisma.user.findUnique({ where: { id: context.user.id } });
    },
  },
  Mutation: {
    // Allows a user to join an event
    joinEvent: async (parent: any, { eventId }: { eventId: string }, context: any) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const userId = context.user.id;

      // Find the event to ensure it exists
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { attendees: true }, // Include current attendees to check if user already joined
      });

      if (!event) {
        throw new Error('Event not found');
      }

      // Check if the user is already an attendee of this event
      const isAlreadyJoined = event.attendees.some(attendee => attendee.id === userId);

      let updatedEvent;
      if (!isAlreadyJoined) {
        // If not already joined, connect the user to the event's attendees
        updatedEvent = await prisma.event.update({
          where: { id: eventId },
          data: {
            attendees: {
              connect: { id: userId }, // Connects an existing user to the event
            },
          },
          include: { attendees: true }, // Re-fetch attendees to get the updated list
        });

        // Broadcast the attendee update to all clients subscribed to this event's room
        io.to(eventId).emit('attendeeUpdate', {
          eventId: updatedEvent.id,
          attendees: updatedEvent.attendees,
        });

        console.log(`User ${userId} joined event ${eventId}`);
      } else {
        updatedEvent = event; // No change needed if user already joined
        console.log(`User ${userId} already joined event ${eventId}`);
      }

      return updatedEvent;
    },
    // Mock login mutation: Authenticates a user and returns a JWT token
    login: async (parent: any, { email, password }: any) => {
      // In a real app, you'd fetch the user from the DB and compare hashed passwords
      const user = MOCK_USERS.find(u => u.email === email && u.password === password);

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Sign a JWT token with the user's ID and email
      // Use a strong, environment-variable-based secret in production
      const secret = process.env.JWT_SECRET || 'your_jwt_secret_fallback';
      const token = jwt.sign({ userId: user.id, email: user.email }, secret, { expiresIn: '1h' });
      return token;
    },
  },
};

// Setup Express App for HTTP server
const app = express();
const httpServer = http.createServer(app);

// Setup Socket.io server
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*', // Allow all origins for development (adjust for production)
    methods: ['GET', 'POST'],
  },
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // When a client wants to join an event-specific room for real-time updates
  socket.on('joinEventRoom', (eventId: string) => {
    socket.join(eventId);
    console.log(`Socket ${socket.id} joined event room: ${eventId}`);
  });

  // When a client leaves an event-specific room
  socket.on('leaveEventRoom', (eventId: string) => {
    socket.leave(eventId);
    console.log(`Socket ${socket.id} left event room: ${eventId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Setup Apollo Server for GraphQL
const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })], // Graceful shutdown
});

async function startServer() {
  await server.start(); // Start Apollo Server

  app.use(cors<cors.CorsRequest>()); // Enable CORS for all origins
  app.use(express.json()); // Parse JSON request bodies

  // GraphQL endpoint middleware
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => {
        // Mock authentication context: Extract and verify JWT token
        const token = req.headers.authorization || '';
        try {
          const secret = process.env.JWT_SECRET || 'your_jwt_secret_fallback';
          const decoded = jwt.verify(token.replace('Bearer ', ''), secret) as { userId: string; email: string };
          // For this example, we use MOCK_USERS, but in a real app, you'd fetch from DB
          const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
          return { user }; // Attach the authenticated user to the context
        } catch (error) {
          // If token is invalid or missing, user is null
          return { user: null };
        }
      },
    }),
  );

  // Start the HTTP server (for both GraphQL and Socket.io)
  const PORT = process.env.PORT || 4000;
  await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));
  console.log(`🚀 GraphQL Server ready at http://localhost:${PORT}/graphql`);
  console.log(`🚀 WebSocket server ready at ws://localhost:${PORT}`);

  // Seed initial data if the database is empty (optional, for convenience)
  // This will be called via a separate script for better control
  // await seedDatabase();
}

startServer();

