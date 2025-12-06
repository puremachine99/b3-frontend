"use client";

import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconTerminal2 } from "@tabler/icons-react";  
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

import { DeviceActionMenu } from "./DeviceActionMenu";
import { truncateId } from "@/utils/device";

import type { Device } from "@/types/device";

interface Props {
  device: Device;
  isOnline: boolean;
  isPowerOn: boolean;
  onTogglePower: (device: Device, value: boolean) => void;
  onOpenLogs: (device: Device) => void;
  onOpenEdit: (device: Device) => void;
  onOpenDelete: (device: Device) => void;
  onOpenAssign: (device: Device) => void;
}

export const DeviceCard = ({
  device,
  isOnline,
  isPowerOn,
  onTogglePower,
  onOpenLogs,
  onOpenEdit,
  onOpenDelete,
  onOpenAssign,
}: Props) => {
  const renderInfo = (
    label: string,
    value?: string | null,
    display?: string | null
  ) => {
    const raw = value ?? "-";
    const shown = display ?? raw;

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <p className="text-xs text-muted-foreground truncate cursor-help">
            <span className="font-medium text-foreground">{label}:</span>{" "}
            {shown}
          </p>
        </TooltipTrigger>
        <TooltipContent side="top" align="start">
          <p className="max-w-xs text-xs">{raw}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  const gps =
    device.latitude != null && device.longitude != null
      ? `${device.latitude}, ${device.longitude}`
      : null;

  const disabled = !isOnline;

  return (
    <div
      aria-disabled={disabled}
      data-disabled={disabled}
      tabIndex={disabled ? -1 : undefined}
      className={cn(
        "relative rounded-xl border p-4 shadow-sm flex flex-col gap-3 bg-card transition-all",
        isOnline ? "border-border" : "border-red-500/60 bg-muted/40",
        disabled && "opacity-70 pointer-events-none"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">
            {device.name ?? truncateId(device.id)}
          </h3>
          <Badge
            variant={isOnline ? "default" : "destructive"}
            className="mt-1 capitalize"
          >
            {isOnline ? "Online" : "Offline"}
          </Badge>
        </div>

        <DeviceActionMenu
          device={device}
          onEdit={onOpenEdit}
          onAssign={onOpenAssign}
          onDelete={onOpenDelete}
          onViewLogs={onOpenLogs}
          disabledActions={!isOnline}
        />
      </div>

      <div className="space-y-1.5">
        {renderInfo("ID", device.id, truncateId(device.id))}
        {renderInfo("Serial", device.serial || "-")}
        {renderInfo("Location", device.location || "-")}
        {renderInfo("Last seen", device.lastSeen || "-")}
        {renderInfo("GPS", gps || "No data")}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Power {isPowerOn ? "On" : "Off"}</p>

        <Switch
          checked={isPowerOn}
          onCheckedChange={(val) => {
            if (disabled) return;
            onTogglePower(device, val);
          }}
          disabled={disabled}
        />
      </div>

      <Button
        className="w-full"
        onClick={() => {
          if (disabled) return;
          onOpenLogs(device);
        }}
        disabled={disabled}
      >
        <IconTerminal2 className="size-4" />
        View Logs
      </Button>

      {disabled ? (
        <div className="absolute inset-0 rounded-xl border border-transparent" aria-hidden="true" />
      ) : null}
    </div>
  );
};
