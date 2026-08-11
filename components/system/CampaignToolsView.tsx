"use client";

import { CalendarDays, Link2, Plus, Trash2, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";

import type { CampaignRelation, CalendarEvent, RulebookData, WorldCalendar } from "@/types/rulebook";

type Action = (payload: Record<string, unknown>, options?: { silent?: boolean }) => Promise<unknown>;

type RefOption = { value: string; type: CampaignRelation["sourceType"]; id: string; name: string };

export function CampaignToolsView({ data, action }: { data: RulebookData; action: Action }) {
  const [mode, setMode] = useState<"relations" | "calendar">("relations");
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
          <button onClick={() => setMode("relations")} className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold ${mode === "relations" ? "bg-amber-500 text-zinc-950" : "text-zinc-400"}`}><UsersRound className="mr-2 inline h-4 w-4" />Relações</button>
          <button onClick={() => setMode("calendar")} className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold ${mode === "calendar" ? "bg-amber-500 text-zinc-950" : "text-zinc-400"}`}><CalendarDays className="mr-2 inline h-4 w-4" />Calendário</button>
        </div>
        {mode === "relations" ? <Relations data={data} action={action} /> : <Calendar data={data} action={action} />}
      </div>
    </div>
  );
}

function Relations({ data, action }: { data: RulebookData; action: Action }) {
  const options = useMemo<RefOption[]>(() => [
    ...data.npcs.map((item) => ({ value: `npc:${item.id}`, type: "npc" as const, id: item.id, name: item.name })),
    ...data.players.map((item) => ({ value: `player:${item.id}`, type: "player" as const, id: item.id, name: item.characterName })),
    ...(data.entities ?? []).map((item) => ({ value: `entity:${item.id}`, type: "entity" as const, id: item.id, name: item.name })),
  ], [data]);
  const [source, setSource] = useState(options[0]?.value ?? "");
  const [target, setTarget] = useState(options[1]?.value ?? options[0]?.value ?? "");
  const [relation, setRelation] = useState("conhece");
  const [note, setNote] = useState("");

  async function add() {
    const a = options.find((item) => item.value === source);
    const b = options.find((item) => item.value === target);
    if (!a || !b || a.value === b.value || !relation.trim()) return;
    await action({ action: "upsert-relation", tableId: data.activeTableId, item: { tableId: data.activeTableId, sourceType: a.type, sourceId: a.id, sourceName: a.name, targetType: b.type, targetId: b.id, targetName: b.name, relation: relation.trim(), note: note.trim() } });
    setNote("");
  }

  const grouped = useMemo(() => {
    const map = new Map<string, CampaignRelation[]>();
    for (const item of data.relations ?? []) {
      const key = `${item.sourceType}:${item.sourceId}`;
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return [...map.entries()];
  }, [data.relations]);

  return <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
    <aside className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
      <p className="flex items-center gap-2 font-semibold text-zinc-100"><Link2 className="h-4 w-4 text-amber-400" />Nova relação</p>
      <label className="form-label mt-4">Origem<select className="field mt-2" value={source} onChange={(event) => setSource(event.target.value)}>{options.map((item) => <option key={item.value} value={item.value}>{item.type} — {item.name}</option>)}</select></label>
      <label className="form-label mt-3">Relação<input className="field mt-2" value={relation} onChange={(event) => setRelation(event.target.value)} placeholder="irmão, inimigo, aliado, respeita..." /></label>
      <label className="form-label mt-3">Alvo<select className="field mt-2" value={target} onChange={(event) => setTarget(event.target.value)}>{options.map((item) => <option key={item.value} value={item.value}>{item.type} — {item.name}</option>)}</select></label>
      <label className="form-label mt-3">Nota<textarea className="field mt-2" rows={3} value={note} onChange={(event) => setNote(event.target.value)} /></label>
      <button onClick={() => void add()} className="primary-button mt-4 w-full"><Plus className="h-4 w-4" />Adicionar relação</button>
    </aside>
    <section className="space-y-4">
      {grouped.length === 0 ? <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-500">Nenhuma relação registrada.</div> : grouped.map(([key, items]) => <div key={key} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4"><h3 className="font-semibold text-amber-300">{items[0]?.sourceName}</h3><div className="mt-3 grid gap-2 md:grid-cols-2">{items.map((item) => <div key={item.id} className="flex items-start justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3"><div><p className="text-sm text-zinc-200"><span className="text-zinc-500">{item.relation}</span> → {item.targetName}</p>{item.note && <p className="mt-1 text-xs text-zinc-500">{item.note}</p>}</div><button onClick={() => confirm(`Excluir a relação com ${item.targetName}?`) && void action({ action: "delete-relation", tableId: data.activeTableId, id: item.id })} className="text-red-300"><Trash2 className="h-4 w-4" /></button></div>)}</div></div>)}
    </section>
  </div>;
}

function Calendar({ data, action }: { data: RulebookData; action: Action }) {
  const initial = data.runtime?.calendar ?? { day: 1, month: 1, year: 1, events: [] };
  const [draft, setDraft] = useState<WorldCalendar>(initial);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDay, setEventDay] = useState(initial.day);
  const [eventMonth, setEventMonth] = useState(initial.month);
  const [eventYear, setEventYear] = useState(initial.year);

  async function save(next = draft) {
    setDraft(next);
    await action({ action: "save-calendar", tableId: data.activeTableId, calendar: next });
  }

  function addEvent() {
    if (!title.trim()) return;
    const event: CalendarEvent = { id: `event-${Date.now()}`, title: title.trim(), day: eventDay, month: eventMonth, year: eventYear, description: description.trim(), visibility: "master" };
    void save({ ...draft, events: [...draft.events, event] });
    setTitle(""); setDescription("");
  }

  function advance(days: number) {
    let day = draft.day + days;
    let month = draft.month;
    let year = draft.year;
    while (day > 30) { day -= 30; month += 1; }
    while (month > 12) { month -= 12; year += 1; }
    void save({ ...draft, day, month, year, monthName: `Mês ${month}` });
  }

  const upcoming = [...draft.events].sort((a, b) => (a.year - b.year) || (a.month - b.month) || (a.day - b.day));

  return <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
    <aside className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
      <div><p className="text-xs uppercase tracking-[0.2em] text-amber-400">Tempo do mundo</p><h3 className="mt-1 text-2xl font-black text-zinc-100">Dia {draft.day} / Mês {draft.month} / Ano {draft.year}</h3><p className="text-sm text-zinc-500">{draft.calendarName ?? "Calendário da campanha"}</p></div>
      <div className="grid grid-cols-3 gap-2"><button onClick={() => advance(1)} className="secondary-button">+1 dia</button><button onClick={() => advance(7)} className="secondary-button">+7 dias</button><button onClick={() => advance(30)} className="secondary-button">+30 dias</button></div>
      <div className="grid grid-cols-3 gap-2"><input type="number" value={draft.day} onChange={(event) => setDraft({ ...draft, day: Number(event.target.value) || 1 })} className="field" /><input type="number" value={draft.month} onChange={(event) => setDraft({ ...draft, month: Number(event.target.value) || 1 })} className="field" /><input type="number" value={draft.year} onChange={(event) => setDraft({ ...draft, year: Number(event.target.value) || 1 })} className="field" /></div>
      <input value={draft.calendarName ?? ""} onChange={(event) => setDraft({ ...draft, calendarName: event.target.value })} className="field" placeholder="Nome do calendário" />
      <button onClick={() => void save()} className="primary-button w-full">Salvar calendário</button>
    </aside>
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      <h3 className="font-semibold text-zinc-100">Eventos programados</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-4"><input value={title} onChange={(event) => setTitle(event.target.value)} className="field md:col-span-2" placeholder="Título do evento" /><input type="number" value={eventDay} onChange={(event) => setEventDay(Number(event.target.value))} className="field" placeholder="Dia" /><input type="number" value={eventMonth} onChange={(event) => setEventMonth(Number(event.target.value))} className="field" placeholder="Mês" /><input type="number" value={eventYear} onChange={(event) => setEventYear(Number(event.target.value))} className="field" placeholder="Ano" /><textarea value={description} onChange={(event) => setDescription(event.target.value)} className="field md:col-span-2" rows={2} placeholder="Descrição" /><button onClick={addEvent} className="primary-button"><Plus className="h-4 w-4" />Adicionar</button></div>
      <div className="mt-5 space-y-2">{upcoming.map((event) => <div key={event.id} className={`flex items-start justify-between gap-3 rounded-lg border p-3 ${(event.year === draft.year && event.month === draft.month && event.day === draft.day) ? "border-amber-500/60 bg-amber-500/10" : "border-zinc-800 bg-zinc-950"}`}><div><p className="text-xs text-amber-400">{event.day}/{event.month}/{event.year}</p><p className="font-medium text-zinc-200">{event.title}</p>{event.description && <p className="mt-1 text-sm text-zinc-500">{event.description}</p>}</div><div className="flex items-center gap-2"><button onClick={() => void save({ ...draft, events: draft.events.map((item) => item.id === event.id ? { ...item, visibility: item.visibility === "players" ? "master" : "players" } : item) })} className="text-xs text-zinc-400">{event.visibility === "players" ? "Público" : "Mestre"}</button><button onClick={() => void save({ ...draft, events: draft.events.filter((item) => item.id !== event.id) })} className="text-red-300"><Trash2 className="h-4 w-4" /></button></div></div>)}</div>
    </section>
  </div>;
}
