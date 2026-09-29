"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";

export function DashboardHeader({
  onMenuClick,
}: {
  onMenuClick?: () => void;
}) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          Notes UI
        </span>
        {onMenuClick && (
          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
