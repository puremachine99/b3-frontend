"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import type { Device } from "@/types/device";
import type { DeviceGroup } from "@/types/group";

interface Props {
  open: boolean;
  device: Device | null;

  groups: DeviceGroup[];
  selectedGroupId: string;
  onSelectGroup: (id: string) => void;

  submitting: boolean;
  loading: boolean;

  onSubmit: () => void;
  onOpenChange: (open: boolean) => void;
}

export const AssignGroupDialog = ({
  open,
  device,
  groups,
  selectedGroupId,
  onSelectGroup,
  submitting,
  loading,
  onSubmit,
  onOpenChange,
}: Props) => {
  const hasGroups = groups.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Device to Group</DialogTitle>
          <DialogDescription>
            Pilih group untuk{" "}
            <span className="font-semibold">{device?.name}</span> (
            {device?.serial})
          </DialogDescription>
        </DialogHeader>

        {/* GROUP SELECT */}
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Group</Label>

            <Select
              disabled={!hasGroups || loading}
              value={selectedGroupId}
              onValueChange={onSelectGroup}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={loading ? "Loading groups..." : "Select group"}
                />
              </SelectTrigger>

              <SelectContent>
                {loading && (
                  <SelectItem value="loading" disabled>
                    Loading groups...
                  </SelectItem>
                )}

                {!loading &&
                  hasGroups &&
                  groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}

                {!loading && !hasGroups && (
                  <SelectItem value="none" disabled>
                    No groups found
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>

          <Button
            onClick={onSubmit}
            disabled={!selectedGroupId || !hasGroups || submitting || loading}
          >
            {submitting ? "Saving..." : "Add to Group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
