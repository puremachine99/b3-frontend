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
      const up = statusStr ? statusStr.toLowerCase() : "";

      const online = up === "online" || up === "on" || up.includes("connected");

      const logKey = device.serial || device.id;
      onConnectionUpdate(logKey, online ? "online" : "offline");

      // If the status message indicates ON/OFF relay, update power
      if (up === "on" || up === "online") {
        onPowerUpdate(device.id, true);
      }
      if (up === "off" || up === "offline") {
        onPowerUpdate(device.id, false);
      }

      // Also push to logs
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

      // payload may contain connection info
      const conn = extractConnectionState({
        message: raw?.status,
        payload: raw,
      });

      const finalState = conn === "ONLINE" ? "online" : "offline";
      const logKey = device.serial || device.id;
      onConnectionUpdate(logKey, finalState);

      // push into logs
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
    // CLEANUP
    // ------------------------
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [getDevices, onLog, onConnectionUpdate, onPowerUpdate]);
};
