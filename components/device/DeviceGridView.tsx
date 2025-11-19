"use client";

import { Badge } from "@/components/ui/badge";
import { DeviceCard } from "./DeviceCard";

import type { Device } from "@/types/device";
import type { DeviceGroup } from "@/types/group";

interface Props {
  groups: DeviceGroup[];
  powerMap: Record<string, boolean>;
  connectionMap: Record<string, "online" | "offline">;

  onTogglePower: (device: Device, value: boolean) => void;
  onDelete: (device: Device) => void;
  onViewLogs: (device: Device) => void;
  onEdit: (device: Device) => void;
  onAssign: (device: Device) => void;

  logs: Record<string, any[]>;
}

export const DeviceGridView = ({
  groups,
  powerMap,
  connectionMap,
  onTogglePower,
  onDelete,
  onViewLogs,
  onEdit,
  onAssign,
}: Props) => {
  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={group.id} className="space-y-3">
          {/* GROUP HEADER */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {group.name}
              </h2>
              {group.description ? (
                <p className="text-xs text-muted-foreground/70">
                  {group.description}
                </p>
              ) : null}
            </div>

            <Badge variant="outline">{group.devices.length} devices</Badge>
          </div>

          {/* GRID */}
          <div
            className="
              grid 
              gap-4 
              sm:grid-cols-2 
              md:grid-cols-3 
              lg:grid-cols-4 
              xl:grid-cols-5 
              2xl:grid-cols-6
            "
          >
            {group.devices.map((device) => {
              const isOnline =
                connectionMap[device.serial || device.id] === "online";

              const isPowerOn = powerMap[device.id] ?? false;

              return (
                <DeviceCard
                  key={device.id}
                  device={device}
                  isOnline={isOnline}
                  isPowerOn={isPowerOn}
                  onTogglePower={onTogglePower}
                  onOpenDelete={onDelete}
                  onOpenLogs={onViewLogs}
                  onOpenEdit={onEdit}
                  onOpenAssign={onAssign}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
