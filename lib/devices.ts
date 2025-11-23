import "@/lib/api-client/config";
import { DevicesService } from "@/lib/api-client";

export async function getDevices() {
  return DevicesService.devicesControllerFindAll();
}

export async function getDevice(id: string) {
  return DevicesService.devicesControllerFindOne(id);
}

export async function sendCommand(
  id: string,
  payload: Record<string, unknown>
) {
  return DevicesService.devicesControllerSendCommand(id, { payload });
}

export async function deleteDevice(id: string) {
  return DevicesService.devicesControllerRemove(id);
}
