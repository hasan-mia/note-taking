import { useInfiniteQuery } from "@tanstack/react-query";

/** One page of a cursor-paginated list. */
export interface CursorPage<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Cursor pagination helper for the Notes API.
 *
 * The API returns:
 *   { success, data: [...], meta: { nextCursor, hasMore } }
 *
 * getNextPageParam returns meta.nextCursor only when meta.hasMore is true.
 *
 * `P` may extend CursorPage<T> with extra per-page fields (e.g. the author of a
 * user's posts); it defaults to the plain page shape.
 */
export function useCursorInfiniteQuery<
  T,
  P extends CursorPage<T> = CursorPage<T>,
>(
  queryKey: readonly unknown[],
  fetchPage: (cursor: string | null) => Promise<P>,
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam as string | null),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    enabled,
  });
}

/** Flatten pages into a single list (pages are already newest-first). */
export function flattenPages<T>(pages: { data: T[] }[] | undefined): T[] {
  if (!pages) return [];
  return pages.flatMap((page) => page.data);
}
