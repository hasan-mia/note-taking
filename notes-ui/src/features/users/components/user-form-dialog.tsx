"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { createUser, updateUser, type User } from "@/features/users/api";

interface UserFormDialogProps {
  user?: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserFormDialog({
  user,
  open,
  onOpenChange,
}: UserFormDialogProps) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(user);

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "admin">(
    (user?.role as "user" | "admin") ?? "user",
  );
  const [interests, setInterests] = useState(
    (user?.interests ?? []).join(", "),
  );

  const mutation = useMutation({
    mutationFn: (values: {
      name: string;
      email: string;
      password?: string;
      role: "user" | "admin";
      interests: string[];
    }) =>
      isEdit
        ? updateUser(user!._id, {
            name: values.name,
            email: values.email,
            role: values.role,
            interests: values.interests,
          })
        : createUser({
            name: values.name,
            email: values.email,
            password: values.password!,
            role: values.role,
            interests: values.interests,
          }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(isEdit ? "User updated" : "User created");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Operation failed");
    },
  });

  const interestsList = interests
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit user" : "Create user"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the user's details."
              : "Create a new user. Role defaults to user."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || !email.trim()) {
              toast.error("Name and email are required");
              return;
            }
            if (!isEdit && !password) {
              toast.error("Password is required");
              return;
            }
            mutation.mutate({
              name: name.trim(),
              email: email.trim(),
              password: password || undefined,
              role,
              interests: interestsList,
            });
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="user-name">Name</Label>
            <Input
              id="user-name"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="user-email">Email</Label>
            <Input
              id="user-email"
              type="email"
              placeholder="jane@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {!isEdit && (
            <div className="grid gap-2">
              <Label htmlFor="user-password">Password</Label>
              <Input
                id="user-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="user-role">Role</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as "user" | "admin")}
            >
              <SelectTrigger id="user-role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">user</SelectItem>
                <SelectItem value="admin">admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="user-interests">Interests</Label>
            <Input
              id="user-interests"
              placeholder="chess, hiking, reading"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated list.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : isEdit ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}