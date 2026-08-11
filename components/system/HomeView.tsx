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
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <section className="overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-zinc-900 to-zinc-950 p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-400">Mesa do Mestre</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h2 className="text-3xl font-black text-zinc-100">{current?.name ?? "Sua campanha"}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">Continue exatamente de onde parou, entre no painel de sessão ou abra rapidamente o combate atual.</p>
            {activeSession && <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300"><Play className="h-3.5 w-3.5" />Sessão em andamento: {activeSession.title}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={onContinue} className="primary-button"><Play className="h-4 w-4" />Continuar</button>
            <button onClick={onSession} className="secondary-button"><CalendarDays className="h-4 w-4" />Modo sessão</button>
            <button onClick={onCombat} className="secondary-button"><Swords className="h-4 w-4" />Combate</button>
            <button onClick={onLibrary} className="secondary-button"><Library className="h-4 w-4" />Biblioteca</button>
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
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h3 className="font-semibold text-zinc-100">Mesas recentes</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">{data.tables.map((table) => <button key={table.id} onClick={() => onOpenTable(table.id)} className={`rounded-xl border p-4 text-left transition ${table.id === data.activeTableId ? "border-amber-500/50 bg-amber-500/5" : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"}`}><p className="font-semibold text-zinc-100">{table.name}</p><p className="mt-1 text-xs text-zinc-500">{data.systems.find((system) => system.id === table.systemId)?.name ?? table.systemId}</p><p className="mt-2 line-clamp-2 text-sm text-zinc-400">{table.description}</p></button>)}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h3 className="flex items-center gap-2 font-semibold text-zinc-100"><Clock3 className="h-4 w-4 text-amber-400" />Conteúdo recente</h3>
          <div className="mt-4 space-y-2">{recent.length === 0 ? <p className="text-sm text-zinc-500">Abra fichas e regras para criar atalhos aqui.</p> : recent.slice(0, 8).map((item) => <button key={`${item.type}:${item.id}`} onClick={() => onOpenRecent(item)} className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-left hover:border-amber-500/40"><p className="text-[10px] uppercase tracking-wide text-zinc-600">{item.type}</p><p className="text-sm font-medium text-zinc-200">{item.name}</p></button>)}</div>
        </div>
      </section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4"><p className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">{icon}{label}</p><p className="mt-2 text-3xl font-black text-amber-300">{value}</p></div>;
}
