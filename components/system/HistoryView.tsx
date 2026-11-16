"use client";

import { ArchiveRestore, Clock3, DatabaseBackup, History } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import type { RulebookData } from "@/types/rulebook";
import { WorkspaceListEmpty } from "@/components/ui/workspace-feedback";

type VersionRow = {
  id: string;
  contentName: string;
  snapshotJson: string;
  createdAt: string;
};

export function HistoryView({ data, action }: { data: RulebookData; action: (payload: Record<string, unknown>) => Promise<unknown> }) {
  const [selectedContent, setSelectedContent] = useState("");
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [versionsError, setVersionsError] = useState<string | null>(null);
  const requestNumber = useRef(0);
  const contentOptions = useMemo(() => [
    ...data.rules.map((item) => ({ value: `rule:${item.id}`, label: `Regra — ${item.title}` })),
    ...data.players.map((item) => ({ value: `player:${item.id}`, label: `Player — ${item.characterName}` })),
    ...data.npcs.map((item) => ({ value: `npc:${item.id}`, label: `NPC — ${item.name}` })),
    ...data.notes.map((item) => ({ value: `note:${item.id}`, label: `Nota — ${item.title}` })),
    ...data.sessions.map((item) => ({ value: `session:${item.id}`, label: `Sessão — ${item.title}` })),
  ], [data]);

  async function loadVersions(value: string) {
    const requestId = ++requestNumber.current;
    setSelectedContent(value);
    setVersions([]);
    setVersionsError(null);
    if (!value) {
      setVersionsLoading(false);
      return;
    }
    const [type, id] = value.split(":");
    setVersionsLoading(true);
    try {
      const params = new URLSearchParams({ versionsType: type, versionsId: id, tableId: data.activeTableId });
      const response = await fetch(`/api/rulebook?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Falha ao consultar versões anteriores.");
      const json = await response.json() as { versions?: VersionRow[] };
      if (requestId !== requestNumber.current) return;
      setVersions(json.versions ?? []);
    } catch (error) {
      if (requestId === requestNumber.current) {
        setVersionsError(error instanceof Error ? error.message : "Não foi possível consultar o histórico.");
      }
    } finally {
      if (requestId === requestNumber.current) setVersionsLoading(false);
    }
  }

  async function restoreVersion(versionId: string) {
    const [contentType, contentId] = selectedContent.split(":");
    if (!contentType || !contentId) return;
    if (!confirm("Restaurar esta versão? Um backup do estado atual será criado antes.")) return;
    await action({
      action: "restore-version",
      tableId: data.activeTableId,
      systemId: data.activeSystemId,
      versionId,
      contentType,
      contentId,
    });
    await loadVersions(selectedContent);
  }

  return (
    <div className="mdm-module mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="mdm-section-kicker text-xs uppercase tracking-[0.2em] text-primary">Auditoria</p><h2 className="mt-1 text-2xl font-bold">Histórico e backups</h2><p className="mt-1 text-sm text-muted-foreground">Alterações importantes ficam registradas e operações destrutivas criam backup antes de executar.</p></div>
        <button onClick={() => void action({ action: "backup", tableId: data.activeTableId, reason: "Backup manual" })} className="primary-button"><DatabaseBackup className="h-4 w-4" />Criar backup</button>
      </div>

      <section className="mdm-section-card rounded-xl border border-border bg-card/70 p-5">
        <h3 className="flex items-center gap-2 font-semibold text-foreground"><History className="h-4 w-4 text-primary" />Restaurar versão de um conteúdo</h3>
        <p className="mt-1 text-sm text-muted-foreground">Escolha uma ficha, regra, nota ou sessão para ver os snapshots salvos antes das edições.</p>
        <select value={selectedContent} onChange={(event) => void loadVersions(event.target.value)} className="field mt-4">
          <option value="">Selecionar conteúdo...</option>
          {contentOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {!selectedContent ? (
            <WorkspaceListEmpty title="Escolha um conteúdo" description="Selecione um item acima para consultar suas versões anteriores." />
          ) : versionsLoading ? (
            <p role="status" className="text-sm text-muted-foreground">Carregando versões...</p>
          ) : versionsError ? (
            <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{versionsError}</p>
              <button type="button" onClick={() => void loadVersions(selectedContent)} className="secondary-button mt-3">Tentar novamente</button>
            </div>
          ) : versions.length === 0 ? (
            <WorkspaceListEmpty title="Sem versões anteriores" description="Ainda não existem versões registradas para este conteúdo." />
          ) : versions.map((version) => (
            <div key={version.id} className="rounded-lg border border-border bg-background p-3">
              <p className="text-sm font-medium text-foreground">{version.contentName}</p>
              <p className="mt-1 text-xs text-muted-foreground/80">{version.createdAt}</p>
              <button onClick={() => void restoreVersion(version.id)} className="secondary-button mt-3 w-full">Restaurar versão</button>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <section className="mdm-section-card rounded-xl border border-border bg-card/70 p-5">
          <h3 className="flex items-center gap-2 font-semibold text-foreground"><Clock3 className="h-4 w-4 text-primary" />Atividade recente</h3>
          <div className="mt-4 space-y-2">{data.history.length === 0 ? <WorkspaceListEmpty title="Sem atividade registrada" description="As próximas alterações importantes aparecerão aqui." /> : data.history.map((entry) => <div key={entry.id} className="rounded-lg border border-border bg-background p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm text-foreground/90"><span className="font-medium text-primary">{entry.action}</span> {entry.targetType}: {entry.targetName}</p><span className="text-xs text-muted-foreground/80">{entry.createdAt}</span></div>{entry.details && <p className="mt-1 text-xs text-muted-foreground">{entry.details}</p>}</div>)}</div>
        </section>
        <section className="mdm-section-card rounded-xl border border-border bg-card/70 p-5">
          <h3 className="flex items-center gap-2 font-semibold text-foreground"><ArchiveRestore className="h-4 w-4 text-primary" />Backups</h3>
          <div className="mt-4 space-y-2">{(data.backups ?? []).length === 0 ? <WorkspaceListEmpty title="Nenhum backup disponível" description="Crie um backup manual ou aguarde os backups automáticos." /> : (data.backups ?? []).map((backup) => <div key={backup.id} className="rounded-lg border border-border bg-background p-3"><p className="text-sm text-foreground/90">{backup.reason}</p><p className="mt-1 text-xs text-muted-foreground/80">{backup.createdAt}</p><button onClick={() => { if (confirm("Restaurar este backup? O estado atual será salvo antes.")) void action({ action: "restore-backup", tableId: data.activeTableId, backupId: backup.id }); }} className="secondary-button mt-3 w-full">Restaurar</button></div>)}</div>
        </section>
      </div>
    </div>
  );
}
