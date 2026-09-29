"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCursorInfiniteQuery, flattenPages } from "@/hooks/use-cursor-pagination";
import { useAuthStore } from "@/features/auth/store";
import { listNotes, deleteNote, type Note } from "@/features/notes/api";
import { listUsers } from "@/features/users/api";
import { useDelete } from "@/components/common/confirm-delete-dialog";
import { NoteFormDialog } from "@/features/notes/components/note-form-dialog";
import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import { LoadMore } from "@/components/common/load-more";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty } from "@/components/ui/empty";
import { EmptyHeader } from "@/components/ui/empty";
import { EmptyTitle } from "@/components/ui/empty";
import { EmptyDescription } from "@/components/ui/empty";
import { EmptyContent } from "@/components/ui/empty";
import { EmptyMedia } from "@/components/ui/empty";
import { FileText, Pencil, Trash2, User } from "lucide-react";

const NOTES_QUERY_KEY = ["notes"] as const;

export function NotesList() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");

  const {
    data,
    isPending,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useCursorInfiniteQuery<Note>(
    NOTES_QUERY_KEY,
    (cursor) => listNotes(cursor),
  );

  const notes = flattenPages(data?.pages);

  // Admins see every note, so resolve owner ids to names for display.
  const { data: ownersData } = useQuery({
    queryKey: ["users", "owner-lookup"],
    queryFn: () => listUsers(null, 50),
    enabled: isAdmin,
  });
  const ownerNames = Object.fromEntries(
    (ownersData?.data ?? []).map((u) => [u._id, u.name]),
  );

  const { mutate: doDelete, isPending: deleting } = useDelete<Note>({
    queryKey: NOTES_QUERY_KEY,
    deleteFn: (note) => deleteNote(note._id),
    successMessage: "Note deleted",
    errorMessage: "Failed to delete note",
    afterDelete: () => setDeleteTarget(null),
  });

  const handleDelete = (note: Note) => {
    setDeleteTarget(note);
  };

  const confirmDelete = () => {
    if (deleteTarget) doDelete(deleteTarget);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notes</h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "All notes in the system, including other users' notes."
              : "Your personal notes."}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Pencil className="size-4" />
          New note
        </Button>
      </div>

      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : notes.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText className="size-6" />
            </EmptyMedia>
            <EmptyTitle>No notes yet</EmptyTitle>
            <EmptyDescription>
              Create your first note to get started.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setCreateOpen(true)}>Create note</Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {notes.map((note) => (
            <Card key={note._id} className="flex flex-col">
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <CardTitle className="text-base">{note.title}</CardTitle>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setEditNote(note)}
                    aria-label="Edit note"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(note)}
                    aria-label="Delete note"
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                {isAdmin && (
                  <p className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User className="size-3.5" />
                    Owner:{" "}
                    {ownerNames[note.owner] ?? note.owner}
                  </p>
                )}
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {note.content || (
                    <span className="italic">No content</span>
                  )}
                </p>
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

      <NoteFormDialog
        key="create-note"
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <NoteFormDialog
        key={editNote?._id ?? "edit-note"}
        note={editNote ?? undefined}
        open={editNote !== null}
        onOpenChange={(open) => {
          if (!open) setEditNote(null);
        }}
      />
      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete note"
        description="Are you sure you want to delete this note? This action cannot be undone."
        deleting={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}