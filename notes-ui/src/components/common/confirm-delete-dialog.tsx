"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  deleting: boolean;
  onConfirm: () => void;
  confirmLabel?: string;
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title = "Delete item",
  description = "This action cannot be undone.",
  deleting,
  onConfirm,
  confirmLabel = "Delete",
}: ConfirmDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Trash2 className="size-6 text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            disabled={deleting}
            onClick={onConfirm}
          >
            {deleting ? "Deleting…" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface UseDeleteOptions<T> {
  queryKey: readonly unknown[];
  deleteFn: (item: T) => Promise<unknown>;
  successMessage?: string;
  errorMessage?: string;
  afterDelete?: () => void;
}

export function useDelete<T>(opts: UseDeleteOptions<T>) {
  const queryClient = useQueryClient();
  const {
    queryKey,
    deleteFn,
    successMessage = "Deleted",
    errorMessage = "Delete failed",
    afterDelete,
  } = opts;

  const mutation = useMutation({
    mutationFn: deleteFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(successMessage);
      afterDelete?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || errorMessage);
    },
  });

  return {
    mutate: mutation.mutate,
    isPending: mutation.isPending,
  };
}