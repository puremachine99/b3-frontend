"use client";

import { IconDots, IconPencil, IconTrash, IconUserPlus, IconTerminal2 } from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { Device } from "@/types/device";

interface Props {
  device: Device;
  onEdit: (d: Device) => void;
  onAssign: (d: Device) => void;
  onDelete: (d: Device) => void;
  onViewLogs: (d: Device) => void;

  /** FIX: tambahin properti ini */
  disabledActions?: boolean;
}

export function DeviceActionMenu({
  device,
  onEdit,
  onAssign,
  onDelete,
  onViewLogs,
  disabledActions = false,
}: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          disabled={disabledActions}
        >
          <IconDots className="size-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled={disabledActions} onSelect={() => onEdit(device)}>
          <IconPencil className="size-4" /> Edit
        </DropdownMenuItem>

        <DropdownMenuItem disabled={disabledActions} onSelect={() => onAssign(device)}>
          <IconUserPlus className="size-4" /> Assign Group
        </DropdownMenuItem>

        <DropdownMenuItem disabled={disabledActions} onSelect={() => onViewLogs(device)}>
          <IconTerminal2 className="size-4" /> View Logs
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="text-destructive"
          disabled={disabledActions}
          onSelect={() => onDelete(device)}
        >
          <IconTrash className="size-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
