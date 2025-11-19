// src/types/device.ts

export type DeviceStatus =
  | "online"
  | "offline"
  | "running"
  | "idle"
  | "error";

export type DeviceView = "grid" | "groups" | "rows";

export interface Device {
  id: string;
  name: string;
  serial?: string;
  serialNumber?: string;
  macAddress?: string;
  description?: string | null;
  location?: string | null;

  latitude?: number | null;
  longitude?: number | null;

  status: DeviceStatus;
  lastSeen?: string | null;
  lastSeenAt?: string | null;

  firmware?: string | null;
  type?: "tracker" | "sensor" | "gateway";

  createdAt?: string;
  updatedAt?: string;

  groupId?: string;
  groupIds?: string[];
}

// ---------------------------------------------------
// OPTIONAL BUT RECOMMENDED PAYLOAD TYPES
// ---------------------------------------------------

export interface NewDevicePayload {
  name: string;
  serialNumber: string;
  location?: string;
  description?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface UpdateDevicePayload extends NewDevicePayload {
  id: string;
}
