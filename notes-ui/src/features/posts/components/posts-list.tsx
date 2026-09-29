"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCursorInfiniteQuery, flattenPages } from "@/hooks/use-cursor-pagination";
import {
  getUserPosts,
  listPosts,
  postAuthorName,
  type Post,
  type UserPostsPage,
} from "@/features/posts/api";
import { listUsers, type User as UserRecord } from "@/features/users/api";
import { useAuthStore } from "@/features/auth/store";
import { LoadMore } from "@/components/common/load-more";
import { PostFormDialog } from "@/features/posts/components/post-form-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { EmptyDescription } from "@/components/ui/empty";
import { EmptyMedia } from "@/components/ui/empty";
import { FileText, Plus, User } from "lucide-react";

const ALL_POSTS_QUERY_KEY = ["posts", "all"] as const;
const USER_POSTS_QUERY_KEY = ["user-posts"] as const;
const USER_OPTIONS_QUERY_KEY = ["users", "options"] as const;
/** GET /api/users caps a page at 50, which is plenty for the picker. */
const USER_OPTION_LIMIT = 50;

export function PostsList() {
  const [createOpen, setCreateOpen] = useState(false);
  const currentUserId = useAuthStore((s) => s.user?._id ?? "");
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");
  // A normal user has no picker: GET /api/users is admin-only, so they simply
  // browse their own posts. An admin picks any user by name.
  const [pickedUserId, setPickedUserId] = useState<string | null>(null);
  const activeUserId = isAdmin ? (pickedUserId ?? "") : currentUserId;

  const { data: userOptions } = useQuery({
    queryKey: USER_OPTIONS_QUERY_KEY,
    queryFn: () => listUsers(null, USER_OPTION_LIMIT),
    enabled: isAdmin,
  });
  const users: UserRecord[] = userOptions?.data ?? [];
  const pickedUser = users.find((u) => u._id === activeUserId);

  const {
    data,
    isPending,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useCursorInfiniteQuery<Post, UserPostsPage>(
    [...USER_POSTS_QUERY_KEY, activeUserId],
    (cursor) =>
      activeUserId
        ? getUserPosts(activeUserId, cursor)
        : Promise.resolve({
            data: [],
            nextCursor: null,
            hasMore: false,
            author: { _id: "", name: "" },
          }),
    Boolean(activeUserId),
  );

  const posts = flattenPages(data?.pages);

  // The author name comes from the same $lookup response, so no second request
  // is needed - and it works for every role, not just admins.
  const authorName = data?.pages?.[0]?.author?.name;

  // Every post in the system, from the public GET /api/posts. This is how an
  // admin sees posts written by other users.
  const {
    data: allData,
    isPending: allPending,
    isFetchingNextPage: allFetchingNext,
    hasNextPage: allHasNext,
    fetchNextPage: allFetchNext,
  } = useCursorInfiniteQuery<Post>(ALL_POSTS_QUERY_KEY, (cursor) => listPosts(cursor));

  const allPosts = flattenPages(allData?.pages);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Posts</h1>
          <p className="text-sm text-muted-foreground">
            Create a post and browse the posts of any user.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          New post
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="size-4" />
            User&apos;s posts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAdmin ? (
            <div className="grid gap-2">
              <Label htmlFor="user-picker">User</Label>
              <Select
                value={activeUserId || null}
                onValueChange={(value) => setPickedUserId(value ?? null)}
              >
                <SelectTrigger id="user-picker" className="w-full">
                  <SelectValue placeholder="Select a user to see their posts">
                    {/* Base UI renders the raw value (the ObjectId) by
                        default, so render the selected user's name. */}
                    {pickedUser ? pickedUser.name : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u._id} value={u._id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {pickedUser && (
                <p className="text-xs text-muted-foreground">
                  {pickedUser.email} ·{" "}
                  <span className="font-mono">{pickedUser._id}</span>
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Listing users needs the admin role, so this picker is only
                available to admins. It loads the first 50 users.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Showing your own posts. The posts endpoint is public, so anyone
              can read anyone&apos;s posts by id — only admins can list the
              users here.
            </p>
          )}

          {activeUserId === "" ? (
            <p className="text-sm text-muted-foreground">
              Select a user to load their posts.
            </p>
          ) : isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          ) : posts.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileText className="size-6" />
                </EmptyMedia>
                <EmptyTitle>No posts found</EmptyTitle>
                <EmptyDescription>
                  This user has not created any posts yet.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {posts.length} post{posts.length === 1 ? "" : "s"} by{" "}
                <span className="font-medium text-foreground">
                  {authorName || pickedUser?.name || "this user"}
                </span>
              </p>
              {posts.map((post) => (
                <div key={post._id} className="rounded-lg border border-border p-3">
                  <h3 className="font-medium">{post.title}</h3>
                  {post.content && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {post.content}
                    </p>
                  )}
                </div>
              ))}
              <LoadMore
                hasNext={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                onClick={() => fetchNextPage()}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="size-4" />
            All posts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Every post in the system, newest first. Public endpoint - an admin
            sees other users&apos; posts here.
          </p>

          {allPending ? (
            <div className="space-y-3">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          ) : allPosts.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileText className="size-6" />
                </EmptyMedia>
                <EmptyTitle>No posts yet</EmptyTitle>
                <EmptyDescription>
                  Create the first post to get started.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="space-y-3">
              {allPosts.map((post) => (
                <div
                  key={post._id}
                  className="rounded-lg border border-border p-3"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-medium">{post.title}</h3>
                    <span className="text-xs text-muted-foreground">
                      {postAuthorName(post.author)}
                    </span>
                  </div>
                  {post.content && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {post.content}
                    </p>
                  )}
                </div>
              ))}
              <LoadMore
                hasNext={allHasNext}
                isFetchingNextPage={allFetchingNext}
                onClick={() => allFetchNext()}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <PostFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
