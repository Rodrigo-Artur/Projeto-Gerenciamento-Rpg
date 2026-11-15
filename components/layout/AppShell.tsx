"use client";

import type { DragEventHandler, ReactNode } from "react";
import { cn } from "@/lib/utils";

type AppShellProps = {
  sidebar: ReactNode;
  topbar: ReactNode;
  pageHeader?: ReactNode;
  tabStrip?: ReactNode;
  children: ReactNode;
  compact?: boolean;
  onDragOver?: DragEventHandler<HTMLDivElement>;
  onDrop?: DragEventHandler<HTMLDivElement>;
};

export function AppShell({ sidebar, topbar, pageHeader, tabStrip, children, compact, onDragOver, onDrop }: AppShellProps) {
  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        "flex h-dvh min-h-[480px] w-full overflow-hidden bg-background text-foreground",
        compact && "compact-workspace"
      )}
    >
      {sidebar}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {topbar}
        {pageHeader}
        {tabStrip}
        {children}
      </div>
    </div>
  );
}
