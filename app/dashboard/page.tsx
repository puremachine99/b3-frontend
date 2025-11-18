"use client";

import * as React from "react";

import { api } from "@/lib/api";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Device = {
  id: string;
  name: string;
  serial: string;
  status: "online" | "offline" | "error";
  location: string;
  lastSeen?: string | null;
  groupId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

type ApiDevice = {
  id?: string;
  name?: string;
  serialNumber?: string;
  macAddress?: string;
  status?: string | null;
  location?: string | null;
  lastSeenAt?: string | null;
  groupId?: string | null;
  group?: { id?: string | null } | null;
  latitude?: number | null;
  longitude?: number | null;
};

type DeviceGroup = {
  id: string;
  name: string;
  description?: string;
  devices: number;
};

type ApiGroup = {
  id?: string;
  name?: string;
  description?: string;
  devices?: ApiDevice[];
};

declare global {
  interface Window {
    L?: any;
  }
}

export default function Page() {
  const [devices, setDevices] = React.useState<Device[]>([]);
  const [groups, setGroups] = React.useState<DeviceGroup[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [leafletReady, setLeafletReady] = React.useState(false);
  const mapContainerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<any>(null);
  const markerLayerRef = React.useRef<any>(null);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [deviceRes, groupRes] = await Promise.allSettled([
        api.get<ApiDevice[]>("/devices"),
        api.get("/groups"),
      ]);

      if (deviceRes.status === "rejected") {
        throw deviceRes.reason;
      }
      const apiDevices = deviceRes.value.data ?? [];
      setDevices(apiDevices.map(mapDevice));

      if (groupRes.status === "fulfilled") {
        const raw = groupRes.value.data;
        const apiGroups = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
        setGroups(apiGroups.map(mapGroup));
      } else {
        setGroups([]);
      }
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredDevices = React.useMemo(
    () => devices.filter((d) => d.serial !== "000000000000"),
    [devices]
  );

  const onlineDevices = filteredDevices.filter((d) => d.status === "online").length;
  const errorDevices = filteredDevices.filter((d) => d.status === "error").length;
  const offlineDevices = filteredDevices.length - onlineDevices - errorDevices;

  const latestDevices = filteredDevices.slice(0, 8);

  React.useEffect(() => {
    // Load Leaflet assets on the client
    if (typeof window === "undefined") return;
    const ensureCss = () => {
      const exists = document.getElementById("leaflet-css");
      if (exists) return;
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    };
    ensureCss();

    const initMap = () => {
      if (!mapContainerRef.current || mapRef.current || !window.L) return;
      const L = window.L;
      mapRef.current = L.map(mapContainerRef.current).setView([-6.17511, 106.865039], 11);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(mapRef.current);
      markerLayerRef.current = L.layerGroup().addTo(mapRef.current);
      setLeafletReady(true);
    };

    if (window.L) {
      initMap();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => initMap();
    script.onerror = () => {
      console.error("Failed to load Leaflet");
    };
    document.body.appendChild(script);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  React.useEffect(() => {
    if (!leafletReady || !mapRef.current || !markerLayerRef.current || !window.L) return;
    const L = window.L;
    markerLayerRef.current.clearLayers();

    const validDevices = filteredDevices.filter(
      (d) => typeof d.latitude === "number" && typeof d.longitude === "number"
    );

    validDevices.forEach((device) => {
      const marker = L.marker([device.latitude!, device.longitude!], {
        title: device.name,
      });
      marker.bindTooltip(
        `<div class="space-y-1">
            <div class="font-semibold">${device.name}</div>
            <div class="text-xs text-muted-foreground">${device.serial}</div>
            <div class="text-xs">${device.location ?? "-"}</div>
            <div class="text-xs">${device.status}</div>
        </div>`,
        { direction: "top" }
      );
      markerLayerRef.current.addLayer(marker);
    });

    if (validDevices.length) {
      const bounds = L.latLngBounds(validDevices.map((d) => [d.latitude!, d.longitude!]));
      mapRef.current.fitBounds(bounds.pad(0.2));
    }
  }, [filteredDevices, leafletReady]);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col px-4 py-4 md:px-6 md:py-6 gap-4 md:gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Summary of your device network status and statistics.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData}>
              Refresh
            </Button>
          </div>

          {error ? (
            <Card className="border-destructive/40">
              <CardHeader>
                <CardTitle className="text-destructive">Dashboard Loading Failed</CardTitle>
                <CardDescription>{error}</CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Devices Statistic</CardTitle>
              <CardDescription>Data from API or API groups</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatBox label="Total Devices" value={devices.length} loading={loading} />
                <StatBox label="Online" value={onlineDevices} loading={loading} />
                <StatBox label="Offline" value={offlineDevices} loading={loading} />
                <StatBox label="Groups" value={groups.length} loading={loading} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Node Map</CardTitle>
              <CardDescription>All devices are connected</CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <div
                ref={mapContainerRef}
                className="h-[360px] w-full rounded-lg border"
                aria-label="Device map"
              />
              {!leafletReady ? (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                  Loading ...
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-4">
            <Card className="lg:col-span-2 xl:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle>Latest Device</CardTitle>
                <CardDescription>Top 8 Device from API</CardDescription>
              </CardHeader>
              <CardContent className="px-2">
                <DeviceTable devices={latestDevices} loading={loading} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Group List</CardTitle>
                <CardDescription>Endpoint /groups</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading groups...</p>
                ) : groups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No Group yet.</p>
                ) : (
                  groups.map((group) => (
                    <div key={group.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{group.name}</p>
                          {group.description ? (
                            <p className="text-xs text-muted-foreground truncate">
                              {group.description}
                            </p>
                          ) : null}
                        </div>
                        <Badge variant="secondary">{group.devices} devices</Badge>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function StatBox({ label, value, loading }: { label: string; value: number; loading: boolean }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-3xl font-semibold tabular-nums">{loading ? "…" : value}</p>
    </div>
  );
}

function DeviceTable({ devices, loading }: { devices: Device[]; loading: boolean }) {
  if (loading) {
    return <p className="text-sm text-muted-foreground px-2 py-4">Loading devices...</p>;
  }

  if (!devices.length) {
    return <p className="text-sm text-muted-foreground px-2 py-4">No Device Yet.</p>;
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Device</TableHead>
            <TableHead>Serial</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Last Seen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devices.map((device) => (
            <TableRow key={device.id}>
              <TableCell className="font-medium">{device.name}</TableCell>
              <TableCell className="font-mono text-xs">{device.serial}</TableCell>
              <TableCell>
                <StatusBadge status={device.status} />
              </TableCell>
              <TableCell>{device.location || "-"}</TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {device.lastSeen || "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function StatusBadge({ status }: { status: Device["status"] }) {
  if (status === "online") {
    return <Badge className="bg-emerald-600 text-white">Online</Badge>;
  }
  if (status === "error") {
    return <Badge variant="destructive">Error</Badge>;
  }
  return <Badge variant="outline">Offline</Badge>;
}

function mapDevice(device: ApiDevice): Device {
  const status = normalizeStatus(device.status);
  const serial = device.serialNumber || device.macAddress || device.id || "-";
  return {
    id: device.id || serial,
    name: device.name || serial,
    serial,
    status,
    location: device.location || "-",
    lastSeen: device.lastSeenAt || null,
    groupId: device.groupId || device.group?.id || null,
    latitude: typeof device.latitude === "number" ? device.latitude : null,
    longitude: typeof device.longitude === "number" ? device.longitude : null,
  };
}

function mapGroup(group: ApiGroup): DeviceGroup {
  return {
    id: group.id || crypto.randomUUID(),
    name: group.name || "Unnamed Group",
    description: group.description,
    devices: Array.isArray(group.devices) ? group.devices.length : 0,
  };
}

function normalizeStatus(status?: string | null): Device["status"] {
  if (!status) return "offline";
  const value = status.toLowerCase();
  if (value.includes("error")) return "error";
  if (value.includes("on")) return "online";
  return "offline";
}

function parseApiError(error: unknown): string {
  if (typeof error === "string") return error;
  if (
    typeof error === "object" &&
    error &&
    "response" in error &&
    (error as any).response?.data
  ) {
    const resp = (error as any).response;
    const data = resp.data;
    const message = data?.message || data?.error || "Request failed";
    return Array.isArray(message) ? message.join(", ") : String(message);
  }
  if (error instanceof Error) return error.message;
  return "Request failed";
}
