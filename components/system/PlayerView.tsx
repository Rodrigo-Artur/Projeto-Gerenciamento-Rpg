"use client";

import { BookOpen, Eye, Map, ScrollText, Swords, UserRound } from "lucide-react";

import type { RulebookData } from "@/types/rulebook";

export function PlayerView({ data }: { data: RulebookData }) {
  const combat = (data.combats ?? []).find((item) => item.status === "active");
  const visibleParticipants = combat?.participants.filter((item) => !item.hidden) ?? [];
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-950/95 px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div><p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-amber-400"><Eye className="h-4 w-4" />Modo jogador</p><h1 className="mt-1 text-2xl font-bold">Mesa do Mestre</h1></div>
          <div className="text-right text-sm text-zinc-500"><p>{data.tables.find((item) => item.id === data.activeTableId)?.name}</p><p>{data.systems.find((item) => item.id === data.activeSystemId)?.name}</p></div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl space-y-8 p-6">
        {combat && <section><SectionTitle icon={<Swords className="h-4 w-4" />} title={`Combate — rodada ${combat.round}`} /><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{visibleParticipants.map((participant, index) => <div key={participant.id} className={`rounded-xl border p-4 ${index === combat.turnIndex ? "border-amber-500/60 bg-amber-500/10" : "border-zinc-800 bg-zinc-900/70"}`}><p className="font-semibold text-zinc-100">{participant.name}</p><p className="mt-2 text-sm text-zinc-400">HP {participant.hpCurrent}/{participant.hpMax}</p>{participant.conditions.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{participant.conditions.map((condition) => <span key={condition} className="rounded-full bg-red-500/10 px-2 py-1 text-xs text-red-300">{condition}</span>)}</div>}</div>)}</div></section>}

        {data.players.length > 0 && <section><SectionTitle icon={<UserRound className="h-4 w-4" />} title="Personagens revelados" /><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{data.players.map((player) => <Card key={player.id} title={player.characterName} subtitle={`${player.playerName} • ${player.role}`} content={player.concept} />)}</div></section>}

        {(data.entities ?? []).filter((item) => !item.archived).length > 0 && <section><SectionTitle icon={<Map className="h-4 w-4" />} title="Mundo revelado" /><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{(data.entities ?? []).filter((item) => !item.archived).map((entity) => <Card key={entity.id} title={entity.name} subtitle={entity.type} content={entity.summary || entity.content} />)}</div></section>}

        {data.rules.length > 0 && <section><SectionTitle icon={<BookOpen className="h-4 w-4" />} title="Regras compartilhadas" /><div className="grid gap-3 md:grid-cols-2">{data.rules.map((rule) => <Card key={rule.id} title={rule.title} subtitle={rule.category} content={rule.summary} />)}</div></section>}

        {data.notes.length > 0 && <section><SectionTitle icon={<ScrollText className="h-4 w-4" />} title="Handouts e notas reveladas" /><div className="grid gap-3 md:grid-cols-2">{data.notes.map((note) => <Card key={note.id} title={note.title} subtitle="Nota" content={note.content} />)}</div></section>}
      </div>
    </main>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-amber-300">{icon}{title}</h2>;
}

function Card({ title, subtitle, content }: { title: string; subtitle: string; content: string }) {
  return <article className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4"><p className="text-xs uppercase text-zinc-500">{subtitle}</p><h3 className="mt-1 font-semibold text-zinc-100">{title}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-400">{content}</p></article>;
}
