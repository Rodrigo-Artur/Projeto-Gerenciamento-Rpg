"use client";

import { BookOpen, CalendarDays, Eye, Image as ImageIcon, Map, ScrollText, Swords, UserRound } from "lucide-react";
import type { ReactNode } from "react";

import type { RulebookData } from "@/types/rulebook";

export function PlayerView({ data }: { data: RulebookData }) {
  const combat = (data.combats ?? []).find((item) => item.status === "active");
  const visibleParticipants = combat?.participants.filter((item) => !item.hidden) ?? [];
  const calendar = data.runtime?.calendar;
  const entities = (data.entities ?? []).filter((item) => !item.archived);
  const handouts = data.handouts ?? [];

  return <main className="min-h-screen bg-zinc-950 text-zinc-100">
    <header className="border-b border-zinc-800 bg-zinc-950/95 px-6 py-5"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4"><div><p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-amber-400"><Eye className="h-4 w-4" />Modo jogador</p><h1 className="mt-1 text-2xl font-bold">Mesa do Mestre</h1></div><div className="text-right text-sm text-zinc-500"><p>{data.tables.find((item) => item.id === data.activeTableId)?.name}</p><p>{data.systems.find((item) => item.id === data.activeSystemId)?.name}</p></div></div></header>
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      {calendar && <section><SectionTitle icon={<CalendarDays className="h-4 w-4" />} title="Calendário da campanha" /><div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5"><p className="text-2xl font-black text-zinc-100">Dia {calendar.day} • Mês {calendar.month} • Ano {calendar.year}</p><p className="text-sm text-zinc-500">{calendar.calendarName}</p>{calendar.events.length > 0 && <div className="mt-4 grid gap-2 md:grid-cols-2">{calendar.events.map((event) => <div key={event.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3"><p className="text-xs text-amber-400">{event.day}/{event.month}/{event.year}</p><p className="font-medium text-zinc-200">{event.title}</p>{event.description && <p className="mt-1 text-sm text-zinc-500">{event.description}</p>}</div>)}</div>}</div></section>}

      {combat && <section><SectionTitle icon={<Swords className="h-4 w-4" />} title={`Combate — rodada ${combat.round}`} /><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{visibleParticipants.map((participant, index) => <div key={participant.id} className={`overflow-hidden rounded-xl border ${index === combat.turnIndex ? "border-amber-500/60 bg-amber-500/10" : "border-zinc-800 bg-zinc-900/70"}`}>{participant.imageUrl && <img src={participant.imageUrl} alt={participant.name} referrerPolicy="no-referrer" className="h-36 w-full object-cover" />}<div className="p-4"><p className="font-semibold text-zinc-100">{participant.name}</p><p className="mt-2 text-sm text-zinc-400">HP {participant.hpCurrent}/{participant.hpMax}</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800"><div className="h-full bg-red-500" style={{ width: `${participant.hpMax ? Math.max(0, Math.min(100, participant.hpCurrent / participant.hpMax * 100)) : 0}%` }} /></div>{participant.conditions.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{participant.conditions.map((condition) => <span key={condition} className="rounded-full bg-red-500/10 px-2 py-1 text-xs text-red-300">{condition}</span>)}</div>}</div></div>)}</div></section>}

      {handouts.length > 0 && <section><SectionTitle icon={<ImageIcon className="h-4 w-4" />} title="Handouts revelados" /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{handouts.map((handout) => <Card key={handout.id} title={handout.title} subtitle="Handout" content={handout.content} imageUrl={handout.imageUrl} />)}</div></section>}

      {data.players.length > 0 && <section><SectionTitle icon={<UserRound className="h-4 w-4" />} title="Personagens revelados" /><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{data.players.map((player) => <Card key={player.id} title={player.characterName} subtitle={`${player.playerName} • ${player.role}`} content={player.concept} imageUrl={player.meta?.imageUrl} />)}</div></section>}

      {data.npcs.length > 0 && <section><SectionTitle icon={<UserRound className="h-4 w-4" />} title="NPCs revelados" /><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{data.npcs.map((npc) => <Card key={npc.id} title={npc.name} subtitle={`${npc.category} • ${npc.role}`} content={npc.description} imageUrl={npc.meta?.imageUrl} />)}</div></section>}

      {entities.length > 0 && <section><SectionTitle icon={<Map className="h-4 w-4" />} title="Mundo revelado" /><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{entities.map((entity) => <Card key={entity.id} title={entity.name} subtitle={entity.type} content={entity.summary || entity.content} imageUrl={typeof entity.data?.imageUrl === "string" ? entity.data.imageUrl : undefined} />)}</div></section>}

      {data.rules.length > 0 && <section><SectionTitle icon={<BookOpen className="h-4 w-4" />} title="Regras compartilhadas" /><div className="grid gap-3 md:grid-cols-2">{data.rules.map((rule) => <Card key={rule.id} title={rule.title} subtitle={rule.category} content={rule.summary} imageUrl={rule.meta?.imageUrl} />)}</div></section>}

      {data.notes.length > 0 && <section><SectionTitle icon={<ScrollText className="h-4 w-4" />} title="Notas reveladas" /><div className="grid gap-3 md:grid-cols-2">{data.notes.map((note) => <Card key={note.id} title={note.title} subtitle="Nota" content={note.content} />)}</div></section>}
    </div>
  </main>;
}

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) { return <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-amber-300">{icon}{title}</h2>; }
function Card({ title, subtitle, content, imageUrl }: { title: string; subtitle: string; content: string; imageUrl?: string }) { return <article className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/70">{imageUrl && <img src={imageUrl} alt={title} referrerPolicy="no-referrer" className="max-h-72 w-full object-cover" />}<div className="p-4"><p className="text-xs uppercase text-zinc-500">{subtitle}</p><h3 className="mt-1 font-semibold text-zinc-100">{title}</h3>{content && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-400">{content}</p>}</div></article>; }
