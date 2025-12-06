// src/hooks/useSocket.ts

"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { extractRelayState, extractConnectionState } from "@/utils/device";

import type { Device } from "@/types/device";
import type { DeviceLog } from "@/types/logs";

interface UseSocketProps {
  getDevices: () => Device[];
  onLog: (deviceId: string, log: DeviceLog) => void;
  onConnectionUpdate: (deviceId: string, status: "online" | "offline") => void;
  onPowerUpdate: (deviceId: string, powered: boolean) => void;
}
export type LogType = "INFO" | "WARN" | "ERROR" | "COMMAND" | "STATUS" | "LWT" | "AVAILABILITY";

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
      const keys = Array.from(
        new Set([d.serial, d.serialNumber, d.id].filter(Boolean))
      ) as string[];

      keys.forEach((key) => {
        console.log("[socket] join-device", { key, device: d.id });
        socket.emit("join-device", { deviceId: key });
      });
    });
  };

  // --------------------------------------------------
  // MAIN EFFECT
  // --------------------------------------------------
  useEffect(() => {
    const SOCKET_URL =
      process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token") || undefined
        : undefined;

    const socket = io(SOCKET_URL, {
      // Allow polling fallback agar tetap jalan lewat tunnel/proxy
      transports: ["websocket", "polling"],
      path: "/socket.io",
      closeOnBeforeunload: true,
      auth: token ? { token } : undefined,
    });

    socketRef.current = socket;

    // ------------------------
    // CONNECTED
    // ------------------------
    socket.on("connect", () => {
      console.log("[socket] connected", socket.id);
      joinDeviceRooms(socket);
    });

    // ------------------------
    // EVENT: device-log
    // ------------------------
    socket.on("device-log", (raw: any) => {
      const deviceId = raw?.deviceId || raw?.macAddress || raw?.serialNumber;

      if (!deviceId) return;

      console.log("[socket] device-log", deviceId, raw);

      const device = getDevices().find(
        (d) => d.id === deviceId || d.serial === deviceId
      );

      const mapped: DeviceLog = {
        id: `${deviceId}-${Date.now()}`,
        deviceId,
        type: raw?.type || raw?.eventType || "LOG",
        message: raw?.message || JSON.stringify(raw?.payload ?? raw),
        payload: raw?.payload,
        timestamp: raw?.createdAt || new Date().toISOString(),
      };

      // push into logs
      const logKey = device?.serial || device?.id || deviceId;
      onLog(logKey, mapped);

      // sync power if log contains relay state
      const relay = extractRelayState(raw?.payload ?? raw);
      if (relay && device) onPowerUpdate(device.id, relay === "ON");

      // update connection when LWT log arrives (payload is plain status string)
      if ((mapped.type || "").toUpperCase() === "LWT") {
        const conn = extractConnectionState(raw);
        if (conn) {
            onConnectionUpdate(
              logKey,
              conn === "ONLINE" ? "online" : "offline"
            );
          console.log("[socket] LWT log connection", logKey, conn);
        }
      }
    });

    // ------------------------
    // EVENT: device-status
    // ------------------------
    socket.on("device-status", (raw: any) => {
      const deviceId = raw?.deviceId || raw?.macAddress || raw?.serialNumber;
      if (!deviceId) return;

      console.log("[socket] device-status", deviceId, raw);

      const device = getDevices().find(
        (d) => d.serial === deviceId || d.id === deviceId
      );

      const statusStr =
        raw?.status ||
        raw?.payload?.status ||
        raw?.payload?.connection ||
        raw?.payload?.device_connection;
      const normalized = statusStr ? String(statusStr).toLowerCase() : "";
      const logKey = device?.serial || device?.id || deviceId;

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

      // Update power from status payload
      const relay =
        raw?.payload?.relay ??
        raw?.payload?.relay_state ??
        raw?.payload?.relayState;
      if (device && (normalized === "on" || normalized === "off" || relay)) {
        const nextPower =
          normalized === "on"
            ? true
            : normalized === "off"
            ? false
            : relay === "ON" || relay === "on";
        onPowerUpdate(device.id, nextPower);
      }

      const log: DeviceLog = {
        id: `${deviceId}-${Date.now()}`,
        deviceId,
        type: "STATUS",
        message: statusStr || JSON.stringify(raw?.payload ?? raw),
        payload: raw?.payload ?? raw,
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

      const conn = extractConnectionState({
        message: raw?.status || raw?.payload?.status,
        payload: raw,
      });

      const finalState = conn === "ONLINE" ? "online" : "offline";
      const logKey = device?.serial || device?.id || deviceId;
      onConnectionUpdate(logKey, finalState);
      console.log("[socket] device-connection", logKey, finalState, raw);

      const log: DeviceLog = {
        id: `${deviceId}-${Date.now()}`,
        deviceId,
        type: "STATUS",
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

      console.log("[socket] device-availability", deviceId, raw);

      const device = getDevices().find(
        (d) => d.serial === deviceId || d.id === deviceId
      );

      const available = !!raw?.available;
      const logKey = device?.serial || device?.id || deviceId;
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

  // Re-join rooms whenever device list changes after initial load
  useEffect(() => {
    const socket = socketRef.current;
    if (socket?.connected) {
      joinDeviceRooms(socket);
    }
  }, [getDevices]);
};
