"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

import type { Device } from "@/types/device";
import type { DeviceGroup } from "@/types/group";
import { DeviceActionMenu } from "./DeviceActionMenu";

interface Props {
  groups: DeviceGroup[];
  powerMap: Record<string, boolean>;
  connectionMap: Record<string, "online" | "offline">;

  onTogglePower: (device: Device, checked: boolean) => void;
  onDelete: (device: Device) => void;
  onViewLogs: (device: Device) => void;
  onEdit: (device: Device) => void;
  onAssign: (device: Device) => void;

  logs: Record<string, any[]>;
}

export const DeviceTableView = ({
  groups,
  powerMap,
  connectionMap,
  onTogglePower,
  onDelete,
  onViewLogs,
  onEdit,
  onAssign,
  logs,
}: Props) => {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Device Row View</CardTitle>
        <CardDescription>
          Tabel komprehensif untuk audit cepat antar group.
        </CardDescription>
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
              <GroupSection
                key={group.id}
                group={group}
                powerMap={powerMap}
                connectionMap={connectionMap}
                onTogglePower={onTogglePower}
                onDelete={onDelete}
                onViewLogs={onViewLogs}
                onEdit={onEdit}
                onAssign={onAssign}
                logs={logs}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

/* -------------------------------------------------------------------------- */
/*                                GROUP SECTION                                */
/* -------------------------------------------------------------------------- */

const GroupSection = ({
  group,
  powerMap,
  connectionMap,
  onTogglePower,
  onDelete,
  onViewLogs,
  onEdit,
  onAssign,
  logs,
}: {
  group: DeviceGroup;
  powerMap: Record<string, boolean>;
  connectionMap: Record<string, "online" | "offline">;
  onTogglePower: (device: Device, checked: boolean) => void;
  onDelete: (device: Device) => void;
  onViewLogs: (device: Device) => void;
  onEdit: (device: Device) => void;
  onAssign: (device: Device) => void;
  logs: Record<string, any[]>;
}) => {
  return (
    <>
      {/* Group Label */}
      <TableRow className="bg-muted/50">
        <TableCell colSpan={5} className="pl-6 font-semibold">
          {group.name}
        </TableCell>
      </TableRow>

      {/* Devices */}
      {group.devices.map((device) => {
        const serialKey = device.serial || device.id;

        const isOnline = connectionMap[serialKey] === "online";
        const isPowerOn = powerMap[device.id] ?? false;

        const lastLog = logs[serialKey]?.slice(-1)[0];

        return (
          <TableRow key={device.id}>
            {/* DEVICE NAME */}
            <TableCell className="pl-6">
              <p className="flex items-center gap-2 font-medium">
                <span>{isOnline ? "🟢" : "🔴"}</span>
                {device.name}
              </p>
              <p className="text-xs text-muted-foreground">{device.id}</p>
            </TableCell>

            {/* SERIAL */}
            <TableCell>{device.serial}</TableCell>

            {/* POWER STATUS */}
            <TableCell>
              <Badge
                variant={isPowerOn ? "secondary" : "outline"}
                className={
                  isPowerOn
                    ? "bg-emerald-600 text-white capitalize"
                    : "border-rose-500 text-rose-600 capitalize"
                }
              >
                {isPowerOn ? "ON" : "OFF"}
              </Badge>
            </TableCell>

            {/* LOCATION */}
            <TableCell>{device.location}</TableCell>

            {/* ACTIONS */}
            <TableCell className="pr-6 text-right">
              <div className="flex items-center justify-end gap-3">
                {/* CONNECTION STATE */}
                <span className="text-[11px] text-muted-foreground">
                  {isOnline ? "Connected" : "Disconnected"}
                </span>

                {/* TOGGLE POWER */}
                <Switch
                  disabled={!isOnline}
                  checked={isPowerOn}
                  onCheckedChange={(checked) => onTogglePower(device, checked)}
                />

                {/* LAST LOG PREVIEW */}
                {lastLog ? (
                  <div className="flex flex-col gap-1 text-right text-[11px] text-muted-foreground max-w-[260px]">
                    <div className="flex justify-end gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {lastLog.type}
                      </Badge>
                      <span className="truncate">{lastLog.message}</span>
                    </div>
                  </div>
                ) : null}

                {/* DROPDOWN ACTION MENU */}
                <DeviceActionMenu
                  device={device}
                  onDelete={onDelete}
                  onViewLogs={onViewLogs}
                  onEdit={onEdit}
                  onAssign={onAssign}
                  disabledActions={!isOnline}
                />
              </div>
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
};
