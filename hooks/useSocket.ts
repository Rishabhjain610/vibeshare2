"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket(userId: string | null | undefined) {
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    let activeSocket: Socket | null = null;

    // 1. Trigger API Socket handler to initialize server if not already running
    const initSocket = async () => {
      try {
        await fetch("/api/socket");
      } catch (err) {
        console.error("[useSocket] Error hitting socket setup endpoint:", err);
      }

      // 2. Establish connection to Socket.io server
      const clientSocket = io({
        path: "/api/socket",
        addTrailingSlash: false,
        autoConnect: true,
      });

      clientSocket.on("connect", () => {
        console.log("[useSocket] Connected to WebSocket server with ID:", clientSocket.id);
        setIsConnected(true);

        // Join user's private message room
        clientSocket.emit("join-room", userId);
      });

      clientSocket.on("disconnect", () => {
        console.log("[useSocket] Disconnected from WebSocket server");
        setIsConnected(false);
      });

      activeSocket = clientSocket;
      setSocket(clientSocket);
    };

    initSocket();

    // 3. Clean up on component unmount
    return () => {
      if (activeSocket) {
        console.log("[useSocket] Cleaning up socket connection...");
        activeSocket.disconnect();
      }
      setSocket(null);
      setIsConnected(false);
    };
  }, [userId]);

  return {
    socket,
    isConnected,
  };
}
