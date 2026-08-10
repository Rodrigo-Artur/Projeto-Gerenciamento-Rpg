"use client";

import { ChevronRight, Heart, Plus, RotateCcw, Shield, Swords, Trash2, Zap } from "lucide-react";
import { useMemo, useState } from "react";

import type { CombatParticipant, CombatState, LabeledValue, NpcSheet, PlayerSheet, RulebookData, StructuredAbility } from "@/types/rulebook";

function numberFromRows(rows: LabeledValue[], labels: string[], fallback = 0) {
  const row = rows.find((item) => labels.some((label) => item.label.toLowerCase() === label.toLowerCase()));
  const match = row?.value.match(/-?\d+/);
  return match ? Number(match[0]) : fallback;
}

function participantFromPlayer(player: PlayerSheet): CombatParticipant {
  const hp = numberFromRows(player.status, ["HP", "PV", "Vida"], 1);
  const ac = numberFromRows([...player.status, ...player.resources], ["CA", "AC", "Defesa"], 0);
  return {
    id: `combat-player-${player.id}-${Date.now()}`,
    sourceType: "player",
    sourceId: player.id,
    name: player.characterName,
    initiative: 0,
    hpCurrent: hp,
    hpMax: hp,
    armorClass: ac || undefined,
    conditions: [],
    resources: player.resources,
    abilities: player.structuredAbilities ?? [],
  };
}

function participantFromNpc(npc: NpcSheet): CombatParticipant {
  const hp = numberFromRows(npc.stats, ["HP", "PV", "Vida"], 1);
  const ac = numberFromRows(npc.stats, ["CA", "AC", "Defesa"], 0);
  return {
    id: `combat-npc-${npc.id}-${Date.now()}`,
    sourceType: "npc",
    sourceId: npc.id,
    name: npc.name,
    initiative: 0,
    hpCurrent: hp,
    hpMax: hp,
    armorClass: ac || undefined,
    conditions: [],
    resources: [],
    abilities: npc.abilities ?? [],
    hidden: true,
  };
}

export function CombatView({ data, action }: { data: RulebookData; action: (payload: Record<string, unknown>, options?: { silent?: boolean }) => Promise<unknown> }) {
  const combats = data.combats ?? [];
  const [selectedId, setSelectedId] = useState(combats.find((item) => item.status === "active")?.id ?? combats[0]?.id ?? "");
  const selected = combats.find((item) => item.id === selectedId);

  async function createCombat() {
    const combat: CombatState = {
      id: `combat-${Date.now()}`,
      tableId: data.activeTableId,
      name: `Combate ${combats.length + 1}`,
      round: 1,
      turnIndex: 0,
      status: "prepared",
      participants: [],
      notes: [],
    };
    await action({ action: "save-combat", tableId: data.activeTableId, item: combat });
    setSelectedId(combat.id);
  }

  return (
    <div className="grid h-full grid-cols-[280px_1fr] overflow-hidden">
      <aside className="overflow-y-auto border-r border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex items-center justify-between"><div><p className="flex items-center gap-2 font-semibold text-zinc-200"><Swords className="h-4 w-4 text-amber-400" />Combates</p><p className="text-xs text-zinc-500">Tracker da mesa</p></div><button onClick={() => void createCombat()} className="icon-button"><Plus className="h-4 w-4" /></button></div>
        <div className="mt-4 space-y-2">{combats.map((combat) => <button key={combat.id} onClick={() => setSelectedId(combat.id)} className={`w-full rounded-lg border p-3 text-left ${selected?.id === combat.id ? "border-amber-500/50 bg-amber-500/10" : "border-zinc-800 bg-zinc-950"}`}><p className="font-medium text-zinc-200">{combat.name}</p><p className="mt-1 text-xs text-zinc-500">{combat.status} • rodada {combat.round} • {combat.participants.length} participantes</p></button>)}</div>
      </aside>
      <section className="overflow-y-auto p-5">{selected ? <CombatTracker key={selected.id} combat={selected} data={data} action={action} /> : <div className="flex h-full items-center justify-center text-sm text-zinc-500">Crie um combate para começar.</div>}</section>
    </div>
  );
}

function CombatTracker({ combat, data, action }: { combat: CombatState; data: RulebookData; action: (payload: Record<string, unknown>, options?: { silent?: boolean }) => Promise<unknown> }) {
  const [draft, setDraft] = useState(combat);
  const [source, setSource] = useState("");
  const [condition, setCondition] = useState("");
  const current = draft.participants[draft.turnIndex];
  const conditionSuggestions = data.systemConfig?.conditions ?? [];
  const sortedSources = useMemo(() => [
    ...data.players.map((player) => ({ value: `player:${player.id}`, label: `Player — ${player.characterName}` })),
    ...data.npcs.map((npc) => ({ value: `npc:${npc.id}`, label: `NPC — ${npc.name}` })),
  ], [data.players, data.npcs]);

  async function persist(next: CombatState) {
    setDraft(next);
    await action({ action: "save-combat", tableId: data.activeTableId, item: next }, { silent: true });
  }

  function addSource() {
    const [type, id] = source.split(":");
    let participant: CombatParticipant | undefined;
    if (type === "player") {
      const player = data.players.find((item) => item.id === id);
      if (player) participant = participantFromPlayer(player);
    } else if (type === "npc") {
      const npc = data.npcs.find((item) => item.id === id);
      if (npc) participant = participantFromNpc(npc);
    }
    if (participant) void persist({ ...draft, participants: [...draft.participants, participant] });
    setSource("");
  }

  function patchParticipant(index: number, patch: Partial<CombatParticipant>) {
    void persist({ ...draft, participants: draft.participants.map((participant, currentIndex) => currentIndex === index ? { ...participant, ...patch } : participant) });
  }

  function patchResource(participantIndex: number, resourceIndex: number, value: string) {
    const participant = draft.participants[participantIndex];
    patchParticipant(participantIndex, {
      resources: participant.resources.map((resource, index) => index === resourceIndex ? { ...resource, value } : resource),
    });
  }

  function nextTurn() {
    if (draft.participants.length === 0) return;
    const wraps = draft.turnIndex >= draft.participants.length - 1;
    const participants = wraps ? draft.participants.map((participant) => ({
      ...participant,
      abilities: participant.abilities.map((ability) => ({ ...ability, currentCooldown: Math.max(0, (ability.currentCooldown ?? 0) - 1) })),
    })) : draft.participants;
    void persist({ ...draft, status: "active", participants, turnIndex: wraps ? 0 : draft.turnIndex + 1, round: wraps ? draft.round + 1 : draft.round });
  }

  function useAbility(participantIndex: number, abilityIndex: number) {
    const participant = draft.participants[participantIndex];
    const ability = participant.abilities[abilityIndex];
    const match = ability.cooldown?.match(/\d+/);
    const cooldown = match ? Number(match[0]) : 0;
    const abilities = participant.abilities.map((item, index) => index === abilityIndex ? {
      ...item,
      currentCooldown: cooldown,
      uses: item.uses !== undefined ? Math.max(0, item.uses - 1) : item.uses,
    } : item);
    patchParticipant(participantIndex, { abilities });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
        <div><p className="text-xs uppercase tracking-[0.2em] text-amber-400">Modo combate</p><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} onBlur={() => void persist(draft)} className="mt-1 bg-transparent text-2xl font-bold text-zinc-100 outline-none" /><p className="text-sm text-zinc-500">Rodada {draft.round} • Turno: {current?.name ?? "—"}</p></div>
        <div className="flex flex-wrap gap-2"><button onClick={() => void persist({ ...draft, participants: [...draft.participants].sort((a, b) => b.initiative - a.initiative), turnIndex: 0 })} className="secondary-button">Ordenar iniciativa</button><button onClick={nextTurn} className="primary-button"><ChevronRight className="h-4 w-4" />Próximo turno</button><button onClick={() => void persist({ ...draft, round: 1, turnIndex: 0, status: "prepared", participants: draft.participants.map((participant) => ({ ...participant, conditions: [], abilities: participant.abilities.map((ability) => ({ ...ability, currentCooldown: 0 })) })) })} className="secondary-button"><RotateCcw className="h-4 w-4" />Reset</button><button onClick={async () => { if (confirm(`Excluir ${draft.name}?`)) await action({ action: "delete-combat", tableId: data.activeTableId, id: draft.id }); }} className="icon-button text-red-300"><Trash2 className="h-4 w-4" /></button></div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="flex flex-wrap gap-2"><select value={source} onChange={(event) => setSource(event.target.value)} className="field max-w-md"><option value="">Adicionar participante da mesa...</option>{sortedSources.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><button onClick={addSource} disabled={!source} className="secondary-button"><Plus className="h-4 w-4" />Adicionar</button><button onClick={() => void persist({ ...draft, participants: [...draft.participants, { id: `custom-${Date.now()}`, sourceType: "custom", name: "Participante", initiative: 0, hpCurrent: 1, hpMax: 1, conditions: [], resources: [], abilities: [] }] })} className="secondary-button">+ Custom</button></div>
      </div>

      <div className="space-y-3">
        {draft.participants.map((participant, index) => {
          const active = index === draft.turnIndex;
          return (
            <div key={participant.id} className={`rounded-xl border p-4 ${active ? "border-amber-500/60 bg-amber-500/10" : "border-zinc-800 bg-zinc-900/60"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-[220px] flex-1"><div className="flex items-center gap-2"><input value={participant.name} onChange={(event) => patchParticipant(index, { name: event.target.value })} className="bg-transparent text-lg font-semibold text-zinc-100 outline-none" />{active && <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-zinc-950">TURNO</span>}</div><div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-500"><label>Iniciativa <input type="number" value={participant.initiative} onChange={(event) => patchParticipant(index, { initiative: Number(event.target.value) })} className="ml-1 w-16 rounded border border-zinc-800 bg-zinc-950 px-2 py-1" /></label>{participant.armorClass !== undefined && <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" />CA {participant.armorClass}</span>}<label className="flex items-center gap-1"><input type="checkbox" checked={Boolean(participant.hidden)} onChange={(event) => patchParticipant(index, { hidden: event.target.checked })} />Oculto no modo jogador</label></div></div>
                <button onClick={() => void persist({ ...draft, participants: draft.participants.filter((_, currentIndex) => currentIndex !== index), turnIndex: Math.min(draft.turnIndex, Math.max(0, draft.participants.length - 2)) })} className="icon-button text-red-300"><Trash2 className="h-4 w-4" /></button>
              </div>

              <div className="mt-4 grid gap-3 xl:grid-cols-4">
                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3"><p className="flex items-center gap-2 text-xs uppercase text-zinc-500"><Heart className="h-3.5 w-3.5 text-red-400" />HP</p><div className="mt-2 flex flex-wrap items-center gap-2"><button onClick={() => patchParticipant(index, { hpCurrent: Math.max(0, participant.hpCurrent - 5) })} className="mini-combat">-5</button><button onClick={() => patchParticipant(index, { hpCurrent: Math.max(0, participant.hpCurrent - 1) })} className="mini-combat">-1</button><input type="number" value={participant.hpCurrent} onChange={(event) => patchParticipant(index, { hpCurrent: Number(event.target.value) })} className="w-16 rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-center font-bold" /><span className="text-zinc-600">/ {participant.hpMax}</span><button onClick={() => patchParticipant(index, { hpCurrent: Math.min(participant.hpMax, participant.hpCurrent + 1) })} className="mini-combat">+1</button><button onClick={() => patchParticipant(index, { hpCurrent: Math.min(participant.hpMax, participant.hpCurrent + 5) })} className="mini-combat">+5</button></div></div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3"><p className="text-xs uppercase text-zinc-500">Condições</p><div className="mt-2 flex gap-2"><input list={`conditions-${participant.id}`} value={active ? condition : ""} onChange={(event) => active && setCondition(event.target.value)} disabled={!active} placeholder="Ex.: Sangrando" className="field py-1" /><datalist id={`conditions-${participant.id}`}>{conditionSuggestions.map((item) => <option key={item} value={item} />)}</datalist><button onClick={() => { if (condition.trim()) { patchParticipant(index, { conditions: [...participant.conditions, condition.trim()] }); setCondition(""); } }} disabled={!active} className="mini-combat">+</button></div><div className="mt-2 flex flex-wrap gap-1">{participant.conditions.map((item) => <button key={item} onClick={() => patchParticipant(index, { conditions: participant.conditions.filter((conditionItem) => conditionItem !== item) })} className="rounded-full bg-red-500/10 px-2 py-1 text-xs text-red-300">{item} ×</button>)}</div></div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3"><p className="text-xs uppercase text-zinc-500">Recursos</p><div className="mt-2 space-y-2">{participant.resources.length === 0 ? <p className="text-xs text-zinc-600">Sem recursos rastreáveis.</p> : participant.resources.map((resource, resourceIndex) => <label key={`${resource.label}-${resourceIndex}`} className="flex items-center justify-between gap-2 text-xs text-zinc-400"><span>{resource.label}</span><input value={resource.value} onChange={(event) => patchResource(index, resourceIndex, event.target.value)} className="w-24 rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-right text-zinc-200" /></label>)}</div></div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3"><p className="flex items-center gap-2 text-xs uppercase text-zinc-500"><Zap className="h-3.5 w-3.5 text-amber-400" />Habilidades</p><div className="mt-2 grid gap-2">{participant.abilities.length === 0 ? <p className="text-xs text-zinc-600">Sem habilidades estruturadas.</p> : participant.abilities.map((ability, abilityIndex) => <AbilityButton key={ability.id} ability={ability} onUse={() => useAbility(index, abilityIndex)} />)}</div></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AbilityButton({ ability, onUse }: { ability: StructuredAbility; onUse: () => void }) {
  const unavailable = (ability.currentCooldown ?? 0) > 0 || (ability.uses !== undefined && ability.uses <= 0);
  return <button onClick={onUse} disabled={unavailable} title={ability.effect} className="rounded-md border border-zinc-800 bg-zinc-900 p-2 text-left text-xs disabled:opacity-40"><div className="flex items-center justify-between gap-2"><span className="font-medium text-zinc-200">{ability.name}</span>{(ability.currentCooldown ?? 0) > 0 && <span className="text-amber-300">CD {ability.currentCooldown}</span>}</div><p className="mt-1 line-clamp-2 text-zinc-500">{ability.damage || ability.effect}</p>{ability.uses !== undefined && <p className="mt-1 text-zinc-600">Usos: {ability.uses}/{ability.maxUses ?? "—"}</p>}</button>;
}
