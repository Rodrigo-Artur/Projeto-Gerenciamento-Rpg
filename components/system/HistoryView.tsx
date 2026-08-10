"use client";

import { ArchiveRestore, Clock3, DatabaseBackup } from "lucide-react";

import type { RulebookData } from "@/types/rulebook";

export function HistoryView({ data, action }: { data: RulebookData; action: (payload: Record<string, unknown>) => Promise<unknown> }) {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs uppercase tracking-[0.2em] text-amber-400">Auditoria</p><h2 className="mt-1 text-2xl font-bold">Histórico e backups</h2><p className="mt-1 text-sm text-zinc-500">Alterações importantes ficam registradas e operações destrutivas criam backup antes de executar.</p></div>
        <button onClick={() => void action({ action: "backup", tableId: data.activeTableId, reason: "Backup manual" })} className="primary-button"><DatabaseBackup className="h-4 w-4" />Criar backup</button>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
          <h3 className="flex items-center gap-2 font-semibold text-zinc-100"><Clock3 className="h-4 w-4 text-amber-400" />Atividade recente</h3>
          <div className="mt-4 space-y-2">{data.history.length === 0 ? <p className="text-sm text-zinc-500">Ainda não há histórico.</p> : data.history.map((entry) => <div key={entry.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm text-zinc-300"><span className="font-medium text-amber-300">{entry.action}</span> {entry.targetType}: {entry.targetName}</p><span className="text-xs text-zinc-600">{entry.createdAt}</span></div>{entry.details && <p className="mt-1 text-xs text-zinc-500">{entry.details}</p>}</div>)}</div>
        </section>
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
          <h3 className="flex items-center gap-2 font-semibold text-zinc-100"><ArchiveRestore className="h-4 w-4 text-amber-400" />Backups</h3>
          <div className="mt-4 space-y-2">{(data.backups ?? []).length === 0 ? <p className="text-sm text-zinc-500">Nenhum backup salvo.</p> : (data.backups ?? []).map((backup) => <div key={backup.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3"><p className="text-sm text-zinc-300">{backup.reason}</p><p className="mt-1 text-xs text-zinc-600">{backup.createdAt}</p><button onClick={() => { if (confirm("Restaurar este backup? O estado atual será salvo antes.")) void action({ action: "restore-backup", tableId: data.activeTableId, backupId: backup.id }); }} className="secondary-button mt-3 w-full">Restaurar</button></div>)}</div>
        </section>
      </div>
    </div>
  );
}
