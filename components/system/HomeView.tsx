"use client";

import { CalendarDays, Clock3, Library, Play, Swords, Users } from "lucide-react";

import type { RecentContent } from "@/hooks/useWorkspaceApi";
import type { RulebookData } from "@/types/rulebook";

export function HomeView({
  data,
  recent,
  onContinue,
  onSession,
  onCombat,
  onLibrary,
  onOpenTable,
  onOpenRecent,
}: {
  data: RulebookData;
  recent: RecentContent[];
  onContinue: () => void;
  onSession: () => void;
  onCombat: () => void;
  onLibrary: () => void;
  onOpenTable: (tableId: string) => void;
  onOpenRecent: (item: RecentContent) => void;
}) {
  const current = data.tables.find((item) => item.id === data.activeTableId);
  const activeSession = data.sessions.find((item) => item.id === data.runtime?.activeSessionId);
  return (
    <div className="mdm-module mx-auto max-w-7xl space-y-8 p-6">
      <section className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-background p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Mesa do Mestre</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h2 className="text-3xl font-black text-foreground">{current?.name ?? "Sua campanha"}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Continue exatamente de onde parou, entre no painel de sessão ou abra rapidamente o combate atual.</p>
            {activeSession && <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs text-success"><Play className="h-3.5 w-3.5" />Sessão em andamento: {activeSession.title}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button data-nonmutating="true" onClick={onContinue} className="primary-button"><Play className="h-4 w-4" />Continuar</button>
            <button data-nonmutating="true" onClick={onSession} className="secondary-button"><CalendarDays className="h-4 w-4" />Modo sessão</button>
            <button data-nonmutating="true" onClick={onCombat} className="secondary-button"><Swords className="h-4 w-4" />Combate</button>
            <button data-nonmutating="true" onClick={onLibrary} className="secondary-button"><Library className="h-4 w-4" />Biblioteca</button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Stat icon={<Users className="h-4 w-4" />} label="Players" value={data.players.length} />
        <Stat icon={<Users className="h-4 w-4" />} label="NPCs" value={data.npcs.length} />
        <Stat icon={<CalendarDays className="h-4 w-4" />} label="Sessões" value={data.sessions.length} />
        <Stat icon={<Swords className="h-4 w-4" />} label="Combates" value={(data.combats ?? []).length} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <div className="rounded-xl border border-border bg-card/60 p-5">
          <h3 className="font-semibold text-foreground">Mesas recentes</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">{data.tables.map((table) => <button key={table.id} onClick={() => onOpenTable(table.id)} className={`rounded-xl border p-4 text-left transition ${table.id === data.activeTableId ? "border-primary/50 bg-primary/5" : "border-border bg-background hover:border-primary/40"}`}><p className="font-semibold text-foreground">{table.name}</p><p className="mt-1 text-xs text-muted-foreground">{data.systems.find((system) => system.id === table.systemId)?.name ?? table.systemId}</p><p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{table.description}</p></button>)}</div>
        </div>
        <div className="rounded-xl border border-border bg-card/60 p-5">
          <h3 className="flex items-center gap-2 font-semibold text-foreground"><Clock3 className="h-4 w-4 text-primary" />Conteúdo recente</h3>
          <div className="mt-4 space-y-2">{recent.length === 0 ? <p className="text-sm text-muted-foreground">Abra fichas e regras para criar atalhos aqui.</p> : recent.slice(0, 8).map((item) => <button key={`${item.type}:${item.id}`} onClick={() => onOpenRecent(item)} className="w-full rounded-lg border border-border bg-background p-3 text-left hover:border-primary/40"><p className="text-[10px] uppercase tracking-wide text-muted-foreground/80">{item.type}</p><p className="text-sm font-medium text-foreground">{item.name}</p></button>)}</div>
        </div>
      </section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <div className="mdm-section-card rounded-xl border border-border bg-card/70 p-4"><p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">{icon}{label}</p><p className="mt-2 text-3xl font-black text-primary">{value}</p></div>;
}
