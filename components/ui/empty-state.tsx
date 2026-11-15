import type * as React from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-10 text-center",
        className
      )}
    >
      {icon ? <div aria-hidden="true" className="flex size-12 items-center justify-center rounded-xl border border-border bg-secondary text-primary [&_svg]:size-6">{icon}</div> : null}
      <div className="max-w-sm space-y-1.5">
        <h3 className="font-heading text-base font-semibold text-foreground">{title}</h3>
        {description ? <p className="text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="mt-2 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
