"use client";

import { Camera, ClipboardList, Eye, EyeOff, FileText, Image as ImageIcon, Play, Plus, RotateCcw, Send, Square, Swords, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { Handout, RulebookData, SnapshotComparison } from "@/types/rulebook";

type Action = (payload: Record<string, unknown>, options?: { silent?: boolean }) => Promise<Record<string, unknown>>;

export function SessionCockpitView({
  data,
  action,
  onOpenCombat,
  onOpenContent,
  focusHandoutId,
}: {
  data: RulebookData;
  action: Action;
  onOpenCombat: () => void;
  onOpenContent: (type: string, id: string, name: string) => void;
  focusHandoutId?: string;
}) {
  const runtime = data.runtime;
  const [quickNotes, setQuickNotes] = useState((runtime?.quickNotes ?? []).join("\n"));
  const [manualLog, setManualLog] = useState("");
  const [summary, setSummary] = useState("");
  const [snapshotLabel, setSnapshotLabel] = useState("Snapshot manual");
  const [fromSnapshot, setFromSnapshot] = useState(data.sessionSnapshots?.[1]?.id ?? "");
  const [toSnapshot, setToSnapshot] = useState(data.sessionSnapshots?.[0]?.id ?? "");
  const [comparison, setComparison] = useState<SnapshotComparison>();
  const [handoutTitle, setHandoutTitle] = useState("");
  const [handoutContent, setHandoutContent] = useState("");
  const [handoutImage, setHandoutImage] = useState("");

  useEffect(() => {
    if (!focusHandoutId) return;
    document.getElementById(`mdm-handout-${focusHandoutId}`)?.scrollIntoView({ block: "center", behavior: "instant" });
  }, [focusHandoutId, data.activeTableId]);

  const activeSession = data.sessions.find((item) => item.id === runtime?.activeSessionId);
  const plannedSession = data.sessions.find((item) => item.status === "planned") ?? data.sessions[0];
  const activeCombat = (data.combats ?? []).find((item) => item.status === "active") ?? data.combats?.[0];
  const favorites = useMemo(() => [
    ...data.npcs.filter((item) => item.meta?.favorite).map((item) => ({ type: "npc", id: item.id, name: item.name, subtitle: item.role })),
    ...data.players.filter((item) => item.meta?.favorite).map((item) => ({ type: "player", id: item.id, name: item.characterName, subtitle: item.role })),
    ...data.rules.filter((item) => item.meta?.favorite).map((item) => ({ type: "rule", id: item.id, name: item.title, subtitle: item.category })),
    ...(data.entities ?? []).filter((item) => item.favorite).map((item) => ({ type: "entity", id: item.id, name: item.name, subtitle: item.type })),
  ], [data]);

  async function saveQuickNotes() {
    const notes = quickNotes.split("\n").map((line) => line.trim()).filter(Boolean);
    await action({ action: "save-quick-notes", tableId: data.activeTableId, notes });
  }

  async function startSession() {
    const sessionId = activeSession?.id ?? plannedSession?.id;
    await action({ action: "start-session", tableId: data.activeTableId, sessionId });
  }

  async function endSession() {
    if (!confirm("Encerrar a sessão atual? Um snapshot pós-sessão será criado.")) return;
    const result = await action({ action: "end-session", tableId: data.activeTableId, sessionId: activeSession?.id });
    if (typeof result.summary === "string") setSummary(result.summary);
  }

  async function makeSummary() {
    const result = await action({ action: "generate-session-summary", tableId: data.activeTableId, sessionId: activeSession?.id }, { silent: true });
    setSummary(String(result.summary ?? ""));
  }

  async function compare() {
    if (!fromSnapshot || !toSnapshot) return;
    const result = await action({ action: "compare-snapshots", tableId: data.activeTableId, fromId: fromSnapshot, toId: toSnapshot }, { silent: true });
    setComparison(result as unknown as SnapshotComparison);
  }

  async function createHandout() {
    if (!handoutTitle.trim()) return;
    const item: Partial<Handout> = { title: handoutTitle.trim(), content: handoutContent.trim(), imageUrl: handoutImage.trim() || undefined, visibility: "master" };
    await action({ action: "upsert-handout", tableId: data.activeTableId, item });
    setHandoutTitle(""); setHandoutContent(""); setHandoutImage("");
  }

  return (
    <div className="mdm-module h-full overflow-y-auto bg-background p-5">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-card to-background p-5">
          <div><p className="mdm-section-kicker text-xs uppercase tracking-[0.2em] text-primary">Escudo do mestre digital</p><h2 className="mt-1 text-2xl font-black text-foreground">{activeSession?.title ?? plannedSession?.title ?? "Modo Sessão"}</h2><p className="mt-1 text-sm text-muted-foreground">{activeSession ? "Sessão em andamento — o log automático está ativo." : "Nenhuma sessão em andamento."}</p></div>
          <div className="flex flex-wrap gap-2">{activeSession ? <button onClick={() => void endSession()} className="secondary-button border-destructive/40 text-destructive"><Square className="h-4 w-4" />Encerrar sessão</button> : <button onClick={() => void startSession()} className="primary-button"><Play className="h-4 w-4" />Iniciar sessão</button>}<button onClick={onOpenCombat} className="secondary-button"><Swords className="h-4 w-4" />Abrir combate</button><button onClick={() => void action({ action: "create-session-snapshot", tableId: data.activeTableId, sessionId: activeSession?.id, label: snapshotLabel })} className="secondary-button"><Camera className="h-4 w-4" />Snapshot</button></div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[1.1fr_1fr_1fr]">
          <section className="mdm-section-card rounded-xl border border-border bg-card/65 p-4">
            <div className="flex items-center justify-between"><div><p className="font-semibold text-foreground">Notas rápidas</p><p className="text-xs text-muted-foreground">Rascunho durante a sessão.</p></div><button onClick={() => void saveQuickNotes()} className="secondary-button">Salvar</button></div>
            <textarea value={quickNotes} onChange={(event) => setQuickNotes(event.target.value)} className="field mt-3 min-h-[250px]" placeholder="Uma anotação por linha..." />
            <div className="mt-3 flex gap-2"><input value={manualLog} onChange={(event) => setManualLog(event.target.value)} className="field" placeholder="Registrar acontecimento no log..." /><button onClick={async () => { if (!manualLog.trim()) return; await action({ action: "manual-log", tableId: data.activeTableId, message: manualLog.trim() }); setManualLog(""); }} className="icon-button"><Send className="h-4 w-4" /></button></div>
          </section>

          <section className="mdm-section-card rounded-xl border border-border bg-card/65 p-4">
            <p className="font-semibold text-foreground">Combate atual</p>
            {activeCombat ? <div className="mt-3"><div className="rounded-lg border border-border bg-background p-3"><p className="font-medium text-primary">{activeCombat.name}</p><p className="text-xs text-muted-foreground">Rodada {activeCombat.round} • turno {activeCombat.participants[activeCombat.turnIndex]?.name ?? "—"}</p></div><div className="mt-3 space-y-2">{activeCombat.participants.slice(0, 8).map((participant, index) => <div key={participant.id} className={`rounded-lg border p-3 ${index === activeCombat.turnIndex ? "border-primary/50 bg-primary/5" : "border-border bg-background"}`}><div className="flex items-center justify-between"><p className="text-sm font-medium text-foreground">{participant.name}</p><span className="text-xs text-muted-foreground">{participant.hpCurrent}/{participant.hpMax} HP</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-red-500" style={{ width: `${Math.max(0, Math.min(100, participant.hpMax ? participant.hpCurrent / participant.hpMax * 100 : 0))}%` }} /></div></div>)}</div></div> : <p className="mt-3 text-sm text-muted-foreground">Nenhum combate preparado.</p>}
          </section>

          <section className="mdm-section-card rounded-xl border border-border bg-card/65 p-4">
            <p className="font-semibold text-foreground">Favoritos da sessão</p><p className="text-xs text-muted-foreground">Atalhos para o que você usa o tempo todo.</p>
            <div className="mt-3 space-y-2">{favorites.length === 0 ? <p className="text-sm text-muted-foreground/80">Marque fichas, regras ou locais com ★.</p> : favorites.slice(0, 10).map((item) => <button key={`${item.type}:${item.id}`} onClick={() => onOpenContent(item.type, item.id, item.name)} className="w-full rounded-lg border border-border bg-background p-3 text-left hover:border-primary/40"><p className="text-xs uppercase text-muted-foreground/80">{item.type}</p><p className="font-medium text-foreground">{item.name}</p><p className="text-xs text-muted-foreground">{item.subtitle}</p></button>)}</div>
          </section>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
          <section className="mdm-section-card rounded-xl border border-border bg-card/65 p-4">
            <div className="flex items-center justify-between"><div><p className="flex items-center gap-2 font-semibold text-foreground"><ClipboardList className="h-4 w-4 text-primary" />Log automático</p><p className="text-xs text-muted-foreground">Ações importantes realizadas durante a sessão.</p></div><button onClick={() => confirm("Limpar o log desta sessão?") && void action({ action: "clear-session-log", tableId: data.activeTableId, sessionId: activeSession?.id })} className="secondary-button">Limpar</button></div>
            <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">{(data.sessionLog ?? []).length === 0 ? <p className="text-sm text-muted-foreground/80">O log aparecerá quando a sessão começar.</p> : (data.sessionLog ?? []).map((entry) => <div key={entry.id} className="rounded-lg border border-border bg-background p-3"><div className="flex items-center justify-between gap-3"><span className="text-[10px] uppercase text-primary">{entry.kind}</span><span className="text-[10px] text-muted-foreground/80">{new Date(entry.createdAt).toLocaleString()}</span></div><p className="mt-1 text-sm text-foreground/90">{entry.message}</p></div>)}</div>
            <button onClick={() => void makeSummary()} className="secondary-button mt-4"><FileText className="h-4 w-4" />Gerar resumo pós-sessão</button>
            {summary && <textarea readOnly value={summary} className="field mt-3 min-h-44" />}
          </section>

          <section className="mdm-section-card rounded-xl border border-border bg-card/65 p-4">
            <p className="font-semibold text-foreground">Snapshots e comparação</p>
            <div className="mt-3 flex gap-2"><input value={snapshotLabel} onChange={(event) => setSnapshotLabel(event.target.value)} className="field" /><button onClick={() => void action({ action: "create-session-snapshot", tableId: data.activeTableId, sessionId: activeSession?.id, label: snapshotLabel })} className="secondary-button"><Plus className="h-4 w-4" /></button></div>
            <div className="mt-3 space-y-2">{(data.sessionSnapshots ?? []).slice(0, 8).map((snap) => <div key={snap.id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background p-3"><div><p className="text-sm text-foreground/90">{snap.label}</p><p className="text-xs text-muted-foreground/80">{new Date(snap.createdAt).toLocaleString()}</p></div><button onClick={() => confirm(`Restaurar o snapshot “${snap.label}”? O estado atual ficará disponível no Undo.`) && void action({ action: "restore-session-snapshot", tableId: data.activeTableId, snapshotId: snap.id })} className="icon-button" title="Restaurar"><RotateCcw className="h-4 w-4" /></button></div>)}</div>
            {(data.sessionSnapshots ?? []).length >= 2 && <div className="mt-4 rounded-lg border border-border bg-background p-3"><p className="text-xs uppercase text-muted-foreground">Comparar versões</p><select value={fromSnapshot} onChange={(event) => setFromSnapshot(event.target.value)} className="field mt-2"><option value="">De...</option>{data.sessionSnapshots?.map((item) => <option key={item.id} value={item.id}>{item.label} — {item.createdAt}</option>)}</select><select value={toSnapshot} onChange={(event) => setToSnapshot(event.target.value)} className="field mt-2"><option value="">Para...</option>{data.sessionSnapshots?.map((item) => <option key={item.id} value={item.id}>{item.label} — {item.createdAt}</option>)}</select><button onClick={() => void compare()} className="secondary-button mt-2 w-full">Comparar</button>{comparison && <div className="mt-3 text-sm text-muted-foreground"><p className="font-medium text-primary">{comparison.summary}</p>{comparison.added.length > 0 && <p className="mt-2">+ {comparison.added.join(", ")}</p>}{comparison.removed.length > 0 && <p className="mt-1 text-destructive">− {comparison.removed.join(", ")}</p>}{comparison.changed.length > 0 && <p className="mt-1 text-blue-300">~ {comparison.changed.join(", ")}</p>}</div>}</div>}
          </section>
        </div>

        <section className="mdm-section-card rounded-xl border border-border bg-card/65 p-4">
          <div className="flex items-center justify-between"><div><p className="font-semibold text-foreground">Handouts e imagens</p><p className="text-xs text-muted-foreground">Use URLs externas diretas, inclusive imagens hospedadas no Imgur.</p></div><ImageIcon className="h-5 w-5 text-primary" /></div>
          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1.2fr_1.2fr_auto]"><input value={handoutTitle} onChange={(event) => setHandoutTitle(event.target.value)} className="field" placeholder="Título" /><input value={handoutImage} onChange={(event) => setHandoutImage(event.target.value)} className="field" placeholder="https://i.imgur.com/imagem.png" /><input value={handoutContent} onChange={(event) => setHandoutContent(event.target.value)} className="field" placeholder="Texto opcional" /><button onClick={() => void createHandout()} className="primary-button"><Plus className="h-4 w-4" />Criar</button></div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{(data.handouts ?? []).map((handout) => <HandoutCard key={handout.id} handout={handout} focused={focusHandoutId === handout.id} onToggle={() => void action({ action: "upsert-handout", tableId: data.activeTableId, item: { ...handout, visibility: handout.visibility === "players" ? "master" : "players" } })} onDelete={() => confirm(`Excluir o handout ${handout.title}?`) && void action({ action: "delete-handout", tableId: data.activeTableId, id: handout.id })} />)}</div>
        </section>
      </div>
    </div>
  );
}

function HandoutCard({ handout, focused, onToggle, onDelete }: { handout: Handout; focused?: boolean; onToggle: () => void; onDelete: () => void }) {
  return <article id={`mdm-handout-${handout.id}`} aria-current={focused ? "true" : undefined} className={`overflow-hidden rounded-xl border bg-background ${focused ? "border-primary ring-2 ring-primary/35" : "border-border"}`}>{handout.imageUrl ? <img src={handout.imageUrl} alt={handout.title} referrerPolicy="no-referrer" className="h-40 w-full object-cover" /> : <div className="flex h-24 items-center justify-center bg-card text-muted-foreground/70"><ImageIcon className="h-7 w-7" /></div>}<div className="p-3"><div className="flex items-start justify-between gap-2"><div><h4 className="font-medium text-foreground">{handout.title}</h4><p className="text-xs text-muted-foreground">{handout.visibility === "players" ? "Revelado aos jogadores" : "Somente mestre"}</p></div><button onClick={onToggle} className="icon-button">{handout.visibility === "players" ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button></div>{handout.content && <p className="mt-2 text-sm text-muted-foreground">{handout.content}</p>}<button onClick={onDelete} className="mt-3 inline-flex items-center gap-1 text-xs text-destructive"><Trash2 className="h-3.5 w-3.5" />Excluir</button></div></article>;
}
