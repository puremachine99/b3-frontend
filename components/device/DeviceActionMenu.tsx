"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";

import {
  IconDotsVertical,
  IconDeviceFloppy,
  IconUsersGroup,
  IconTerminal2,
  IconTrash,
} from "@tabler/icons-react";

import type { Device } from "@/types/device";

interface Props {
  device: Device;
  onDelete: (device: Device) => void;
  onViewLogs: (device: Device) => void;
  onEdit: (device: Device) => void;
  onAssign: (device: Device) => void;
}

export const DeviceActionMenu = ({
  device,
  onDelete,
  onViewLogs,
  onEdit,
  onAssign,
}: Props) => {
  const isOffline = device.status === "offline";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 rounded-full hover:bg-muted"
        >
          <IconDotsVertical className="size-4" />
          <span className="sr-only">Device actions</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        {/* EDIT — enable always */}
        <DropdownMenuItem onSelect={() => onEdit(device)}>
          <IconDeviceFloppy className="size-4" />
          Edit Device
        </DropdownMenuItem>

        {/* ASSIGN — enable always */}
        <DropdownMenuItem onSelect={() => onAssign(device)}>
          <IconUsersGroup className="size-4" />
          Add to Group
        </DropdownMenuItem>

        {/* VIEW LOGS — enable always */}
        <DropdownMenuItem onSelect={() => onViewLogs(device)}>
          <IconTerminal2 className="size-4" />
          View Logs
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* DELETE — ONLY disabled if offline */}
        <DropdownMenuItem
          disabled={isOffline}
          onSelect={() => onDelete(device)}
          className="text-rose-600 focus:text-rose-700"
        >
          <IconTrash className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
