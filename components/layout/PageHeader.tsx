import { LockKeyhole, Pencil } from "lucide-react";
import { navigationGroups, type ViewId } from "@/components/layout/AppSidebar";

const descriptions: Record<ViewId, string> = {
  home: "Acompanhe suas campanhas, sessões e conteúdos recentes.",
  "session-mode": "Controle sua sessão com informações importantes ao alcance.",
  dashboard: "Gerencie mesas, sistemas e preferências da campanha.",
  rules: "Consulte e organize as regras do sistema atual.",
  sheets: "Personagens, NPCs e bosses da mesa.",
  templates: "Modelos reutilizáveis para fichas e criaturas.",
  world: "Locais, facções, itens e elementos do mundo.",
  campaign: "Relações, calendário e evolução da campanha.",
  sessions: "Planejamento e registro das suas sessões.",
  combat: "Gerencie iniciativa, condições e recursos de combate.",
  library: "Conteúdos que podem ser reutilizados entre mesas.",
  history: "Acompanhe alterações, backups e versões anteriores.",
};

type PageHeaderProps = {
  view: ViewId;
  systemName: string;
  activeTabTitle?: string;
  editMode: boolean;
  itemEditMode: boolean;
  editTimeoutMinutes: number;
  compact?: boolean;
};

export function PageHeader({ view, systemName, activeTabTitle, editMode, itemEditMode, editTimeoutMinutes, compact }: PageHeaderProps) {
  const item = navigationGroups.flatMap((group) => group.items).find((entry) => entry.id === view);
  const title = item?.label ?? "Mesa do Mestre";
  return (
    <div className={`shrink-0 border-b border-border/60 bg-background/90 px-4 ${compact ? "py-2" : "py-3"} lg:px-6`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{systemName} / {title}</p>
          <h1 className="mt-0.5 truncate font-heading text-lg font-bold text-foreground lg:text-xl">{activeTabTitle ?? title}</h1>
          {!compact && <p className="mt-0.5 hidden text-xs text-muted-foreground sm:block">{activeTabTitle ? descriptions[view] : descriptions[view]}</p>}
        </div>
        <div role="status" aria-live="polite" className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${editMode ? "border-primary/35 bg-primary/10 text-primary" : itemEditMode ? "border-info/40 bg-info/10 text-info" : "border-success/30 bg-success/10 text-success"}`}>
          {editMode || itemEditMode ? <Pencil aria-hidden="true" className="size-3.5" /> : <LockKeyhole aria-hidden="true" className="size-3.5" />}
          <span>{editMode ? "Edição global" : itemEditMode ? "Editando item" : "Modo Leitura"}</span>
          {(editMode || itemEditMode) && editTimeoutMinutes > 0 && <span className="hidden font-normal opacity-80 md:inline">· bloqueio em {editTimeoutMinutes} min</span>}
        </div>
      </div>
    </div>
  );
}
