"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  // Tracks which rooms this client has joined so they can be re-joined after reconnect
  const activeRoomsRef = useRef(new Set());

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    const handleConnect = () => {
      setConnected(true);
      // Re-join every tracked room whenever the socket (re)connects
      activeRoomsRef.current.forEach((room) => {
        if (room === "admin") {
          socket.emit("join_admin");
        } else if (room.startsWith("auction:")) {
          socket.emit("join_auction", {
            auctionId: room.replace("auction:", ""),
          });
        }
      });
    };

    const handleDisconnect = () => setConnected(false);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    if (socket.connected) setConnected(true);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [isAuthenticated]);

  const joinAuction = (auctionId) => {
    activeRoomsRef.current.add(`auction:${auctionId}`);
    socketRef.current?.emit("join_auction", { auctionId });
  };

  const leaveAuction = (auctionId) => {
    activeRoomsRef.current.delete(`auction:${auctionId}`);
    socketRef.current?.emit("leave_auction", { auctionId });
  };

  const joinAdmin = () => {
    activeRoomsRef.current.add("admin");
    socketRef.current?.emit("join_admin");
  };

  const on = (event, handler) => {
    socketRef.current?.on(event, handler);
    return () => socketRef.current?.off(event, handler);
  };

  const off = (event, handler) => {
    socketRef.current?.off(event, handler);
  };

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        connected,
        joinAuction,
        leaveAuction,
        joinAdmin,
        on,
        off,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
};
