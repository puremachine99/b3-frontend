"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { DeviceGroup } from "@/types/group";
import { mapApiGroupToGroup } from "@/utils/device";
import { parseApiError } from "@/utils/device";

export const useGroups = () => {
  const [groups, setGroups] = useState<DeviceGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGroups = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/groups");
      const raw = Array.isArray(res.data)
        ? res.data
        : res.data?.data ?? [];

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
