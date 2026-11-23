"use client";

import { useMemo, useRef, useState } from "react";
import { CalendarClock, GripVertical, Layers3 } from "lucide-react";
import {
  KanbanBoard, KanbanCard, KanbanCards, KanbanHeader, KanbanProvider,
  type DragEndEvent,
} from "@/components/kibo-ui/kanban";
import type { SessionPlan } from "@/types/rulebook";

type SessionStatus = NonNullable<SessionPlan["status"]>;
type BoardCard = { id: string; name: string; column: SessionStatus; session: SessionPlan };
type Column = { id: SessionStatus; name: string };

const columns: Column[] = [
  { id: "planned", name: "Planejadas" },
  { id: "running", name: "Em andamento" },
  { id: "completed", name: "Concluídas" },
];

function mapCards(sessions: SessionPlan[]): BoardCard[] {
  return sessions.map((session) => ({
    id: session.id, name: session.title, column: session.status ?? "planned", session,
  }));
}

export function SessionKanbanBoard({
  sessions, canEdit, onOpen, onStatusChange,
}: {
  sessions: SessionPlan[];
  canEdit: boolean;
  onOpen: (session: SessionPlan) => void;
  onStatusChange: (session: SessionPlan, status: SessionStatus) => Promise<void>;
}) {
  const [previewCards, setPreviewCards] = useState<BoardCard[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const cardsRef = useRef<BoardCard[]>([]);
  const dragEnded = useRef(false);
  const initialCards = useMemo(() => mapCards(sessions), [sessions]);
  const cards = previewCards ?? initialCards;

  function updateCards(next: BoardCard[]) {
    if (dragEnded.current) return;
    // The upstream Kanban mutates a shallow copy on drag-over. Keep our own objects.
    const safe = next.map((item) => ({ ...item }));
    cardsRef.current = safe;
    setPreviewCards(safe);
  }

  function dropped(event: DragEndEvent) {
    dragEnded.current = true;
    if (!canEdit || !event.over || busyId) {
      setPreviewCards(null);
      return;
    }
    const id = String(event.active.id);
    const source = sessions.find((item) => item.id === id);
    if (!source) return;
    const targetId = String(event.over.id);
    const targetColumn = columns.find((item) => item.id === targetId)?.id
      ?? cardsRef.current.find((item) => item.id === targetId)?.column
      ?? cardsRef.current.find((item) => item.id === id)?.column;
    if (!targetColumn || targetColumn === (source.status ?? "planned")) {
      setPreviewCards(null);
      return;
    }
    setBusyId(id);
    setError("");
    const preview = cardsRef.current.map((item) =>
      item.id === id ? { ...item, column: targetColumn } : item
    );
    setPreviewCards(preview);
    void onStatusChange(source, targetColumn).catch(() => {
      setError("Não foi possível salvar a alteração. O quadro voltou ao estado anterior.");
    }).finally(() => {
      setBusyId(null);
      setPreviewCards(null);
    });
  }

  if (!sessions.length) {
    return (
      <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-6 text-center">
        <Layers3 aria-hidden="true" className="mb-2 size-7 text-primary" />
        <p className="text-sm font-semibold">Nenhuma sessão preparada</p>
        <p className="mt-1 text-xs text-muted-foreground">Crie sua primeira sessão na visualização de lista.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {canEdit ? "Arraste os cartões para mudar o status e salvar na campanha." : "Quadro de consulta. Ative o Modo Edição para mover sessões."}
        </p>
        {busyId && <span role="status" className="text-xs text-primary">Salvando status...</span>}
      </div>
      {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">{error}</p>}
      <div className="w-full overflow-x-auto pb-3">
        <KanbanProvider<BoardCard, Column>
          columns={columns}
          data={cards}
          className="min-h-[330px] min-w-[810px] grid-cols-3"
          sensors={canEdit && !busyId ? undefined : []}
          onDragStart={() => {
            cardsRef.current = mapCards(sessions);
            dragEnded.current = false;
          }}
          onDataChange={canEdit && !busyId ? updateCards : undefined}
          onDragEnd={dropped}
        >
          {(column) => (
            <KanbanBoard id={column.id} key={column.id} className="min-w-0 bg-card/65">
              <KanbanHeader className="flex items-center justify-between border-b border-border p-3 text-sm">
                {column.name}
                <span className="rounded-full bg-secondary px-2 py-0.5 font-mono text-xs text-muted-foreground">
                  {cards.filter((item) => item.column === column.id).length}
                </span>
              </KanbanHeader>
              <KanbanCards<BoardCard> id={column.id} className="min-h-[250px] gap-2 p-2">
                {(card) => (
                  <KanbanCard key={card.id} {...card} disabled={!canEdit || Boolean(busyId)} className="gap-2 rounded-lg border-border bg-background/85 p-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm font-semibold text-foreground">{card.name}</p>
                          {card.session.sessionNumber && <p className="text-[11px] text-muted-foreground">Sessão #{card.session.sessionNumber}</p>}
                        </div>
                        {canEdit && <GripVertical aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />}
                      </div>
                      {card.session.summary && (
                        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{card.session.summary}</p>
                      )}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-2">
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <CalendarClock aria-hidden="true" className="size-3" />
                          {card.session.scheduledFor || `${card.session.scenes.length} cena(s)`}
                        </span>
                        <button
                          type="button"
                          className="rounded px-1.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring"
                          onClick={(event) => { event.stopPropagation(); onOpen(card.session); }}
                          onPointerDown={(event) => event.stopPropagation()}
                        >
                          Abrir
                        </button>
                      </div>
                    </div>
                  </KanbanCard>
                )}
              </KanbanCards>
            </KanbanBoard>
          )}
        </KanbanProvider>
      </div>
    </div>
  );
}
