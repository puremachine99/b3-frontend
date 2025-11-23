// src/hooks/useDevices.ts

"use client";

import { useCallback, useEffect, useState } from "react";
import "@/lib/api-client/config";
import {
  ApiError,
  DeviceLogsService,
  DevicesService,
  GroupsService,
} from "@/lib/api-client";
import { useSocket } from "@/hooks/useSocket";
import { fetchDeviceGroups } from "@/lib/group-client";

import {
  mapApiDeviceToDevice,
  mapApiLog,
  parseApiError,
  normalizeStatus,
  extractRelayState,
  mergeAndSortLogs,
} from "@/utils/device";

import type { CreateDeviceDto, UpdateDeviceDto } from "@/lib/api-client";
import type { Device } from "@/types/device";
import type { DeviceGroup } from "@/types/group";
import type { DeviceLog } from "@/types/logs";

type CreateDeviceInput = CreateDeviceDto & {
  groupId?: string;
};

type UpdateDeviceInput = UpdateDeviceDto & {
  id: string;
  groupId?: string;
};
export const useDevices = () => {
  // ---------------------------
  // STATE
  // ---------------------------
  const [devices, setDevices] = useState<Device[]>([]);
  const [groups, setGroups] = useState<DeviceGroup[]>([]);
  const [logs, setLogs] = useState<Record<string, DeviceLog[]>>({});
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // power state ON/OFF
  const [powerMap, setPowerMap] = useState<Record<string, boolean>>({});
  // online / offline
  const [connectionMap, setConnectionMap] = useState<
    Record<string, "online" | "offline">
  >({});

  // ---------------------------
  // HELPERS
  // ---------------------------

  const updateConnectionState = (
    deviceId: string,
    status: string | undefined
  ) => {
    if (!status) return;

    const v = status.toLowerCase();
    const online = v === "online" || v === "on" || v.includes("connected");

    const offline =
      v === "offline" || v === "off" || v.includes("disconnected");

    if (!online && !offline) return;

    setConnectionMap((prev) => ({
      ...prev,
      [deviceId]: online ? "online" : "offline",
    }));
  };

  const appendLogs = useCallback(
    (deviceId: string, entries: DeviceLog | DeviceLog[]) => {
      const incoming = Array.isArray(entries) ? entries : [entries];
      setLogs((prev) => {
        const merged = mergeAndSortLogs(prev[deviceId] ?? [], incoming);
        return {
          ...prev,
          [deviceId]: merged.slice(-50),
        };
      });
    },
    []
  );

  const getDevicesSnapshot = useCallback(() => devices, [devices]);

  const handleSocketConnection = useCallback(
    (deviceId: string, status: "online" | "offline") => {
      setConnectionMap((prev) => ({
        ...prev,
        [deviceId]: status,
      }));
    },
    []
  );

  const handleSocketPower = useCallback(
    (deviceId: string, powered: boolean) => {
      setPowerMap((prev) => ({
        ...prev,
        [deviceId]: powered,
      }));
    },
    []
  );

  const handleSocketLog = useCallback(
    (deviceId: string, log: DeviceLog) => {
      appendLogs(deviceId, log);
    },
    [appendLogs]
  );

  useSocket({
    getDevices: getDevicesSnapshot,
    onLog: handleSocketLog,
    onConnectionUpdate: handleSocketConnection,
    onPowerUpdate: handleSocketPower,
  });

  // ---------------------------
  // LOAD DEVICES
  // ---------------------------

  const loadDevices = useCallback(async () => {
    try {
      setLoadingDevices(true);
      setError(null);

      const res = await DevicesService.devicesControllerFindAll();
      const rawDevices = Array.isArray(res) ? res : res?.data ?? [];

      const mapped = rawDevices.map(mapApiDeviceToDevice);
      setDevices(mapped);

      // Initial power & connection
      setPowerMap(
        Object.fromEntries(
          mapped.map((d: Device) => [d.id, d.status === "online"])
        )
      );

      setConnectionMap(
        Object.fromEntries(
          mapped.map((d: Device) => [
            d.serial || d.id,
            d.status === "online" ? "online" : "offline",
          ])
        )
      );

      await refreshDeviceStatuses(mapped);
      await preloadLogs(mapped);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoadingDevices(false);
    }
  }, []);

  // ---------------------------
  // LOAD GROUPS
  // ---------------------------

  const loadGroups = useCallback(async () => {
    try {
      setLoadingGroups(true);

      const mappedGroups = await fetchDeviceGroups();
      setGroups(mappedGroups);
    } catch (err) {
      console.error("Failed to load groups:", err);
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  // ---------------------------------
  // PRELOAD LOGS (API)
  // ---------------------------------

  const preloadLogs = async (deviceList: Device[]) => {
    try {
      const results = await Promise.allSettled(
        deviceList.map(async (dev) => {
          const key = dev.serial || dev.id;
          if (!key) return null;

          const res = await DeviceLogsService.deviceLogsControllerGetDeviceLogs(
            key
          );
          const rawLogs = Array.isArray(res) ? res : res?.data ?? [];

          const mappedLogs = rawLogs.map((item: any, idx: number) =>
            mapApiLog(dev, item, idx)
          );
          type RelayState = "ON" | "OFF" | null;

          const relay = mappedLogs
            .map((l: DeviceLog) => extractRelayState(l.payload) as RelayState)
            .find(
              (v: RelayState): v is "ON" | "OFF" => v === "ON" || v === "OFF"
            );

          if (relay) {
            setPowerMap((prev) => ({
              ...prev,
              [dev.id]: relay === "ON",
            }));
          }

          return {
            deviceId: key,
            logs: mergeAndSortLogs(mappedLogs).slice(-50),
          };
        })
      );

      const merged: Record<string, DeviceLog[]> = {};
      results.forEach((res) => {
        if (res.status === "fulfilled" && res.value) {
          merged[res.value.deviceId] = res.value.logs;
        }
      });

      setLogs((prev) => ({ ...prev, ...merged }));
    } catch (err) {
      console.error("Failed preload logs:", err);
    }
  };

  // ---------------------------------
  // CRUD & ACTIONS
  // ---------------------------------

  const createDevice = async (payload: CreateDeviceInput) => {
    try {
      const defaultStatus = (payload.status ??
        "OFFLINE") as CreateDeviceDto["status"];
      await DevicesService.devicesControllerCreate({
        serialNumber: payload.serialNumber,
        name: payload.name,
        description: payload.description,
        location: payload.location,
        status: defaultStatus,
        latitude:
          typeof payload.latitude === "number" ? payload.latitude : undefined,
        longitude:
          typeof payload.longitude === "number" ? payload.longitude : undefined,
      });
      await loadDevices();
    } catch (err) {
      if (err instanceof ApiError) {
        throw err;
      }
      throw new Error(parseApiError(err));
    }
  };

  const updateDevice = async (payload: UpdateDeviceInput) => {
    try {
      await DevicesService.devicesControllerUpdate(payload.id, {
        serialNumber: payload.serialNumber,
        name: payload.name,
        description: payload.description,
        location: payload.location,
        latitude:
          typeof payload.latitude === "number" ? payload.latitude : undefined,
        longitude:
          typeof payload.longitude === "number" ? payload.longitude : undefined,
      });
      await loadDevices();
    } catch (err) {
      if (err instanceof ApiError) {
        throw err;
      }
      throw new Error(parseApiError(err));
    }
  };

  const deleteDevice = async (device: Device) => {
    try {
      const id = device.serial || device.id;
      await DevicesService.devicesControllerRemove(id);
      await loadDevices();
    } catch (err) {
      if (err instanceof ApiError) {
        throw err;
      }
      throw new Error(parseApiError(err));
    }
  };

  const assignDeviceToGroup = async (groupId: string, deviceId: string) => {
    try {
      await GroupsService.groupsControllerAddDevice(groupId, deviceId);
      await Promise.all([loadDevices(), loadGroups()]);
    } catch (err) {
      if (err instanceof ApiError) {
        throw err;
      }
      throw new Error(parseApiError(err));
    }
  };

  const togglePower = async (device: Device, value: boolean) => {
    const command = value ? "ON" : "OFF";
    const id = device.serial || device.id;

    // optimistic update
    setPowerMap((prev) => ({ ...prev, [device.id]: value }));

    try {
      await DevicesService.devicesControllerSendCommand(id, {
        payload: { command, params: { speed: 1 } },
      });
    } catch (err) {
      // revert
      setPowerMap((prev) => ({ ...prev, [device.id]: !value }));
      if (err instanceof ApiError) {
        throw err;
      }
      throw new Error(parseApiError(err));
    }
  };

  // ---------------------------------
  // REFRESH STATUS (API)
  // ---------------------------------

  const refreshDeviceStatuses = useCallback(async (deviceList: Device[]) => {
    try {
      const results = await Promise.allSettled(
        deviceList.map(async (dev) => {
          const id = dev.serial || dev.id;
          const data = await DevicesService.devicesControllerFindStatus(id);

          const status = normalizeStatus(data?.status);
          const lastSeen = data?.lastSeenAt
            ? new Date(data.lastSeenAt).toLocaleString()
            : undefined;

          return { id, status, lastSeen };
        })
      );

      results.forEach((res) => {
        if (res.status !== "fulfilled" || !res.value) return;
        const { id, status, lastSeen } = res.value;

        updateConnectionState(id, status);

        setDevices((prev) =>
          prev.map((d) =>
            d.serial === id || d.id === id
              ? { ...d, status: status, lastSeen: lastSeen ?? d.lastSeen }
              : d
          )
        );
      });
    } catch (err) {
      console.error("Failed refresh:", err);
    }
  }, []);

  // ---------------------------------
  // INIT LOAD
  // ---------------------------------

  useEffect(() => {
    loadDevices();
    loadGroups();
  }, [loadDevices, loadGroups]);

  // ---------------------------------
  // PUBLIC API RETURN
  // ---------------------------------

  return {
    devices,
    groups,
    logs,
    powerMap,
    connectionMap,

    loadingDevices,
    loadingGroups,
    error,

    // actions
    createDevice,
    updateDevice,
    deleteDevice,
    assignDeviceToGroup,
    togglePower,

    refreshDeviceStatuses,
    reloadDevices: loadDevices,
    reloadGroups: loadGroups,
  };
};
