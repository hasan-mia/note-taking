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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createNote, updateNote, type Note } from "@/features/notes/api";

interface NoteFormProps {
  note?: Note;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function NoteFormDialog({
  note,
  open,
  onOpenChange,
  onSuccess,
}: NoteFormProps) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(note);

  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");

  const mutation = useMutation({
    mutationFn: (values: { title: string; content?: string }) =>
      isEdit ? updateNote(note!._id, values) : createNote(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast.success(isEdit ? "Note updated" : "Note created");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Operation failed");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit note" : "Create note"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update your note's title and content."
              : "Write a new personal note."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) {
              toast.error("Title is required");
              return;
            }
            mutation.mutate({ title: title.trim(), content: content.trim() });
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="note-title">Title</Label>
            <Input
              id="note-title"
              placeholder="Note title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="note-content">Content</Label>
            <Textarea
              id="note-content"
              placeholder="Write your note here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
            />
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