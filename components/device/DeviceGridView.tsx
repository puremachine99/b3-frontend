"use client";

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { DeviceCard } from "./DeviceCard";

import type { Device } from "@/types/device";
import type { DeviceGroup } from "@/types/group";

interface Props {
  groups: DeviceGroup[];
  powerMap: Record<string, boolean>;
  connectionMap: Record<string, "online" | "offline">;

  onTogglePower: (device: Device, value: boolean) => void;
  onToggleGroup: (group: DeviceGroup, value: boolean) => void;
  onDelete: (device: Device) => void;
  onViewLogs: (device: Device) => void;
  onEdit: (device: Device) => void;
  onAssign: (device: Device) => void;

  logs: Record<string, any[]>;
  groupToggleState: Record<string, boolean>;
  groupToggleLoading: Record<string, boolean>;
}

export const DeviceGridView = ({
  groups,
  powerMap,
  connectionMap,
  onTogglePower,
  onToggleGroup,
  onDelete,
  onViewLogs,
  onEdit,
  onAssign,
  groupToggleState,
  groupToggleLoading,
}: Props) => {
  return (
    <div className="space-y-8">
      {groups.map((group) => {
        const isAllGroup = group.id === "all";
        const fallbackChecked =
          group.devices.length > 0 &&
          group.devices.every((device) => powerMap[device.id]);
        const checked =
          groupToggleState[group.id] ?? fallbackChecked;
        const disabled =
          isAllGroup ||
          group.devices.length === 0 ||
          groupToggleLoading[group.id];

        return (
          <div key={group.id} className="space-y-3">
            {/* GROUP HEADER */}
            <div className="flex items-center justify-between gap-3">
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

              <div className="flex items-center gap-3">
                <Badge variant="outline">{group.devices.length} devices</Badge>
                {!isAllGroup ? (
                  <Switch
                    checked={checked}
                    disabled={disabled}
                    onCheckedChange={(value) => onToggleGroup(group, value)}
                  />
                ) : null}
              </div>
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
        );
      })}
    </div>
  );
};
