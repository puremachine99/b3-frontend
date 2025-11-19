// src/hooks/useDeviceLogs.ts

"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

import {
  mergeAndSortLogs,
  mapApiLog,
  parseApiError,
} from "@/utils/device";

import type { Device } from "@/types/device";
import type { DeviceLog } from "@/types/logs";

interface UseDeviceLogsProps {
  device: Device | null;
  memoryLogs: Record<string, DeviceLog[]>;
}

export const useDeviceLogs = ({ device, memoryLogs }: UseDeviceLogsProps) => {
  const [logs, setLogs] = useState<DeviceLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------
  // HELPERS
  // ---------------------------------

  const renderPayload = (payload: any): string => {
    if (!payload) return "";

    if (typeof payload === "string") return payload;

    if (typeof payload === "object") {
      return Object.entries(payload)
        .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
        .join(" · ");
    }

    return String(payload);
  };

  // ---------------------------------
  // FETCH LATEST LOGS (API)
  // ---------------------------------

  const fetchLatest = useCallback(async () => {
    if (!device) return;

    try {
      setLoading(true);
      setError(null);

      const serial = device.serial || device.id;
      const res = await api.get(`/device-logs/${serial}`);
      const raw = Array.isArray(res.data) ? res.data : res.data?.data ?? [];

      const mapped = raw.map((item: any, i: number) =>
        mapApiLog(device, item, i)
      );

      setLogs((prev) => {
        return mergeAndSortLogs(prev, mapped, memoryLogs[serial] ?? []);
      });
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, [device, memoryLogs]);

  // ---------------------------------
  // INIT (DIALOG OPEN)
  // ---------------------------------

  useEffect(() => {
    if (!device) {
      setLogs([]);
      return;
    }

    const serial = device.serial || device.id;

    // start with memory logs
    const baseLogs = memoryLogs[serial] ?? [];
    setLogs(baseLogs);

    // fetch latest server logs
    fetchLatest();
  }, [device, memoryLogs, fetchLatest]);

  // ---------------------------------
  // REALTIME MEMORY LOGS UPDATE
  // (listen perubahan logs dari socket)
  // ---------------------------------

  useEffect(() => {
    if (!device) return;
    const serial = device.serial || device.id;

    const mem = memoryLogs[serial] ?? [];

    setLogs((prev) => mergeAndSortLogs(prev, mem));
  }, [memoryLogs, device]);

  // ---------------------------------
  // PUBLIC API
  // ---------------------------------

  return {
    logs,
    loading,
    error,
    reloadLogs: fetchLatest,
    renderPayload,
  };
};
