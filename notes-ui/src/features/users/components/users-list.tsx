"use client";

import { useState } from "react";
import { useAuthStore } from "@/features/auth/store";
import { useCursorInfiniteQuery, flattenPages } from "@/hooks/use-cursor-pagination";
import {
  listUsers,
  deleteUser,
  type User,
} from "@/features/users/api";
import { useDelete } from "@/components/common/confirm-delete-dialog";
import { UserFormDialog } from "@/features/users/components/user-form-dialog";
import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import { LoadMore } from "@/components/common/load-more";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { EmptyDescription } from "@/components/ui/empty";
import { EmptyContent } from "@/components/ui/empty";
import { EmptyMedia } from "@/components/ui/empty";
import { Users, Pencil, Trash2, UserPlus } from "lucide-react";

const USERS_QUERY_KEY = ["users", "list"] as const;

export function UsersList() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const currentUserId = useAuthStore((s) => s.user?._id ?? null);

  const {
    data,
    isPending,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useCursorInfiniteQuery<User>(
    USERS_QUERY_KEY,
    (cursor) => listUsers(cursor),
  );

  const users = flattenPages(data?.pages);

  const { mutate: doDelete, isPending: deleting } = useDelete<User>({
    queryKey: USERS_QUERY_KEY,
    deleteFn: (user) => deleteUser(user._id),
    successMessage: "User deleted",
    errorMessage: "Failed to delete user",
    afterDelete: () => setDeleteTarget(null),
  });

  const confirmDelete = () => {
    if (deleteTarget) doDelete(deleteTarget);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">
            Manage all users. Admin only.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <UserPlus className="size-4" />
          Create user
        </Button>
      </div>

      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : users.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users className="size-6" />
            </EmptyMedia>
            <EmptyTitle>No users yet</EmptyTitle>
            <EmptyDescription>
              Create the first user to get started.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setCreateOpen(true)}>Create user</Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {users.map((user) => (
            <Card key={user._id}>
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{user.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setEditUser(user)}
                    aria-label="Edit user"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDeleteTarget(user)}
                    disabled={user._id === currentUserId}
                    title={
                      user._id === currentUserId
                        ? "You cannot delete your own account"
                        : "Delete user"
                    }
                    aria-label="Delete user"
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">Role:</span>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                    {user.role}
                  </span>
                  {(user.interests?.length ?? 0) > 0 && (
                    <span className="text-xs text-muted-foreground">
                      Interests: {user.interests?.join(", ")}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <LoadMore
        hasNext={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onClick={() => fetchNextPage()}
      />

      <UserFormDialog
        key="create-user"
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <UserFormDialog
        key={editUser?._id ?? "edit-user"}
        user={editUser ?? undefined}
        open={editUser !== null}
        onOpenChange={(open) => {
          if (!open) setEditUser(null);
        }}
      />
      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete user"
        description="Are you sure you want to delete this user? This action cannot be undone."
        deleting={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}