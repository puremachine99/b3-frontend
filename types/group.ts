// src/types/group.ts

import type { Device } from "./device";

export interface DeviceGroup {
  id: string;
  name: string;
  description?: string | null;
  site?: string | null;
  metadata?: Record<string, any> | null;
  devices: Device[];
}
