"use client";

import { useEffect, useState, useCallback } from "react";
import "@/lib/api-client/config";
import { fetchDeviceGroups } from "@/lib/group-client";
import type { DeviceGroup } from "@/types/group";
import { parseApiError } from "@/utils/device";

export const useGroups = () => {
  const [groups, setGroups] = useState<DeviceGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGroups = useCallback(async () => {
    try {
      setLoading(true);
      const mapped = await fetchDeviceGroups();
      setGroups(mapped);
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
