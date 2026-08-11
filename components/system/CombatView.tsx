"use client";

import { ChevronRight, Dices, Heart, Plus, RotateCcw, Shield, Swords, Trash2, Zap } from "lucide-react";
import { useMemo, useState } from "react";

import type { CombatParticipant, CombatState, LabeledValue, NpcSheet, PlayerSheet, RulebookData, StructuredAbility, TimedCondition } from "@/types/rulebook";

function numberFromRows(rows: LabeledValue[], labels: string[], fallback = 0) {
  const row = rows.find((item) => labels.some((label) => item.label.toLowerCase() === label.toLowerCase()));
  const match = row?.value.match(/-?\d+/); return match ? Number(match[0]) : fallback;
}

function participantFromPlayer(player: PlayerSheet): CombatParticipant {
  const hp = numberFromRows(player.status, ["HP", "PV", "Vida"], 1);
  const ac = numberFromRows([...player.status, ...player.resources], ["CA", "AC", "Defesa"], 0);
  return { id: `combat-player-${player.id}-${Date.now()}`, sourceType: "player", sourceId: player.id, name: player.characterName, initiative: 0, hpCurrent: hp, hpMax: hp, armorClass: ac || undefined, conditions: [], timedConditions: [], resources: player.resources.map((row) => ({ ...row })), abilities: (player.structuredAbilities ?? []).map((ability) => ({ ...ability, currentCooldown: 0 })), imageUrl: player.meta?.imageUrl };
}

function participantFromNpc(npc: NpcSheet, configuredResources: string[]): CombatParticipant {
  const hp = numberFromRows(npc.stats, ["HP", "PV", "Vida"], 1); const ac = numberFromRows(npc.stats, ["CA", "AC", "Defesa"], 0);
  const resourceNames = new Set(configuredResources.map((item) => item.toLowerCase()));
  const resources = npc.stats.filter((row) => resourceNames.has(row.label.toLowerCase()) || ["energia", "postura", "mana", "ki", "fúria", "marcas"].some((name) => row.label.toLowerCase().includes(name))).map((row) => ({ ...row }));
  return { id: `combat-npc-${npc.id}-${Date.now()}`, sourceType: "npc", sourceId: npc.id, name: npc.name, initiative: 0, hpCurrent: hp, hpMax: hp, armorClass: ac || undefined, conditions: [], timedConditions: [], resources, abilities: (npc.abilities ?? []).map((ability) => ({ ...ability, currentCooldown: 0 })), hidden: true, imageUrl: npc.meta?.imageUrl };
}

function rollExpression(expression: string) {
  const normalized = expression.replace(/\s+/g, "").toLowerCase();
  const match = normalized.match(/^(\d*)d(\d+)([+-]\d+)?$/);
  if (!match) return undefined;
  const count = Math.max(1, Math.min(100, Number(match[1] || 1))); const sides = Math.max(2, Math.min(1000, Number(match[2]))); const mod = Number(match[3] || 0);
  const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1); const total = rolls.reduce((sum, value) => sum + value, 0) + mod;
  return { total, details: `${expression} = ${total} [${rolls.join(", ")}]${mod ? ` ${mod > 0 ? "+" : ""}${mod}` : ""}` };
}

function numericValue(value: string) { const match = value.match(/-?\d+/); return match ? Number(match[0]) : 0; }
function replaceFirstNumber(value: string, next: number) { return /-?\d+/.test(value) ? value.replace(/-?\d+/, String(next)) : String(next); }

export function CombatView({ data, action }: { data: RulebookData; action: (payload: Record<string, unknown>, options?: { silent?: boolean }) => Promise<unknown> }) {
  const combats = data.combats ?? []; const [selectedId, setSelectedId] = useState(combats.find((item) => item.status === "active")?.id ?? combats[0]?.id ?? ""); const selected = combats.find((item) => item.id === selectedId);
  async function createCombat() { const combat: CombatState = { id: `combat-${Date.now()}`, tableId: data.activeTableId, name: `Combate ${combats.length + 1}`, round: 1, turnIndex: 0, status: "prepared", participants: [], notes: [] }; await action({ action: "save-combat", tableId: data.activeTableId, item: combat, name: combat.name }); setSelectedId(combat.id); }
  return <div className="grid h-full grid-cols-[280px_1fr] overflow-hidden"><aside className="overflow-y-auto border-r border-zinc-800 bg-zinc-900/60 p-4"><div className="flex items-center justify-between"><div><p className="flex items-center gap-2 font-semibold text-zinc-200"><Swords className="h-4 w-4 text-amber-400" />Combates</p><p className="text-xs text-zinc-500">Tracker, macros e automações</p></div><button onClick={() => void createCombat()} className="icon-button"><Plus className="h-4 w-4" /></button></div><div className="mt-4 space-y-2">{combats.map((combat) => <button key={combat.id} onClick={() => setSelectedId(combat.id)} className={`w-full rounded-lg border p-3 text-left ${selected?.id === combat.id ? "border-amber-500/50 bg-amber-500/10" : "border-zinc-800 bg-zinc-950"}`}><p className="font-medium text-zinc-200">{combat.name}</p><p className="mt-1 text-xs text-zinc-500">{combat.status} • rodada {combat.round} • {combat.participants.length} participantes</p></button>)}</div></aside><section className="overflow-y-auto p-5">{selected ? <CombatTracker key={selected.id} combat={selected} data={data} action={action} /> : <div className="flex h-full items-center justify-center text-sm text-zinc-500">Crie um combate para começar.</div>}</section></div>;
}

function CombatTracker({ combat, data, action }: { combat: CombatState; data: RulebookData; action: (payload: Record<string, unknown>, options?: { silent?: boolean }) => Promise<unknown> }) {
  const [draft, setDraft] = useState(combat); const [source, setSource] = useState(""); const [condition, setCondition] = useState(""); const [conditionRounds, setConditionRounds] = useState(2); const [macroResult, setMacroResult] = useState("");
  const current = draft.participants[draft.turnIndex]; const conditionSuggestions = data.systemConfig?.conditions ?? [];
  const sortedSources = useMemo(() => [...data.players.map((player) => ({ value: `player:${player.id}`, label: `Player — ${player.characterName}` })), ...data.npcs.map((npc) => ({ value: `npc:${npc.id}`, label: `NPC — ${npc.name}` }))], [data.players, data.npcs]);

  async function persist(next: CombatState, message?: string) { setDraft(next); await action({ action: "save-combat", tableId: data.activeTableId, item: next, name: next.name }, { silent: true }); if (message) await action({ action: "manual-log", tableId: data.activeTableId, message }, { silent: true }); }

  function addSource() {
    const [type, id] = source.split(":"); let participant: CombatParticipant | undefined;
    if (type === "player") { const player = data.players.find((item) => item.id === id); if (player) participant = participantFromPlayer(player); }
    else if (type === "npc") { const npc = data.npcs.find((item) => item.id === id); if (npc) participant = participantFromNpc(npc, data.systemConfig?.resources ?? []); }
    if (participant) void persist({ ...draft, participants: [...draft.participants, participant] }, `${participant.name} entrou no combate ${draft.name}.`); setSource("");
  }

  function phaseAndTriggers(participant: CombatParticipant, previousHp: number) {
    const ratio = participant.hpMax > 0 ? participant.hpCurrent / participant.hpMax : 1; const previousRatio = participant.hpMax > 0 ? previousHp / participant.hpMax : 1;
    const triggered: string[] = [];
    for (const ability of participant.abilities) {
      if (ability.trigger === "hp-half" && previousRatio > 0.5 && ratio <= 0.5) triggered.push(ability.name);
      if (ability.trigger === "hp-quarter" && previousRatio > 0.25 && ratio <= 0.25) triggered.push(ability.name);
    }
    const phase = ratio <= 0.25 ? "Fase crítica" : ratio <= 0.5 ? "Fase 2" : participant.phase;
    if (triggered.length) void action({ action: "manual-log", tableId: data.activeTableId, message: `${participant.name}: gatilho automático — ${triggered.join(", ")}.` }, { silent: true });
    return { ...participant, phase };
  }

  function patchParticipant(index: number, patch: Partial<CombatParticipant>) {
    const previous = draft.participants[index]; let nextParticipant = { ...previous, ...patch };
    if (patch.hpCurrent !== undefined) nextParticipant = phaseAndTriggers(nextParticipant, previous.hpCurrent);
    void persist({ ...draft, participants: draft.participants.map((participant, currentIndex) => currentIndex === index ? nextParticipant : participant) });
  }

  function patchResource(participantIndex: number, resourceIndex: number, value: string) { const participant = draft.participants[participantIndex]; patchParticipant(participantIndex, { resources: participant.resources.map((resource, index) => index === resourceIndex ? { ...resource, value } : resource) }); }

  function tickTimedConditions(participant: CombatParticipant) {
    const nextTimed = (participant.timedConditions ?? []).map((item) => item.remainingRounds === undefined ? item : { ...item, remainingRounds: item.remainingRounds - 1 }).filter((item) => item.remainingRounds === undefined || item.remainingRounds > 0);
    return { ...participant, timedConditions: nextTimed, conditions: [...new Set([...participant.conditions.filter((name) => nextTimed.some((item) => item.name === name) || !(participant.timedConditions ?? []).some((item) => item.name === name)), ...nextTimed.map((item) => item.name)])] };
  }

  function nextTurn() {
    if (!draft.participants.length) return;
    const wraps = draft.turnIndex >= draft.participants.length - 1;
    let participants = draft.participants;
    if (wraps) participants = participants.map((participant) => ({ ...tickTimedConditions(participant), abilities: participant.abilities.map((ability) => ({ ...ability, currentCooldown: Math.max(0, (ability.currentCooldown ?? 0) - 1) })) }));
    const nextRound = wraps ? draft.round + 1 : draft.round; const nextIndex = wraps ? 0 : draft.turnIndex + 1;
    const nextCurrent = participants[nextIndex];
    if (wraps) {
      const triggers = participants.flatMap((participant) => participant.abilities.filter((ability) => ability.trigger === "round-start").map((ability) => `${participant.name}: ${ability.name}`));
      if (triggers.length) void action({ action: "manual-log", tableId: data.activeTableId, message: `Início da rodada ${nextRound}: ${triggers.join(" | ")}` }, { silent: true });
    }
    void persist({ ...draft, status: "active", participants, turnIndex: nextIndex, round: nextRound }, `Turno: ${nextCurrent?.name ?? "—"} • rodada ${nextRound}.`);
  }

  function useAbility(participantIndex: number, abilityIndex: number) {
    const participant = draft.participants[participantIndex]; const ability = participant.abilities[abilityIndex];
    if ((ability.currentCooldown ?? 0) > 0 || ability.uses === 0) return;
    const cooldown = Number(ability.cooldown?.match(/\d+/)?.[0] ?? 0);
    let resources = participant.resources;
    if (ability.resourceName && ability.resourceCost) {
      const resourceIndex = resources.findIndex((item) => item.label.toLowerCase() === ability.resourceName?.toLowerCase());
      if (resourceIndex >= 0) {
        const currentValue = numericValue(resources[resourceIndex].value); if (currentValue < ability.resourceCost) { setMacroResult(`Recurso insuficiente: ${ability.resourceName}.`); return; }
        resources = resources.map((item, index) => index === resourceIndex ? { ...item, value: replaceFirstNumber(item.value, currentValue - (ability.resourceCost ?? 0)) } : item);
      }
    }
    const expression = ability.rollExpression || ability.damage?.match(/\d+d\d+(?:\s*[+-]\s*\d+)?/)?.[0] || ""; const result = expression ? rollExpression(expression) : undefined;
    const abilities = participant.abilities.map((item, index) => index === abilityIndex ? { ...item, currentCooldown: cooldown, uses: item.uses !== undefined ? Math.max(0, item.uses - 1) : item.uses } : item);
    const message = `${participant.name} usou ${ability.name}${result ? ` — ${result.details}` : ""}.`;
    setMacroResult(message); patchParticipant(participantIndex, { abilities, resources }); void action({ action: "manual-log", tableId: data.activeTableId, message }, { silent: true });
  }

  function addTimedCondition(index: number) {
    if (!condition.trim()) return; const participant = draft.participants[index]; const timed: TimedCondition = { id: `condition-${Date.now()}`, name: condition.trim(), remainingRounds: Math.max(1, conditionRounds), tick: "end" };
    patchParticipant(index, { conditions: [...new Set([...participant.conditions, timed.name])], timedConditions: [...(participant.timedConditions ?? []), timed] }); setCondition("");
  }

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4"><div><p className="text-xs uppercase tracking-[0.2em] text-amber-400">Modo combate</p><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} onBlur={() => void persist(draft)} className="mt-1 bg-transparent text-2xl font-bold text-zinc-100 outline-none" /><p className="text-sm text-zinc-500">Rodada {draft.round} • Turno: {current?.name ?? "—"}</p></div><div className="flex flex-wrap gap-2"><button onClick={() => void persist({ ...draft, participants: [...draft.participants].sort((a, b) => b.initiative - a.initiative), turnIndex: 0 })} className="secondary-button">Ordenar iniciativa</button><button onClick={nextTurn} className="primary-button"><ChevronRight className="h-4 w-4" />Próximo turno</button><button onClick={() => { if (prompt(`Digite RESET para reiniciar ${draft.name}:`) === "RESET") void persist({ ...draft, round: 1, turnIndex: 0, status: "prepared", participants: draft.participants.map((participant) => ({ ...participant, conditions: [], timedConditions: [], phase: undefined, hpCurrent: participant.hpMax, abilities: participant.abilities.map((ability) => ({ ...ability, currentCooldown: 0 })) })) }); }} className="secondary-button"><RotateCcw className="h-4 w-4" />Reset</button><button onClick={async () => { if (prompt(`Para excluir ${draft.name}, digite o nome exatamente:`) === draft.name) await action({ action: "delete-combat", tableId: data.activeTableId, id: draft.id, name: draft.name }); }} className="icon-button text-red-300"><Trash2 className="h-4 w-4" /></button></div></div>
    {macroResult && <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200"><Dices className="mr-2 inline h-4 w-4" />{macroResult}</div>}
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"><div className="flex flex-wrap gap-2"><select value={source} onChange={(event) => setSource(event.target.value)} className="field max-w-md"><option value="">Adicionar participante da mesa...</option>{sortedSources.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><button onClick={addSource} disabled={!source} className="secondary-button"><Plus className="h-4 w-4" />Adicionar</button><button onClick={() => void persist({ ...draft, participants: [...draft.participants, { id: `custom-${Date.now()}`, sourceType: "custom", name: "Participante", initiative: 0, hpCurrent: 1, hpMax: 1, conditions: [], timedConditions: [], resources: [], abilities: [] }] })} className="secondary-button">+ Custom</button></div></div>
    <div className="space-y-3">{draft.participants.map((participant, index) => { const active = index === draft.turnIndex; const hpPercent = participant.hpMax ? Math.max(0, Math.min(100, participant.hpCurrent / participant.hpMax * 100)) : 0; return <div key={participant.id} className={`rounded-xl border p-4 ${active ? "border-amber-500/60 bg-amber-500/10" : "border-zinc-800 bg-zinc-900/60"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex min-w-[240px] flex-1 gap-3">{participant.imageUrl ? <img src={participant.imageUrl} alt="" referrerPolicy="no-referrer" className="h-14 w-14 rounded-lg object-cover" /> : null}<div className="flex-1"><div className="flex items-center gap-2"><input value={participant.name} onChange={(event) => patchParticipant(index, { name: event.target.value })} className="bg-transparent text-lg font-semibold text-zinc-100 outline-none" />{active && <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-zinc-950">TURNO</span>}{participant.phase && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-300">{participant.phase}</span>}</div><div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-500"><label>Iniciativa <input type="number" value={participant.initiative} onChange={(event) => patchParticipant(index, { initiative: Number(event.target.value) })} className="ml-1 w-16 rounded border border-zinc-800 bg-zinc-950 px-2 py-1" /></label>{participant.armorClass !== undefined && <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" />CA {participant.armorClass}</span>}<label className="flex items-center gap-1"><input type="checkbox" checked={Boolean(participant.hidden)} onChange={(event) => patchParticipant(index, { hidden: event.target.checked })} />Oculto</label></div></div></div><button onClick={() => void persist({ ...draft, participants: draft.participants.filter((_, currentIndex) => currentIndex !== index), turnIndex: Math.min(draft.turnIndex, Math.max(0, draft.participants.length - 2)) })} className="icon-button text-red-300"><Trash2 className="h-4 w-4" /></button></div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800"><div className="h-full bg-red-500 transition-all" style={{ width: `${hpPercent}%` }} /></div>
      <div className="mt-4 grid gap-3 xl:grid-cols-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3"><p className="flex items-center gap-2 text-xs uppercase text-zinc-500"><Heart className="h-3.5 w-3.5 text-red-400" />HP</p><div className="mt-2 flex flex-wrap items-center gap-2"><button onClick={() => patchParticipant(index, { hpCurrent: Math.max(0, participant.hpCurrent - 5) })} className="mini-combat">-5</button><button onClick={() => patchParticipant(index, { hpCurrent: Math.max(0, participant.hpCurrent - 1) })} className="mini-combat">-1</button><input type="number" value={participant.hpCurrent} onChange={(event) => patchParticipant(index, { hpCurrent: Number(event.target.value) })} className="w-16 rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-center font-bold" /><span className="text-zinc-600">/ {participant.hpMax}</span><button onClick={() => patchParticipant(index, { hpCurrent: Math.min(participant.hpMax, participant.hpCurrent + 1) })} className="mini-combat">+1</button><button onClick={() => patchParticipant(index, { hpCurrent: Math.min(participant.hpMax, participant.hpCurrent + 5) })} className="mini-combat">+5</button></div></div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3"><p className="text-xs uppercase text-zinc-500">Condições temporizadas</p><div className="mt-2 flex gap-1"><input list={`conditions-${participant.id}`} value={active ? condition : ""} onChange={(event) => active && setCondition(event.target.value)} disabled={!active} placeholder="Sangrando" className="field py-1" /><datalist id={`conditions-${participant.id}`}>{conditionSuggestions.map((item) => <option key={item} value={item} />)}</datalist><input type="number" min={1} value={conditionRounds} onChange={(event) => setConditionRounds(Number(event.target.value) || 1)} className="w-14 rounded border border-zinc-800 bg-zinc-900 px-1 text-xs" /><button onClick={() => addTimedCondition(index)} disabled={!active} className="mini-combat">+</button></div><div className="mt-2 flex flex-wrap gap-1">{(participant.timedConditions ?? []).map((item) => <button key={item.id} onClick={() => patchParticipant(index, { timedConditions: (participant.timedConditions ?? []).filter((conditionItem) => conditionItem.id !== item.id), conditions: participant.conditions.filter((name) => name !== item.name) })} className="rounded-full bg-red-500/10 px-2 py-1 text-xs text-red-300">{item.name} • {item.remainingRounds ?? "∞"}r ×</button>)}</div></div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3"><p className="text-xs uppercase text-zinc-500">Recursos personalizados</p><div className="mt-2 space-y-2">{participant.resources.length === 0 ? <button onClick={() => patchParticipant(index, { resources: [{ label: "Recurso", value: "0" }] })} className="mini-combat">+ recurso</button> : participant.resources.map((resource, resourceIndex) => <div key={`${resource.label}-${resourceIndex}`} className="flex items-center gap-2"><input value={resource.label} onChange={(event) => patchParticipant(index, { resources: participant.resources.map((item, currentIndex) => currentIndex === resourceIndex ? { ...item, label: event.target.value } : item) })} className="min-w-0 flex-1 rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-300" /><button onClick={() => patchResource(index, resourceIndex, replaceFirstNumber(resource.value, numericValue(resource.value) - 1))} className="mini-combat">-</button><input value={resource.value} onChange={(event) => patchResource(index, resourceIndex, event.target.value)} className="w-20 rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-right text-xs" /><button onClick={() => patchResource(index, resourceIndex, replaceFirstNumber(resource.value, numericValue(resource.value) + 1))} className="mini-combat">+</button></div>)}</div><button onClick={() => patchParticipant(index, { resources: [...participant.resources, { label: "Novo recurso", value: "0" }] })} className="mt-2 text-xs text-amber-300">+ adicionar recurso</button></div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3"><p className="flex items-center gap-2 text-xs uppercase text-zinc-500"><Zap className="h-3.5 w-3.5 text-amber-400" />Macros</p><div className="mt-2 space-y-2">{participant.abilities.length === 0 ? <p className="text-xs text-zinc-600">Sem habilidades estruturadas.</p> : participant.abilities.map((ability, abilityIndex) => { const blocked = (ability.currentCooldown ?? 0) > 0 || ability.uses === 0; const triggerReady = (ability.trigger === "hp-half" && participant.hpCurrent <= participant.hpMax / 2) || (ability.trigger === "hp-quarter" && participant.hpCurrent <= participant.hpMax / 4); return <button key={ability.id} disabled={blocked} onClick={() => useAbility(index, abilityIndex)} className={`w-full rounded-lg border p-2 text-left text-xs ${triggerReady ? "border-red-500/50 bg-red-500/10" : "border-zinc-800 bg-zinc-900 hover:border-amber-500/40"}`}><div className="flex items-center justify-between"><span className="font-semibold text-zinc-200">{ability.name}</span><span className="text-zinc-500">{ability.currentCooldown ? `${ability.currentCooldown}r` : "usar"}</span></div><p className="mt-1 text-zinc-500">{ability.rollExpression || ability.damage || ability.effect}</p>{ability.resourceName && <p className="mt-1 text-amber-400">Custo: {ability.resourceCost ?? 0} {ability.resourceName}</p>}</button>; })}</div></div>
      </div>
    </div>; })}</div>
  </div>;
}
