import { apiClient } from "@/lib/api-client";

/** Author as returned by the populated endpoints. */
export interface PostAuthor {
  _id: string;
  name: string;
}

export interface Post {
  _id: string;
  title: string;
  content?: string;
  /**
   * `GET /api/posts` and `GET /api/posts/:id` populate the author and send
   * `{ _id, name }`. The $lookup in `GET /api/users/:id/posts` returns the raw
   * ObjectId, so both shapes reach the client.
   */
  author: string | PostAuthor;
  createdAt?: string;
  updatedAt?: string;
}

/** Display name for a post's author, whichever shape the endpoint returned. */
export function postAuthorName(
  author: Post["author"] | undefined,
  fallback = "Unknown",
): string {
  if (!author) return fallback;
  if (typeof author === "string") return fallback;
  return author.name || fallback;
}

/** The author's id, whichever shape the endpoint returned. */
export function postAuthorId(
  author: Post["author"] | undefined,
): string {
  if (!author) return "";
  return typeof author === "string" ? author : author._id;
}

export interface PostListMeta {
  nextCursor: string | null;
  hasMore: boolean;
}

export async function listPosts(
  cursor: string | null,
  limit = 10,
): Promise<{ data: Post[]; nextCursor: string | null; hasMore: boolean }> {
  const res = await apiClient.get("/posts", {
    params: { limit, after: cursor || undefined },
  });
  return {
    data: res.data.data as Post[],
    nextCursor: res.data.meta?.nextCursor ?? null,
    hasMore: res.data.meta?.hasMore ?? false,
  };
}

export async function createPost(input: {
  title: string;
  content?: string;
}): Promise<Post> {
  const res = await apiClient.post("/posts", input);
  return res.data.data as Post;
}

export async function getPost(id: string): Promise<Post> {
  const res = await apiClient.get(`/posts/${id}`);
  return res.data.data as Post;
}

export interface UserPostsPage {
  data: Post[];
  nextCursor: string | null;
  hasMore: boolean;
  /** Author returned by the same $lookup pipeline as the posts. */
  author: PostAuthor;
}

export async function getUserPosts(
  userId: string,
  cursor: string | null,
  limit = 10,
): Promise<UserPostsPage> {
  const res = await apiClient.get(`/users/${userId}/posts`, {
    params: { limit, after: cursor || undefined },
  });
  return {
    data: res.data.data as Post[],
    nextCursor: res.data.meta?.nextCursor ?? null,
    hasMore: res.data.meta?.hasMore ?? false,
    author: res.data.author as PostAuthor,
  };
}