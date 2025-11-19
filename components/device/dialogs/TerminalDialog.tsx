"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TerminalDialog = ({ open, onOpenChange }: Props) => {
  const mockLines = [
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
          <DialogTitle>Terminal Mode</DialogTitle>
          <DialogDescription>
            Live feed from /device-logs (mock upstream)
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border bg-muted/40 p-4 font-mono text-sm leading-relaxed max-h-[400px] overflow-y-auto">
          {mockLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

        <DialogFooter className="sm:justify-between">
          <div className="flex gap-2">
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
};
