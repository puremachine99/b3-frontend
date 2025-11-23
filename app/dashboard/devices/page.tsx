"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";

import { DeviceStatsCards } from "@/components/device/DeviceStatsCards";
import { DeviceToolbar } from "@/components/device/DeviceToolbar";
import { DeviceLoadingState } from "@/components/device/DeviceLoadingState";

import { DeviceGridView } from "@/components/device/DeviceGridView";
import { DeviceGroupPanels } from "@/components/device/DeviceGroupPanels";
import { DeviceTableView } from "@/components/device/DeviceTableView";

import { TerminalDialog } from "@/components/device/dialogs/TerminalDialog";
import { AddDeviceDialog } from "@/components/device/dialogs/AddDeviceDialog";
import { EditDeviceDialog } from "@/components/device/dialogs/EditDeviceDialog";
import { AssignGroupDialog } from "@/components/device/dialogs/AssignGroupDialog";
import { DeleteDeviceDialog } from "@/components/device/dialogs/DeleteDeviceDialog";
import { DeviceLogsDialog } from "@/components/device/dialogs/DeviceLogsDialog";

import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { useDevices } from "@/hooks/useDevices";
import { useDeviceDialogs } from "@/hooks/useDeviceDialogs";
import { isDeviceDisconnected, parseApiError } from "@/utils/device";
import { toast } from "sonner";

import type { Device } from "@/types/device";
import type { DeviceGroup } from "@/types/group";

const SHELL_STYLE: CSSProperties = {
  "--sidebar-width": "calc(var(--spacing) * 72)",
  "--header-height": "calc(var(--spacing) * 12)",
} as CSSProperties;

export default function DevicesPage() {
  const {
    devices,
    groups,
    logs,
    powerMap,
    connectionMap,
    loadingDevices,
    loadingGroups,
    error,
    createDevice,
    updateDevice,
    deleteDevice: deleteDeviceAction,
    assignDeviceToGroup,
    togglePower,
  } = useDevices();

  const {
    view,
    setView,
    terminalOpen,
    setTerminalOpen,
    addOpen,
    setAddOpen,
    editDevice,
    setEditDevice,
    assignDevice,
    setAssignDevice,
    deleteDevice,
    setDeleteDevice,
    logDevice,
    setLogDevice,
    deleteInput,
    setDeleteInput,
  } = useDeviceDialogs();

  const [assignGroupId, setAssignGroupId] = useState("");
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [groupToggleState, setGroupToggleState] = useState<Record<string, boolean>>({});
  const [groupToggleLoading, setGroupToggleLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!assignDevice) {
      setAssignGroupId("");
      return;
    }

    const preferred =
      assignDevice.groupId && groups.some((g) => g.id === assignDevice.groupId)
        ? assignDevice.groupId
        : groups[0]?.id ?? "";

    setAssignGroupId(preferred);
  }, [assignDevice, groups]);

  const visibleDevices = useMemo(
    () =>
      devices.filter(
        (device) =>
          device.id !== "000000000000" &&
          (device.serial ?? "") !== "000000000000"
      ),
    [devices]
  );

  const derivedGroups = useMemo<DeviceGroup[]>(() => {
    const apiGroups = groups.map((group) => ({
      ...group,
      devices: (group.devices ?? []).map((device) => ({
        ...device,
        groupId: group.id,
      })),
    }));

    const getDeviceKey = (device: Device) =>
      device.id || device.serial || device.serialNumber || "";

    const groupedDeviceIds = new Set<string>();
    apiGroups.forEach((group) => {
      (group.devices ?? []).forEach((device) => {
        const key = getDeviceKey(device);
        if (key) groupedDeviceIds.add(key);
      });
    });

    const fallbackMap = new Map<string, Device[]>();
    visibleDevices.forEach((device) => {
      const key = getDeviceKey(device);
      if (!key) return;
      if (groupedDeviceIds.has(key)) return;
      if (device.groupId) {
        const list = fallbackMap.get(device.groupId) ?? [];
        fallbackMap.set(device.groupId, [...list, device]);
      }
    });

    const fallbackGroups: DeviceGroup[] = Array.from(
      fallbackMap.entries()
    ).map(([id, devices]) => ({
      id,
      name: `Group ${id}`,
      description: "",
      site: "",
      devices,
    }));

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
        devices: visibleDevices.filter((device) => {
          const key = getDeviceKey(device);
          if (!key) return !device.groupId;
          return !device.groupId && !groupedDeviceIds.has(key);
        }),
      },
      ...merged,
    ];
  }, [groups, visibleDevices]);

  const poweredOnDevices = visibleDevices.filter(
    (device) => powerMap[device.id]
  ).length;
  const errorDevices = visibleDevices.filter(
    (device) => device.status === "error"
  ).length;
  const disconnectedDevices = visibleDevices.filter((device) =>
    isDeviceDisconnected(connectionMap, logs, device)
  ).length;

  const deviceStats = {
    total: visibleDevices.length,
    poweredOn: poweredOnDevices,
    errors: errorDevices + disconnectedDevices,
    groups: Math.max(0, derivedGroups.length - 1),
  };

  const showLoadingCards = loadingDevices && visibleDevices.length === 0;

  const handleOpenDelete = (device: Device) => {
    setDeleteDevice(device);
    setDeleteInput("");
  };

  const handleOpenAssign = (device: Device) => {
    setAssignDevice(device);
    const preferred =
      device.groupId && groups.some((g) => g.id === device.groupId)
        ? device.groupId
        : groups[0]?.id ?? "";
    setAssignGroupId(preferred);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDevice) return;
    try {
      setDeleteLoading(true);
      await deleteDeviceAction(deleteDevice);
      setDeleteDevice(null);
      setDeleteInput("");
    } catch (err) {
      console.error("Failed to delete device", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAssignSubmit = async () => {
    if (!assignDevice || !assignGroupId) return;
    try {
      setAssignSubmitting(true);
      await assignDeviceToGroup(assignGroupId, assignDevice.id);
      setAssignDevice(null);
    } catch (err) {
      console.error("Failed to assign device", err);
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleGroupToggle = useCallback(
    async (group: DeviceGroup, value: boolean) => {
      if (group.id === "all") return;
      if (!group.devices.length) {
        toast.error("Group has no devices", {
          description: "Assign devices to this group before sending commands.",
        });
        return;
      }

      setGroupToggleLoading((prev) => ({ ...prev, [group.id]: true }));
      setGroupToggleState((prev) => ({ ...prev, [group.id]: value }));

      try {
        await Promise.all(
          group.devices.map((device) => togglePower(device, value))
        );
        toast(value ? "Power ON command sent" : "Power OFF command sent", {
          description: `${group.devices.length} device${
            group.devices.length === 1 ? "" : "s"
          } targeted`,
        });
      } catch (err) {
        setGroupToggleState((prev) => ({ ...prev, [group.id]: !value }));
        toast.error("Failed to send group command", {
          description: parseApiError(err),
        });
      } finally {
        setGroupToggleLoading((prev) => ({ ...prev, [group.id]: false }));
      }
    },
    [togglePower]
  );

  return (
    <SidebarProvider style={SHELL_STYLE}>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />

        <div className="flex flex-col flex-1">
          <section className="flex flex-col flex-1 gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
            <DeviceStatsCards
              total={deviceStats.total}
              poweredOn={deviceStats.poweredOn}
              errors={deviceStats.errors}
              groups={deviceStats.groups}
            />

            <DeviceToolbar
              view={view}
              onViewChange={setView}
              onOpenTerminal={() => setTerminalOpen(true)}
              onOpenAdd={() => setAddOpen(true)}
            />

            {error ? (
              <Card className="border-destructive/30">
                <CardHeader>
                  <CardTitle className="text-destructive">
                    Gagal memuat data
                  </CardTitle>
                  <CardDescription>{error}</CardDescription>
                </CardHeader>
              </Card>
            ) : null}

            {showLoadingCards ? (
              <DeviceLoadingState />
            ) : (
              <Tabs value={view} onValueChange={(v) => setView(v as any)}>
                <TabsContent value="grid">
                  <DeviceGridView
                    groups={derivedGroups}
                    powerMap={powerMap}
                    connectionMap={connectionMap}
                    logs={logs}
                    onTogglePower={togglePower}
                    onToggleGroup={handleGroupToggle}
                    onDelete={handleOpenDelete}
                    onViewLogs={setLogDevice}
                    onEdit={setEditDevice}
                    onAssign={handleOpenAssign}
                    groupToggleState={groupToggleState}
                    groupToggleLoading={groupToggleLoading}
                  />
                </TabsContent>

                <TabsContent value="groups">
                  <DeviceGroupPanels
                    groups={derivedGroups}
                    powerMap={powerMap}
                    connectionMap={connectionMap}
                    logs={logs}
                    onTogglePower={togglePower}
                    onToggleGroup={handleGroupToggle}
                    onDelete={handleOpenDelete}
                    onViewLogs={setLogDevice}
                    onEdit={setEditDevice}
                    onAssign={handleOpenAssign}
                    groupToggleState={groupToggleState}
                    groupToggleLoading={groupToggleLoading}
                  />
                </TabsContent>

                <TabsContent value="rows">
                  <DeviceTableView
                    groups={derivedGroups}
                    powerMap={powerMap}
                    connectionMap={connectionMap}
                    logs={logs}
                    onTogglePower={togglePower}
                    onToggleGroup={handleGroupToggle}
                    onDelete={handleOpenDelete}
                    onViewLogs={setLogDevice}
                    onEdit={setEditDevice}
                    onAssign={handleOpenAssign}
                    groupToggleState={groupToggleState}
                    groupToggleLoading={groupToggleLoading}
                  />
                </TabsContent>
              </Tabs>
            )}
          </section>
        </div>
      </SidebarInset>

      <TerminalDialog open={terminalOpen} onOpenChange={setTerminalOpen} />

      <AddDeviceDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        groups={groups}
        onSubmit={createDevice}
      />

      <EditDeviceDialog
        device={editDevice}
        canEditSerial={editDevice?.status === "offline"}
        onOpenChange={(open) => {
          if (!open) setEditDevice(null);
        }}
        onSubmit={updateDevice}
      />

      <AssignGroupDialog
        open={!!assignDevice}
        device={assignDevice}
        groups={groups}
        selectedGroupId={assignGroupId}
        onSelectGroup={setAssignGroupId}
        submitting={assignSubmitting}
        loading={loadingGroups}
        onSubmit={handleAssignSubmit}
        onOpenChange={(open) => {
          if (!open) setAssignDevice(null);
        }}
      />

      <DeviceLogsDialog
        device={logDevice}
        logs={logs}
        onOpenChange={(open) => {
          if (!open) setLogDevice(null);
        }}
      />

      <DeleteDeviceDialog
        device={deleteDevice}
        deleteInput={deleteInput}
        onDeleteInputChange={setDeleteInput}
        disabled={!deleteDevice || deleteInput !== deleteDevice.name}
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDevice(null);
            setDeleteInput("");
          }
        }}
      />
    </SidebarProvider>
  );
}
