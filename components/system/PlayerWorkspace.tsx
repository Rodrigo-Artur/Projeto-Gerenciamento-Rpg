"use client";

import { PlayerView } from "@/components/system/PlayerView";
import { useWorkspaceApi } from "@/hooks/useWorkspaceApi";

export function PlayerWorkspace() {
  const { data, loading } = useWorkspaceApi(true);
  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-sm text-zinc-500">Carregando tela dos jogadores...</main>;
  }
  return <PlayerView data={data} />;
}
