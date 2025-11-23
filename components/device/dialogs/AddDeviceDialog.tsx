"use client";

import { useState } from "react";

import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogDescription,
  DialogContent,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import type { CreateDeviceDto } from "@/lib/api-client";
import type { DeviceGroup } from "@/types/group";

import { parseCoordinateInput } from "@/utils/coords";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  groups: DeviceGroup[];
  onSubmit: (payload: (CreateDeviceDto & { groupId?: string })) => Promise<void>;
}

export const AddDeviceDialog = ({
  open,
  onOpenChange,
  groups,
  onSubmit,
}: Props) => {
  const [name, setName] = useState("");
  const [serialNumber, setSerial] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDesc] = useState("");
  const [latitude, setLat] = useState("");
  const [longitude, setLng] = useState("");
  const [groupId, setGroupId] = useState<string>(groups[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName("");
    setSerial("");
    setLocation("");
    setDesc("");
    setLat("");
    setLng("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const latitudeValue = parseCoordinateInput(latitude);
      const longitudeValue = parseCoordinateInput(longitude);

      await onSubmit({
        name,
        serialNumber,
        location,
        description,
        latitude: latitudeValue ?? undefined,
        longitude: longitudeValue ?? undefined,
        groupId,
      });

      reset();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create device");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Device</DialogTitle>
          <DialogDescription>Register a new IoT device node.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label>Device Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Serial Number</Label>
            <Input
              value={serialNumber}
              onChange={(e) => setSerial(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Location</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Latitude</Label>
              <Input
                value={latitude}
                onChange={(e) => setLat(e.target.value)}
              />
            </div>

            <div>
              <Label>Longitude</Label>
              <Input
                value={longitude}
                onChange={(e) => setLng(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Group</Label>
            <Select value={groupId} onValueChange={setGroupId}>
              <SelectTrigger>
                <SelectValue placeholder="Select group" />
              </SelectTrigger>

              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button disabled={loading} type="submit">
              {loading ? "Saving..." : "Save Device"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
