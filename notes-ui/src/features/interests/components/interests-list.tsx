"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";
import { groupUsersByInterests } from "@/features/interests/api";
import { useAuthStore } from "@/features/auth/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { EmptyDescription } from "@/components/ui/empty";
import { EmptyMedia } from "@/components/ui/empty";
import { Tag, Search } from "lucide-react";

export interface InterestGroup {
  _id: string;
  count: number;
  users: { _id: string; name: string }[];
}

const INTERESTS_QUERY_KEY = ["interests"] as const;

export function InterestsList() {
  const [interest, setInterest] = useState("");
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");

  const debouncedInterest = useDebounce(interest, 400);

  const {
    data: groups,
    isPending,
    isError,
    error,
  } = useQuery<InterestGroup[]>({
    queryKey: [...INTERESTS_QUERY_KEY, debouncedInterest],
    queryFn: () => groupUsersByInterests(debouncedInterest || undefined),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Interests</h1>
        <p className="text-sm text-muted-foreground">
          Users grouped by interest, with a count and the member names.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Label htmlFor="interest-filter" className="sr-only">
          Filter by interest
        </Label>
        <Input
          id="interest-filter"
          placeholder="Filter by interest (e.g. chess)"
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
          className="pl-9"
        />
      </div>

      {isError ? (
        <p className="text-sm text-destructive">{error?.message}</p>
      ) : isPending ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : (groups?.length ?? 0) === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Tag className="size-6" />
            </EmptyMedia>
            <EmptyTitle>No interests found</EmptyTitle>
            <EmptyDescription>
              {debouncedInterest
                ? `No users match the interest "${debouncedInterest}".`
                : "No user has an interest yet. Users can set interests when they register, and an admin can add or edit them from the Users page."}
            </EmptyDescription>
          </EmptyHeader>
          {isAdmin && !debouncedInterest && (
            <Button asChild variant="outline">
              <Link href="/dashboard/users">Open Users</Link>
            </Button>
          )}
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups!.map((group) => (
            <Card key={group._id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Tag className="size-4" />
                  {group._id}
                  <span className="ml-auto text-sm font-normal text-muted-foreground">
                    {group.count} user{group.count === 1 ? "" : "s"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {group.users.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No users.</p>
                ) : (
                  <ul className="flex flex-wrap gap-1.5">
                    {group.users.map((u) => (
                      <li
                        key={u._id}
                        className="rounded-md bg-muted px-2 py-0.5 text-xs"
                      >
                        {u.name}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}