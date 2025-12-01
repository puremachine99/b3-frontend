import type { NextConfig } from "next";

// When developing through a reverse proxy/https tunnel, HMR's websocket
// often fails unless the socket hostname/port/protocol are explicit.
// These defaults keep local dev working and allow overriding via env
// (e.g. NEXT_WEBPACK_HMR_SOCKET_HOSTNAME=nopel.cloud NEXT_WEBPACK_HMR_SOCKET_PROTOCOL=wss NEXT_WEBPACK_HMR_SOCKET_PORT=443).
const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  env: isDev
    ? {
        NEXT_WEBPACK_HMR_SOCKET_HOSTNAME:
          process.env.NEXT_WEBPACK_HMR_SOCKET_HOSTNAME || "localhost",
        NEXT_WEBPACK_HMR_SOCKET_PORT:
          process.env.NEXT_WEBPACK_HMR_SOCKET_PORT || "3000",
        NEXT_WEBPACK_HMR_SOCKET_PROTOCOL:
          process.env.NEXT_WEBPACK_HMR_SOCKET_PROTOCOL || "ws",
      }
    : {},
};

export default nextConfig;
