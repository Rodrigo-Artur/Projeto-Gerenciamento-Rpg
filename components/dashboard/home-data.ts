import type {
  RulebookData, SessionPlan, CalendarEvent,
} from "@/types/rulebook";

export type HomeFavorite = {
  type: "npc" | "player" | "rule" | "entity" | "note";
  id: string;
  name: string;
  detail: string;
};

export function selectHomeSessions(data: RulebookData): {
  activeSession?: SessionPlan;
  nextSession?: SessionPlan;
} {
  const activeSession =
    data.sessions.find((item) => item.id === data.runtime?.activeSessionId) ??
    data.sessions.find((item) => item.status === "running");

  // Primeiramente sessões planejadas com data; depois preparações sem data.
  const nextSession = data.sessions
    .filter((item) => item.id !== activeSession?.id && item.status !== "completed" && item.status !== "running")
    .sort((a, b) => {
      if (!a.scheduledFor && !b.scheduledFor) return (a.sessionNumber ?? 0) - (b.sessionNumber ?? 0);
      if (!a.scheduledFor) return 1;
      if (!b.scheduledFor) return -1;
      return a.scheduledFor.localeCompare(b.scheduledFor);
    })[0];

  return { activeSession, nextSession };
}

export function homeFavorites(data: RulebookData): HomeFavorite[] {
  return [
    ...data.npcs.filter((item) => item.meta?.favorite && !item.meta?.archived).map((item) => ({
      type: "npc" as const, id: item.id, name: item.name, detail: item.role || "NPC",
    })),
    ...data.players.filter((item) => item.meta?.favorite && !item.meta?.archived).map((item) => ({
      type: "player" as const, id: item.id, name: item.characterName, detail: item.playerName || "Personagem",
    })),
    ...data.rules.filter((item) => item.meta?.favorite && !item.meta?.archived).map((item) => ({
      type: "rule" as const, id: item.id, name: item.title, detail: item.category,
    })),
    ...(data.entities ?? []).filter((item) => item.favorite && !item.archived).map((item) => ({
      type: "entity" as const, id: item.id, name: item.name, detail: item.type,
    })),
    ...data.notes.filter((item) => item.favorite).map((item) => ({
      type: "note" as const, id: item.id, name: item.title, detail: "Nota da mesa",
    })),
  ];
}

export function nextCalendarEvents(data: RulebookData, limit = 3): CalendarEvent[] {
  const calendar = data.runtime?.calendar;
  if (!calendar) return [];
  const current = [calendar.year, calendar.month, calendar.day];
  return (calendar.events ?? [])
    .filter((item) => {
      const value = [item.year, item.month, item.day];
      for (let index = 0; index < 3; index++) {
        if (value[index] > current[index]) return true;
        if (value[index] < current[index]) return false;
      }
      return true;
    })
    .sort((a, b) => a.year - b.year || a.month - b.month || a.day - b.day)
    .slice(0, limit);
}

export function sessionDateLabel(date?: string): string | undefined {
  if (!date) return undefined;
  // Evita diferenças de fuso ao interpretar YYYY-MM-DD como meia-noite UTC.
  const found = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  return found ? `${found[3]}/${found[2]}/${found[1]}` : date;
}
