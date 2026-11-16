import { ArrowRight, CalendarClock, Play, Sparkles, Swords } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SessionPlan } from "@/types/rulebook";
import { sessionDateLabel } from "@/components/dashboard/home-data";

type HomeHeroProps = {
  tableName: string;
  systemName: string;
  description?: string;
  activeSession?: SessionPlan;
  nextSession?: SessionPlan;
  activeCombatName?: string;
  onContinue: () => void;
  onOpenSession: () => void;
  onPrepareSession: () => void;
  onOpenCombat: () => void;
};

export function HomeHero({
  tableName, systemName, description, activeSession, nextSession,
  activeCombatName, onContinue, onOpenSession, onPrepareSession, onOpenCombat,
}: HomeHeroProps) {
  const session = activeSession ?? nextSession;
  return (
    <section
      aria-labelledby="home-campaign-title"
      className="relative isolate overflow-hidden rounded-2xl border border-primary/25 bg-card p-5 shadow-[var(--mdm-shadow-panel)] sm:p-7 xl:p-8"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_92%_12%,rgba(225,182,93,0.15),transparent_44%),radial-gradient(ellipse_at_0%_95%,rgba(120,183,238,0.08),transparent_40%)]" />
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default"><Sparkles aria-hidden="true" /> Campanha atual</Badge>
            <Badge variant="secondary">{systemName}</Badge>
            {activeSession && <Badge variant="success"><span aria-hidden="true" className="size-1.5 rounded-full bg-success" /> Sessão em andamento</Badge>}
          </div>
          <h2 id="home-campaign-title" className="font-heading text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">{tableName}</h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            {description?.trim() || "Sua central para preparar aventuras, consultar fichas e acompanhar a campanha."}
          </p>
        </div>
        <div className="flex w-full flex-wrap gap-2 xl:w-auto xl:max-w-[350px] xl:justify-end">
          <Button size="lg" onClick={activeSession ? onContinue : onPrepareSession}>
            {activeSession ? <Play aria-hidden="true" /> : <CalendarClock aria-hidden="true" />}
            {activeSession ? "Continuar sessão" : "Preparar sessão"}
            <ArrowRight aria-hidden="true" />
          </Button>
          <Button size="lg" variant="outline" onClick={onOpenSession}><CalendarClock aria-hidden="true" /> Modo Sessão</Button>
          {activeCombatName && <Button variant="ghost" onClick={onOpenCombat}><Swords aria-hidden="true" /> Abrir combate</Button>}
        </div>
      </div>

      <div className="relative z-10 mt-6 grid gap-3 border-t border-border/70 pt-5 sm:grid-cols-2">
        <div className="rounded-xl border border-border/70 bg-background/55 p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{activeSession ? "Sessão atual" : "Próxima preparação"}</p>
          <p className="mt-1 truncate text-sm font-semibold text-foreground" title={session?.title}>
            {session ? `${session.sessionNumber ? `#${session.sessionNumber} · ` : ""}${session.title}` : "Nenhuma sessão planejada"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {session?.scheduledFor ? `Prevista para ${sessionDateLabel(session.scheduledFor)}` : session ? "Abra o planejamento para consultar as cenas." : "Crie uma sessão para organizar a próxima aventura."}
          </p>
        </div>
        <div className="rounded-xl border border-border/70 bg-background/55 p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Combate</p>
          <p className="mt-1 truncate text-sm font-semibold text-foreground">{activeCombatName || "Nenhum combate em andamento"}</p>
          <p className="mt-1 text-xs text-muted-foreground">{activeCombatName ? "Acompanhe iniciativa, recursos e turnos." : "Prepare um encontro na seção Combate."}</p>
        </div>
      </div>
    </section>
  );
}
