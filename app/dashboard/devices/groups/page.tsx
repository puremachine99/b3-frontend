"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import "@/lib/api-client/config";
import {
  ApiError,
  GroupsService,
  type CreateGroupDto,
  type UpdateGroupDto,
} from "@/lib/api-client";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";

type Group = {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
};

type ApiGroup = Record<string, any>; // missing from OpenAPI

type UpdateGroupPayload = UpdateGroupDto & { id: string };

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = React.useState<Group[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [view, setView] = React.useState<"cards" | "table">("table");
  const [addOpen, setAddOpen] = React.useState(false);
  const [editGroup, setEditGroup] = React.useState<Group | null>(null);
  const [deleteGroup, setDeleteGroup] = React.useState<Group | null>(null);
  const [deleteInput, setDeleteInput] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const loadGroups = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await GroupsService.groupsControllerFindAll();
      const raw = Array.isArray(res) ? res : res?.data ?? [];
      setGroups(raw);
    } catch (err) {
      console.error(err);
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const token = getClientToken();
    if (!token) {
      router.replace("/login?redirect=/dashboard/groups");
      return;
    }
    loadGroups();
  }, [loadGroups, router]);

  const handleCreate = async (payload: CreateGroupDto) => {
    try {
      setSaving(true);
      await GroupsService.groupsControllerCreate(payload);
      toast({ title: "Group created" });
      setAddOpen(false);
      await loadGroups();
    } catch (err) {
      const msg = parseApiError(err);
      toast({ title: "Failed to create group", description: msg, variant: "destructive" });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (payload: UpdateGroupPayload) => {
    try {
      setSaving(true);
      await GroupsService.groupsControllerUpdate(payload.id, {
        name: payload.name,
        description: payload.description,
        metadata: payload.metadata,
      });
      toast({ title: "Group updated" });
      setEditGroup(null);
      await loadGroups();
    } catch (err) {
      const msg = parseApiError(err);
      toast({ title: "Failed to update group", description: msg, variant: "destructive" });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteGroup) return;
    try {
      setDeleting(true);
      await GroupsService.groupsControllerRemove(deleteGroup.id);
      toast({ title: "Group deleted" });
      setDeleteGroup(null);
      setDeleteInput("");
      await loadGroups();
    } catch (err) {
      const msg = parseApiError(err);
      toast({ title: "Failed to delete group", description: msg, variant: "destructive" });
      throw err;
    } finally {
      setDeleting(false);
    }
  };

  const deleteDisabled =
    !deleteGroup || deleteInput !== deleteGroup.name;

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
        <div className="flex flex-1 flex-col">
          <section className="flex flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Groups</h1>
                <p className="text-sm text-muted-foreground">
                  Kelola grup perangkat (GET/POST/PATCH/DELETE /groups)
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Tabs value={view} onValueChange={(v) => setView(v as any)}>
                  <TabsList>
                    <TabsTrigger value="cards">Cards</TabsTrigger>
                    <TabsTrigger value="table">Table</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button onClick={() => setAddOpen(true)}>
                  <IconPlus className="size-4" />
                  Add Group
                </Button>
                <Button variant="outline" onClick={loadGroups} disabled={loading}>
                  Refresh
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Statistik Grup</CardTitle>
                <CardDescription>Langsung dari endpoint /groups</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <StatTile label="Total Groups" value={groups.length} loading={loading} />
                  <StatTile
                    label="Described"
                    value={groups.filter((g) => g.description).length}
                    loading={loading}
                  />
                  <StatTile
                    label="With CreatedAt"
                    value={groups.filter((g) => g.createdAt).length}
                    loading={loading}
                  />
                  <StatTile label="Actions" value={2} loading={false} helper="Edit & Delete" />
                </div>
              </CardContent>
            </Card>

            {error ? (
              <Card className="border-destructive/40">
                <CardHeader>
                  <CardTitle className="text-destructive">Error</CardTitle>
                  <CardDescription>{error}</CardDescription>
                </CardHeader>
              </Card>
            ) : null}

            {view === "cards" ? (
              <GroupCards
                groups={groups}
                onEdit={setEditGroup}
                onDelete={(g) => {
                  setDeleteGroup(g);
                  setDeleteInput("");
                }}
              />
            ) : (
              <GroupTable
                groups={groups}
                onEdit={setEditGroup}
                onDelete={(g) => {
                  setDeleteGroup(g);
                  setDeleteInput("");
                }}
              />
            )}
          </section>
        </div>
      </SidebarInset>

      <AddGroupDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={handleCreate}
        loading={saving}
      />
      <EditGroupDialog
        group={editGroup}
        onOpenChange={(open) => {
          if (!open) setEditGroup(null);
        }}
        onSubmit={handleUpdate}
        loading={saving}
      />
      <DeleteGroupDialog
        group={deleteGroup}
        deleteInput={deleteInput}
        onDeleteInputChange={setDeleteInput}
        onConfirm={handleDelete}
        disabled={deleteDisabled}
        loading={deleting}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteGroup(null);
            setDeleteInput("");
          }
        }}
      />
    </SidebarProvider>
  );
}

function GroupCards({
  groups,
  onEdit,
  onDelete,
}: {
  groups: Group[];
  onEdit: (group: Group) => void;
  onDelete: (group: Group) => void;
}) {
  if (!groups.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center text-muted-foreground">
          Belum ada grup. Klik Add Group untuk menambahkan.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {groups.map((group) => (
        <Card key={group.id} className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              {group.name}
              <Badge variant="outline">{group.id}</Badge>
            </CardTitle>
            {group.description ? (
              <CardDescription>{group.description}</CardDescription>
            ) : null}
            {group.createdAt ? (
              <p className="text-xs text-muted-foreground">
                Created {new Date(group.createdAt).toLocaleString()}
              </p>
            ) : null}
          </CardHeader>
          <CardFooter className="pt-0">
            <div className="ml-auto flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(group)}
              >
                <IconPencil className="size-4" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(group)}
              >
                <IconTrash className="size-4" />
                Delete
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

function GroupTable({
  groups,
  onEdit,
  onDelete,
}: {
  groups: Group[];
  onEdit: (group: Group) => void;
  onDelete: (group: Group) => void;
}) {
  if (!groups.length) {
    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Group Table</CardTitle>
          <CardDescription>Data dari GET /groups</CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          Belum ada grup. Klik Add Group untuk membuat grup baru.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Group Table</CardTitle>
        <CardDescription>Data dari GET /groups</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group) => (
              <TableRow key={group.id}>
                <TableCell className="pl-6">
                  <p className="font-semibold">{group.name}</p>
                  <p className="text-xs text-muted-foreground">{group.id}</p>
                </TableCell>
                <TableCell>{group.description || "-"}</TableCell>
                <TableCell className="pr-6 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(group)}
                    >
                      <IconPencil className="size-4" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDelete(group)}
                    >
                      <IconTrash className="size-4" />
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function AddGroupDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CreateGroupDto) => Promise<void>;
  loading: boolean;
}) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [localError, setLocalError] = React.useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setLocalError(null);
      await onSubmit({ name, description });
      setName("");
      setDescription("");
      onOpenChange(false);
    } catch (err) {
      setLocalError(parseApiError(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Group</DialogTitle>
          <DialogDescription>POST /groups</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <Label htmlFor="group-name">Name</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="group-description">Description</Label>
            <Input
              id="group-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>
          {localError ? (
            <p className="text-sm text-destructive">{localError}</p>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditGroupDialog({
  group,
  onOpenChange,
  onSubmit,
  loading,
}: {
  group: Group | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: UpdateGroupPayload) => Promise<void>;
  loading: boolean;
}) {
  const [name, setName] = React.useState(group?.name ?? "");
  const [description, setDescription] = React.useState(group?.description ?? "");
  const [localError, setLocalError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setName(group?.name ?? "");
    setDescription(group?.description ?? "");
    setLocalError(null);
  }, [group]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!group) return;
    try {
      setLocalError(null);
      await onSubmit({ id: group.id, name, description });
      onOpenChange(false);
    } catch (err) {
      setLocalError(parseApiError(err));
    }
  };

  return (
    <Dialog open={!!group} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Group</DialogTitle>
          <DialogDescription>PATCH /groups/{group?.id ?? ""}</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <Label htmlFor="edit-group-name">Name</Label>
            <Input
              id="edit-group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-group-description">Description</Label>
            <Input
              id="edit-group-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>
          {localError ? (
            <p className="text-sm text-destructive">{localError}</p>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteGroupDialog({
  group,
  deleteInput,
  onDeleteInputChange,
  onConfirm,
  disabled,
  loading,
  onOpenChange,
}: {
  group: Group | null;
  deleteInput: string;
  onDeleteInputChange: (value: string) => void;
  onConfirm: () => Promise<void>;
  disabled: boolean;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!group} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Group</DialogTitle>
          <DialogDescription>
            Ketik nama <span className="font-semibold">{group?.name}</span> untuk konfirmasi.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          <Label htmlFor="delete-group">Group Name</Label>
          <Input
            id="delete-group"
            value={deleteInput}
            onChange={(e) => onDeleteInputChange(e.target.value)}
            placeholder={group?.name ?? ""}
          />
        </div>
        <DialogFooter className="sm:justify-between">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={disabled || loading}
            onClick={onConfirm}
          >
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatTile({
  label,
  value,
  loading,
  helper,
}: {
  label: string;
  value: number;
  loading: boolean;
  helper?: string;
}) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-3xl font-semibold tabular-nums">{loading ? "…" : value}</p>
      {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

function parseApiError(error: unknown): string {
  if (error instanceof ApiError) {
    const body = error.body as Record<string, unknown> | undefined;
    const message = body?.message || body?.error || error.message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string") return message;
    return error.message || "Request failed";
  }
  if (typeof error === "string") return error;
  if (
    typeof error === "object" &&
    error &&
    "response" in error &&
    (error as any).response?.data
  ) {
    const data = (error as any).response.data;
    const message = data?.message || data?.error || "Request failed";
    return Array.isArray(message) ? message.join(", ") : String(message);
  }
  if (error instanceof Error) return error.message;
  return "Request failed";
}

function getClientToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("token="));
  if (match) return match.split("=")[1];
  return localStorage.getItem("token");
}
