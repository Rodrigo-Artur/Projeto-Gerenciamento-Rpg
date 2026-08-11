"use client";

import { AlertTriangle, FileJson, Upload, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { ImportPreview, MesaImportPackage, RulebookData } from "@/types/rulebook";

const sectionNames = ["rules", "npcs", "players", "notes", "sessions", "templates", "entities"] as const;
type SectionName = typeof sectionNames[number];

export function ImportDialog({ data, action, previewImport, onClose, onFinish, initialFile }: {
  data: RulebookData;
  action: (payload: Record<string, unknown>) => Promise<Record<string, unknown>>;
  previewImport: (payload: unknown, tableId?: string) => Promise<ImportPreview>;
  onClose: () => void;
  onFinish: (tableId: string) => void;
  initialFile?: File;
}) {
  const [payload, setPayload] = useState<unknown>();
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<ImportPreview>();
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [conflict, setConflict] = useState<"skip" | "replace" | "copy">("skip");
  const [sections, setSections] = useState<SectionName[]>([...sectionNames]);
  const [target, setTarget] = useState<"current" | "new-table" | "new-system-table">("current");
  const [newTableName, setNewTableName] = useState("Mesa importada");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const packageInfo = useMemo(() => {
    const raw = payload as Partial<MesaImportPackage> | undefined;
    return { systemName: raw?.system?.name || "Sistema importado", tableName: raw?.table?.name || "Mesa importada" };
  }, [payload]);

  async function readFile(file: File) {
    setError("");
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      setPayload(parsed); setFileName(file.name);
      const result = await previewImport(parsed, data.activeTableId);
      setPreview(result);
      const raw = parsed as Partial<MesaImportPackage>;
      setNewTableName(raw.table?.name || file.name.replace(/\.json$/i, "") || "Mesa importada");
    } catch (readError) {
      setPayload(undefined); setPreview(undefined);
      setError(readError instanceof Error ? readError.message : "Arquivo JSON inválido.");
    }
  }

  useEffect(() => { if (initialFile) void readFile(initialFile); }, [initialFile]);

  function toggleSection(section: SectionName) {
    setSections((current) => current.includes(section) ? current.filter((item) => item !== section) : [...current, section]);
  }

  async function runImport() {
    if (!payload || sections.length === 0) return;
    setBusy(true); setError("");
    try {
      let targetTableId = data.activeTableId;
      let targetSystemId = data.activeSystemId;
      if (target === "new-system-table") {
        const systemResult = await action({ action: "create-system", tableId: data.activeTableId, name: packageInfo.systemName, description: "Sistema criado automaticamente durante uma importação.", mode: "blank" });
        targetSystemId = String(systemResult.createdSystemId || data.activeSystemId);
        const tableResult = await action({ action: "create-table", tableId: data.activeTableId, systemId: targetSystemId, name: newTableName || packageInfo.tableName, description: "Mesa criada automaticamente durante uma importação." });
        targetTableId = String(tableResult.activeTableId || data.activeTableId);
      } else if (target === "new-table") {
        const tableResult = await action({ action: "create-table", tableId: data.activeTableId, systemId: data.activeSystemId, name: newTableName || packageInfo.tableName, description: "Mesa criada automaticamente durante uma importação." });
        targetTableId = String(tableResult.activeTableId || data.activeTableId);
      }
      await action({ action: "import-package", tableId: targetTableId, systemId: targetSystemId, payload, mode, conflict, sections });
      onFinish(targetTableId); onClose();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Falha ao importar.");
    } finally { setBusy(false); }
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
    <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl">
      <header className="flex items-start justify-between gap-3 border-b border-zinc-800 p-5"><div><p className="text-xs uppercase tracking-[0.2em] text-amber-400">Importação inteligente</p><h2 className="mt-1 text-xl font-bold text-zinc-100">Pré-visualizar antes de alterar o banco</h2><p className="mt-1 text-sm text-zinc-500">Você pode selecionar ou soltar um JSON. Um backup é criado antes da importação.</p></div><button onClick={onClose} className="icon-button"><X className="h-4 w-4" /></button></header>
      <div className="space-y-5 p-5">
        <label onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files?.[0]; if (file) void readFile(file); }} className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/60 p-8 text-zinc-300 hover:border-amber-500/60"><Upload className="h-5 w-5 text-amber-400" /><span>{fileName || "Clique ou arraste o arquivo JSON para cá"}</span><input type="file" accept="application/json,.json" className="hidden" onChange={(event) => event.target.files?.[0] && void readFile(event.target.files[0])} /></label>
        {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
        {preview && <>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-7">{sectionNames.map((section) => <div key={section} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3"><p className="text-xs uppercase text-zinc-500">{section}</p><p className="mt-1 text-xl font-bold text-amber-300">{preview.counts[section] ?? 0}</p></div>)}</div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4"><p className="flex items-center gap-2 font-semibold text-zinc-100"><FileJson className="h-4 w-4 text-amber-400" />Pacote detectado</p><p className="mt-2 text-sm text-zinc-400">Formato v{preview.formatVersion} • {preview.packageType}</p><p className="text-sm text-zinc-400">Conflitos detectados: <span className="font-semibold text-amber-300">{preview.conflicts.length}</span></p></div>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4"><p className="font-semibold text-zinc-100">O que importar</p><div className="mt-3 grid grid-cols-2 gap-2">{sectionNames.map((section) => <label key={section} className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950 p-2 text-sm text-zinc-300"><input type="checkbox" checked={sections.includes(section)} onChange={() => toggleSection(section)} />{section} ({preview.counts[section] ?? 0})</label>)}</div></div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4"><p className="font-semibold text-zinc-100">Destino</p><div className="mt-3 space-y-2"><label className="flex gap-2 text-sm text-zinc-300"><input type="radio" checked={target === "current"} onChange={() => setTarget("current")} />Mesa atual</label><label className="flex gap-2 text-sm text-zinc-300"><input type="radio" checked={target === "new-table"} onChange={() => setTarget("new-table")} />Nova mesa usando o sistema atual</label><label className="flex gap-2 text-sm text-zinc-300"><input type="radio" checked={target === "new-system-table"} onChange={() => setTarget("new-system-table")} />Novo sistema + nova mesa</label>{target !== "current" && <input value={newTableName} onChange={(event) => setNewTableName(event.target.value)} className="field mt-2" placeholder="Nome da nova mesa" />}</div></div>
          </div>
          <div className="grid gap-5 lg:grid-cols-2"><div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4"><p className="font-semibold text-zinc-100">Modo</p><select value={mode} onChange={(event) => setMode(event.target.value as "merge" | "replace")} className="field mt-3"><option value="merge">Mesclar — não apaga conteúdo ausente</option><option value="replace">Substituir somente as seções marcadas</option></select>{mode === "replace" && <p className="mt-2 flex items-start gap-2 text-xs text-amber-300"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />As seções marcadas serão limpas. O backup permite restaurar.</p>}</div><div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4"><p className="font-semibold text-zinc-100">Quando um ID já existir</p><select value={conflict} onChange={(event) => setConflict(event.target.value as "skip" | "replace" | "copy")} className="field mt-3"><option value="skip">Ignorar o existente</option><option value="replace">Substituir o existente</option><option value="copy">Criar uma cópia</option></select></div></div>
          {preview.conflicts.length > 0 && <details className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4"><summary className="cursor-pointer font-semibold text-zinc-200">Ver conflitos ({preview.conflicts.length})</summary><div className="mt-3 max-h-48 space-y-1 overflow-y-auto">{preview.conflicts.map((item) => <p key={`${item.section}-${item.id}`} className="text-xs text-zinc-400"><span className="text-amber-300">{item.section}</span> — {item.name}</p>)}</div></details>}
          <div className="flex justify-end gap-2"><button onClick={onClose} className="secondary-button">Cancelar</button><button disabled={busy || sections.length === 0} onClick={() => void runImport()} className="primary-button">{busy ? "Importando..." : "Importar agora"}</button></div>
        </>}
      </div>
    </div>
  </div>;
}
