"use client";

import { ArchiveRestore, Copy, DatabaseBackup, Pencil, Plus, Shield, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import type { RecentContent } from "@/hooks/useWorkspaceApi";
import type { RulebookData } from "@/types/rulebook";

type Action = <T extends Record<string, unknown>>(payload: T, options?: { reloadTableId?: string; silent?: boolean }) => Promise<RulebookData & { activeTableId?: string }>;

export function DashboardView({
  data,
  recent,
  action,
  onOpenTable,
  onOpenRecent,
}: {
  data: RulebookData;
  recent: RecentContent[];
  action: Action;
  onOpenTable: (tableId: string) => void;
  onOpenRecent: (item: RecentContent) => void;
}) {
  const [tableName, setTableName] = useState("");
  const [tableDescription, setTableDescription] = useState("");
  const [tableSystemId, setTableSystemId] = useState(data.activeSystemId);
  const [systemName, setSystemName] = useState("");
  const [systemDescription, setSystemDescription] = useState("");
  const [systemMode, setSystemMode] = useState<"blank" | "clone">("blank");
  const [cloneSourceId, setCloneSourceId] = useState(data.activeSystemId);
  const [editingTable, setEditingTable] = useState<string | null>(null);
  const [editingSystem, setEditingSystem] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");

  const currentTable = data.tables.find((item) => item.id === data.activeTableId);
  const stats = useMemo(() => [
    ["Players", data.players.length],
    ["NPCs", data.npcs.length],
    ["Regras", data.rules.length],
    ["Sessões", data.sessions.length],
    ["Mundo", (data.entities ?? []).length],
    ["Combates", (data.combats ?? []).length],
  ], [data]);

  async function createTable() {
    if (!tableName.trim()) return;
    const result = await action({
      action: "create-table",
      tableId: data.activeTableId,
      systemId: tableSystemId,
      name: tableName.trim(),
      description: tableDescription.trim(),
    });
    setTableName("");
    setTableDescription("");
    if (result.activeTableId) onOpenTable(result.activeTableId);
  }

  async function createSystem() {
    if (!systemName.trim()) return;
    await action({
      action: "create-system",
      tableId: data.activeTableId,
      name: systemName.trim(),
      description: systemDescription.trim(),
      mode: systemMode,
      sourceSystemId: systemMode === "clone" ? cloneSourceId : undefined,
    });
    setSystemName("");
    setSystemDescription("");
  }

  function beginEditTable(id: string, name: string, description: string) {
    setEditingTable(id);
    setEditingSystem(null);
    setDraftName(name);
    setDraftDescription(description);
  }

  function beginEditSystem(id: string, name: string, description: string) {
    setEditingSystem(id);
    setEditingTable(null);
    setDraftName(name);
    setDraftDescription(description);
  }

  return (
    <div className="space-y-8 p-6">
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Visão geral</p>
            <h2 className="mt-1 text-2xl font-bold text-zinc-100">{currentTable?.name ?? "Mesa"}</h2>
            <p className="mt-1 text-sm text-zinc-500">Gerencie campanhas, sistemas, backups e conteúdo recente.</p>
          </div>
          <button
            onClick={() => void action({ action: "backup", tableId: data.activeTableId, reason: "Backup manual" })}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 hover:border-amber-500/60"
          >
            <DatabaseBackup className="h-4 w-4" /> Backup agora
          </button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {stats.map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
              <p className="mt-1 text-2xl font-bold text-amber-300">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
          <h3 className="flex items-center gap-2 font-semibold text-zinc-100"><Plus className="h-4 w-4 text-amber-400" /> Nova mesa</h3>
          <div className="mt-4 grid gap-3">
            <input value={tableName} onChange={(event) => setTableName(event.target.value)} placeholder="Nome da mesa" className="field" />
            <textarea value={tableDescription} onChange={(event) => setTableDescription(event.target.value)} placeholder="Descrição" rows={3} className="field" />
            <select value={tableSystemId} onChange={(event) => setTableSystemId(event.target.value)} className="field">
              {data.systems.map((system) => <option key={system.id} value={system.id}>{system.name}</option>)}
            </select>
            <button onClick={() => void createTable()} className="primary-button">Criar mesa vazia</button>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
          <h3 className="flex items-center gap-2 font-semibold text-zinc-100"><Shield className="h-4 w-4 text-amber-400" /> Novo sistema</h3>
          <div className="mt-4 grid gap-3">
            <input value={systemName} onChange={(event) => setSystemName(event.target.value)} placeholder="Nome do sistema" className="field" />
            <textarea value={systemDescription} onChange={(event) => setSystemDescription(event.target.value)} placeholder="Descrição" rows={3} className="field" />
            <select value={systemMode} onChange={(event) => setSystemMode(event.target.value as "blank" | "clone")} className="field">
              <option value="blank">Sistema vazio</option>
              <option value="clone">Duplicar sistema existente</option>
            </select>
            {systemMode === "clone" && (
              <select value={cloneSourceId} onChange={(event) => setCloneSourceId(event.target.value)} className="field">
                {data.systems.map((system) => <option key={system.id} value={system.id}>{system.name}</option>)}
              </select>
            )}
            <button onClick={() => void createSystem()} className="primary-button">Criar sistema</button>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
          <h3 className="font-semibold text-zinc-100">Mesas</h3>
          <div className="mt-4 space-y-3">
            {data.tables.map((table) => {
              const system = data.systems.find((item) => item.id === table.systemId);
              const isEditing = editingTable === table.id;
              return (
                <div key={table.id} className={`rounded-lg border p-4 ${table.id === data.activeTableId ? "border-amber-500/50 bg-amber-500/5" : "border-zinc-800 bg-zinc-950"}`}>
                  {isEditing ? (
                    <div className="grid gap-2">
                      <input value={draftName} onChange={(event) => setDraftName(event.target.value)} className="field" />
                      <textarea value={draftDescription} onChange={(event) => setDraftDescription(event.target.value)} className="field" rows={2} />
                      <div className="flex gap-2">
                        <button onClick={async () => { await action({ action: "update-table", tableId: table.id, name: draftName, description: draftDescription }); setEditingTable(null); }} className="primary-button">Salvar</button>
                        <button onClick={() => setEditingTable(null)} className="secondary-button">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <button onClick={() => onOpenTable(table.id)} className="text-left">
                          <p className="font-semibold text-zinc-100">{table.name}</p>
                          <p className="text-xs text-zinc-500">Sistema: {system?.name ?? table.systemId}</p>
                          <p className="mt-1 text-sm text-zinc-400">{table.description}</p>
                        </button>
                        <div className="flex gap-1">
                          <IconButton title="Editar" onClick={() => beginEditTable(table.id, table.name, table.description)}><Pencil className="h-4 w-4" /></IconButton>
                          <IconButton title="Duplicar" onClick={async () => { const result = await action({ action: "duplicate-table", tableId: table.id, name: `${table.name} — Cópia` }); if (result.activeTableId) onOpenTable(result.activeTableId); }}><Copy className="h-4 w-4" /></IconButton>
                          {table.id !== "mesa-principal" && <IconButton title="Excluir" danger onClick={async () => { if (confirm(`Excluir a mesa ${table.name}? Um backup será criado antes.`)) await action({ action: "delete-table", tableId: table.id }); }}><Trash2 className="h-4 w-4" /></IconButton>}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs text-zinc-500">Trocar sistema:</span>
                        <select value={table.systemId} onChange={(event) => void action({ action: "update-table", tableId: table.id, newSystemId: event.target.value })} className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-300">
                          {data.systems.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
            <h3 className="font-semibold text-zinc-100">Sistemas</h3>
            <div className="mt-4 space-y-3">
              {data.systems.map((system) => {
                const isEditing = editingSystem === system.id;
                return (
                  <div key={system.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                    {isEditing ? (
                      <div className="grid gap-2">
                        <input value={draftName} onChange={(event) => setDraftName(event.target.value)} className="field" />
                        <textarea value={draftDescription} onChange={(event) => setDraftDescription(event.target.value)} className="field" rows={2} />
                        <div className="flex gap-2">
                          <button onClick={async () => { await action({ action: "update-system", systemId: system.id, tableId: data.activeTableId, name: draftName, description: draftDescription }); setEditingSystem(null); }} className="primary-button">Salvar</button>
                          <button onClick={() => setEditingSystem(null)} className="secondary-button">Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div><p className="font-medium text-zinc-200">{system.name}</p><p className="mt-1 text-xs text-zinc-500">{system.description}</p></div>
                        <div className="flex gap-1">
                          <IconButton title="Editar" onClick={() => beginEditSystem(system.id, system.name, system.description)}><Pencil className="h-4 w-4" /></IconButton>
                          {system.id !== "kaiju-rpg" && <IconButton title="Excluir" danger onClick={async () => { if (confirm(`Excluir o sistema ${system.name}?`)) await action({ action: "delete-system", systemId: system.id, tableId: data.activeTableId }); }}><Trash2 className="h-4 w-4" /></IconButton>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
            <h3 className="flex items-center gap-2 font-semibold text-zinc-100"><ArchiveRestore className="h-4 w-4 text-amber-400" /> Backups automáticos</h3>
            <div className="mt-3 space-y-2">
              {(data.backups ?? []).length === 0 ? <p className="text-sm text-zinc-500">Nenhum backup ainda.</p> : (data.backups ?? []).map((backup) => (
                <div key={backup.id} className="flex items-center justify-between gap-3 rounded-md border border-zinc-800 bg-zinc-950 p-3">
                  <div><p className="text-sm text-zinc-300">{backup.reason}</p><p className="text-xs text-zinc-600">{backup.createdAt}</p></div>
                  <button onClick={() => void action({ action: "restore-backup", tableId: data.activeTableId, backupId: backup.id })} className="secondary-button">Restaurar</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
        <h3 className="font-semibold text-zinc-100">Recentes</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {recent.length === 0 ? <p className="text-sm text-zinc-500">Abra conteúdo durante a mesa e ele aparecerá aqui.</p> : recent.map((item) => (
            <button key={`${item.type}-${item.id}`} onClick={() => onOpenRecent(item)} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-left hover:border-amber-500/50">
              <p className="text-xs uppercase text-zinc-600">{item.type}</p>
              <p className="mt-1 text-sm font-medium text-zinc-200">{item.name}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function IconButton({ children, title, onClick, danger = false }: { children: React.ReactNode; title: string; onClick: () => void; danger?: boolean }) {
  return <button title={title} onClick={onClick} className={`rounded-md border border-zinc-800 p-2 ${danger ? "text-red-300 hover:border-red-500/60" : "text-zinc-400 hover:border-amber-500/60 hover:text-amber-300"}`}>{children}</button>;
}
