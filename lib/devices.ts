import { api } from "./api";

export async function getDevices() {
  const res = await api.get("/devices");
  return res.data;
}

export async function getDevice(id: string) {
  const res = await api.get(`/devices/${id}`);
  return res.data;
}

export async function sendCommand(id: string, payload: any) {
  return api.post(`/devices/${id}/cmd`, { payload });
}

export async function deleteDevice(id: string) {
  return api.delete(`/devices/${id}`);
}
