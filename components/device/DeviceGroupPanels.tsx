"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import type { Device } from "@/types/device";
import type { DeviceGroup } from "@/types/group";
import { DeviceActionMenu } from "./DeviceActionMenu";
import { Switch } from "@/components/ui/switch";

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

export const DeviceGroupPanels = ({
  groups,
  powerMap,
  connectionMap,
  onTogglePower,
  onToggleGroup,
  onDelete,
  onViewLogs,
  onEdit,
  onAssign,
  logs,
  groupToggleState,
  groupToggleLoading,
}: Props) => {
  return (
    <div className="grid gap-4 xl:grid-cols-10">
      {groups.map((group) => {
        const isAllGroup = group.id === "all";
        const fallbackAllOn =
          group.devices.length > 0 &&
          group.devices.every((device) => powerMap[device.id]);
        const groupChecked =
          groupToggleState[group.id] ?? fallbackAllOn;
        const disableGroupSwitch =
          isAllGroup ||
          group.devices.length === 0 ||
          groupToggleLoading[group.id];

        return (
          <Card key={group.id} className="xl:col-span-5">
            <CardHeader className="space-y-1">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  <Badge variant="outline">{group.devices.length} devices</Badge>
                </div>
                {!isAllGroup ? (
                  <div className="flex flex-col items-end gap-1">
                    <Switch
                      checked={groupChecked}
                      disabled={disableGroupSwitch}
                      onCheckedChange={(value) => onToggleGroup(group, value)}
                      aria-label={`Toggle group ${group.name}`}
                    />
                    {groupToggleLoading[group.id] ? (
                      <p className="text-[11px] text-muted-foreground">
                        Sending command…
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {group.description ? (
                <CardDescription>{group.description}</CardDescription>
              ) : null}

              {group.site ? (
                <p className="text-xs text-muted-foreground">Site: {group.site}</p>
              ) : null}
            </CardHeader>

          <CardContent className="space-y-3">
            {group.devices.map((device) => {
              const key = device.serial || device.id;

              const isOnline = connectionMap[key] === "online";
              const isPowerOn = powerMap[device.id] ?? false;

              const lastLog = logs[key]?.slice(-1)[0];

              return (
                <div
                  key={device.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border px-3 py-2"
                >
                  {/* LEFT SIDE → NAME + SERIAL */}
                  <div className="mr-auto">
                    <p className="flex items-center gap-2 font-semibold text-sm">
                      <span>{isOnline ? "🟢" : "🔴"}</span>
                      {device.name}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {device.serial} · {device.lastSeen}
                    </p>
                  </div>

                  {/* POWER STATE */}
                  <Badge
                    variant="outline"
                    className={
                      isPowerOn
                        ? "border-emerald-500 text-emerald-600"
                        : "border-rose-500 text-rose-600"
                    }
                  >
                    {isPowerOn ? "ON" : "OFF"}
                  </Badge>

                  {/* SWITCH */}
                  <Switch
                    disabled={!isOnline}
                    checked={isPowerOn}
                    onCheckedChange={(value) => onTogglePower(device, value)}
                  />

                  {/* LAST LOG */}
                  {lastLog ? (
                    <div className="w-full rounded-md bg-muted/40 p-2">
                      <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {lastLog.type}
                        </Badge>

                        <span className="truncate">{lastLog.message}</span>
                      </p>
                    </div>
                  ) : null}

                  {/* ACTION MENU */}
                  <DeviceActionMenu
                    device={device}
                    onDelete={onDelete}
                    onViewLogs={onViewLogs}
                    onEdit={onEdit}
                    onAssign={onAssign}
                    disabledActions={!isOnline}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
        );
      })}
    </div>
  );
};
