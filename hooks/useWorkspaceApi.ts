"use client";

import { useCallback, useEffect, useState } from "react";

import type { ImportPreview, RulebookData } from "@/types/rulebook";

export type RecentContent = {
  type: string;
  id: string;
  name: string;
  openedAt: string;
};

export type SearchResult = {
  type: string;
  id: string;
  name: string;
  description: string;
};

type WorkspaceResponse = RulebookData & {
  recent?: RecentContent[];
  error?: string;
};

const emptyData: RulebookData = {
  systems: [],
  tables: [],
  activeTableId: "mesa-principal",
  activeSystemId: "kaiju-rpg",
  rules: [],
  npcs: [],
  players: [],
  notes: [],
  sessions: [],
  history: [],
  templates: [],
  entities: [],
  combats: [],
  backups: [],
};

function normalize(data: Partial<RulebookData>): RulebookData {
  return {
    systems: data.systems ?? [],
    tables: data.tables ?? [],
    activeTableId: data.activeTableId ?? "mesa-principal",
    activeSystemId: data.activeSystemId ?? "kaiju-rpg",
    rules: data.rules ?? [],
    npcs: data.npcs ?? [],
    players: data.players ?? [],
    notes: data.notes ?? [],
    sessions: data.sessions ?? [],
    history: data.history ?? [],
    templates: data.templates ?? [],
    entities: data.entities ?? [],
    combats: data.combats ?? [],
    backups: data.backups ?? [],
    systemConfig: data.systemConfig,
  };
}

export function useWorkspaceApi(playerView = false) {
  const [data, setData] = useState<RulebookData>(emptyData);
  const [recent, setRecent] = useState<RecentContent[]>([]);
  const [status, setStatus] = useState("Carregando...");
  const [loading, setLoading] = useState(true);

  const applyResponse = useCallback((response: WorkspaceResponse) => {
    setData(normalize(response));
    setRecent(response.recent ?? []);
  }, []);

  const load = useCallback(async (tableId?: string) => {
    setLoading(true);
    setStatus("Carregando mesa...");
    try {
      const params = new URLSearchParams();
      if (tableId) params.set("tableId", tableId);
      if (playerView) params.set("view", "players");
      const response = await fetch(`/api/rulebook?${params.toString()}`, { cache: "no-store" });
      const json = await response.json() as WorkspaceResponse;
      if (!response.ok) throw new Error(json.error || "Falha ao carregar.");
      applyResponse(json);
      setStatus("Salvo");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, [applyResponse, playerView]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    void load(params.get("tableId") ?? undefined);
  }, [load]);

  const action = useCallback(async <T extends Record<string, unknown>>(payload: T, options?: { reloadTableId?: string; silent?: boolean }) => {
    if (!options?.silent) setStatus("Salvando...");
    const response = await fetch("/api/rulebook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await response.json() as WorkspaceResponse;
    if (!response.ok) {
      const message = json.error || "Falha ao salvar.";
      setStatus(message);
      throw new Error(message);
    }
    if (json.tables) applyResponse(json);
    if (options?.reloadTableId) await load(options.reloadTableId);
    if (!options?.silent) setStatus("Salvo");
    return json;
  }, [applyResponse, load]);

  const search = useCallback(async (query: string, tableId = data.activeTableId) => {
    if (!query.trim()) return [] as SearchResult[];
    const params = new URLSearchParams({ tableId, search: query });
    if (playerView) params.set("view", "players");
    const response = await fetch(`/api/rulebook?${params.toString()}`, { cache: "no-store" });
    if (!response.ok) return [] as SearchResult[];
    const json = await response.json() as { results?: SearchResult[] };
    return json.results ?? [];
  }, [data.activeTableId, playerView]);

  const previewImport = useCallback(async (payload: unknown, tableId = data.activeTableId) => {
    const response = await fetch("/api/rulebook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "import-preview", tableId, payload }),
    });
    const json = await response.json() as ImportPreview & { error?: string };
    if (!response.ok) throw new Error(json.error || "Falha ao analisar arquivo.");
    return json;
  }, [data.activeTableId]);

  const recordRecent = useCallback(async (type: string, id: string, name: string) => {
    await action({ action: "record-recent", tableId: data.activeTableId, contentType: type, contentId: id, contentName: name }, { silent: true });
  }, [action, data.activeTableId]);

  return {
    data,
    recent,
    status,
    loading,
    setData,
    load,
    action,
    search,
    previewImport,
    recordRecent,
  };
}
