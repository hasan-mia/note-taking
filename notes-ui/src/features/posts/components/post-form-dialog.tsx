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
import { createPost } from "@/features/posts/api";

interface PostFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PostFormDialog({ open, onOpenChange }: PostFormDialogProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const mutation = useMutation({
    mutationFn: (values: { title: string; content?: string }) =>
      createPost(values),
    onSuccess: () => {
      // A new post must show up both in the all-posts list and in the
      // signed-in user's own posts view.
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["user-posts"] });
      toast.success("Post created");
      setTitle("");
      setContent("");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create post");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create post</DialogTitle>
          <DialogDescription>
            Write a new public post. Author is set to your account.
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
            <Label htmlFor="post-title">Title</Label>
            <Input
              id="post-title"
              placeholder="Post title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="post-content">Content</Label>
            <Textarea
              id="post-content"
              placeholder="Write your post here..."
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
              {mutation.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}