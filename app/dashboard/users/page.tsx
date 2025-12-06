"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import "@/lib/api-client/config";
import {
  ApiError,
  UsersService,
  type CreateUserDto,
  type UpdateUserDto,
} from "@/lib/api-client";

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

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

import { toast } from "sonner";
import {
  IconDotsVertical,
  IconPencil,
  IconTrash,
  IconUserPlus,
} from "@tabler/icons-react";

/* ============================================================
   TYPES
============================================================ */
type User = {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt?: string;
};

type UserFormPayload = {
  username: string;
  email: string;
  password?: string;
  role?: CreateUserDto["role"];
};
type UpdateUserPayload = UpdateUserDto & UserFormPayload & { id: string };

/* ============================================================
   MAIN PAGE
============================================================ */
export default function UsersPage() {
  const router = useRouter();

  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [deleteUser, setDeleteUser] = React.useState<User | null>(null);
  const [deleteInput, setDeleteInput] = React.useState("");

  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  /* ============================================================
     LOAD USERS
  ============================================================ */
  const loadUsers = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await UsersService.usersControllerFindAll();
      const apiUsers = Array.isArray(res) ? res : res?.data ?? [];

      setUsers(apiUsers);
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
      router.replace("/login?redirect=/dashboard/users");
      return;
    }
    loadUsers();
  }, [loadUsers, router]);

  /* ============================================================
     CREATE USER
  ============================================================ */
  const handleCreate = async (payload: UserFormPayload) => {
    try {
      setSaving(true);

      await UsersService.usersControllerCreate({
        username: payload.username,
        email: payload.email,
        password: payload.password ?? "",
        role: payload.role as CreateUserDto["role"],
      });

      toast("User created");
      setFormOpen(false);
      await loadUsers();
    } catch (err) {
      toast.error("Failed to create user", {
        description: parseApiError(err),
      });
    } finally {
      setSaving(false);
    }
  };

  /* ============================================================
     UPDATE USER
  ============================================================ */
  const handleUpdate = async (payload: UpdateUserPayload) => {
    try {
      setSaving(true);

      await UsersService.usersControllerUpdate(payload.id, {
        username: payload.username,
        email: payload.email,
        password: payload.password,
        role: payload.role as UpdateUserDto["role"],
      });

      toast("User updated");
      setEditingUser(null);
      setFormOpen(false);
      await loadUsers();
    } catch (err) {
      toast.error("Failed to update user", {
        description: parseApiError(err),
      });
    } finally {
      setSaving(false);
    }
  };

  /* ============================================================
     DELETE USER
  ============================================================ */
  const handleDelete = async () => {
    if (!deleteUser) return;

    try {
      setDeleting(true);

      await UsersService.usersControllerRemove(deleteUser.id);

      toast("User deleted");
      setDeleteUser(null);
      setDeleteInput("");

      await loadUsers();
    } catch (err) {
      toast.error("Failed to delete user", {
        description: parseApiError(err),
      });
    } finally {
      setDeleting(false);
    }
  };

  const deleteDisabled =
    !deleteUser || deleteInput !== deleteUser.username;

  /* ============================================================
     RENDER
  ============================================================ */
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

        <div className="flex flex-col flex-1">
          <section className="flex flex-col flex-1 gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">

            {/* === CONSISTENT HEADER (SAME AS GROUP PAGE) === */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
                <p className="text-sm text-muted-foreground">
                  Manage user accounts (GET/POST/PATCH/DELETE /users)
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setEditingUser(null);
                    setFormOpen(true);
                  }}
                >
                  <IconUserPlus className="size-4" />
                  Add User
                </Button>

                <Button variant="outline" onClick={loadUsers} disabled={loading}>
                  Refresh
                </Button>
              </div>
            </div>

            {/* === ERROR BLOCK === */}
            {error ? (
              <Card className="border-destructive/40">
                <CardHeader>
                  <CardTitle className="text-destructive">Error</CardTitle>
                  <CardDescription>{error}</CardDescription>
                </CardHeader>
              </Card>
            ) : null}

            {/* === TABLE VIEW === */}
            <UserTable
              users={users}
              onEdit={(u) => {
                setEditingUser(u);
                setFormOpen(true);
              }}
              onDelete={(u) => {
                setDeleteUser(u);
                setDeleteInput("");
              }}
            />
          </section>
        </div>
      </SidebarInset>

      {/* DIALOGS */}
      <UserDialog
        open={formOpen}
        user={editingUser}
        onOpenChange={(open) => {
          if (!open) {
            setEditingUser(null);
          }
          setFormOpen(open);
        }}
        onSubmit={(payload) => {
          if (editingUser) {
            return handleUpdate({ id: editingUser.id, ...payload });
          }
          return handleCreate(payload);
        }}
        mode={editingUser ? "edit" : "create"}
        loading={saving}
      />

      <DeleteUserDialog
        user={deleteUser}
        deleteInput={deleteInput}
        onDeleteInputChange={setDeleteInput}
        onConfirm={handleDelete}
        disabled={deleteDisabled}
        loading={deleting}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteUser(null);
            setDeleteInput("");
          }
        }}
      />
    </SidebarProvider>
  );
}

/* ============================================================
   TABLE COMPONENT
============================================================ */
function UserTable({
  users,
  onEdit,
  onDelete,
}: {
  users: User[];
  onEdit: (u: User) => void;
  onDelete: (u: User) => void;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>User Table</CardTitle>
        <CardDescription>Data dari GET /users</CardDescription>
      </CardHeader>

      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="pl-6">
                  <p className="font-semibold">{user.username}</p>
                  <p className="text-xs text-muted-foreground">{user.id}</p>
                </TableCell>

                <TableCell>{user.email}</TableCell>

                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {user.role}
                  </Badge>
                </TableCell>

                <TableCell className="pr-6 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <IconDotsVertical className="size-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => onEdit(user)}>
                        <IconPencil className="size-4" />
                        Edit
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        className="text-destructive"
                        onSelect={() => onDelete(user)}
                      >
                        <IconTrash className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>

              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/* ============================================================
   USER DIALOG (CREATE + EDIT)
============================================================ */
function UserDialog({
  open,
  user,
  onOpenChange,
  onSubmit,
  mode,
  loading,
}: {
  open: boolean;
  user: User | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: UserFormPayload) => Promise<void>;
  mode: "create" | "edit";
  loading: boolean;
}) {
  const [username, setUsername] = React.useState(user?.username ?? "");
  const [email, setEmail] = React.useState(user?.email ?? "");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState(user?.role ?? "OPERATOR");
  const [localError, setLocalError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setUsername(user?.username ?? "");
    setEmail(user?.email ?? "");
    setPassword("");
    setRole(user?.role ?? "OPERATOR");
    setLocalError(null);
  }, [user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setLocalError(null);

      await onSubmit({
        username,
        email,
        password: password || undefined,
        role: role as CreateUserDto["role"],
      });

      if (mode === "create") {
        setUsername("");
        setEmail("");
        setPassword("");
        setRole("OPERATOR");
      }

      onOpenChange(false);
    } catch (err) {
      setLocalError(parseApiError(err));
    }
  };

  const passwordLabel =
    mode === "create" ? "Password" : "Password (optional)";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add User" : "Edit User"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "POST /users" : `PATCH /users/${user?.id ?? ""}`}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <Label>Username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label>{passwordLabel}</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={
                mode === "create" ? "" : "Leave empty to keep old password"
              }
              required={mode === "create"}
            />
          </div>

          <div className="space-y-1">
            <Label>Role</Label>
            <Input
              value={role}
              onChange={(e) => setRole(e.target.value.toUpperCase())}
              placeholder="ADMIN or OPERATOR"
              required
            />
          </div>

          {localError ? (
            <p className="text-sm text-destructive">{localError}</p>
          ) : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>

            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : mode === "create" ? "Save" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================
   DELETE USER DIALOG
============================================================ */
function DeleteUserDialog({
  user,
  deleteInput,
  onDeleteInputChange,
  onConfirm,
  disabled,
  loading,
  onOpenChange,
}: {
  user: User | null;
  deleteInput: string;
  onDeleteInputChange: (value: string) => void;
  onConfirm: () => Promise<void>;
  disabled: boolean;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
          <DialogDescription>
            Ketik username{" "}
            <span className="font-semibold">{user?.username}</span> untuk konfirmasi.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1">
          <Label>Username</Label>
          <Input
            value={deleteInput}
            onChange={(e) => onDeleteInputChange(e.target.value)}
            placeholder={user?.username ?? ""}
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

/* ============================================================
   UTILS
============================================================ */
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
    .map((x) => x.trim())
    .find((x) => x.startsWith("token="));

  if (match) return match.split("=")[1];

  return localStorage.getItem("token");
}
