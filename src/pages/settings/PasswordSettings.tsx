import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  passwordManagementService,
  PasswordManagedUser,
} from "@/services/passwordManagementService";

const roleOptions = ["all", "ADMIN", "TEACHER", "STUDENT", "PARENT", "FINANCE", "LIBRARIAN"];

const formatRole = (role: string) => role.replace("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export default function PasswordSettings() {
  const { token, user } = useAuth();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [users, setUsers] = useState<PasswordManagedUser[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedUser, setSelectedUser] = useState<PasswordManagedUser | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [reason, setReason] = useState("Password forgotten");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManagePasswords = useMemo(() => user?.role === "admin" || user?.role === "super_admin", [user?.role]);

  const loadUsers = async () => {
    if (!token || !canManagePasswords) return;
    setIsLoading(true);
    try {
      const res = await passwordManagementService.listUsers({
        token,
        page,
        limit,
        search,
        role,
        status,
      });

      setUsers(res.users || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalItems(res.pagination?.totalItems || 0);
    } catch (error: any) {
      toast({
        title: "Failed to load users",
        description: error?.message || "Unable to fetch users for password management",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [token, page, role, status]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setPage(1);
      loadUsers();
    }, 350);

    return () => clearTimeout(handle);
  }, [search]);

  const openResetDialog = (u: PasswordManagedUser) => {
    setSelectedUser(u);
    setTempPassword("");
    setConfirmPassword("");
    setReason("Password forgotten");
    setDialogOpen(true);
  };

  const submitReset = async () => {
    if (!token || !selectedUser) return;

    if (tempPassword.length < 8) {
      toast({
        title: "Invalid password",
        description: "Temporary password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    if (tempPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please make sure both password fields match",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await passwordManagementService.resetUserPassword(token, selectedUser.id, {
        newTemporaryPassword: tempPassword,
        forceResetOnNextLogin: true,
        reason,
      });

      toast({
        title: "Password reset successful",
        description: response.message || "User must change password on next login",
      });

      setDialogOpen(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error: any) {
      toast({
        title: "Password reset failed",
        description: error?.message || "Could not reset this user's password",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canManagePasswords) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Password Settings</CardTitle>
            <CardDescription>You do not have permission to access this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Password Settings</h1>
        <p className="text-muted-foreground">
          Reset passwords for users across all roles. Users will be required to change password at next login.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Password Management</CardTitle>
          <CardDescription>Search and reset passwords for forgotten-password support.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2 space-y-1">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, username, or email"
              />
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <Select value={role} onValueChange={(value) => { setRole(value); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r === "all" ? "All roles" : formatRole(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reset Flag</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="font-medium">{u.displayName}</div>
                        <div className="text-xs text-muted-foreground">{u.email || "No email"}</div>
                      </TableCell>
                      <TableCell>{u.username}</TableCell>
                      <TableCell>{formatRole(u.role)}</TableCell>
                      <TableCell>
                        <Badge variant={u.isActive ? "default" : "secondary"}>{u.isActive ? "Active" : "Inactive"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.forcePasswordReset ? "default" : "outline"}>
                          {u.forcePasswordReset ? "Required" : "Not required"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => openResetDialog(u)}>
                          Reset Password
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total users: {totalItems}</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || isLoading}>
                Previous
              </Button>
              <span className="text-sm">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages || isLoading}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a temporary password for {selectedUser?.displayName || "this user"}. The user will be asked to change it on next login.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="tempPassword">Temporary password</Label>
              <Input
                id="tempPassword"
                type="password"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                placeholder="Minimum 8 characters"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirmPassword">Confirm temporary password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Password forgotten"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={submitReset} disabled={isSubmitting}>
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
