"use client";

import * as React from "react";

import { api } from "@/lib/api";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  IconDeviceFloppy,
  IconDotsVertical,
  IconPlugConnected,
  IconTerminal2,
  IconTrash,
  IconUserPlus,
  IconUsersGroup,
} from "@tabler/icons-react";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";

type Device = {
  id: string;
  name: string;
  serial: string;
  status: "online" | "offline" | "error";
  type: "tracker" | "sensor" | "gateway";
  lastSeen: string;
  location: string;
  firmware: string;
  groupId: string;
  description?: string;
};

type DeviceGroup = {
  id: string;
  name: string;
  description: string;
  site: string;
  devices: Device[];
};

type DeviceView = "grid" | "groups" | "rows";

type DeviceLog = {
  id: string;
  deviceId: string;
  type?: string;
  message: string;
  payload?: unknown;
  timestamp?: string;
};

type ApiDevice = {
  id?: string;
  macAddress?: string;
  serialNumber?: string;
  name?: string;
  description?: string;
  location?: string;
  status?: string;
  lastSeenAt?: string | null;
  groupId?: string;
  group?: { id?: string };
};

type NewDevicePayload = {
  name: string;
  serialNumber: string;
  location?: string;
  description?: string;
  groupId?: string;
};

type UpdateDevicePayload = NewDevicePayload & { id: string };

type ApiGroup = {
  id?: string;
  name?: string;
  description?: string;
  site?: string;
  devices?: ApiDevice[];
};

export default function Page() {
  const socketRef = React.useRef<Socket | null>(null);
  const [logs, setLogs] = React.useState<Record<string, DeviceLog[]>>({});
  const [view, setView] = React.useState<DeviceView>("grid");
  const [devices, setDevices] = React.useState<Device[]>([]);
  const [loadingDevices, setLoadingDevices] = React.useState(true);
  const [groups, setGroups] = React.useState<DeviceGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [devicePower, setDevicePower] = React.useState<Record<string, boolean>>(
    {}
  );
  const [deviceConnection, setDeviceConnection] = React.useState<
    Record<string, "online" | "offline">
  >({});
  const [terminalOpen, setTerminalOpen] = React.useState(false);
  const [addDeviceOpen, setAddDeviceOpen] = React.useState(false);
  const [editDevice, setEditDevice] = React.useState<Device | null>(null);
  const [deviceToDelete, setDeviceToDelete] = React.useState<Device | null>(
    null
  );
  const [deleting, setDeleting] = React.useState(false);
  const [logDevice, setLogDevice] = React.useState<Device | null>(null);
  const [deleteInput, setDeleteInput] = React.useState("");
  const [assignDevice, setAssignDevice] = React.useState<Device | null>(null);
  const [assignGroupId, setAssignGroupId] = React.useState<string>("");
  const [assigning, setAssigning] = React.useState(false);

  const refreshDeviceStatuses = React.useCallback(async (deviceList: Device[]) => {
    try {
      const results = await Promise.allSettled(
        deviceList.map(async (device) => {
          const id = device.serial || device.id;
          if (!id) return null;
          const res = await api.get(`/devices/${id}/status`);
          const body = res.data;
          const statusValue = body?.status ?? body?.data?.status;
          const normalized = normalizeStatus(statusValue);
          const lastSeenAt = body?.lastSeenAt ?? body?.data?.lastSeenAt;
          return {
            key: id,
            status: normalized,
            lastSeen:
              lastSeenAt && !isNaN(Date.parse(lastSeenAt))
                ? new Date(lastSeenAt).toLocaleString()
                : undefined,
          };
        })
      );

      const connectionUpdates: Record<string, "online" | "offline"> = {};
      const deviceUpdates: Record<string, { status?: "online" | "offline" | "error"; lastSeen?: string }> = {};

      results.forEach((result) => {
        if (result.status !== "fulfilled" || !result.value) return;
        const { key, status, lastSeen } = result.value;
        if (status) {
          connectionUpdates[key] = status === "online" ? "online" : "offline";
          deviceUpdates[key] = {
            status,
            lastSeen: lastSeen,
          };
        }
      });

      if (Object.keys(connectionUpdates).length) {
        setDeviceConnection((prev) => ({ ...prev, ...connectionUpdates }));
      }

      if (Object.keys(deviceUpdates).length) {
        setDevices((prev) =>
          prev.map((device) => {
            const key = device.serial || device.id;
            const update = deviceUpdates[key];
            if (!update) return device;
            return {
              ...device,
              status: update.status ?? device.status,
              lastSeen: update.lastSeen ?? device.lastSeen,
            };
          })
        );
      }
    } catch (error) {
      console.error("Failed to refresh device statuses", error);
    }
  }, []);

  const loadDevices = React.useCallback(async () => {
    try {
      setLoadingDevices(true);
      setFetchError(null);
      const res = await api.get<ApiDevice[]>("/devices");
      const apiDevices: ApiDevice[] = res.data ?? [];
      const mapped = apiDevices.map(mapApiDeviceToDevice);
      setDevices(mapped);
      setDeviceConnection(
        Object.fromEntries(
          mapped.map((device) => [
            device.serial || device.id,
            device.status === "online" ? "online" : "offline",
          ])
        )
      );
      setDevicePower(
        Object.fromEntries(
          mapped.map((device) => [device.id, device.status === "online"])
        )
      );
      await refreshDeviceStatuses(mapped);
      await preloadLogs(mapped);
    } catch (error) {
      console.error(error);
      setFetchError(
        error instanceof Error ? error.message : "Gagal memuat perangkat"
      );
    } finally {
      setLoadingDevices(false);
    }
  }, []);

  const loadGroups = React.useCallback(async () => {
    try {
      setLoadingGroups(true);
      const res = await api.get("/groups");
      const body = res.data;
      const apiGroups = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
      const mapped = apiGroups.map(mapApiGroupToGroup);
      setGroups(mapped);
    } catch (error) {
      console.error("Failed to load groups", error);
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  React.useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  React.useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  React.useEffect(() => {
    if (assignDevice && !assignGroupId && groups.length) {
      setAssignGroupId(groups[0].id);
    }
  }, [assignDevice, assignGroupId, groups]);

  React.useEffect(() => {
    const SOCKET_URL =
      process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      joinDeviceRooms(socket, devices);
    });

    socket.on("device-log", (data: any) => {
      const deviceId = data?.deviceId || data?.macAddress || data?.serialNumber;
      if (!deviceId) return;
      syncPowerFromCommand(deviceId, data);
      syncPowerFromRelay(deviceId, data?.payload);
      const entry: DeviceLog = {
        id: `${deviceId}-${Date.now()}`,
        deviceId,
        type: data?.type,
        message: data?.message || JSON.stringify(data?.payload ?? data),
        payload: data?.payload,
        timestamp: data?.createdAt || new Date().toISOString(),
      };
      setLogs((prev) => {
        const next = { ...prev };
        const list = next[deviceId] ? [...next[deviceId]] : [];
        list.push(entry);
        next[deviceId] = sortLogs(list).slice(-5);
        return next;
      });
    });

    socket.on("device-status", (data: any) => {
      const deviceId = data?.deviceId || data?.macAddress || data?.serialNumber;
      if (!deviceId) return;
      const statusMsg = data?.status || JSON.stringify(data);
      syncPowerFromStatus(deviceId, data?.status);
      updateDeviceConnection(deviceId, data?.status);
      pushLog(deviceId, "STATUS", statusMsg, data?.payload ?? data);
    });

    socket.on("device-connection", (data: any) => {
      const deviceId = data?.deviceId;
      if (!deviceId) return;
      const statusMsg = data?.status || JSON.stringify(data);
      updateDeviceConnection(deviceId, statusMsg);
      pushLog(deviceId, "LWT", statusMsg, data);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [devices]);

  const pushLog = React.useCallback(
    (deviceId: string, type: string, message: string, payload?: any) => {
      setLogs((prev) => {
        const next = { ...prev };
        const list = next[deviceId] ? [...next[deviceId]] : [];
        list.push({
          id: `${deviceId}-${Date.now()}`,
          deviceId,
          type,
          message,
          payload,
          timestamp: new Date().toISOString(),
        });
        next[deviceId] = sortLogs(list).slice(-5);
        return next;
      });
    },
    []
  );

  const joinDeviceRooms = (socket: Socket, deviceList: Device[]) => {
    deviceList.forEach((device) => {
      if (device.serial) {
        socket.emit("join-device", { deviceId: device.serial });
      }
    });
  };

  const preloadLogs = async (deviceList: Device[]) => {
    try {
      const results = await Promise.allSettled(
        deviceList.map(async (device) => {
          const res = await api.get(`/device-logs/${device.serial}`);
          const body = res.data;
          const apiLogs = Array.isArray(body?.data)
            ? body.data
            : Array.isArray(body)
            ? body
            : [];
          const mapped: DeviceLog[] = apiLogs.map((item: any, idx: number) =>
            mapApiLog(device, item, idx)
          );
          const relay = getLatestRelayState(mapped);
          if (relay) {
            setDevicePower((prev) => ({
              ...prev,
              [device.id]: relay === "ON",
            }));
          }
          return { deviceId: device.serial || device.id, logs: mapped.slice(-5) };
        })
      );
      const merged: Record<string, DeviceLog[]> = {};
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          merged[result.value.deviceId] = result.value.logs;
        }
      });
      setLogs((prev) => ({ ...merged, ...prev }));
    } catch (error) {
      console.error("Failed to preload logs", error);
    }
  };

  const syncPowerFromCommand = (deviceId: string, data: any) => {
    const cmd =
      data?.payload?.command ||
      data?.payload?.Command ||
      data?.command ||
      data?.message;
    if (!cmd || typeof cmd !== "string") return;
    const normalized = cmd.toUpperCase();
    if (normalized !== "ON" && normalized !== "OFF") return;
    const target = findDeviceBySerial(deviceId);
    if (!target) return;
    setDevicePower((prev) => ({
      ...prev,
      [target.id]: normalized === "ON",
    }));
  };

  const syncPowerFromStatus = (deviceId: string, status?: string) => {
    if (!status || typeof status !== "string") return;
    const normalized = status.toUpperCase();
    if (normalized !== "ON" && normalized !== "OFF") return;
    const target = findDeviceBySerial(deviceId);
    if (!target) return;
    setDevicePower((prev) => ({
      ...prev,
      [target.id]: normalized === "ON",
    }));
  };

  const updateDeviceConnection = (deviceId: string, status?: string) => {
    if (!status || typeof status !== "string") return;
    const normalized = status.trim().toUpperCase();
    const isOnline =
      normalized === "ON" ||
      normalized === "ONLINE" ||
      normalized === "CONNECTED";
    const isOffline =
      normalized === "OFF" ||
      normalized === "OFFLINE" ||
      normalized === "DISCONNECTED";
    if (!isOnline && !isOffline) return;
    const key = deviceId;
    setDeviceConnection((prev) => ({
      ...prev,
      [key]: isOnline ? "online" : "offline",
    }));
  };

  const syncPowerFromRelay = (deviceId: string, payload: any) => {
    const relay = extractRelayState(payload);
    if (!relay) return;
    const target = findDeviceBySerial(deviceId);
    if (!target) return;
    setDevicePower((prev) => ({
      ...prev,
      [target.id]: relay === "ON",
    }));
  };

  const findDeviceBySerial = (serialOrId: string): Device | undefined => {
    return devices.find(
      (d) => d.serial === serialOrId || d.id === serialOrId
    );
  };

  const visibleDevices = devices.filter(
    (d) => d.id !== "000000000000" && d.serial !== "000000000000"
  );
  const totalDevices = visibleDevices.length;
  const poweredOnDevices = Object.entries(devicePower).filter(([id, on]) => {
    const dev = visibleDevices.find((d) => d.id === id);
    return dev && on;
  }).length;
  const devicesInAlert =
    visibleDevices.filter((device) => device.status === "error").length +
    visibleDevices.filter((device) =>
      isDeviceDisconnected(deviceConnection, logs, device)
    ).length;

  const deviceGroups: DeviceGroup[] = React.useMemo(
    () => {
      const apiGroups = groups.map((group) => ({
        ...group,
        devices: (group.devices || []).map((device) => ({
          ...device,
          groupId: group.id,
        })),
      }));

      const fallbackGroupsMap: Record<string, Device[]> = {};
      visibleDevices.forEach((device) => {
        if (device.groupId && device.groupId !== "all") {
          fallbackGroupsMap[device.groupId] = fallbackGroupsMap[device.groupId] || [];
          fallbackGroupsMap[device.groupId].push(device);
        }
      });
      const fallbackGroups: DeviceGroup[] = Object.entries(fallbackGroupsMap).map(
        ([id, devs]) => ({
          id,
          name: `Group ${id}`,
          description: "",
          site: "",
          devices: devs,
        })
      );

      const mergedById = new Map<string, DeviceGroup>();
      [...apiGroups, ...fallbackGroups].forEach((group) => {
        const existing = mergedById.get(group.id);
        if (existing) {
          mergedById.set(group.id, {
            ...existing,
            ...group,
            devices: group.devices?.length ? group.devices : existing.devices,
          });
        } else {
          mergedById.set(group.id, group);
        }
      });

      const merged = Array.from(mergedById.values());

      return [
        {
          id: "all",
          name: "All Devices",
          description: "Data langsung dari API /devices",
          site: "",
          devices: visibleDevices,
        },
        ...merged,
      ];
    },
    [visibleDevices, groups]
  );
  const groupCount = Math.max(0, deviceGroups.length - 1);

  const handleTogglePower = async (device: Device, checked: boolean) => {
    // Optimistic UI toggle
    setDevicePower((prev) => ({
      ...prev,
      [device.id]: checked,
    }));

    const command = checked ? "ON" : "OFF";
    const deviceId = device.serial || device.id;
    try {
      await api.post(`/devices/${deviceId}/cmd`, {
        payload: {
          command,
          params: {
            speed: 1,
          },
        },
      });
    } catch (error) {
      console.error(error);
      // revert on failure
      setDevicePower((prev) => ({
        ...prev,
        [device.id]: !checked,
      }));
      setFetchError(
        error instanceof Error ? error.message : "Gagal mengirim perintah device"
      );
      toast.error(parseApiError(error));
    }
  };

  const handleDeleteRequest = (device: Device) => {
    setDeviceToDelete(device);
    setDeleteInput("");
  };

  const closeDeleteDialog = () => {
    setDeviceToDelete(null);
    setDeleteInput("");
  };

  const handleOpenAssign = (device: Device) => {
    setAssignDevice(device);
    setAssignGroupId(device.groupId && device.groupId !== "all" ? device.groupId : "");
  };

  const handleAssignToGroup = async () => {
    if (!assignDevice || !assignGroupId) return;
    try {
      setAssigning(true);
      const deviceId = assignDevice.serial || assignDevice.id;
      await api.post(`/groups/${assignGroupId}/devices/${deviceId}`);
      toast.success(`${assignDevice.name} added to group`);
      setAssignDevice(null);
      setAssignGroupId("");
      await Promise.all([loadDevices(), loadGroups()]);
    } catch (error) {
      toast.error(parseApiError(error));
    } finally {
      setAssigning(false);
    }
  };

  const closeEditDialog = () => {
    setEditDevice(null);
  };

  const handleCreateDevice = async (payload: NewDevicePayload) => {
    try {
      await api.post("/devices", {
        macAddress: payload.serialNumber,
        serialNumber: payload.serialNumber,
        name: payload.name,
        description: payload.description,
        location: payload.location,
        status: "OFFLINE",
      });
      await loadDevices();
    } catch (error) {
      throw new Error(parseApiError(error));
    }
  };

  const handleDeleteDevice = async () => {
    if (!deviceToDelete) return;
    try {
      setDeleting(true);
      const target = deviceToDelete.serial || deviceToDelete.id;
      await api.delete(`/devices/${target}`);
      await loadDevices();
    } catch (error) {
      console.error(error);
      setFetchError(parseApiError(error));
    } finally {
      setDeleting(false);
      closeDeleteDialog();
    }
  };

  const handleUpdateDevice = async (payload: UpdateDevicePayload) => {
    try {
      await api.patch(`/devices/${payload.id}`, {
        macAddress: payload.serialNumber,
        serialNumber: payload.serialNumber,
        name: payload.name,
        description: payload.description,
        location: payload.location,
      });
      await loadDevices();
      closeEditDialog();
    } catch (error) {
      throw new Error(parseApiError(error));
    }
  };

  const deleteDisabled = !deviceToDelete || deleteInput !== deviceToDelete.name;

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <section className="flex flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
            <DeviceStatsCards
              total={totalDevices}
              poweredOn={poweredOnDevices}
              errors={devicesInAlert}
              groups={groupCount}
            />
            <DeviceToolbar
              view={view}
              onViewChange={setView}
              onOpenTerminal={() => setTerminalOpen(true)}
              onOpenAdd={() => setAddDeviceOpen(true)}
            />
            {fetchError ? (
              <Card className="border-destructive/30">
                <CardHeader>
                  <CardTitle className="text-destructive">Gagal memuat data</CardTitle>
                  <CardDescription>{fetchError}</CardDescription>
                </CardHeader>
              </Card>
            ) : null}
            {loadingDevices ? (
              <Card>
                <CardHeader>
                  <CardTitle>Loading devices...</CardTitle>
                </CardHeader>
              </Card>
            ) : null}
            <Tabs
              value={view}
              onValueChange={(value) => setView(value as DeviceView)}
            >
              <TabsContent value="grid">
            <DeviceGridView
              groups={deviceGroups}
              powerMap={devicePower}
              connectionMap={deviceConnection}
              onTogglePower={handleTogglePower}
              onDelete={handleDeleteRequest}
              onViewLogs={setLogDevice}
              onEdit={setEditDevice}
              onAssign={handleOpenAssign}
              logs={logs}
            />
          </TabsContent>
          <TabsContent value="groups">
            <DeviceGroupPanels
              groups={deviceGroups}
              powerMap={devicePower}
              connectionMap={deviceConnection}
              onTogglePower={handleTogglePower}
              onDelete={handleDeleteRequest}
              onViewLogs={setLogDevice}
              onEdit={setEditDevice}
              onAssign={handleOpenAssign}
              logs={logs}
            />
          </TabsContent>
          <TabsContent value="rows">
            <DeviceTableView
              groups={deviceGroups}
              powerMap={devicePower}
              connectionMap={deviceConnection}
              onTogglePower={handleTogglePower}
              onDelete={handleDeleteRequest}
              onViewLogs={setLogDevice}
              onEdit={setEditDevice}
              onAssign={handleOpenAssign}
              logs={logs}
            />
          </TabsContent>
        </Tabs>
      </section>
    </div>
      </SidebarInset>
      <TerminalDialog open={terminalOpen} onOpenChange={setTerminalOpen} />
      <AddDeviceDialog
        open={addDeviceOpen}
        onOpenChange={setAddDeviceOpen}
        groups={deviceGroups.filter((group) => group.id !== "all")}
        onSubmit={handleCreateDevice}
      />
      <AssignGroupDialog
        open={!!assignDevice}
        device={assignDevice}
        selectedGroupId={assignGroupId}
        onSelectGroup={setAssignGroupId}
        onOpenChange={(open) => {
          if (!open) {
            setAssignDevice(null);
            setAssignGroupId("");
          }
        }}
        onSubmit={handleAssignToGroup}
        submitting={assigning}
        groups={deviceGroups.filter((group) => group.id !== "all")}
        loading={loadingGroups}
      />
      <DeviceLogsDialog
        device={logDevice}
        logs={logs}
        onOpenChange={(open) => {
          if (!open) setLogDevice(null);
        }}
      />
      <EditDeviceDialog
        device={editDevice}
        onOpenChange={(open) => {
          if (!open) closeEditDialog();
        }}
        onSubmit={handleUpdateDevice}
      />
      <DeleteDeviceDialog
        device={deviceToDelete}
        deleteInput={deleteInput}
        onDeleteInputChange={setDeleteInput}
        disabled={deleteDisabled}
        onConfirm={handleDeleteDevice}
        loading={deleting}
        onOpenChange={(open) => {
          if (!open) closeDeleteDialog();
        }}
      />
    </SidebarProvider>
  );
}

function DeviceStatsCards({
  total,
  poweredOn,
  errors,
  groups,
}: {
  total: number;
  poweredOn: number;
  errors: number;
  groups: number;
}) {
  const cards = [
    { label: "Total Devices", value: total },
    { label: "Power On", value: poweredOn },
    { label: "Alerts", value: errors },
    { label: "Groups", value: groups },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="pb-3">
            <CardDescription>{card.label}</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {card.value}
            </CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

function mapApiDeviceToDevice(apiDevice: ApiDevice): Device {
  const status = normalizeStatus(apiDevice.status);
  const id =
    apiDevice.id ||
    apiDevice.macAddress ||
    apiDevice.serialNumber ||
    crypto.randomUUID();
  const serial = apiDevice.serialNumber || apiDevice.macAddress;
  const lastSeen =
    apiDevice.lastSeenAt && !isNaN(Date.parse(apiDevice.lastSeenAt))
      ? new Date(apiDevice.lastSeenAt).toLocaleString()
      : "-";

  return {
    id,
    name: apiDevice.name || serial || "Unknown device",
    serial,
    status,
    type: "tracker",
    lastSeen,
    location: apiDevice.location || "-",
    firmware: "-",
    description: apiDevice.description,
    groupId: apiDevice.groupId || apiDevice.group?.id || "all",
  };
}

function mapApiGroupToGroup(apiGroup: ApiGroup): DeviceGroup {
  const id = apiGroup.id || crypto.randomUUID();
  const devices = Array.isArray(apiGroup.devices)
    ? apiGroup.devices.map((device) => ({
        ...mapApiDeviceToDevice(device),
        groupId: id,
      }))
    : [];

  return {
    id,
    name: apiGroup.name || "Unnamed Group",
    description: apiGroup.description || "",
    site: apiGroup.site || "",
    devices,
  };
}

function normalizeStatus(status?: string): "online" | "offline" | "error" {
  if (!status) return "offline";
  const value = status.toLowerCase();
  if (value.includes("error")) return "error";
  if (value.includes("on")) return "online";
  return "offline";
}

function truncateId(id: string, length = 5): string {
  if (!id) return "";
  return id.length <= length ? id : `${id.slice(0, length)}...`;
}

function extractRelayState(payload: any): "ON" | "OFF" | null {
  if (!payload) return null;
  let relay = "";
  if (typeof payload === "string") {
    try {
      const parsed = JSON.parse(payload);
      relay = parsed?.relay_state || parsed?.relayState || parsed?.relay;
    } catch {
      // ignore
    }
  } else if (typeof payload === "object") {
    relay = payload?.relay_state || payload?.relayState || payload?.relay;
  }
  if (!relay || typeof relay !== "string") return null;
  const normalized = relay.toUpperCase();
  if (normalized === "ON" || normalized === "OFF") return normalized;
  return null;
}

function extractConnectionState(log: DeviceLog): "ONLINE" | "OFFLINE" | null {
  const payload = log.payload;
  if (typeof payload === "object" && payload) {
    const conn =
      (payload as any).device_connection ||
      (payload as any).connection ||
      (payload as any).status;
    if (typeof conn === "string") {
      const up = conn.toUpperCase();
      if (up === "ONLINE" || up === "OFFLINE") return up;
    }
  }
  if (typeof payload === "string") {
    const up = payload.toUpperCase();
    if (up.includes("OFFLINE")) return "OFFLINE";
    if (up.includes("ONLINE")) return "ONLINE";
  }
  if (typeof log.message === "string") {
    const up = log.message.toUpperCase();
    if (up.includes("OFFLINE")) return "OFFLINE";
    if (up.includes("ONLINE")) return "ONLINE";
  }
  return null;
}

function getLatestRelayState(logs: DeviceLog[]): "ON" | "OFF" | null {
  if (!logs.length) return null;
  const sorted = sortLogs(logs);
  for (const log of sorted) {
    const relay = extractRelayState(log.payload);
    if (relay) return relay;
  }
  return null;
}

function sortLogs(logs: DeviceLog[]): DeviceLog[] {
  return [...logs].sort((a, b) => {
    const ta = a.timestamp ? Date.parse(a.timestamp) : 0;
    const tb = b.timestamp ? Date.parse(b.timestamp) : 0;
    return tb - ta;
  });
}

function isDeviceOffline(
  logs: Record<string, DeviceLog[]>,
  device: Device
): boolean {
  const list = logs[device.serial] || logs[device.id] || [];
  if (!list.length) return false;
  const sorted = sortLogs(list);
  const conn = getLatestConnectionState(sorted);
  if (conn === "OFFLINE") return true;
  if (conn === "ONLINE") return false;
  return false;
}

function getLatestConnectionState(
  logs: DeviceLog[]
): "ONLINE" | "OFFLINE" | null {
  for (const log of logs) {
    const isConnectionLog =
      (log.type || "").toUpperCase() === "LWT" ||
      (log.type || "").toUpperCase() === "SYSTEM" ||
      (log.message || "").toUpperCase().includes("LWT");
    if (!isConnectionLog) continue;
    const conn = extractConnectionState(log);
    if (conn) return conn;
  }
  return null;
}

function getDeviceConnectionStatus(
  connectionMap: Record<string, "online" | "offline">,
  logs: Record<string, DeviceLog[]>,
  device: Device
): "online" | "offline" {
  const key = device.serial || device.id;
  const mapped = connectionMap[key];
  if (mapped) return mapped;
  return isDeviceOffline(logs, device) ? "offline" : "online";
}

function isDeviceDisconnected(
  connectionMap: Record<string, "online" | "offline">,
  logs: Record<string, DeviceLog[]>,
  device: Device
): boolean {
  return getDeviceConnectionStatus(connectionMap, logs, device) === "offline";
}

function mapApiLog(device: Device, item: any, idx: number): DeviceLog {
  const payload = item?.payload;
  const command = item?.command || payload?.command || "";
  const relay =
    typeof payload === "object" && payload?.relay_state
      ? `relay=${payload.relay_state}`
      : "";
  const messageParts = [
    item?.eventType || item?.type,
    command,
    relay,
    typeof payload === "string" ? payload : "",
  ].filter(Boolean);

  return {
    id: item?.id || `${device.id}-${idx}`,
    deviceId: item?.deviceId || device.serial || device.id,
    type: item?.eventType || item?.type || "LOG",
    message:
      messageParts.join(" · ") ||
      item?.message ||
      JSON.stringify(payload ?? item),
    payload,
    timestamp: item?.createdAt || item?.timestamp,
  };
}

function parseApiError(error: unknown): string {
  if (typeof error === "string") return error;
  if (
    typeof error === "object" &&
    error &&
    "response" in error &&
    (error as any).response?.data
  ) {
    const resp = (error as any).response;
    if (resp?.status === 404) {
      return "Endpoint tidak tersedia (404). Periksa URL atau dukungan update di backend.";
    }
    const data = resp.data;
    const message = data?.message || data?.error || "Request failed";
    return Array.isArray(message) ? message.join(", ") : String(message);
  }
  if (error instanceof Error) return error.message;
  return "Request failed";
}

function DeviceToolbar({
  view,
  onViewChange,
  onOpenTerminal,
  onOpenAdd,
}: {
  view: DeviceView;
  onViewChange: (value: DeviceView) => void;
  onOpenTerminal: () => void;
  onOpenAdd: () => void;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col gap-4 pt-4 md:flex-row md:items-center md:justify-between md:pt-6">
        <Tabs
          value={view}
          onValueChange={(value) => onViewChange(value as DeviceView)}
        >
          <TabsList>
            <TabsTrigger value="grid">Card/Grid</TabsTrigger>
            <TabsTrigger value="groups">Group Panel</TabsTrigger>
            <TabsTrigger value="rows">Row/Table</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onOpenTerminal}>
            <IconTerminal2 className="size-4" />
            Terminal Mode
          </Button>
          <Button variant="outline" onClick={onOpenAdd}>
            <IconPlugConnected className="size-4" />
            Add Device
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DeviceGridView({
  groups,
  powerMap,
  connectionMap,
  onTogglePower,
  onDelete,
  onViewLogs,
  onEdit,
  onAssign,
  logs,
}: {
  groups: DeviceGroup[];
  powerMap: Record<string, boolean>;
  connectionMap: Record<string, "online" | "offline">;
  onTogglePower: (device: Device, checked: boolean) => void;
  onDelete: (device: Device) => void;
  onViewLogs: (device: Device) => void;
  onEdit: (device: Device) => void;
  onAssign: (device: Device) => void;
  logs: Record<string, DeviceLog[]>;
}) {
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.id} className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {group.name}
              </p>
              <p className="text-xs text-muted-foreground/80">
                {group.description}
              </p>
            </div>
            <Badge variant="outline">{group.devices.length} devices</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
            {group.devices.map((device) => {
              const status = getDeviceConnectionStatus(
                connectionMap,
                logs,
                device
              );
              const icon = status === "online" ? "🟢" : "🔴";

              return (
                <div
                  key={device.id}
                  className={`border-card bg-card relative flex aspect-square flex-col justify-between rounded-xl border p-4 shadow-xs`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold flex items-center gap-2">
                        <span role="img" aria-label={status}>
                          {icon}
                        </span>
                        {device.name}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {device.serial}
                      </p>
                    </div>
                    <DeviceActionMenu
                      device={device}
                      onDelete={onDelete}
                      onViewLogs={onViewLogs}
                      onEdit={onEdit}
                      onAssign={onAssign}
                      disabledActions={isDeviceOffline(logs, device)}
                    />
                  </div>
                  <div className="space-y-2 text-xs">
                    <p className="font-mono text-[11px]">ID: {truncateId(device.id)}</p>
                    <p className="text-muted-foreground">
                      {device.location} {/*· FW {device.firmware} */}
                    </p>
                    <Badge
                      variant={
                        powerMap[device.id] ? "secondary" : "outline"
                      }
                      className={
                        powerMap[device.id]
                          ? "bg-emerald-600 text-white"
                          : "border-rose-500 text-rose-600"
                      }
                    >
                      {powerMap[device.id] ? "ON" : "OFF"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div
                      className="flex flex-col text-[11px] text-muted-foreground"
                      title={status === "online" ? "Connected" : "Disconnected"}
                    >
                      <span>{device.lastSeen}</span>
                      <span>
                        {status === "online" ? "Connected" : "Disconnected"}
                      </span>
                    </div>
                    <Switch
                      disabled={isDeviceOffline(logs, device)}
                      checked={powerMap[device.id]}
                      onCheckedChange={(checked) =>
                        onTogglePower(device, checked)
                      }
                      aria-label={`Toggle ${device.name}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function DeviceGroupPanels({
  groups,
  powerMap,
  connectionMap,
  onTogglePower,
  onDelete,
  onViewLogs,
  onEdit,
  onAssign,
  logs,
}: {
  groups: DeviceGroup[];
  powerMap: Record<string, boolean>;
  connectionMap: Record<string, "online" | "offline">;
  onTogglePower: (device: Device, checked: boolean) => void;
  onDelete: (device: Device) => void;
  onViewLogs: (device: Device) => void;
  onEdit: (device: Device) => void;
  onAssign: (device: Device) => void;
  logs: Record<string, DeviceLog[]>;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-10">
      {groups.map((group) => (
        <Card key={group.id} className="xl:col-span-5">
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center justify-between text-lg">
              {group.name}
              <Badge variant="outline">{group.devices.length} devices</Badge>
            </CardTitle>
            <CardDescription>{group.description}</CardDescription>
            <p className="text-xs text-muted-foreground">Site: {group.site}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {group.devices.map((device) => {
              const status = getDeviceConnectionStatus(
                connectionMap,
                logs,
                device
              );
              const icon = status === "online" ? "🟢" : "🔴";

              return (
                <div
                  key={device.id}
                  className={`flex flex-wrap items-center gap-3 rounded-xl border px-3 py-2`}
                >
                  <div className="mr-auto">
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <span role="img" aria-label={status}>
                        {icon}
                      </span>
                      {device.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {device.serial} · {device.lastSeen}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      device.status === "error"
                        ? "border-amber-500 text-amber-600"
                        : device.status === "online"
                        ? "border-emerald-500 text-emerald-600"
                        : "border-slate-400 text-slate-500"
                    }
                  >
                    {powerMap[device.id] ? "ON" : "OFF"}
                  </Badge>
                  <Switch
                    disabled={isDeviceDisconnected(connectionMap, logs, device)}
                    checked={powerMap[device.id]}
                    onCheckedChange={(checked) => onTogglePower(device, checked)}
                  />
                  {logs[device.serial]?.length ? (
                    <div className="w-full rounded-md bg-muted/40 p-2">
                      {logs[device.serial]
                        .slice(-1)
                        .map((log) => (
                          <p
                            key={log.id}
                            className="flex items-center gap-2 text-[11px] text-muted-foreground"
                          >
                            <Badge variant="outline" className="text-[10px] uppercase">
                              {log.type || "LOG"}
                            </Badge>
                            <span className="truncate">{log.message}</span>
                          </p>
                        ))}
                    </div>
                  ) : null}
                    <DeviceActionMenu
                      device={device}
                      onDelete={onDelete}
                      onViewLogs={onViewLogs}
                      onEdit={onEdit}
                      onAssign={onAssign}
                      disabledActions={isDeviceDisconnected(connectionMap, logs, device)}
                    />
                  </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DeviceTableView({
  groups,
  powerMap,
  connectionMap,
  onTogglePower,
  onDelete,
  onViewLogs,
  onEdit,
  onAssign,
  logs,
}: {
  groups: DeviceGroup[];
  powerMap: Record<string, boolean>;
  connectionMap: Record<string, "online" | "offline">;
  onTogglePower: (device: Device, checked: boolean) => void;
  onDelete: (device: Device) => void;
  onViewLogs: (device: Device) => void;
  onEdit: (device: Device) => void;
  onAssign: (device: Device) => void;
  logs: Record<string, DeviceLog[]>;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Device Row View</CardTitle>
        <CardDescription>Grouped table for quick auditing</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Device</TableHead>
              <TableHead>Serial</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group) => (
              <React.Fragment key={group.id}>
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={5} className="pl-6 font-semibold">
                    {group.name}
                  </TableCell>
                </TableRow>
                {group.devices.map((device) => {
                  const status = getDeviceConnectionStatus(
                    connectionMap,
                    logs,
                    device
                  );
                  const icon = status === "online" ? "🟢" : "🔴";

                  return (
                    <TableRow key={device.id}>
                      <TableCell className="pl-6">
                        <p className="font-medium flex items-center gap-2">
                          <span role="img" aria-label={status}>
                            {icon}
                          </span>
                          {device.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {device.id}
                        </p>
                      </TableCell>
                      <TableCell>{device.serial}</TableCell>
                      <TableCell>
                        <Badge
                          variant={powerMap[device.id] ? "secondary" : "outline"}
                          className={
                            powerMap[device.id]
                              ? "bg-emerald-600 text-white capitalize"
                              : "border-rose-500 text-rose-600 capitalize"
                          }
                        >
                          {powerMap[device.id] ? "ON" : "OFF"}
                        </Badge>
                      </TableCell>
                      <TableCell>{device.location}</TableCell>
                      <TableCell className="pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span
                            className="text-[11px] text-muted-foreground"
                            title={status === "online" ? "Connected" : "Disconnected"}
                          >
                            {status === "online" ? "Connected" : "Disconnected"}
                          </span>
                          <Switch
                            disabled={isDeviceDisconnected(connectionMap, logs, device)}
                            checked={powerMap[device.id]}
                            onCheckedChange={(checked) =>
                              onTogglePower(device, checked)
                            }
                          />
                          {logs[device.serial]?.length ? (
                            <div className="flex flex-col gap-1 text-right text-[11px] text-muted-foreground">
                              {logs[device.serial]
                                .slice(-1)
                                .map((log) => (
                                  <div key={log.id} className="flex justify-end gap-2">
                                    <Badge variant="outline" className="text-[10px] uppercase">
                                      {log.type || "LOG"}
                                    </Badge>
                                    <span className="truncate max-w-[240px]">
                                      {log.message}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          ) : null}
                          <DeviceActionMenu
                            device={device}
                            onDelete={onDelete}
                            onViewLogs={onViewLogs}
                            onEdit={onEdit}
                            onAssign={onAssign}
                            disabledActions={isDeviceDisconnected(connectionMap, logs, device)}
                          />
                            </div>
                          </TableCell>
                        </TableRow>
                  );
                })}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function DeviceActionMenu({
  device,
  onDelete,
  onViewLogs,
  onEdit,
  onAssign,
  disabledActions = false,
}: {
  device: Device;
  onDelete: (device: Device) => void;
  onViewLogs: (device: Device) => void;
  onEdit: (device: Device) => void;
  onAssign: (device: Device) => void;
  disabledActions?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-7 rounded-full">
          <IconDotsVertical className="size-4" />
          <span className="sr-only">Device actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onSelect={() => !disabledActions && onEdit(device)}
          disabled={disabledActions}
        >
          <IconDeviceFloppy className="size-4" />
          Edit Device
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => !disabledActions && onAssign(device)}
          disabled={disabledActions}
        >
          <IconUsersGroup className="size-4" />
          Add to Group
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onViewLogs(device)}>
          <IconTerminal2 className="size-4" />
          View Logs
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-rose-600"
          onSelect={() => !disabledActions && onDelete(device)}
          disabled={disabledActions}
        >
          <IconTrash className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TerminalDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const logLines = [
    "[09:32:11] TRK-201 ack command lockDoor success",
    "[09:30:02] POS-112 error printer timeout (retry=2)",
    "[09:28:54] ENV-703 offline threshold breached",
    "[09:21:07] MQTT broker connection check OK",
    "[09:19:33] OTA update scheduled for TRK-203",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Terminal Mode · Device Logs</DialogTitle>
          <DialogDescription>
            Live feed from /device-logs stream endpoint
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-xl border bg-muted/40 p-4 font-mono text-sm leading-relaxed">
          {logLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <DialogFooter className="sm:justify-between">
          <div className="gap-2 flex">
            <Button>Export Logs</Button>
            <Button variant="outline">Connection Test</Button>
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddDeviceDialog({
  open,
  onOpenChange,
  groups = [],
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups?: DeviceGroup[];
  onSubmit: (payload: NewDevicePayload) => Promise<void>;
}) {
  const firstGroupId = groups[0]?.id;
  const [name, setName] = React.useState("");
  const [serialNumber, setSerialNumber] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const reset = () => {
    setName("");
    setSerialNumber("");
    setLocation("");
    setDescription("");
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        name,
        serialNumber,
        location,
        description,
        groupId: firstGroupId ?? "all",
      });
      reset();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to create device");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Device</DialogTitle>
          <DialogDescription>
            Register an IoT node and assign it to a group
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <Label htmlFor="device-name">Device Name</Label>
            <Input
              id="device-name"
              placeholder="e.g. Truck 210"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="device-serial">Serial Number</Label>
            <Input
              id="device-serial"
              placeholder="SN-XXXXX"
              value={serialNumber}
              onChange={(event) => setSerialNumber(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="device-location">Location</Label>
            <Input
              id="device-location"
              placeholder="Main Branch - Room A"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="device-description">Description</Label>
            <Input
              id="device-description"
              placeholder="Optional description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Target Group</Label>
            <Select defaultValue={firstGroupId}>
              <SelectTrigger>
                <SelectValue placeholder="Select group" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button" onClick={reset}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              <IconUserPlus className="size-4" />
              {loading ? "Saving..." : "Save Device"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AssignGroupDialog({
  open,
  device,
  groups = [],
  selectedGroupId,
  onSelectGroup,
  onSubmit,
  submitting,
  loading,
  onOpenChange,
}: {
  open: boolean;
  device: Device | null;
  groups?: DeviceGroup[];
  selectedGroupId: string;
  onSelectGroup: (value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const hasGroups = groups.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add device to group</DialogTitle>
          <DialogDescription>
            Pilih grup untuk {device?.name || "device"} ({device?.serial})
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Group</Label>
            <Select value={selectedGroupId} onValueChange={onSelectGroup} disabled={!hasGroups || loading}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Loading groups..." : "Select group"} />
              </SelectTrigger>
              <SelectContent>
                {loading ? (
                  <SelectItem value="loading" disabled>
                    Loading groups...
                  </SelectItem>
                ) : hasGroups ? (
                  groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-group" disabled>
                    No groups found
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={onSubmit}
            disabled={!selectedGroupId || !hasGroups || submitting || loading}
          >
            {submitting ? "Saving..." : "Add to Group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditDeviceDialog({
  device,
  onOpenChange,
  onSubmit,
}: {
  device: Device | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: UpdateDevicePayload) => Promise<void>;
}) {
  const [name, setName] = React.useState(device?.name ?? "");
  const [serialNumber, setSerialNumber] = React.useState(device?.serial ?? "");
  const [location, setLocation] = React.useState(device?.location ?? "");
  const [description, setDescription] = React.useState(device?.description ?? "");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setName(device?.name ?? "");
    setSerialNumber(device?.serial ?? "");
    setLocation(device?.location ?? "");
    setDescription(device?.description ?? "");
    setError(null);
  }, [device]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!device) return;
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        id: device.id,
        name,
        serialNumber,
        location,
        description,
        groupId: device.groupId,
      });
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to update device");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!device} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Device</DialogTitle>
          <DialogDescription>
            Update device information and metadata
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <Label htmlFor="edit-device-name">Device Name</Label>
            <Input
              id="edit-device-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-device-serial">Serial Number</Label>
            <Input
              id="edit-device-serial"
              value={serialNumber}
              onChange={(event) => setSerialNumber(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-device-location">Location</Label>
            <Input
              id="edit-device-location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-device-description">Description</Label>
            <Input
              id="edit-device-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              <IconDeviceFloppy className="size-4" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeviceLogsDialog({
  device,
  logs,
  onOpenChange,
}: {
  device: Device | null;
  logs: Record<string, DeviceLog[]>;
  onOpenChange: (open: boolean) => void;
}) {
  const deviceLogs = device ? logs[device.serial] ?? [] : [];
  const renderPayload = (payload: any): string => {
    if (payload == null) return "";
    if (typeof payload === "string") return payload;
    if (typeof payload === "object") {
      const kv: string[] = [];
      Object.entries(payload).forEach(([key, value]) => {
        if (value == null) return;
        if (typeof value === "object") {
          kv.push(`${key}: ${JSON.stringify(value)}`);
        } else {
          kv.push(`${key}: ${String(value)}`);
        }
      });
      return kv.join(" · ");
    }
    return String(payload);
  };

  return (
    <Dialog open={!!device} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Device Logs · {device?.name ?? ""}</DialogTitle>
          <DialogDescription>
            Realtime logs (socket) + latest entries from room {device?.serial ?? ""}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 rounded-xl border bg-muted/40 p-4 font-mono text-xs max-h-[360px] overflow-y-auto">
          {deviceLogs.length === 0 ? (
            <p className="text-muted-foreground">Belum ada log untuk device ini.</p>
          ) : (
            deviceLogs
              .slice()
              .reverse()
              .map((log) => (
                <div key={log.id} className="flex flex-col gap-1 rounded-md bg-background/60 p-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {log.type || "LOG"}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : ""}
                    </span>
                  </div>
                  <p className="font-medium">{log.message}</p>
                  {log.payload ? (
                    <p className="text-[11px] text-muted-foreground">
                      {renderPayload(log.payload)}
                    </p>
                  ) : null}
                </div>
              ))
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDeviceDialog({
  device,
  deleteInput,
  onDeleteInputChange,
  onOpenChange,
  disabled,
  onConfirm,
  loading,
}: {
  device: Device | null;
  deleteInput: string;
  onDeleteInputChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  disabled: boolean;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <Dialog open={!!device} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Device</DialogTitle>
          <DialogDescription>
            Type the device name{" "}
            <span className="font-semibold">{device?.name}</span> to confirm
            deletion.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          <Label htmlFor="delete-confirm">Device Name</Label>
          <Input
            id="delete-confirm"
            value={deleteInput}
            onChange={(event) => onDeleteInputChange(event.target.value)}
            placeholder={device?.name ?? ""}
          />
        </div>
        <Separator />
        <DialogFooter className="sm:justify-between">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={disabled || loading}
            onClick={onConfirm}
          >
            {loading ? "Deleting..." : "Delete Device"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
