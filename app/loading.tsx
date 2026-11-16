import { WorkspaceLoading } from "@/components/ui/workspace-feedback";

export default function Loading() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <WorkspaceLoading label="Preparando o Mesa do Mestre..." />
    </main>
  );
}
