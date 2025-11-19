"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { Device } from "@/types/device";
import type { DeviceLog } from "@/types/logs";

import { useDeviceLogs } from "@/hooks/useDeviceLogs";

interface Props {
  device: Device | null;

  logs: Record<string, DeviceLog[]>;

  onOpenChange: (open: boolean) => void;
}

export const DeviceLogsDialog = ({ device, logs, onOpenChange }: Props) => {
  const {
    logs: dialogLogs,
    loading,
    error,
    renderPayload,
  } = useDeviceLogs({
    device,
    memoryLogs: logs,
  });

  return (
    <Dialog open={!!device} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Device Logs · {device?.name}</DialogTitle>
          <DialogDescription>
            Realtime logs merged with the latest API entries.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[380px] gap-2 overflow-y-auto rounded-xl border bg-muted/40 p-3 font-mono text-xs">
          {loading && dialogLogs.length === 0 ? (
            <p className="text-muted-foreground">Loading logs...</p>
          ) : null}

          {!loading && dialogLogs.length === 0 ? (
            <p className="text-muted-foreground">No logs available.</p>
          ) : null}

          {dialogLogs.map((log) => (
            <div
              key={log.id}
              className="flex flex-col gap-1 rounded-md bg-background/60 p-3"
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] uppercase">
                  {log.type || "LOG"}
                </Badge>

                <span className="text-[11px] text-muted-foreground">
                  {log.timestamp
                    ? new Date(log.timestamp).toLocaleString()
                    : ""}
                </span>
              </div>

              <p className="break-words font-medium">{log.message}</p>

              {log.payload ? (
                <p className="break-all text-[11px] text-muted-foreground">
                  {renderPayload(log.payload)}
                </p>
              ) : null}
            </div>
          ))}
        </div>

        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
