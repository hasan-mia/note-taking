import { Button } from "@/components/ui/button";

export function LoadMore({
  hasNext,
  isFetchingNextPage,
  onClick,
}: {
  hasNext: boolean;
  isFetchingNextPage: boolean;
  onClick: () => void;
}) {
  if (!hasNext) return null;
  return (
    <div className="flex justify-center pt-2">
      <Button
        variant="outline"
        onClick={onClick}
        disabled={isFetchingNextPage}
      >
        {isFetchingNextPage ? "Loading…" : "Load more"}
      </Button>
    </div>
  );
}