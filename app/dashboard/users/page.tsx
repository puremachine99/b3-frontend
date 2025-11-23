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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  IconDotsVertical,
  IconPencil,
  IconTrash,
  IconUserPlus,
} from "@tabler/icons-react";

type User = {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt?: string;
};

type ApiUser = Record<string, any>; // missing from OpenAPI

type NewUserPayload = CreateUserDto;
type UpdateUserPayload = UpdateUserDto & { id: string };

export default function Page() {
  const router = useRouter();
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [editUser, setEditUser] = React.useState<User | null>(null);
  const [deleteUser, setDeleteUser] = React.useState<User | null>(null);
  const [deleteInput, setDeleteInput] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [view, setView] = React.useState<"cards" | "table">("table");

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

  const handleCreate = async (payload: CreateUserDto) => {
    try {
      setSaving(true);
      await UsersService.usersControllerCreate({
        username: payload.username,
        email: payload.email,
        password: payload.password,
        role: payload.role as CreateUserDto["role"],
      });
      toast({ title: "User created" });
      setAddOpen(false);
      await loadUsers();
    } catch (err) {
      const msg = parseApiError(err);
      setError(msg);
      toast({ title: "Failed to create user", description: msg, variant: "destructive" });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (payload: UpdateUserPayload) => {
    try {
      setSaving(true);
      await UsersService.usersControllerUpdate(payload.id, {
        username: payload.username,
        email: payload.email,
        password: payload.password,
        role: payload.role as UpdateUserDto["role"],
      });
      toast({ title: "User updated" });
      setEditUser(null);
      await loadUsers();
    } catch (err) {
      const msg = parseApiError(err);
      toast({ title: "Failed to update user", description: msg, variant: "destructive" });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    try {
      setDeleting(true);
      await UsersService.usersControllerRemove(deleteUser.id);
      toast({ title: "User deleted" });
      setDeleteUser(null);
      setDeleteInput("");
      await loadUsers();
    } catch (err) {
      const msg = parseApiError(err);
      toast({ title: "Failed to delete user", description: msg, variant: "destructive" });
      throw err;
    } finally {
      setDeleting(false);
    }
  };

  const deleteDisabled =
    !deleteUser || deleteInput !== deleteUser.username;

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <section className="flex flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
            <Card className="border-dashed">
              <CardContent className="flex flex-col gap-4 pt-4 md:flex-row md:items-center md:justify-between md:pt-6">
                <div>
                  <CardTitle>Users</CardTitle>
                  <CardDescription>
                    Manage users from the backend `/users` endpoint.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Tabs value={view} onValueChange={(v) => setView(v as any)}>
                    <TabsList>
                      <TabsTrigger value="cards">Cards</TabsTrigger>
                      <TabsTrigger value="table">Table</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <Button onClick={() => setAddOpen(true)}>
                    <IconUserPlus className="size-4" />
                    Add User
                  </Button>
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
              <UserCards
                users={users}
                onEdit={setEditUser}
                onDelete={(u) => {
                  setDeleteUser(u);
                  setDeleteInput("");
                }}
              />
            ) : (
              <UserTable
                users={users}
                onEdit={setEditUser}
                onDelete={(u) => {
                  setDeleteUser(u);
                  setDeleteInput("");
                }}
              />
            )}
          </section>
        </div>
      </SidebarInset>
      <AddUserDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={handleCreate}
        loading={saving}
      />
      <EditUserDialog
        user={editUser}
        onOpenChange={(open) => {
          if (!open) setEditUser(null);
        }}
        onSubmit={handleUpdate}
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

function UserCards({
  users,
  onEdit,
  onDelete,
}: {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {users.map((user) => (
        <Card key={user.id} className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              {user.username}
              <Badge variant="outline" className="capitalize">
                {user.role}
              </Badge>
            </CardTitle>
            <CardDescription>{user.email}</CardDescription>
            {user.createdAt ? (
              <p className="text-xs text-muted-foreground">
                Created {new Date(user.createdAt).toLocaleString()}
              </p>
            ) : null}
          </CardHeader>
          <CardFooter className="pt-0">
            <div className="ml-auto flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(user)}
              >
                <IconPencil className="size-4" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(user)}
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

function UserTable({
  users,
  onEdit,
  onDelete,
}: {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
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

function AddUserDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: NewUserPayload) => Promise<void>;
  loading: boolean;
}) {
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState("OPERATOR");
  const [localError, setLocalError] = React.useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setLocalError(null);
      await onSubmit({
        username,
        email,
        password,
        role: role as CreateUserDto["role"],
      });
      setUsername("");
      setEmail("");
      setPassword("");
      setRole("OPERATOR");
      onOpenChange(false);
    } catch (err) {
      setLocalError(parseApiError(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add User</DialogTitle>
          <DialogDescription>Create user via POST /users</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value.toUpperCase())}
              placeholder="OPERATOR or ADMIN"
              required
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

function EditUserDialog({
  user,
  onOpenChange,
  onSubmit,
  loading,
}: {
  user: User | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: UpdateUserPayload) => Promise<void>;
  loading: boolean;
}) {
  const [email, setEmail] = React.useState(user?.email ?? "");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState(user?.role ?? "OPERATOR");
  const [localError, setLocalError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setEmail(user?.email ?? "");
    setPassword("");
    setRole(user?.role ?? "OPERATOR");
    setLocalError(null);
  }, [user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    try {
      setLocalError(null);
      await onSubmit({
        id: user.id,
        email,
        password: password || undefined,
        role: role as UpdateUserDto["role"],
      });
      onOpenChange(false);
    } catch (err) {
      setLocalError(parseApiError(err));
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>PATCH /users/{user?.id ?? ""}</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-password">Password (optional)</Label>
            <Input
              id="edit-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave empty to keep"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-role">Role</Label>
            <Input
              id="edit-role"
              value={role}
              onChange={(e) => setRole(e.target.value.toUpperCase())}
              placeholder="OPERATOR or ADMIN"
              required
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
            Ketik username <span className="font-semibold">{user?.username}</span> untuk konfirmasi.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          <Label htmlFor="delete-user">Username</Label>
          <Input
            id="delete-user"
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
