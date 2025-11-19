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

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import type { Device } from "@/types/device";

interface Props {
  device: Device | null;
  deleteInput: string;
  onDeleteInputChange: (value: string) => void;

  disabled: boolean;
  loading: boolean;

  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}

export const DeleteDeviceDialog = ({
  device,
  deleteInput,
  onDeleteInputChange,
  disabled,
  loading,
  onConfirm,
  onOpenChange,
}: Props) => {
  const deviceName = device?.name ?? "";

  return (
    <Dialog open={!!device} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Device</DialogTitle>

          <DialogDescription>
            This action cannot be undone.
            <br />
            Type the device name{" "}
            <span className="font-semibold">{deviceName}</span>{" "}
            to confirm deletion.
          </DialogDescription>
        </DialogHeader>

        {/* INPUT FIELD */}
        <div className="space-y-1">
          <Label htmlFor="delete-confirm">Device Name</Label>
          <Input
            id="delete-confirm"
            value={deleteInput}
            onChange={(e) => onDeleteInputChange(e.target.value)}
            placeholder={deviceName}
            autoFocus
          />
        </div>

        <DialogFooter className="sm:justify-between">
          {/* CANCEL */}
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>

          {/* DELETE */}
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
};
