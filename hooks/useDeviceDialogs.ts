"use client";

import { useState } from "react";
import type { Device, DeviceView } from "@/types/device";

export const useDeviceDialogs = () => {
  const [view, setView] = useState<DeviceView>("grid");
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<Device | null>(null);
  const [deleteDevice, setDeleteDevice] = useState<Device | null>(null);
  const [assignDevice, setAssignDevice] = useState<Device | null>(null);
  const [logDevice, setLogDevice] = useState<Device | null>(null);

  const [deleteInput, setDeleteInput] = useState("");

  return {
    view,
    setView,

    terminalOpen,
    addOpen,
    editDevice,
    deleteDevice,
    assignDevice,
    logDevice,
    deleteInput,

    setTerminalOpen,
    setAddOpen,
    setEditDevice,
    setDeleteDevice,
    setAssignDevice,
    setLogDevice,
    setDeleteInput,

    // helpers
    openEdit: (d: Device) => setEditDevice(d),
    openDelete: (d: Device) => {
      setDeleteDevice(d);
      setDeleteInput("");
    },
    openAssign: (d: Device) => setAssignDevice(d),
    openLogs: (d: Device) => setLogDevice(d),

    closeAll: () => {
      setView("grid");
      setTerminalOpen(false);
      setAddOpen(false);
      setEditDevice(null);
      setDeleteDevice(null);
      setAssignDevice(null);
      setLogDevice(null);
      setDeleteInput("");
    },
  };
};
