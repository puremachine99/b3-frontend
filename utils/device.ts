// src/utils/device.ts

import type { Device } from "@/types/device";
import type { DeviceGroup } from "@/types/group";
import type { DeviceLog } from "@/types/logs";

// -------------------------------------
// Coordinate Helpers
// -------------------------------------
export const parseCoordinateInput = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

export const normalizeCoordinateValue = (
  value?: number | string | null
): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") return parseCoordinateInput(value);
  return null;
};

// -------------------------------------
// Status Helpers
// -------------------------------------
export const normalizeStatus = (
  status?: string
): "online" | "offline" | "error" => {
  if (!status) return "offline";
  const v = status.trim().toLowerCase();

  if (v.includes("error")) return "error";
  if (v === "online" || v === "on" || v.includes("connected")) return "online";
  if (v === "offline" || v === "off" || v.includes("disconnected"))
    return "offline";

  return "offline";
};

// -------------------------------------
// Display Helpers
// -------------------------------------
export const truncateId = (id: string, length = 5): string => {
  return id.length <= length ? id : `${id.slice(0, length)}...`;
};

// -------------------------------------
// Relay / Connection State Extractors
// -------------------------------------
export const extractRelayState = (
  payload: any
): "ON" | "OFF" | null => {
  if (!payload) return null;

  let val = "";

  if (typeof payload === "string") {
    try {
      const parsed = JSON.parse(payload);
      val =
        parsed?.relay_state ||
        parsed?.relayState ||
        parsed?.relay ||
        "";
    } catch {
      return null;
    }
  }

  if (typeof payload === "object") {
    val =
      payload?.relay_state ||
      payload?.relayState ||
      payload?.relay ||
      "";
  }

  if (!val || typeof val !== "string") return null;

  const up = val.toUpperCase();
  return up === "ON" || up === "OFF" ? up : null;
};

export const extractConnectionState = (
  log: any
): "ONLINE" | "OFFLINE" | null => {
  const payload = log?.payload;

  const tryVal = (val: any) => {
    if (typeof val !== "string") return null;
    const up = val.toUpperCase();
    if (up.includes("ONLINE")) return "ONLINE";
    if (up.includes("OFFLINE")) return "OFFLINE";
    return null;
  };

  if (payload && typeof payload === "object") {
    const key =
      payload.device_connection ||
      payload.connection ||
      payload.status;
    const hit = tryVal(key);
    if (hit) return hit;
  }

  const msg1 = tryVal(payload);
  if (msg1) return msg1;

  const msg2 = tryVal(log?.message);
  if (msg2) return msg2;

  return null;
};

// -------------------------------------
// Logs Helpers
// -------------------------------------
export const sortLogs = (logs: DeviceLog[]) => {
  return [...logs].sort((a, b) => {
    const ta = a.timestamp ? Date.parse(a.timestamp) : 0;
    const tb = b.timestamp ? Date.parse(b.timestamp) : 0;
    return tb - ta; // newest first
  });
};

export const mergeAndSortLogs = (...arrays: DeviceLog[][]) => {
  const map = new Map<string, DeviceLog>();
  arrays.flat().forEach((log) => {
    if (!log) return;
    map.set(log.id, log);
  });
  return sortLogs([...map.values()]);
};

export const getLatestConnectionState = (
  logs: DeviceLog[]
): "ONLINE" | "OFFLINE" | null => {
  for (const log of logs) {
    const isConn =
      (log.type || "").toUpperCase().includes("LWT") ||
      (log.type || "").toUpperCase().includes("SYSTEM");
    if (!isConn) continue;

    const res = extractConnectionState(log);
    if (res) return res;
  }
  return null;
};

export const getDeviceLogKey = (device: Device) => {
  return device.serial || device.serialNumber || device.macAddress || device.id;
};

export const getDeviceConnectionStatus = (
  connectionMap: Record<string, "online" | "offline">,
  logs: Record<string, DeviceLog[]>,
  device: Device
): "online" | "offline" => {
  const key = getDeviceLogKey(device);
  const mapped = connectionMap[key];
  if (mapped) return mapped;

  const logList = logs[key] || [];
  if (!logList.length) return "online";

  const latest = getLatestConnectionState(logList);
  if (latest === "OFFLINE") return "offline";
  if (latest === "ONLINE") return "online";
  return "online";
};

export const isDeviceDisconnected = (
  connectionMap: Record<string, "online" | "offline">,
  logs: Record<string, DeviceLog[]>,
  device: Device
): boolean => {
  return getDeviceConnectionStatus(connectionMap, logs, device) === "offline";
};

// -------------------------------------
// Device & Group Mappers (API → UI)
// -------------------------------------
export const mapApiDeviceToDevice = (api: any): Device => {
  const id =
    api?.id ||
    api?.serialNumber ||
    api?.macAddress ||
    crypto.randomUUID();

  return {
    id,
    name: api?.name || api?.serialNumber || "Unknown device",
    serial: api?.serialNumber || api?.macAddress,
    serialNumber: api?.serialNumber,
    macAddress: api?.macAddress,
    status: normalizeStatus(api?.status),
    type: "tracker",
    lastSeen: api?.lastSeenAt
      ? new Date(api.lastSeenAt).toLocaleString()
      : "-",
    lastSeenAt: api?.lastSeenAt,
    location: api?.location || "-",
    firmware: "-",
    description: api?.description,
    groupId: api?.groupId || api?.group?.id || "all",
    latitude: normalizeCoordinateValue(api?.latitude),
    longitude: normalizeCoordinateValue(api?.longitude),
  };
};

export const mapApiGroupToGroup = (api: any): DeviceGroup => {
  const id = api?.id || crypto.randomUUID();

  return {
    id,
    name: api?.name || "Unnamed Group",
    description: api?.description || "",
    site: api?.site || "",
    devices: Array.isArray(api.devices)
      ? api.devices.map((d: any) => ({
          ...mapApiDeviceToDevice(d),
          groupId: id,
        }))
      : [],
  };
};

export const mapApiLog = (
  device: Device,
  item: any,
  idx: number
): DeviceLog => {
  const payload = item?.payload;

  const message =
    item?.eventType ||
    item?.type ||
    item?.command ||
    (typeof payload === "string" ? payload : "") ||
    JSON.stringify(payload ?? item);

  return {
    id: item?.id || `${device.id}-${idx}`,
    deviceId: item?.deviceId || device.serial || device.id,
    type: (item?.eventType || item?.type || "LOG") as DeviceLog["type"],
    message,
    payload,
    timestamp: item?.createdAt || item?.timestamp,
    createdAt: item?.createdAt,
  };
};

// -------------------------------------
// API Error Parser
// -------------------------------------
export const parseApiError = (error: any): string => {
  if (!error) return "Unknown error";

  if (error.response?.data) {
    const data = error.response.data;
    const msg = data?.message || data?.error;
    if (Array.isArray(msg)) return msg.join(", ");
    return msg || "Request failed";
  }

  if (typeof error === "string") return error;

  if (error instanceof Error) return error.message;

  return "Request failed";
};
