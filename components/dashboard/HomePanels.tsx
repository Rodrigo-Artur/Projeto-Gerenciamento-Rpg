import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function HomeStatCard({
  icon: Icon, label, value, caption,
}: { icon: LucideIcon; label: string; value: number; caption?: string }) {
  return (
    <Card className="gap-2 border-border/80 bg-card/75 py-4 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between gap-2 px-4">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
          <Icon aria-hidden="true" className="size-4" />
        </span>
      </CardHeader>
      <CardContent className="px-4">
        <p className="font-mono text-3xl font-bold tabular-nums tracking-tight text-foreground">{value.toLocaleString("pt-BR")}</p>
        {caption && <p className="mt-1 text-xs text-muted-foreground">{caption}</p>}
      </CardContent>
    </Card>
  );
}

export function HomePanel({
  icon: Icon, title, description, action, children, className = "",
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={`gap-4 border-border/80 bg-card/70 py-5 shadow-none ${className}`}>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <Icon aria-hidden="true" className="size-4 text-primary" />{title}
          </CardTitle>
          {description && <CardDescription className="text-xs">{description}</CardDescription>}
        </div>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-primary outline-none transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring"
          >{action.label}<ArrowUpRight aria-hidden="true" className="size-3.5" /></button>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function HomeItemButton({
  icon: Icon, title, meta, onClick, trailing, active = false,
}: {
  icon: LucideIcon;
  title: string;
  meta?: string;
  onClick: () => void;
  trailing?: ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full min-w-0 items-center gap-3 rounded-xl border p-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${active ? "border-primary/45 bg-primary/10" : "border-border/70 bg-background/60 hover:border-primary/35 hover:bg-accent/50"}`}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-secondary text-primary">
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground" title={title}>{title}</span>
        {meta && <span className="mt-0.5 block truncate text-xs text-muted-foreground">{meta}</span>}
      </span>
      {trailing}
    </button>
  );
}
