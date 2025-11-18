import { io } from "socket.io-client";

export const socket = io(
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000",
  {
    transports: ["websocket"],
    autoConnect: true,
  }
);
