"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ImportPreview, RulebookData } from "@/types/rulebook";

export type RecentContent = { type: string; id: string; name: string; openedAt: string };
export type SearchResult = { type: string; id: string; name: string; description: string };
export type WorkspaceStatusKind = "loading" | "saving" | "saved" | "error";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}
type WorkspaceResponse = RulebookData & { recent?: RecentContent[]; error?: string; summary?: string; undo?: boolean; undoLabel?: string };

const emptyData: RulebookData = {
  systems: [], tables: [], activeTableId: "mesa-principal", activeSystemId: "kaiju-rpg",
  rules: [], npcs: [], players: [], notes: [], sessions: [], history: [], templates: [], entities: [], combats: [], backups: [],
  library: [], packs: [], relations: [], sessionLog: [], sessionSnapshots: [], handouts: [],
  runtime: { activeSessionId: undefined, quickNotes: [], calendar: { day: 1, month: 1, year: 1, calendarName: "Calendário da campanha", events: [] } },
};

function normalize(data: Partial<RulebookData>): RulebookData {
  return {
    systems: data.systems ?? [], tables: data.tables ?? [],
    activeTableId: data.activeTableId ?? "mesa-principal", activeSystemId: data.activeSystemId ?? "kaiju-rpg",
    rules: data.rules ?? [], npcs: data.npcs ?? [], players: data.players ?? [], notes: data.notes ?? [], sessions: data.sessions ?? [], history: data.history ?? [],
    templates: data.templates ?? [], entities: data.entities ?? [], combats: data.combats ?? [], backups: data.backups ?? [], systemConfig: data.systemConfig,
    library: data.library ?? [], packs: data.packs ?? [], relations: data.relations ?? [], sessionLog: data.sessionLog ?? [], sessionSnapshots: data.sessionSnapshots ?? [], handouts: data.handouts ?? [],
    runtime: data.runtime ?? emptyData.runtime,
  };
}

export function useWorkspaceApi(playerView = false) {
  const [data, setData] = useState<RulebookData>(emptyData);
  const [recent, setRecent] = useState<RecentContent[]>([]);
  const [status, setStatus] = useState("Carregando...");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pendingSaves, setPendingSaves] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState<string>();
  const loadGeneration = useRef(0);
  const appliedTableId = useRef<string | undefined>(undefined);
  const requestedTableId = useRef<string | undefined>(undefined);

  const applyResponse = useCallback((response: WorkspaceResponse, clearRecents = false) => {
    // Ações de criação/duplicação de mesas podem trocar a mesa sem GET.
    // Não permitir que "Recentes" da mesa antiga permaneçam visíveis.
    if (response.recent !== undefined) setRecent(response.recent);
    else if (clearRecents || (appliedTableId.current !== undefined && appliedTableId.current !== response.activeTableId)) setRecent([]);
    appliedTableId.current = response.activeTableId;
    setData(normalize(response));
  }, []);

  const load = useCallback(async (tableId?: string) => {
    requestedTableId.current = tableId;
    // Uma resposta atrasada não pode trocar a mesa que o usuário já selecionou.
    const generation = ++loadGeneration.current;
    setLoading(true);
    setLoadError(null);
    setStatus("Carregando mesa...");
    try {
      const params = new URLSearchParams();
      if (tableId) params.set("tableId", tableId);
      if (playerView) params.set("view", "players");
      const response = await fetch(`/api/rulebook?${params.toString()}`, { cache: "no-store" });
      const json = await response.json() as WorkspaceResponse;
      if (!response.ok) throw new Error(json.error || "Falha ao carregar.");
      if (generation !== loadGeneration.current) return;
      applyResponse(json, true);
      setLoadError(null);
      setStatus("Salvo");
    } catch (error) {
      if (generation === loadGeneration.current) {
        const message = errorMessage(error, "Não foi possível carregar esta mesa.");
        setLoadError(message);
        setStatus("Falha ao carregar");
      }
    } finally {
      if (generation === loadGeneration.current) setLoading(false);
    }
  }, [applyResponse, playerView]);

  const retryLoad = useCallback(() => load(requestedTableId.current), [load]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    void load(params.get("tableId") ?? undefined);
  }, [load]);

  const action = useCallback(async <T extends Record<string, unknown>>(payload: T, options?: { reloadTableId?: string; silent?: boolean }) => {
    const generation = loadGeneration.current;
    if (!options?.silent) {
      setPendingSaves((count) => count + 1);
      setStatus("Salvando...");
    }
    try {
      const response = await fetch("/api/rulebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json() as WorkspaceResponse;
      if (!response.ok) throw new Error(json.error || "Falha ao salvar.");
      if (json.tables && generation === loadGeneration.current) applyResponse(json);
      if (options?.reloadTableId) await load(options.reloadTableId);
      if (!options?.silent && generation === loadGeneration.current) {
        setSaveError(null);
        setLastSavedAt(new Date().toISOString());
        setStatus("Salvo");
      }
      return json;
    } catch (error) {
      if (!options?.silent && generation === loadGeneration.current) {
        setSaveError(errorMessage(error, "Não foi possível salvar. Verifique os dados antes de tentar novamente."));
        setStatus("Falha ao salvar");
      }
      throw error;
    } finally {
      if (!options?.silent) setPendingSaves((count) => Math.max(0, count - 1));
    }
  }, [applyResponse, load]);

  const search = useCallback(async (query: string, tableId = data.activeTableId, signal?: AbortSignal): Promise<SearchResult[]> => {
    if (!query.trim()) return [];
    const params = new URLSearchParams({ tableId, search: query.trim() });
    if (playerView) params.set("view", "players");
    const response = await fetch(`/api/rulebook?${params.toString()}`, { cache: "no-store", signal });
    if (!response.ok) throw new Error("Falha ao consultar a busca.");
    const json = await response.json() as { results?: SearchResult[] };
    return json.results ?? [];
  }, [data.activeTableId, playerView]);

  const previewImport = useCallback(async (payload: unknown, tableId = data.activeTableId) => {
    const response = await fetch("/api/rulebook", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "import-preview", tableId, payload }) });
    const json = await response.json() as ImportPreview & { error?: string };
    if (!response.ok) throw new Error(json.error || "Falha ao analisar arquivo.");
    return json;
  }, [data.activeTableId]);

  const recordRecent = useCallback(async (type: string, id: string, name: string) => {
    await action({ action: "record-recent", tableId: data.activeTableId, contentType: type, contentId: id, contentName: name }, { silent: true });
  }, [action, data.activeTableId]);

  const statusKind: WorkspaceStatusKind = loadError || saveError || /^falha ao /i.test(status) ? "error"
    : loading ? "loading" : pendingSaves > 0 ? "saving" : "saved";

  return {
    data, recent, status, statusKind, loading, loadError, saveError, lastSavedAt,
    clearSaveError: () => setSaveError(null),
    setData, load, retryLoad, action, search, previewImport, recordRecent,
  };
}
