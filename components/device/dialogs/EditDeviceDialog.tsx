"use client";

import { useState, useEffect } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { UpdateDeviceDto } from "@/lib/api-client";
import type { Device } from "@/types/device";
import { parseCoordinateInput } from "@/utils/coords";

interface Props {
  device: Device | null;
  canEditSerial?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: (UpdateDeviceDto & { id: string; groupId?: string })) => Promise<void>;
}

export const EditDeviceDialog = ({
  device,
  canEditSerial = false,
  onOpenChange,
  onSubmit,
}: Props) => {
  /* FORM STATES */
  const [name, setName] = useState("");
  const [serialNumber, setSerial] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDesc] = useState("");
  const [latitude, setLat] = useState("");
  const [longitude, setLng] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* LOAD DATA WHEN DEVICE CHANGES */
  useEffect(() => {
    if (!device) return;

    setName(device.name ?? "");
    setSerial(device.serial ?? "");
    setLocation(device.location ?? "");
    setDesc(device.description ?? "");
    setLat(device.latitude != null ? String(device.latitude) : "");
    setLng(device.longitude != null ? String(device.longitude) : "");
    setError(null);
  }, [device]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!device) return;

    setLoading(true);
    setError(null);

    try {
      const latitudeValue = parseCoordinateInput(latitude);
      const longitudeValue = parseCoordinateInput(longitude);

      await onSubmit({
        id: device.id,
        name,
        serialNumber,
        location,
        description,
        latitude: latitudeValue ?? undefined,
        longitude: longitudeValue ?? undefined,
        groupId: device.groupId,
      });

      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update device");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!device} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Device</DialogTitle>
          <DialogDescription>
            Update device metadata and attributes.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* NAME */}
          <div>
            <Label>Device Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          {/* SERIAL */}
          <div>
            <Label>Serial Number</Label>
            <Input
              value={serialNumber}
              onChange={(e) => setSerial(e.target.value)}
              required
              disabled={!canEditSerial}
            />
          </div>

          {/* LOCATION */}
          <div>
            <Label>Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>

          {/* DESCRIPTION */}
          <div>
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDesc(e.target.value)} />
          </div>

          {/* LAT / LNG */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Latitude</Label>
              <Input value={latitude} onChange={(e) => setLat(e.target.value)} />
            </div>

            <div>
              <Label>Longitude</Label>
              <Input value={longitude} onChange={(e) => setLng(e.target.value)} />
            </div>
          </div>

          {/* ERROR */}
          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>

            <Button disabled={loading} type="submit">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
