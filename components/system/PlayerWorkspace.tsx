"use client";

import { PlayerView } from "@/components/system/PlayerView";
import { useWorkspaceApi } from "@/hooks/useWorkspaceApi";

export function PlayerWorkspace() {
  const { data, loading } = useWorkspaceApi(true);
  if (loading) {
    return <main className="mdm-module flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">Carregando tela dos jogadores...</main>;
  }
  return <PlayerView data={data} />;
}
