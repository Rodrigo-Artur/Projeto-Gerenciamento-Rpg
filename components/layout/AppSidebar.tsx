"use client";

import {
  BookOpen, CalendarDays, ChevronLeft, ChevronRight, Clock3, History,
  House, LayoutDashboard, Library, Link2, Map, Menu, Settings2,
  Swords, Users, X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewId =
  | "home" | "session-mode" | "dashboard" | "rules" | "sheets"
  | "templates" | "world" | "campaign" | "sessions" | "combat"
  | "library" | "history";

export type NavigationItem = { id: ViewId; label: string; icon: LucideIcon };

export const navigationGroups: Array<{ title: string; items: NavigationItem[] }> = [
  {
    title: "Principal",
    items: [
      { id: "home", label: "Início", icon: House },
      { id: "session-mode", label: "Modo Sessão", icon: CalendarDays },
      { id: "combat", label: "Combate", icon: Swords },
    ],
  },
  {
    title: "Conteúdo",
    items: [
      { id: "rules", label: "Sistema", icon: BookOpen },
      { id: "sheets", label: "Fichas", icon: Users },
      { id: "world", label: "Mundo", icon: Map },
      { id: "campaign", label: "Campanha", icon: Link2 },
    ],
  },
  {
    title: "Organização",
    items: [
      { id: "sessions", label: "Sessões", icon: CalendarDays },
      { id: "library", label: "Biblioteca", icon: Library },
      { id: "templates", label: "Templates", icon: Settings2 },
    ],
  },
  {
    title: "Administração",
    items: [
      { id: "dashboard", label: "Gerenciar", icon: LayoutDashboard },
      { id: "history", label: "Histórico", icon: History },
    ],
  },
];

type AppSidebarProps = {
  activeView: ViewId;
  onNavigate: (view: ViewId) => void;
  tableName: string;
  systemName: string;
  sessionActive: boolean;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

export function AppSidebar({
  activeView, onNavigate, tableName, systemName, sessionActive,
  collapsed, onToggleCollapsed, mobileOpen, onCloseMobile,
}: AppSidebarProps) {
  function contents(isCompact: boolean, mobile: boolean) {
    return (
      <>
        <div className={cn("flex h-[72px] shrink-0 items-center gap-3 border-b border-border/70 px-4", isCompact && "justify-center px-2")}>
          <button
            type="button"
            onClick={() => { onNavigate("home"); if (mobile) onCloseMobile(); }}
            aria-label="Ir para Início"
            className={cn("flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring", isCompact && "flex-none")}
          >
            <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 font-mono text-lg font-bold text-primary">D20</span>
            {!isCompact && <span className="min-w-0"><span className="block text-xs font-semibold tracking-[0.16em] text-primary">MESA DO</span><span className="block text-base font-bold text-foreground">MESTRE</span></span>}
          </button>
          {mobile ? (
            <button type="button" onClick={onCloseMobile} aria-label="Fechar menu" className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"><X className="size-5" /></button>
          ) : !isCompact ? (
            <button type="button" onClick={onToggleCollapsed} aria-label="Recolher menu" title="Recolher menu" className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"><ChevronLeft className="size-4" /></button>
          ) : null}
        </div>
        <nav aria-label="Navegação principal" className={cn("min-h-0 flex-1 overflow-y-auto px-3 py-4", isCompact && "px-2")}>
          {navigationGroups.map((group) => (
            <div key={group.title} className="mb-5">
              {!isCompact && <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{group.title}</p>}
              {isCompact && <div className="mx-auto mb-2 h-px w-7 bg-border/70" aria-hidden="true" />}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const selected = item.id === activeView;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      title={isCompact ? item.label : undefined}
                      aria-label={isCompact ? item.label : undefined}
                      aria-current={selected ? "page" : undefined}
                      onClick={() => { onNavigate(item.id); if (mobile) onCloseMobile(); }}
                      className={cn(
                        "flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                        isCompact && "justify-center px-2",
                        selected ? "border border-primary/35 bg-primary/15 text-primary" : "border border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <Icon aria-hidden="true" className="size-4.5 shrink-0" />
                      {!isCompact && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className={cn("border-t border-border/70 p-3", isCompact && "px-2")}>
          {!isCompact ? (
            <div className="rounded-xl border border-border/70 bg-secondary/80 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Mesa ativa</p>
              <p className="mt-1 truncate text-sm font-semibold text-foreground" title={tableName}>{tableName}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground" title={systemName}>{systemName}</p>
              <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span className={cn("size-2 rounded-full", sessionActive ? "bg-success" : "bg-muted-foreground")} />
                {sessionActive ? "Sessão ativa" : "Sem sessão ativa"}
              </p>
            </div>
          ) : (
            <div className="flex justify-center" title={sessionActive ? "Sessão ativa" : "Sem sessão ativa"}>
              {sessionActive ? <Clock3 aria-label="Sessão ativa" className="size-4 text-success" /> : <Clock3 aria-label="Sem sessão ativa" className="size-4 text-muted-foreground" />}
            </div>
          )}
          {!mobile && isCompact && (
            <button type="button" onClick={onToggleCollapsed} title="Expandir menu" aria-label="Expandir menu" className="mt-3 flex w-full justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground">
              <ChevronRight className="size-4" />
            </button>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <aside className={cn("hidden h-full shrink-0 flex-col border-r border-border/70 bg-card/95 lg:flex", collapsed ? "w-[76px]" : "w-[252px]")}>
        {contents(collapsed, false)}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/75" aria-label="Fechar navegação" onClick={onCloseMobile} />
          <aside className="relative flex h-full w-[min(86vw,290px)] flex-col border-r border-border bg-card shadow-2xl" aria-label="Menu de navegação móvel">
            {contents(false, true)}
          </aside>
        </div>
      )}
    </>
  );
}
