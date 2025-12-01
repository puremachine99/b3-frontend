import { io } from "socket.io-client";

export const socket = io(
  // process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  process.env.NEXT_PUBLIC_API_URL || "https://api.nopel.cloud",
  {
    transports: ["websocket"], // ❗ WAJIB → jangan kasih polling
    secure: true,
    withCredentials: true,
    path: "/socket.io",
  }
);
