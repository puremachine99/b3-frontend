export type Device = {
  id: string;
  macAddress: string;
  name: string;
  description: string;
  location: string;
  status: "ONLINE" | "OFFLINE" | "ERROR";
  groupId: string | null;
  updatedAt: string;
};

export type DeviceGroup = {
  id: string;
  name: string;
  description: string;
  devices: Device[];
};
