import { NextApiRequest, NextApiResponse } from "next";
import { Server as ServerIO } from "socket.io";
import { Server as NetServer } from "http";
import { Socket as NetSocket } from "net";

// Extend native type definitions to attach socket.io properties to Next.js HTTP server instance
export interface NextApiResponseWithSocket extends NextApiResponse {
  socket: NetSocket & {
    server: NetServer & {
      io?: ServerIO;
    };
  };
}

export const config = {
  api: {
    bodyParser: false, // Turn off body parser for WebSocket handshake endpoint
  },
};

export default function socketHandler(
  req: NextApiRequest,
  res: NextApiResponseWithSocket
) {
  if (res.socket.server.io) {
    console.log("[SocketIO] Server is already running");
    res.end();
    return;
  }

  console.log("[SocketIO] Initializing new Socket.io server...");
  const httpServer: NetServer = res.socket.server;
  
  // Attach Socket.io server instance to HTTP server
  const io = new ServerIO(httpServer, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  res.socket.server.io = io;

  // Connection event handlers
  io.on("connection", (socket) => {
    console.log(`[SocketIO] Client connected: ${socket.id}`);

    // Join a private messaging room matching current authenticated User's ID
    socket.on("join-room", (userId: string) => {
      if (!userId) return;
      socket.join(userId);
      console.log(`[SocketIO] Socket ${socket.id} joined private room: ${userId}`);
    });

    // Real-time message relaying logic
    socket.on("send-message", (message) => {
      const { receiverId } = message;
      if (!receiverId) return;

      console.log(`[SocketIO] Relaying message from ${message.senderId} to recipient room: ${receiverId}`);
      // Emit the message to the recipient's room
      io.to(receiverId).emit("message-received", message);
    });

    socket.on("disconnect", () => {
      console.log(`[SocketIO] Client disconnected: ${socket.id}`);
    });
  });

  res.end();
}
