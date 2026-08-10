"use client";

import { Archive, Eye, EyeOff, Map, Plus, Star, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import type { RulebookData, WorldEntity, WorldEntityType } from "@/types/rulebook";

const types: Array<{ id: WorldEntityType; label: string }> = [
  { id: "item", label: "Itens" },
  { id: "location", label: "Locais" },
  { id: "faction", label: "Facções" },
  { id: "quest", label: "Missões" },
  { id: "timeline", label: "Timeline" },
];

export function WorldView({
  data,
  action,
  onOpened,
}: {
  data: RulebookData;
  action: (payload: Record<string, unknown>) => Promise<unknown>;
  onOpened: (type: string, id: string, name: string) => void;
}) {
  const entities = data.entities ?? [];
  const [type, setType] = useState<WorldEntityType>("location");
  const [selectedId, setSelectedId] = useState(entities[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const visible = useMemo(() => entities.filter((item) => !item.archived && item.type === type && (!query || `${item.name} ${item.summary} ${item.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()))), [entities, query, type]);
  const archived = useMemo(() => entities.filter((item) => item.archived), [entities]);
  const selected = entities.find((item) => item.id === selectedId);

  async function createEntity() {
    const item: WorldEntity = {
      id: `entity-${Date.now()}`,
      tableId: data.activeTableId,
      type,
      name: type === "quest" ? "Nova missão" : type === "timeline" ? "Novo evento" : `Novo ${types.find((item) => item.id === type)?.label.slice(0, -1).toLowerCase() ?? "item"}`,
      summary: "Resumo.",
      content: "Descrição detalhada.",
      tags: [],
      visibility: "master",
      favorite: false,
      archived: false,
      data: type === "quest" ? { status: "Em andamento", objectives: [] } : type === "timeline" ? { date: "" } : {},
    };
    await action({ action: "upsert-entity", tableId: data.activeTableId, systemId: data.activeSystemId, item });
    setSelectedId(item.id);
  }

  function select(item: WorldEntity) {
    setSelectedId(item.id);
    setType(item.type);
    onOpened(item.type, item.id, item.name);
  }

  return (
    <div className="grid h-full grid-cols-[330px_1fr] overflow-hidden">
      <aside className="overflow-y-auto border-r border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200"><Map className="h-4 w-4 text-amber-400" />Mundo da campanha</div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {types.map((item) => <button key={item.id} onClick={() => setType(item.id)} className={`rounded-md border px-2 py-2 text-xs ${type === item.id ? "border-amber-500/50 bg-amber-500/10 text-amber-200" : "border-zinc-800 bg-zinc-950 text-zinc-400"}`}>{item.label}</button>)}
        </div>
        <div className="mt-3 flex gap-2"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filtrar" className="field" /><button onClick={() => void createEntity()} className="icon-button"><Plus className="h-4 w-4" /></button></div>
        <div className="mt-4 space-y-2">
          {visible.map((item) => <button key={item.id} onClick={() => select(item)} className={`w-full rounded-lg border p-3 text-left ${selected?.id === item.id ? "border-amber-500/50 bg-amber-500/10" : "border-zinc-800 bg-zinc-950"}`}><div className="flex items-center justify-between"><p className="font-medium text-zinc-200">{item.name}</p>{item.favorite && <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />}</div><p className="mt-1 text-xs text-zinc-500">{item.summary}</p></button>)}
        </div>
        {archived.length > 0 && <details className="mt-6"><summary className="cursor-pointer text-xs font-semibold uppercase text-zinc-600">Arquivados ({archived.length})</summary><div className="mt-2 space-y-2">{archived.map((item) => <button key={item.id} onClick={() => select(item)} className="w-full rounded-md border border-zinc-800 bg-zinc-950 p-2 text-left text-xs text-zinc-500">{item.name}</button>)}</div></details>}
      </aside>
      <section className="overflow-y-auto p-6">{selected ? <EntityEditor key={selected.id} item={selected} data={data} action={action} /> : <div className="flex h-full items-center justify-center text-sm text-zinc-500">Crie ou selecione um item do mundo.</div>}</section>
    </div>
  );
}

function EntityEditor({ item, data, action }: { item: WorldEntity; data: RulebookData; action: (payload: Record<string, unknown>) => Promise<unknown> }) {
  const [draft, setDraft] = useState(item);
  const [tags, setTags] = useState(item.tags.join(", "));
  const objectives = Array.isArray(draft.data?.objectives) ? draft.data?.objectives as Array<{ text: string; done: boolean }> : [];

  async function save(next = draft) {
    await action({ action: "upsert-entity", tableId: data.activeTableId, systemId: data.activeSystemId, item: { ...next, tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean) } });
  }

  function patchObjective(index: number, patch: Partial<{ text: string; done: boolean }>) {
    const next = objectives.map((objective, current) => current === index ? { ...objective, ...patch } : objective);
    setDraft({ ...draft, data: { ...draft.data, objectives: next } });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.2em] text-amber-400">{draft.type}</p><h2 className="mt-1 text-2xl font-bold">{draft.name}</h2></div><div className="flex gap-2"><button onClick={() => { const next = { ...draft, favorite: !draft.favorite }; setDraft(next); void save(next); }} className="icon-button"><Star className={`h-4 w-4 ${draft.favorite ? "fill-amber-300 text-amber-300" : ""}`} /></button><button onClick={() => { const next = { ...draft, visibility: draft.visibility === "players" ? "master" as const : "players" as const }; setDraft(next); void save(next); }} className="icon-button">{draft.visibility === "players" ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button><button onClick={() => { const next = { ...draft, archived: !draft.archived }; setDraft(next); void save(next); }} className="icon-button"><Archive className="h-4 w-4" /></button><button onClick={async () => { if (confirm(`Excluir ${draft.name}?`)) await action({ action: "delete-entity", tableId: data.activeTableId, id: draft.id }); }} className="icon-button text-red-300"><Trash2 className="h-4 w-4" /></button></div></div>
      <div className="grid gap-3 md:grid-cols-2"><Field label="Nome" value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} /><label className="form-label">Tipo<select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as WorldEntityType })} className="field mt-2">{types.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}</select></label></div>
      <Field label="Resumo" value={draft.summary} onChange={(value) => setDraft({ ...draft, summary: value })} />
      <Field label="Tags" value={tags} onChange={setTags} />
      <label className="form-label block">Descrição<textarea value={draft.content} onChange={(event) => setDraft({ ...draft, content: event.target.value })} rows={10} className="field mt-2" /></label>

      {draft.type === "quest" && <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4"><div className="grid gap-3 md:grid-cols-[220px_1fr]"><Field label="Status" value={String(draft.data?.status ?? "Em andamento")} onChange={(value) => setDraft({ ...draft, data: { ...draft.data, status: value } })} /><Field label="Recompensa" value={String(draft.data?.reward ?? "")} onChange={(value) => setDraft({ ...draft, data: { ...draft.data, reward: value } })} /></div><div className="mt-4 flex items-center justify-between"><p className="text-sm font-semibold text-amber-300">Objetivos</p><button onClick={() => setDraft({ ...draft, data: { ...draft.data, objectives: [...objectives, { text: "Novo objetivo", done: false }] } })} className="secondary-button"><Plus className="h-3.5 w-3.5" />Objetivo</button></div><div className="mt-3 space-y-2">{objectives.map((objective, index) => <div key={index} className="flex items-center gap-2"><input type="checkbox" checked={objective.done} onChange={(event) => patchObjective(index, { done: event.target.checked })} /><input value={objective.text} onChange={(event) => patchObjective(index, { text: event.target.value })} className="field" /><button onClick={() => setDraft({ ...draft, data: { ...draft.data, objectives: objectives.filter((_, current) => current !== index) } })} className="icon-button text-red-300"><Trash2 className="h-4 w-4" /></button></div>)}</div></div>}

      {draft.type === "timeline" && <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4"><Field label="Data / Dia da campanha" value={String(draft.data?.date ?? "")} onChange={(value) => setDraft({ ...draft, data: { ...draft.data, date: value } })} /></div>}

      <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-xs text-zinc-500"><span>{draft.visibility === "players" ? "Visível aos jogadores" : "Somente mestre"}</span><button onClick={() => void save()} className="primary-button">Salvar</button></div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="form-label">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="field mt-2" /></label>;
}
