import "@/lib/api-client/config";
import { GroupsService } from "@/lib/api-client";
import { mapApiGroupToGroup } from "@/utils/device";
import type { DeviceGroup } from "@/types/group";

type ApiGroup = Record<string, any>;

const normalizeCollection = (payload: any): ApiGroup[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const attachGroupDevices = async (group: ApiGroup): Promise<ApiGroup> => {
  const groupId: string | undefined = group?.id;
  if (!groupId) {
    return { ...group, devices: [] };
  }

  try {
    const res = await GroupsService.groupsControllerListDevices(groupId);
    const devices = normalizeCollection(res).map((entry: any) => {
      const device = entry?.device ?? entry;
      if (device && typeof device === "object") {
        return {
          ...device,
          groupId: device.groupId ?? groupId,
        };
      }
      return device;
    });
    return { ...group, devices };
  } catch (error) {
    console.error("Failed to load devices for group", groupId, error);
    return { ...group, devices: [] };
  }
};

export const fetchRawGroupsWithDevices = async (): Promise<ApiGroup[]> => {
  const res = await GroupsService.groupsControllerFindAll();
  const groups = normalizeCollection(res);
  if (!groups.length) return [];

  return Promise.all(groups.map((group) => attachGroupDevices(group)));
};

export const fetchDeviceGroups = async (): Promise<DeviceGroup[]> => {
  const rawGroups = await fetchRawGroupsWithDevices();
  if (!rawGroups.length) return [];
  return rawGroups.map(mapApiGroupToGroup);
};
