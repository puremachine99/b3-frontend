// src/types/logs.ts

export type LogType = "STATUS" | "COMMAND" | "SYSTEM" | "ERROR" | "LOG";

export interface DeviceLog {
  id: string;
  deviceId: string;
  type: LogType;
  message: string;
  payload?: any;
  timestamp?: string;
  createdAt?: string;
  command?: string | null;
}
