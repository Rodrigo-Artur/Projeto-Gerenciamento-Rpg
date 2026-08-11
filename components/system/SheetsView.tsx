"use client";

import { CopyPlus, Eye, EyeOff, Image as ImageIcon, Plus, Save, Sparkles, Star, Trash2, UserRound, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { useDebouncedAutosave, type AutosaveState } from "@/hooks/useDebouncedAutosave";
import type { ContentMeta, LabeledValue, NpcSheet, PlayerSheet, RulebookData, SheetCategory, SheetTemplate, StructuredAbility } from "@/types/rulebook";

const fallbackCategories: SheetCategory[] = ["criminosos", "policia-umck", "ameacas-pesadas", "simbiontes", "bosses", "aliados", "monstros", "custom"];
const quickNames = ["Aldren", "Borin", "Cira", "Daren", "Elya", "Fenn", "Gara", "Haru", "Iria", "Joran", "Kira", "Lume", "Mara", "Nero", "Orin", "Pira", "Ravi", "Sora", "Tarin", "Vera"];
const quickSurnames = ["Ferro", "Cinza", "Lâmina", "Vale", "Brasa", "Pedra", "Norte", "Corvo", "Dourado", "Tempestade"];
const quickRoles = ["Guerreiro", "Mercador", "Batedor", "Criminoso", "Guarda", "Caçador", "Informante", "Especialista", "Duelista", "Sobrevivente"];

function rowsToText(rows: LabeledValue[]) { return rows.map((item) => `${item.label}: ${item.value}`).join("\n"); }
function textToRows(text: string) { return text.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => { const [label, ...rest] = line.split(":"); return { label: label.trim() || "Campo", value: rest.join(":").trim() || "-" }; }); }
function defaultCustomFields(template?: SheetTemplate) { return template ? Object.fromEntries(template.fields.map((field) => [field.id, field.defaultValue ?? ""])) : {}; }
function initialAttributes(data: RulebookData) { return (data.systemConfig?.attributes ?? []).map((label) => ({ label, value: "0" })); }
function initialResources(data: RulebookData) { return (data.systemConfig?.resources ?? []).map((label) => ({ label, value: "0" })); }
function typedConfirm(name: string, verb = "excluir") { return prompt(`Para ${verb} “${name}”, digite exatamente o nome:`, "") === name; }

export function SheetsView({ data, action, onOpened }: { data: RulebookData; action: (payload: Record<string, unknown>) => Promise<unknown>; onOpened: (type: string, id: string, name: string) => void }) {
  const [kind, setKind] = useState<"players" | "npcs">("players");
  const [selectedId, setSelectedId] = useState(data.players[0]?.id ?? data.npcs[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const players = useMemo(() => data.players.filter((item) => !query || `${item.characterName} ${item.playerName} ${item.role}`.toLowerCase().includes(query.toLowerCase())), [data.players, query]);
  const npcs = useMemo(() => data.npcs.filter((item) => !query || `${item.name} ${item.role} ${item.category}`.toLowerCase().includes(query.toLowerCase())), [data.npcs, query]);
  const selectedPlayer = data.players.find((item) => item.id === selectedId);
  const selectedNpc = data.npcs.find((item) => item.id === selectedId);

  function selectPlayer(item: PlayerSheet) { setKind("players"); setSelectedId(item.id); onOpened("player", item.id, item.characterName); }
  function selectNpc(item: NpcSheet) { setKind("npcs"); setSelectedId(item.id); onOpened("npc", item.id, item.name); }

  async function createPlayer(templateId?: string) {
    const template = (data.templates ?? []).find((item) => item.id === templateId);
    const resources = initialResources(data);
    const hpResource = resources.find((item) => ["hp", "pv", "vida"].includes(item.label.toLowerCase()));
    const item: PlayerSheet = { id: `player-${Date.now()}`, characterName: "Novo personagem", playerName: "Jogador", role: template?.name ?? "Personagem", tier: String(template?.fields.find((field) => field.id === "tier")?.defaultValue ?? "Tier 1"), concept: "Descreva o conceito do personagem.", status: hpResource ? [{ ...hpResource }] : [{ label: "HP", value: "0" }], attributes: initialAttributes(data), resources, abilities: [], structuredAbilities: [], notes: [], meta: { templateId: template?.id, visibility: "master", favorite: false, archived: false, customFields: defaultCustomFields(template) } };
    await action({ action: "upsert-player", tableId: data.activeTableId, systemId: data.activeSystemId, item }); setKind("players"); setSelectedId(item.id); onOpened("player", item.id, item.characterName);
  }

  async function createNpc(templateId?: string) {
    const template = (data.templates ?? []).find((item) => item.id === templateId);
    const configured = (data.systemConfig?.sheetCategories ?? fallbackCategories).filter((category) => category !== "players");
    const defaultCategory = configured[0] ?? "custom";
    const item: NpcSheet = { id: `npc-${Date.now()}`, category: template?.defaultCategory ?? (template?.kind === "boss" ? "bosses" : template?.kind === "monster" ? "monstros" : defaultCategory), name: "Novo NPC", role: template?.name ?? "NPC", description: "Descrição do NPC.", stats: [...initialResources(data), ...initialAttributes(data)], notes: [], abilities: [], meta: { templateId: template?.id, visibility: "master", favorite: false, archived: false, customFields: defaultCustomFields(template) } };
    await action({ action: "upsert-npc", tableId: data.activeTableId, systemId: data.activeSystemId, item }); setKind("npcs"); setSelectedId(item.id); onOpened("npc", item.id, item.name);
  }

  async function generateNpc() {
    const categories = (data.systemConfig?.sheetCategories ?? fallbackCategories).filter((category) => category !== "players");
    const name = `${quickNames[Math.floor(Math.random() * quickNames.length)]} ${quickSurnames[Math.floor(Math.random() * quickSurnames.length)]}`;
    const role = quickRoles[Math.floor(Math.random() * quickRoles.length)];
    const attributes = initialAttributes(data).map((row) => ({ ...row, value: String(Math.floor(Math.random() * 9) + 8) }));
    const resources = initialResources(data).map((row) => ({ ...row, value: ["hp", "pv", "vida"].includes(row.label.toLowerCase()) ? String(Math.floor(Math.random() * 25) + 10) : row.value }));
    if (!resources.some((row) => ["hp", "pv", "vida"].includes(row.label.toLowerCase()))) resources.unshift({ label: "HP", value: String(Math.floor(Math.random() * 25) + 10) });
    const item: NpcSheet = { id: `npc-gerado-${Date.now()}`, category: categories[0] ?? "custom", name, role, description: `${role} gerado rapidamente para improviso durante a sessão. Edite detalhes quando necessário.`, stats: [...resources, ...attributes], notes: ["NPC gerado pelo gerador rápido."], abilities: [], meta: { visibility: "master", favorite: false, archived: false } };
    await action({ action: "upsert-npc", tableId: data.activeTableId, systemId: data.activeSystemId, item }); setKind("npcs"); setSelectedId(item.id); onOpened("npc", item.id, item.name);
  }

  async function duplicateNpc() {
    if (!selectedNpc) return;
    await action({ action: "duplicate-npc", tableId: data.activeTableId, systemId: data.activeSystemId, id: selectedNpc.id, name: selectedNpc.name });
  }

  const playerTemplates = (data.templates ?? []).filter((item) => item.kind === "player" || item.kind === "companion" || item.kind === "custom");
  const npcTemplates = (data.templates ?? []).filter((item) => item.kind !== "player");

  return <div className="grid h-full grid-cols-[330px_1fr] overflow-hidden">
    <aside className="overflow-y-auto border-r border-zinc-800 bg-zinc-900/60 p-4">
      <div className="grid grid-cols-2 gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-1"><button onClick={() => setKind("players")} className={`rounded-md px-3 py-2 text-sm ${kind === "players" ? "bg-amber-500 text-zinc-950" : "text-zinc-400"}`}><UserRound className="mr-2 inline h-4 w-4" />Players</button><button onClick={() => setKind("npcs")} className={`rounded-md px-3 py-2 text-sm ${kind === "npcs" ? "bg-amber-500 text-zinc-950" : "text-zinc-400"}`}><Users className="mr-2 inline h-4 w-4" />NPCs</button></div>
      <input value={query} onChange={(event) => setQuery(event.target.value)} className="field mt-3" placeholder="Filtrar fichas" />
      <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Criar usando template</p><div className="mt-2 space-y-2">{kind === "players" ? <><button onClick={() => void createPlayer()} className="secondary-button w-full"><Plus className="h-3.5 w-3.5" />Player vazio</button>{playerTemplates.map((template) => <button key={template.id} onClick={() => void createPlayer(template.id)} className="secondary-button w-full">{template.name}</button>)}</> : <><button onClick={() => void createNpc()} className="secondary-button w-full"><Plus className="h-3.5 w-3.5" />NPC vazio</button><button onClick={() => void generateNpc()} className="secondary-button w-full"><Sparkles className="h-3.5 w-3.5" />Gerar NPC rápido</button>{selectedNpc && <button onClick={() => void duplicateNpc()} className="secondary-button w-full"><CopyPlus className="h-3.5 w-3.5" />Duplicar selecionado</button>}{npcTemplates.map((template) => <button key={template.id} onClick={() => void createNpc(template.id)} className="secondary-button w-full">{template.name}</button>)}</>}</div></div>
      <div className="mt-4 space-y-2">{kind === "players" ? players.map((item) => <SheetButton key={item.id} active={selectedId === item.id} favorite={Boolean(item.meta?.favorite)} imageUrl={item.meta?.imageUrl} title={item.characterName} subtitle={`${item.playerName} • ${item.role}`} onClick={() => selectPlayer(item)} />) : npcs.map((item) => <SheetButton key={item.id} active={selectedId === item.id} favorite={Boolean(item.meta?.favorite)} imageUrl={item.meta?.imageUrl} title={item.name} subtitle={`${item.category} • ${item.role}`} onClick={() => selectNpc(item)} />)}</div>
    </aside>
    <section className="overflow-y-auto p-6">{kind === "players" && selectedPlayer ? <PlayerEditor key={selectedPlayer.id} item={selectedPlayer} data={data} action={action} /> : null}{kind === "npcs" && selectedNpc ? <NpcEditor key={selectedNpc.id} item={selectedNpc} data={data} action={action} /> : null}{kind === "players" && !selectedPlayer ? <Empty /> : null}{kind === "npcs" && !selectedNpc ? <Empty /> : null}</section>
  </div>;
}

function SheetButton({ active, favorite, imageUrl, title, subtitle, onClick }: { active: boolean; favorite: boolean; imageUrl?: string; title: string; subtitle: string; onClick: () => void }) {
  return <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left ${active ? "border-amber-500/50 bg-amber-500/10" : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"}`}>{imageUrl ? <img src={imageUrl} alt="" referrerPolicy="no-referrer" className="h-10 w-10 shrink-0 rounded-lg object-cover" /> : null}<div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate font-medium text-zinc-200">{title}</p>{favorite && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-300 text-amber-300" />}</div><p className="mt-1 truncate text-xs text-zinc-500">{subtitle}</p></div></button>;
}

function PlayerEditor({ item, data, action }: { item: PlayerSheet; data: RulebookData; action: (payload: Record<string, unknown>) => Promise<unknown> }) {
  const [draft, setDraft] = useState(item); const [statusText, setStatusText] = useState(rowsToText(item.status)); const [attributesText, setAttributesText] = useState(rowsToText(item.attributes)); const [resourcesText, setResourcesText] = useState(rowsToText(item.resources)); const [notesText, setNotesText] = useState(item.notes.join("\n"));
  const template = (data.templates ?? []).find((entry) => entry.id === draft.meta?.templateId);
  const payload = useMemo<PlayerSheet>(() => ({ ...draft, status: textToRows(statusText), attributes: textToRows(attributesText), resources: textToRows(resourcesText), notes: notesText.split("\n").map((line) => line.trim()).filter(Boolean) }), [attributesText, draft, notesText, resourcesText, statusText]);
  function patchMeta(patch: Partial<ContentMeta>) { setDraft({ ...draft, meta: { ...draft.meta, ...patch } }); }
  async function save(next: PlayerSheet) { await action({ action: "upsert-player", tableId: data.activeTableId, systemId: data.activeSystemId, item: next }); }
  const autosave = useDebouncedAutosave(payload, save, 1100);
  return <EditorShell title={draft.characterName} subtitle={`${draft.playerName} • ${draft.role}`} meta={draft.meta} autosave={autosave} onFavorite={() => patchMeta({ favorite: !draft.meta?.favorite })} onVisibility={() => patchMeta({ visibility: draft.meta?.visibility === "players" ? "master" : "players" })} onDelete={async () => { if (typedConfirm(draft.characterName)) await action({ action: "delete-player", tableId: data.activeTableId, id: draft.id, name: draft.characterName }); }} onSave={() => void save(payload)}>
    <MediaField meta={draft.meta} onChange={patchMeta} />
    <div className="grid gap-3 md:grid-cols-2"><Field label="Personagem" value={draft.characterName} onChange={(value) => setDraft({ ...draft, characterName: value })} /><Field label="Jogador" value={draft.playerName} onChange={(value) => setDraft({ ...draft, playerName: value })} /><Field label="Função / Classe" value={draft.role} onChange={(value) => setDraft({ ...draft, role: value })} /><Field label="Tier / Nível" value={draft.tier} onChange={(value) => setDraft({ ...draft, tier: value })} /></div>
    <Area label="Conceito" value={draft.concept} onChange={(value) => setDraft({ ...draft, concept: value })} rows={4} />{template && <CustomFields template={template} meta={draft.meta} onChange={(customFields) => patchMeta({ customFields })} />}
    <div className="grid gap-4 xl:grid-cols-3"><Area label="Status — Nome: Valor" value={statusText} onChange={setStatusText} rows={8} /><Area label="Atributos — Nome: Valor" value={attributesText} onChange={setAttributesText} rows={8} /><Area label="Recursos personalizados — Nome: Valor" value={resourcesText} onChange={setResourcesText} rows={8} /></div>
    <AbilityEditor abilities={draft.structuredAbilities ?? []} resourceOptions={textToRows(resourcesText).map((row) => row.label)} onChange={(abilities) => setDraft({ ...draft, structuredAbilities: abilities })} /><Area label="Notas do mestre" value={notesText} onChange={setNotesText} rows={7} />
  </EditorShell>;
}

function NpcEditor({ item, data, action }: { item: NpcSheet; data: RulebookData; action: (payload: Record<string, unknown>) => Promise<unknown> }) {
  const [draft, setDraft] = useState(item); const [statsText, setStatsText] = useState(rowsToText(item.stats)); const [notesText, setNotesText] = useState(item.notes.join("\n"));
  const template = (data.templates ?? []).find((entry) => entry.id === draft.meta?.templateId); const categories = (data.systemConfig?.sheetCategories?.filter((category) => category !== "players") ?? fallbackCategories) as SheetCategory[];
  const payload = useMemo<NpcSheet>(() => ({ ...draft, stats: textToRows(statsText), notes: notesText.split("\n").map((line) => line.trim()).filter(Boolean) }), [draft, notesText, statsText]);
  function patchMeta(patch: Partial<ContentMeta>) { setDraft({ ...draft, meta: { ...draft.meta, ...patch } }); }
  async function save(next: NpcSheet) { await action({ action: "upsert-npc", tableId: data.activeTableId, systemId: data.activeSystemId, item: next }); }
  const autosave = useDebouncedAutosave(payload, save, 1100);
  const resourceOptions = textToRows(statsText).map((row) => row.label);
  return <EditorShell title={draft.name} subtitle={`${draft.category} • ${draft.role}`} meta={draft.meta} autosave={autosave} onFavorite={() => patchMeta({ favorite: !draft.meta?.favorite })} onVisibility={() => patchMeta({ visibility: draft.meta?.visibility === "players" ? "master" : "players" })} onDelete={async () => { if (typedConfirm(draft.name)) await action({ action: "delete-npc", tableId: data.activeTableId, id: draft.id, name: draft.name }); }} onSave={() => void save(payload)}>
    <MediaField meta={draft.meta} onChange={patchMeta} />
    <div className="grid gap-3 md:grid-cols-2"><Field label="Nome" value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} /><Field label="Função" value={draft.role} onChange={(value) => setDraft({ ...draft, role: value })} /><label className="form-label">Categoria<select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as SheetCategory })} className="field mt-2">{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label><label className="form-label">Template<input disabled value={template?.name ?? "Sem template"} className="field mt-2 opacity-70" /></label></div>
    <Area label="Descrição" value={draft.description} onChange={(value) => setDraft({ ...draft, description: value })} rows={5} />{template && <CustomFields template={template} meta={draft.meta} onChange={(customFields) => patchMeta({ customFields })} />}
    <Area label="Status e recursos — Nome: Valor" value={statsText} onChange={setStatsText} rows={12} /><AbilityEditor abilities={draft.abilities ?? []} resourceOptions={resourceOptions} onChange={(abilities) => setDraft({ ...draft, abilities })} /><Area label="Notas, tática, fraquezas e drops" value={notesText} onChange={setNotesText} rows={10} />
  </EditorShell>;
}

function MediaField({ meta, onChange }: { meta?: ContentMeta; onChange: (patch: Partial<ContentMeta>) => void }) {
  return <div className="grid gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 md:grid-cols-[180px_1fr]">{meta?.imageUrl ? <img src={meta.imageUrl} alt={meta.imageAlt ?? "Retrato"} referrerPolicy="no-referrer" className="h-44 w-full rounded-xl border border-zinc-800 bg-zinc-950 object-cover" /> : <div className="flex h-44 items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-950 text-zinc-700"><ImageIcon className="h-8 w-8" /></div>}<div><p className="font-semibold text-zinc-200">Imagem externa</p><p className="mt-1 text-xs leading-5 text-zinc-500">Cole uma URL direta de imagem. Funciona com hospedagens de terceiros como Imgur; para Imgur prefira links como https://i.imgur.com/arquivo.png.</p><Field label="URL da imagem" value={meta?.imageUrl ?? ""} onChange={(imageUrl) => onChange({ imageUrl })} /><Field label="Texto alternativo" value={meta?.imageAlt ?? ""} onChange={(imageAlt) => onChange({ imageAlt })} /></div></div>;
}

function EditorShell({ title, subtitle, meta, autosave, onFavorite, onVisibility, onDelete, onSave, children }: { title: string; subtitle: string; meta?: ContentMeta; autosave: AutosaveState; onFavorite: () => void; onVisibility: () => void; onDelete: () => void; onSave: () => void; children: React.ReactNode }) {
  const autosaveText = autosave === "dirty" ? "● Alterações não salvas" : autosave === "saving" ? "Salvando..." : autosave === "error" ? "Erro no autosave" : "✓ Salvo automaticamente";
  return <div className="item-editor-scope mx-auto max-w-5xl space-y-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.2em] text-amber-400">Ficha da mesa</p><h2 className="mt-1 text-2xl font-bold text-zinc-100">{title}</h2><p className="text-sm text-zinc-500">{subtitle}</p></div><div className="flex gap-2"><button onClick={onFavorite} className="icon-button"><Star className={`h-4 w-4 ${meta?.favorite ? "fill-amber-300 text-amber-300" : ""}`} /></button><button onClick={onVisibility} className="icon-button">{meta?.visibility === "players" ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button><button onClick={onDelete} className="icon-button text-red-300"><Trash2 className="h-4 w-4" /></button></div></div>{children}<div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-xs text-zinc-500"><span>{autosaveText} • {meta?.visibility === "players" ? "visível aos jogadores" : "somente mestre"}</span><button onClick={onSave} className="secondary-button"><Save className="h-3.5 w-3.5" />Salvar agora</button></div></div>;
}

function CustomFields({ template, meta, onChange }: { template: SheetTemplate; meta?: ContentMeta; onChange: (values: Record<string, unknown>) => void }) {
  const values = meta?.customFields ?? {}; const fields = template.fields.filter((field) => !["name", "tier", "status", "attributes", "resources", "abilities"].includes(field.id)); if (!fields.length) return null;
  return <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"><p className="mb-3 text-sm font-semibold text-amber-300">Campos do template — {template.name}</p><div className="grid gap-3 md:grid-cols-2">{fields.map((field) => <Field key={field.id} label={field.label} value={String(values[field.id] ?? field.defaultValue ?? "")} onChange={(value) => onChange({ ...values, [field.id]: value })} />)}</div></div>;
}

function AbilityEditor({ abilities, resourceOptions, onChange }: { abilities: StructuredAbility[]; resourceOptions: string[]; onChange: (abilities: StructuredAbility[]) => void }) {
  function patch(index: number, patchData: Partial<StructuredAbility>) { onChange(abilities.map((ability, currentIndex) => currentIndex === index ? { ...ability, ...patchData } : ability)); }
  return <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"><div className="flex items-center justify-between"><div><p className="font-semibold text-amber-300">Habilidades estruturadas e macros</p><p className="text-xs text-zinc-500">Configure rolagem, custo de recurso, cooldown e gatilho automático.</p></div><button onClick={() => onChange([...abilities, { id: `ability-${Date.now()}`, name: "Nova habilidade", type: "Ativa", effect: "", trigger: "manual" }])} className="secondary-button"><Plus className="h-3.5 w-3.5" />Adicionar</button></div><div className="mt-4 space-y-4">{abilities.map((ability, index) => <div key={ability.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-4"><div className="grid gap-3 md:grid-cols-3"><Field label="Nome" value={ability.name} onChange={(value) => patch(index, { name: value })} /><Field label="Tipo" value={ability.type} onChange={(value) => patch(index, { type: value })} /><Field label="Escala" value={ability.scale ?? ""} onChange={(value) => patch(index, { scale: value })} /><Field label="Custo textual" value={ability.cost ?? ""} onChange={(value) => patch(index, { cost: value })} /><Field label="Teste" value={ability.test ?? ""} onChange={(value) => patch(index, { test: value })} /><Field label="Dano" value={ability.damage ?? ""} onChange={(value) => patch(index, { damage: value })} /><Field label="Expressão de rolagem" value={ability.rollExpression ?? ""} onChange={(value) => patch(index, { rollExpression: value })} /><Field label="Alcance" value={ability.range ?? ""} onChange={(value) => patch(index, { range: value })} /><Field label="Duração" value={ability.duration ?? ""} onChange={(value) => patch(index, { duration: value })} /><Field label="Recarga" value={ability.cooldown ?? ""} onChange={(value) => patch(index, { cooldown: value })} /><label className="form-label">Recurso<select value={ability.resourceName ?? ""} onChange={(event) => patch(index, { resourceName: event.target.value || undefined })} className="field mt-2"><option value="">Nenhum</option>{resourceOptions.map((resource) => <option key={resource} value={resource}>{resource}</option>)}</select></label><label className="form-label">Custo numérico<input type="number" value={ability.resourceCost ?? 0} onChange={(event) => patch(index, { resourceCost: Number(event.target.value) || 0 })} className="field mt-2" /></label><label className="form-label">Gatilho<select value={ability.trigger ?? "manual"} onChange={(event) => patch(index, { trigger: event.target.value as StructuredAbility["trigger"] })} className="field mt-2"><option value="manual">Manual</option><option value="hp-half">HP ≤ 50%</option><option value="hp-quarter">HP ≤ 25%</option><option value="round-start">Início da rodada</option><option value="round-end">Fim da rodada</option></select></label></div><Area label="Efeito" value={ability.effect} onChange={(value) => patch(index, { effect: value })} rows={3} /><Area label="Limitação" value={ability.limitation ?? ""} onChange={(value) => patch(index, { limitation: value })} rows={2} /><button onClick={() => onChange(abilities.filter((_, currentIndex) => currentIndex !== index))} className="mt-3 inline-flex items-center gap-2 text-xs text-red-300"><Trash2 className="h-3.5 w-3.5" />Remover habilidade</button></div>)}</div></div>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="form-label">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="field mt-2" /></label>; }
function Area({ label, value, onChange, rows }: { label: string; value: string; onChange: (value: string) => void; rows: number }) { return <label className="form-label block">{label}<textarea value={value} onChange={(event) => onChange(event.target.value)} rows={rows} className="field mt-2" /></label>; }
function Empty() { return <div className="flex h-full items-center justify-center text-sm text-zinc-500">Crie ou selecione uma ficha.</div>; }
