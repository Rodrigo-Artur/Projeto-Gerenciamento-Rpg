"use client";

import { Clock3, LockKeyhole, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

type EditModeSwitchProps = {
  editMode: boolean;
  itemEditMode: boolean;
  canEditItem: boolean;
  timeoutMinutes: number;
  onRead: () => void;
  onEdit: () => void;
  onEditItem: () => void;
  onTimeoutChange: (minutes: number) => void;
};

export function EditModeSwitch({
  editMode, itemEditMode, canEditItem, timeoutMinutes,
  onRead, onEdit, onEditItem, onTimeoutChange,
}: EditModeSwitchProps) {
  const isReading = !editMode && !itemEditMode;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div role="group" aria-label="Modo de acesso" className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-secondary/65 p-1">
        <button
          type="button"
          aria-pressed={isReading}
          onClick={onRead}
          className={cn("inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring", isReading ? "bg-success/15 text-success" : "text-muted-foreground hover:bg-accent hover:text-foreground")}
        ><LockKeyhole aria-hidden="true" className="size-3.5" />Leitura</button>
        <button
          type="button"
          aria-pressed={editMode}
          title="Editar conteúdo — Ctrl+Shift+E"
          onClick={onEdit}
          className={cn("inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring", editMode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground")}
        ><Pencil aria-hidden="true" className="size-3.5" />Edição</button>
        {canEditItem && !editMode && (
          <button
            type="button"
            aria-pressed={itemEditMode}
            title="Editar somente o item aberto"
            onClick={onEditItem}
            className={cn("inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring", itemEditMode ? "bg-info/20 text-info" : "text-muted-foreground hover:bg-accent hover:text-foreground")}
          ><Pencil aria-hidden="true" className="size-3.5" />Item</button>
        )}
      </div>
      <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground" title="Tempo até bloquear a edição automaticamente">
        <Clock3 aria-hidden="true" className="size-3.5" />
        <span className="sr-only">Bloqueio automático da edição</span>
        <select
          aria-label="Bloqueio automático da edição"
          value={timeoutMinutes}
          onChange={(event) => onTimeoutChange(Number(event.target.value))}
          className="h-9 rounded-md border border-border bg-secondary px-2 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value={1}>1 min</option>
          <option value={5}>5 min</option>
          <option value={15}>15 min</option>
          <option value={0}>Nunca</option>
        </select>
      </label>
    </div>
  );
}
