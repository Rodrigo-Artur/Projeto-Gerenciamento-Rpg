"use client";

import { AlertCircle, CloudOff, LoaderCircle, RefreshCw, ShieldAlert, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

export function WorkspaceLoading({ label = "Carregando conteúdo da mesa..." }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className="mx-auto flex h-full min-h-[270px] max-w-6xl flex-col gap-5 overflow-y-auto p-4 sm:p-6 lg:p-8"
    >
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none text-primary" />
        <span>{label}</span>
      </div>
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Skeleton className="h-44 rounded-xl" />
        <Skeleton className="h-44 rounded-xl" />
      </div>
    </div>
  );
}

export function WorkspaceLoadError({
  message,
  onRetry,
  compact = false,
}: {
  message: string;
  onRetry: () => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border-b border-destructive/35 bg-destructive/10 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-start gap-2 text-sm text-foreground">
          <CloudOff aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p>
            <strong>Falha ao atualizar a mesa.</strong> {message}
            <span className="block text-xs text-muted-foreground">Os dados anteriores continuam visíveis; confirme a mesa ativa antes de editar.</span>
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onRetry}><RefreshCw aria-hidden="true" />Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[320px] items-center justify-center overflow-y-auto p-5">
      <EmptyState
        className="max-w-xl border-destructive/35"
        icon={<CloudOff />}
        title="Não foi possível carregar o Mesa do Mestre"
        description={message}
        action={
          <div className="flex flex-col items-center gap-2">
            <Button onClick={onRetry}><RefreshCw aria-hidden="true" />Tentar novamente</Button>
            <p className="max-w-sm text-xs text-muted-foreground">
              Verifique se o servidor local está funcionando. Não é necessário apagar ou recriar suas mesas.
            </p>
          </div>
        }
      />
    </div>
  );
}

export function WorkspaceSaveError({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div role="alert" className="flex flex-wrap items-start justify-between gap-3 border-b border-destructive/40 bg-destructive/10 px-4 py-3">
      <div className="flex min-w-0 flex-1 items-start gap-2.5">
        <ShieldAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-destructive" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-destructive">Falha ao salvar alterações</p>
          <p className="break-words text-sm text-foreground/90">{message}</p>
          <p className="text-xs text-muted-foreground">
            A gravação pode não ter sido concluída. Confira os dados antes de salvar novamente;
            não repita exclusões ou importações sem verificar o resultado.
          </p>
        </div>
      </div>
      <Button variant="ghost" size="icon-sm" aria-label="Dispensar aviso de salvamento" title="Dispensar aviso" onClick={onDismiss}>
        <X aria-hidden="true" />
      </Button>
    </div>
  );
}

export function WorkspaceListEmpty({
  title,
  description,
  isFiltered = false,
  onClear,
}: {
  title: string;
  description: string;
  isFiltered?: boolean;
  onClear?: () => void;
}) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-border/70 bg-background/50 p-4 text-center">
      <AlertCircle aria-hidden="true" className="mx-auto mb-2 size-5 text-muted-foreground" />
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
      {isFiltered && onClear && (
        <Button variant="ghost" size="sm" className="mt-3" onClick={onClear}>Limpar filtro</Button>
      )}
    </div>
  );
}
