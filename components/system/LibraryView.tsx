"use client";

import { Archive, CopyPlus, Image as ImageIcon, Library, PackagePlus, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import type { LibraryItem, LibraryItemType, RulebookData } from "@/types/rulebook";

type Action = (payload: Record<string, unknown>, options?: { silent?: boolean }) => Promise<unknown>;

type CurrentSource = {
  key: string;
  type: LibraryItemType;
  name: string;
  description: string;
  imageUrl?: string;
  payload: Record<string, unknown>;
};

export function LibraryView({ data, action }: { data: RulebookData; action: Action }) {
  const [query, setQuery] = useState("");
  const [sourceKey, setSourceKey] = useState("");
  const [packName, setPackName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [manualName, setManualName] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualImage, setManualImage] = useState("");

  const sources = useMemo<CurrentSource[]>(() => [
    ...data.npcs.map((item) => ({ key: `npc:${item.id}`, type: "npc" as const, name: item.name, description: item.role, imageUrl: item.meta?.imageUrl, payload: item as unknown as Record<string, unknown> })),
    ...data.players.map((item) => ({ key: `player:${item.id}`, type: "player" as const, name: item.characterName, description: item.role, imageUrl: item.meta?.imageUrl, payload: item as unknown as Record<string, unknown> })),
    ...data.rules.map((item) => ({ key: `rule:${item.id}`, type: "rule" as const, name: item.title, description: item.summary, imageUrl: item.meta?.imageUrl, payload: item as unknown as Record<string, unknown> })),
    ...(data.entities ?? []).map((item) => ({ key: `entity:${item.id}`, type: "entity" as const, name: item.name, description: item.summary, imageUrl: typeof item.data?.imageUrl === "string" ? item.data.imageUrl : undefined, payload: item as unknown as Record<string, unknown> })),
    ...(data.templates ?? []).map((item) => ({ key: `template:${item.id}`, type: "template" as const, name: item.name, description: item.description, payload: item as unknown as Record<string, unknown> })),
    ...(data.combats ?? []).map((item) => ({ key: `encounter:${item.id}`, type: "encounter" as const, name: item.name, description: `${item.participants.length} participantes`, payload: item as unknown as Record<string, unknown> })),
  ], [data]);

  const filtered = (data.library ?? []).filter((item) => !query.trim() || `${item.name} ${item.description} ${item.tags.join(" ")} ${item.type}`.toLowerCase().includes(query.toLowerCase()));

  async function addSource() {
    const source = sources.find((item) => item.key === sourceKey);
    if (!source) return;
    await action({
      action: "upsert-library",
      tableId: data.activeTableId,
      systemId: data.activeSystemId,
      item: {
        type: source.type,
        systemId: data.activeSystemId,
        name: source.name,
        description: source.description,
        tags: [source.type],
        imageUrl: source.imageUrl,
        payload: source.payload,
      },
    });
    setSourceKey("");
  }

  async function createManual() {
    if (!manualName.trim()) return;
    await action({ action: "upsert-library", tableId: data.activeTableId, systemId: data.activeSystemId, item: { type: "custom", name: manualName.trim(), description: manualDescription.trim(), tags: ["custom"], imageUrl: manualImage.trim() || undefined, payload: { name: manualName.trim(), description: manualDescription.trim(), imageUrl: manualImage.trim() || undefined } } });
    setManualName(""); setManualDescription(""); setManualImage("");
  }

  async function createPack() {
    if (!packName.trim() || selected.length === 0) return;
    await action({ action: "upsert-pack", tableId: data.activeTableId, item: { name: packName.trim(), description: `Pacote com ${selected.length} itens da biblioteca.`, libraryItemIds: selected } });
    setPackName(""); setSelected([]);
  }

  return (
    <div className="mdm-module workspace-list-detail workspace-list-detail--340 grid h-full min-h-0 overflow-hidden">
      <aside className="mdm-list-pane mdm-scroll-area overflow-y-auto border-r border-border bg-card/60 p-4">
        <div><p className="flex items-center gap-2 font-semibold text-foreground"><Library className="h-4 w-4 text-primary" />Biblioteca reutilizável</p><p className="mt-1 text-xs text-muted-foreground">Conteúdo daqui pode ser usado em qualquer mesa.</p></div>

        <div className="mt-5 rounded-xl border border-border bg-background p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Salvar conteúdo da mesa</p>
          <select value={sourceKey} onChange={(event) => setSourceKey(event.target.value)} className="field mt-3"><option value="">Escolha uma ficha, regra, item ou encontro...</option>{sources.map((source) => <option key={source.key} value={source.key}>{source.type} — {source.name}</option>)}</select>
          <button onClick={() => void addSource()} disabled={!sourceKey} className="secondary-button mt-2 w-full"><CopyPlus className="h-4 w-4" />Adicionar à biblioteca</button>
        </div>

        <div className="mt-4 rounded-xl border border-border bg-background p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Entrada manual</p>
          <input value={manualName} onChange={(event) => setManualName(event.target.value)} className="field mt-3" placeholder="Nome" />
          <textarea value={manualDescription} onChange={(event) => setManualDescription(event.target.value)} className="field mt-2" rows={3} placeholder="Descrição" />
          <input value={manualImage} onChange={(event) => setManualImage(event.target.value)} className="field mt-2" placeholder="URL de imagem, ex.: https://i.imgur.com/..." />
          <button onClick={() => void createManual()} className="secondary-button mt-2 w-full"><Plus className="h-4 w-4" />Criar entrada</button>
        </div>

        <div className="mt-4 rounded-xl border border-border bg-background p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><PackagePlus className="h-4 w-4" />Criar pacote</p>
          <input value={packName} onChange={(event) => setPackName(event.target.value)} className="field mt-3" placeholder="Nome do pacote" />
          <p className="mt-2 text-xs text-muted-foreground/80">Selecione itens no painel ao lado.</p>
          <button onClick={() => void createPack()} disabled={!packName.trim() || selected.length === 0} className="secondary-button mt-2 w-full">Criar pacote ({selected.length})</button>
        </div>

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pacotes</p>
          <div className="mt-2 space-y-2">{(data.packs ?? []).map((pack) => <div key={pack.id} className="rounded-lg border border-border bg-background p-3"><p className="font-medium text-foreground">{pack.name}</p><p className="mt-1 text-xs text-muted-foreground">{pack.libraryItemIds.length} itens</p><div className="mt-2 flex gap-2"><button onClick={() => void action({ action: "apply-pack", tableId: data.activeTableId, systemId: data.activeSystemId, id: pack.id, name: pack.name })} className="secondary-button flex-1">Aplicar na mesa</button><button onClick={() => confirm(`Excluir o pacote ${pack.name}?`) && void action({ action: "delete-pack", tableId: data.activeTableId, id: pack.id })} className="icon-button text-destructive"><Trash2 className="h-4 w-4" /></button></div></div>)}</div>
        </div>
      </aside>

      <section className="mdm-detail-pane mdm-scroll-area overflow-y-auto p-5">
        <label className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"><Search className="h-4 w-4 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm text-foreground outline-none" placeholder="Pesquisar biblioteca..." /></label>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => <LibraryCard key={item.id} item={item} selected={selected.includes(item.id)} onSelect={() => setSelected((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])} onApply={() => void action({ action: "apply-library", tableId: data.activeTableId, systemId: data.activeSystemId, id: item.id, name: item.name })} onDelete={() => confirm(`Excluir ${item.name} da biblioteca?`) && void action({ action: "delete-library", tableId: data.activeTableId, id: item.id })} />)}
        </div>
      </section>
    </div>
  );
}

function LibraryCard({ item, selected, onSelect, onApply, onDelete }: { item: LibraryItem; selected: boolean; onSelect: () => void; onApply: () => void; onDelete: () => void }) {
  return <article className={`overflow-hidden rounded-xl border ${selected ? "border-primary/60 bg-primary/5" : "border-border bg-card/70"}`}>
    {item.imageUrl ? <img src={item.imageUrl} alt={item.name} referrerPolicy="no-referrer" className="h-40 w-full object-cover" /> : <div className="flex h-28 items-center justify-center bg-background text-muted-foreground/70"><ImageIcon className="h-8 w-8" /></div>}
    <div className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] uppercase tracking-wide text-primary">{item.type}</p><h3 className="font-semibold text-foreground">{item.name}</h3></div><label className="flex items-center gap-1 text-xs text-muted-foreground"><input type="checkbox" checked={selected} onChange={onSelect} />Pacote</label></div><p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{item.description}</p><div className="mt-4 flex gap-2"><button onClick={onApply} className="primary-button flex-1"><Archive className="h-4 w-4" />Usar na mesa</button><button onClick={onDelete} className="icon-button text-destructive"><Trash2 className="h-4 w-4" /></button></div></div>
  </article>;
}
