"use client";

import { Eye, EyeOff, Plus, Star, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import type { RuleArticle, RuleCategory, RulebookData } from "@/types/rulebook";

const categories: RuleCategory[] = ["combate", "testes", "atributos", "defesa-dano", "personagem", "progressao", "habilidades", "armaduras", "equipamentos", "npcs", "regras-da-casa"];

export function RulesView({
  data,
  action,
  onOpened,
}: {
  data: RulebookData;
  action: (payload: Record<string, unknown>) => Promise<unknown>;
  onOpened: (type: string, id: string, name: string) => void;
}) {
  const [selectedId, setSelectedId] = useState(data.rules[0]?.id ?? "");
  const [filter, setFilter] = useState("");
  const selected = data.rules.find((item) => item.id === selectedId) ?? data.rules[0];
  const visible = useMemo(() => data.rules.filter((item) => !filter || `${item.title} ${item.summary} ${item.tags.join(" ")}`.toLowerCase().includes(filter.toLowerCase())), [data.rules, filter]);

  function select(rule: RuleArticle) {
    setSelectedId(rule.id);
    onOpened("rule", rule.id, rule.title);
  }

  async function createRule() {
    const item: RuleArticle = {
      id: `rule-${Date.now()}`,
      category: "regras-da-casa",
      title: "Nova regra",
      summary: "Resumo da regra.",
      content: "Descreva a regra aqui.",
      tags: [],
      meta: { visibility: "master", favorite: false, archived: false },
    };
    await action({ action: "upsert-rule", systemId: data.activeSystemId, tableId: data.activeTableId, item });
    setSelectedId(item.id);
  }

  return (
    <div className="grid h-full grid-cols-[300px_1fr] overflow-hidden">
      <aside className="overflow-y-auto border-r border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex gap-2">
          <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filtrar regras" className="field" />
          <button onClick={() => void createRule()} className="icon-button" title="Nova regra"><Plus className="h-4 w-4" /></button>
        </div>
        <div className="mt-4 space-y-2">
          {visible.map((rule) => (
            <button key={rule.id} onClick={() => select(rule)} className={`w-full rounded-lg border p-3 text-left ${selected?.id === rule.id ? "border-amber-500/50 bg-amber-500/10" : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-zinc-200">{rule.title}</p>
                {rule.meta?.favorite && <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />}
              </div>
              <p className="mt-1 text-xs text-zinc-500">{rule.category}</p>
            </button>
          ))}
        </div>
      </aside>
      <section className="overflow-y-auto p-6">
        {selected ? <RuleEditor key={selected.id} rule={selected} data={data} action={action} /> : <Empty />}
      </section>
    </div>
  );
}

function RuleEditor({ rule, data, action }: { rule: RuleArticle; data: RulebookData; action: (payload: Record<string, unknown>) => Promise<unknown> }) {
  const [draft, setDraft] = useState(rule);
  const [tagsText, setTagsText] = useState(rule.tags.join(", "));

  async function save() {
    await action({ action: "upsert-rule", systemId: data.activeSystemId, tableId: data.activeTableId, item: { ...draft, tags: tagsText.split(",").map((item) => item.trim()).filter(Boolean) } });
  }

  async function toggleFavorite() {
    const next = { ...draft, meta: { ...draft.meta, favorite: !draft.meta?.favorite } };
    setDraft(next);
    await action({ action: "upsert-rule", systemId: data.activeSystemId, tableId: data.activeTableId, item: next });
  }

  async function toggleVisibility() {
    const next = { ...draft, meta: { ...draft.meta, visibility: draft.meta?.visibility === "players" ? "master" : "players" as const } };
    setDraft(next);
    await action({ action: "upsert-rule", systemId: data.activeSystemId, tableId: data.activeTableId, item: next });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-xs uppercase tracking-[0.2em] text-amber-400">Regra do sistema</p><h2 className="mt-1 text-2xl font-bold">{draft.title}</h2></div>
        <div className="flex gap-2">
          <button onClick={() => void toggleFavorite()} className="icon-button" title="Favoritar"><Star className={`h-4 w-4 ${draft.meta?.favorite ? "fill-amber-300 text-amber-300" : ""}`} /></button>
          <button onClick={() => void toggleVisibility()} className="icon-button" title="Alternar visibilidade">{draft.meta?.visibility === "players" ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
          <button onClick={async () => { if (confirm(`Excluir ${rule.title}?`)) await action({ action: "delete-rule", systemId: data.activeSystemId, tableId: data.activeTableId, id: rule.id }); }} className="icon-button text-red-300" title="Excluir"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>
      <label className="form-label">Título<input className="field mt-2" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="form-label">Categoria<select className="field mt-2" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as RuleCategory })}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="form-label">Tags<input className="field mt-2" value={tagsText} onChange={(event) => setTagsText(event.target.value)} placeholder="combate, crítico, casa" /></label>
      </div>
      <label className="form-label">Resumo<textarea className="field mt-2" rows={3} value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} /></label>
      <label className="form-label">Conteúdo<textarea className="field mt-2 min-h-[360px]" value={draft.content} onChange={(event) => setDraft({ ...draft, content: event.target.value })} /></label>
      <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-xs text-zinc-500">
        <span>{draft.meta?.visibility === "players" ? "Visível no modo jogador" : "Somente mestre"}</span>
        <button onClick={() => void save()} className="primary-button">Salvar regra</button>
      </div>
    </div>
  );
}

function Empty() {
  return <div className="flex h-full items-center justify-center text-sm text-zinc-500">Crie ou selecione uma regra.</div>;
}
