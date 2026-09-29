import { apiClient } from "@/lib/api-client";

export interface Note {
  _id: string;
  title: string;
  content?: string;
  owner: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NoteListMeta {
  nextCursor: string | null;
  hasMore: boolean;
}

export async function listNotes(
  cursor: string | null,
  limit = 10,
): Promise<{ data: Note[]; nextCursor: string | null; hasMore: boolean }> {
  const res = await apiClient.get("/notes", {
    params: { limit, after: cursor || undefined },
  });
  return {
    data: res.data.data as Note[],
    nextCursor: res.data.meta?.nextCursor ?? null,
    hasMore: res.data.meta?.hasMore ?? false,
  };
}

export async function createNote(input: {
  title: string;
  content?: string;
}): Promise<Note> {
  const res = await apiClient.post("/notes", input);
  return res.data.data as Note;
}

export async function getNote(id: string): Promise<Note> {
  const res = await apiClient.get(`/notes/${id}`);
  return res.data.data as Note;
}

export async function updateNote(
  id: string,
  input: { title?: string; content?: string },
): Promise<Note> {
  const res = await apiClient.put(`/notes/${id}`, input);
  return res.data.data as Note;
}

export async function deleteNote(id: string): Promise<void> {
  await apiClient.delete(`/notes/${id}`);
}