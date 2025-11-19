import type { DeviceLog } from "@/types/logs";

/** Merge + sort logs descending by timestamp */
export const mergeLogs = (...arrays: DeviceLog[][]): DeviceLog[] => {
  const map = new Map<string, DeviceLog>();

  arrays.flat().forEach((log) => {
    if (!log) return;
    map.set(log.id, log);
  });

  const sorted = Array.from(map.values()).sort((a, b) => {
    const ta = a.timestamp ? Date.parse(a.timestamp) : 0;
    const tb = b.timestamp ? Date.parse(b.timestamp) : 0;
    return tb - ta; // newest first
  });

  return sorted;
};

export const renderPayload = (payload: unknown): string => {
  if (!payload) return "";
  if (typeof payload === "string") return payload;

  if (typeof payload === "object") {
    try {
      return JSON.stringify(payload);
    } catch {
      return String(payload);
    }
  }

  return String(payload);
};
