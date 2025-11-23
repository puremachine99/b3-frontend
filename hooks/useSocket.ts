// src/hooks/useSocket.ts

"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import {
  extractRelayState,
  extractConnectionState,
} from "@/utils/device";

import type { Device } from "@/types/device";
import type { DeviceLog } from "@/types/logs";

interface UseSocketProps {
  getDevices: () => Device[];
  onLog: (deviceId: string, log: DeviceLog) => void;
  onConnectionUpdate: (deviceId: string, status: "online" | "offline") => void;
  onPowerUpdate: (deviceId: string, powered: boolean) => void;
}

export const useSocket = ({
  getDevices,
  onLog,
  onConnectionUpdate,
  onPowerUpdate,
}: UseSocketProps) => {
  const socketRef = useRef<Socket | null>(null);

  // --------------------------------------------------
  // JOIN ROOMS
  // --------------------------------------------------
  const joinDeviceRooms = (socket: Socket) => {
    const devices = getDevices();
    devices.forEach((d) => {
      const key = d.serial || d.serialNumber;
      if (key) {
        socket.emit("join-device", { deviceId: key });
      }
    });
  };

  // --------------------------------------------------
  // MAIN EFFECT
  // --------------------------------------------------
  useEffect(() => {
    const SOCKET_URL =
      process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      closeOnBeforeunload: true,
    });

    socketRef.current = socket;

    // ------------------------
    // CONNECTED
    // ------------------------
    socket.on("connect", () => {
      joinDeviceRooms(socket);
    });

    // ------------------------
    // EVENT: device-log
    // ------------------------
    socket.on("device-log", (raw: any) => {
      const deviceId = raw?.deviceId || raw?.macAddress || raw?.serialNumber;

      if (!deviceId) return;

      const device = getDevices().find(
        (d) => d.id === deviceId || d.serial === deviceId
      );
      if (!device) return;

      const mapped: DeviceLog = {
        id: `${deviceId}-${Date.now()}`,
        deviceId,
        type: raw?.type || raw?.eventType || "LOG",
        message: raw?.message || JSON.stringify(raw?.payload ?? raw),
        payload: raw?.payload,
        timestamp: raw?.createdAt || new Date().toISOString(),
      };

      // push into logs
      const logKey = device.serial || device.id;
      onLog(logKey, mapped);

      // sync power if log contains relay state
      const relay = extractRelayState(raw?.payload);
      if (relay) onPowerUpdate(device.id, relay === "ON");
    });

    // ------------------------
    // EVENT: device-status
    // ------------------------
    socket.on("device-status", (raw: any) => {
      const deviceId = raw?.deviceId || raw?.macAddress || raw?.serialNumber;
      if (!deviceId) return;

      const device = getDevices().find(
        (d) => d.serial === deviceId || d.id === deviceId
      );
      if (!device) return;

      const statusStr = raw?.status;
      const normalized = statusStr ? statusStr.toLowerCase() : "";
      const logKey = device.serial || device.id;

      const indicatesConnection =
        normalized === "online" ||
        normalized === "offline" ||
        normalized.includes("connected") ||
        normalized.includes("disconnected");

      if (indicatesConnection) {
        const nextState =
          normalized === "offline" || normalized.includes("disconnected")
            ? "offline"
            : "online";
        onConnectionUpdate(logKey, nextState);
      }

      if (normalized === "on" || normalized === "off") {
        onPowerUpdate(device.id, normalized === "on");
      }

      const log: DeviceLog = {
        id: `${deviceId}-${Date.now()}`,
        deviceId,
        type: "STATUS",
        message: statusStr || JSON.stringify(raw),
        payload: raw?.payload,
        timestamp: new Date().toISOString(),
      };
      onLog(logKey, log);
    });

    // ------------------------
    // EVENT: device-connection (LWT)
    // ------------------------
    socket.on("device-connection", (raw: any) => {
      const deviceId = raw?.deviceId;
      if (!deviceId) return;

      const device = getDevices().find(
        (d) => d.serial === deviceId || d.id === deviceId
      );
      if (!device) return;

      const conn = extractConnectionState({
        message: raw?.status,
        payload: raw,
      });

      const finalState = conn === "ONLINE" ? "online" : "offline";
      const logKey = device.serial || device.id;
      onConnectionUpdate(logKey, finalState);

      const log: DeviceLog = {
        id: `${deviceId}-${Date.now()}`,
        deviceId,
        type: "LWT",
        message: raw?.status || JSON.stringify(raw),
        payload: raw,
        timestamp: new Date().toISOString(),
      };
      onLog(logKey, log);
    });

    // ------------------------
    // EVENT: device-availability
    // ------------------------
    socket.on("device-availability", (raw: any) => {
      const deviceId = raw?.deviceId;
      if (!deviceId) return;

      const device = getDevices().find(
        (d) => d.serial === deviceId || d.id === deviceId
      );
      if (!device) return;

      const available = !!raw?.available;
      const logKey = device.serial || device.id;
      onConnectionUpdate(logKey, available ? "online" : "offline");

      const log: DeviceLog = {
        id: `${deviceId}-${Date.now()}`,
        deviceId,
        type: "AVAILABILITY",
        message: available ? "AVAILABLE" : "UNAVAILABLE",
        payload: raw,
        timestamp: new Date().toISOString(),
      };
      onLog(logKey, log);
    });

    // ------------------------
    // CLEANUP
    // ------------------------
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [getDevices, onLog, onConnectionUpdate, onPowerUpdate]);
};
