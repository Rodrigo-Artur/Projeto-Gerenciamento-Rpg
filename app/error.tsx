"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

/** Next.js route error boundary: React render errors, not async save failures. */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-5 text-foreground">
      <EmptyState
        className="w-full max-w-lg border-destructive/40"
        icon={<TriangleAlert aria-hidden="true" />}
        title="Não foi possível mostrar esta tela"
        description="Ocorreu um problema inesperado na interface. Seus arquivos de campanha não são apagados por este aviso."
        action={
          <Button onClick={() => reset()}>
            <RefreshCw aria-hidden="true" /> Tentar abrir novamente
          </Button>
        }
      />
    </main>
  );
}
