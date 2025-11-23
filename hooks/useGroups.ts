"use client";

import { useEffect, useState, useCallback } from "react";
import "@/lib/api-client/config";
import { GroupsService } from "@/lib/api-client";
import type { DeviceGroup } from "@/types/group";
import { mapApiGroupToGroup } from "@/utils/device";
import { parseApiError } from "@/utils/device";

export const useGroups = () => {
  const [groups, setGroups] = useState<DeviceGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGroups = useCallback(async () => {
    try {
      setLoading(true);
      const res = await GroupsService.groupsControllerFindAll();
      const raw = Array.isArray(res) ? res : res?.data ?? [];

      setGroups(raw.map(mapApiGroupToGroup));
    } catch (error) {
      console.error("Failed to load groups:", parseApiError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  return { groups, loading, reload: loadGroups };
};
