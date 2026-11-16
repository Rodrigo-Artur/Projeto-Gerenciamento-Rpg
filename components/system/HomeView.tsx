"use client";

import {
  Activity, BookOpen, CalendarDays, CalendarRange, Compass, FolderOpen,
  Heart, History, Library, Map, NotebookPen, ScrollText, ShieldCheck,
  Swords, UserRound, Users, type LucideIcon,
} from "lucide-react";

import { HomeHero } from "@/components/dashboard/HomeHero";
import { HomeItemButton, HomePanel, HomeStatCard } from "@/components/dashboard/HomePanels";
import { homeFavorites, nextCalendarEvents, selectHomeSessions } from "@/components/dashboard/home-data";
import type { HomeFavorite } from "@/components/dashboard/home-data";
import type { ViewId } from "@/components/layout/AppSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkspaceEmpty } from "@/components/ui/workspace-empty";
import type { RecentContent } from "@/hooks/useWorkspaceApi";
import type { RulebookData } from "@/types/rulebook";

type HomeViewProps = {
  data: RulebookData;
  recent: RecentContent[];
  loading?: boolean;
  onContinue: () => void;
  onSession: () => void;
  onCombat: () => void;
  onLibrary: () => void;
  onOpenTable: (tableId: string) => void;
  onOpenRecent: (item: RecentContent) => void;
  onOpenContent: (type: string, id: string, name: string) => void;
  onNavigate: (view: ViewId) => void;
};

const favoriteIcons: Record<HomeFavorite["type"], LucideIcon> = {
  npc: UserRound,
  player: Users,
  rule: BookOpen,
  entity: Map,
  note: NotebookPen,
};

function iconForRecent(type: string): LucideIcon {
  if (type === "npc") return UserRound;
  if (type === "player") return Users;
  if (type === "rule") return BookOpen;
  if (type === "note" || type === "session") return NotebookPen;
  if (["entity", "item", "location", "faction", "quest", "timeline"].includes(type)) return Map;
  return FolderOpen;
}

export function HomeView({
  data, recent, loading = false, onContinue, onSession, onCombat, onLibrary,
  onOpenTable, onOpenRecent, onOpenContent, onNavigate,
}: HomeViewProps) {
  const current = data.tables.find((item) => item.id === data.activeTableId);
  const system = data.systems.find((item) => item.id === current?.systemId)
    ?? data.systems.find((item) => item.id === data.activeSystemId);
  const { activeSession, nextSession } = selectHomeSessions(data);
  const session = activeSession ?? nextSession;
  const activeCombat = (data.combats ?? []).find((item) => item.status === "active");
  const favorites = homeFavorites(data).slice(0, 6);
  const events = nextCalendarEvents(data, 3);
  const recentItems = recent.slice(0, 6);
  const activity = (data.sessionLog ?? []).slice(-3).reverse();
  const otherTables = [
    ...(current ? [current] : []),
    ...data.tables.filter((item) => item.id !== current?.id),
  ].slice(0, 4);
  const calendar = data.runtime?.calendar;

  if (loading && data.tables.length === 0) {
    return (
      <div className="mdm-module mx-auto max-w-[1500px] space-y-5 p-4 sm:p-6 lg:p-8" role="status" aria-label="Carregando painel inicial">
        <Skeleton className="h-52 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-28 rounded-xl" />)}
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  if (data.tables.length === 0) {
    return (
      <div className="mdm-module mx-auto flex h-full max-w-4xl flex-col items-center justify-center gap-4 p-6">
        <WorkspaceEmpty kind="sessions" title="Sua mesa começa aqui" description="Crie uma mesa e escolha um sistema para organizar personagens, sessões e regras." />
        <div className="sr-only">Use a seção Gerenciar para criar sua primeira mesa.</div>
        <Button className="ml-4" onClick={() => onNavigate("dashboard")}>Gerenciar mesas</Button>
      </div>
    );
  }

  return (
    <main aria-label="Painel da campanha" className="mdm-module mx-auto max-w-[1500px] space-y-5 p-4 pb-10 sm:p-6 lg:space-y-6 lg:p-8">
      <HomeHero
        tableName={current?.name ?? "Sua campanha"}
        systemName={system?.name ?? "Sistema não definido"}
        description={current?.description}
        activeSession={activeSession}
        nextSession={nextSession}
        activeCombatName={activeCombat?.name}
        onContinue={onContinue}
        onOpenSession={onSession}
        onPrepareSession={() => onNavigate("sessions")}
        onOpenCombat={onCombat}
      />

      <section aria-label="Resumo da campanha" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <HomeStatCard icon={Users} label="Jogadores" value={data.players.length} caption="Fichas de personagens" />
        <HomeStatCard icon={UserRound} label="NPCs" value={data.npcs.length} caption="Aliados e adversários" />
        <HomeStatCard icon={CalendarDays} label="Sessões" value={data.sessions.length} caption={activeSession ? "Sessão em andamento" : "Campanha e planejamento"} />
        <HomeStatCard icon={Compass} label="Mundo" value={(data.entities ?? []).filter((item) => !item.archived).length} caption="Locais, itens e facções" />
      </section>

      <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <HomePanel
          icon={ScrollText}
          title="Preparação da sessão"
          description="O que vem pela frente na narrativa"
          action={{ label: "Abrir sessões", onClick: () => onNavigate("sessions") }}
        >
          {session ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={activeSession ? "success" : "secondary"}>{activeSession ? "Em andamento" : "Planejada"}</Badge>
                  {session.sessionNumber && <span className="text-xs text-muted-foreground">Sessão #{session.sessionNumber}</span>}
                </div>
                <h3 className="mt-2 text-base font-semibold text-foreground">{session.title}</h3>
                <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {session.summary || "Ainda não há um resumo preparado."}
                </p>
              </div>
              {session.scenes.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cenas preparadas</p>
                  <ol className="space-y-2">
                    {session.scenes.slice(0, 3).map((scene, index) => (
                      <li key={index} className="flex gap-3 text-sm text-foreground/90">
                        <span className="font-mono text-xs text-primary">{String(index + 1).padStart(2, "0")}</span>
                        <span className="line-clamp-2">{scene}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ) : (
            <WorkspaceEmpty kind="sessions" title="Nenhuma sessão preparada" description="Organize cenas e anotações para o próximo encontro." />
          )}
        </HomePanel>

        <HomePanel icon={ShieldCheck} title="Acesso rápido" description="Ferramentas usadas durante a mestragem">
          <div className="grid gap-2 sm:grid-cols-2">
            <HomeItemButton icon={Users} title="Fichas" meta="Players e NPCs" onClick={() => onNavigate("sheets")} />
            <HomeItemButton icon={BookOpen} title="Regras" meta="Sistema atual" onClick={() => onNavigate("rules")} />
            <HomeItemButton icon={Swords} title="Combate" meta="Iniciativa e PV" onClick={onCombat} />
            <HomeItemButton icon={Map} title="Mundo" meta="Itens e locais" onClick={() => onNavigate("world")} />
            <HomeItemButton icon={Library} title="Biblioteca" meta="Conteúdo reutilizável" onClick={onLibrary} />
            <HomeItemButton icon={CalendarRange} title="Campanha" meta="Relações e calendário" onClick={() => onNavigate("campaign")} />
          </div>
        </HomePanel>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-3">
        <HomePanel
          icon={Heart}
          title="Favoritos"
          description="Os conteúdos que você marcou para acesso rápido"
          action={{ label: "Ver fichas", onClick: () => onNavigate("sheets") }}
        >
          {favorites.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">Marque NPCs, personagens, regras ou locais com a estrela para encontrá-los aqui.</p>
          ) : (
            <div className="space-y-2">
              {favorites.map((favorite) => (
                <HomeItemButton
                  key={`${favorite.type}:${favorite.id}`}
                  icon={favoriteIcons[favorite.type]}
                  title={favorite.name}
                  meta={favorite.detail}
                  onClick={() => onOpenContent(favorite.type, favorite.id, favorite.name)}
                />
              ))}
            </div>
          )}
        </HomePanel>

        <HomePanel icon={History} title="Abertos recentemente" description="Retome a leitura sem procurar novamente">
          {recentItems.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">Os conteúdos abertos nesta mesa aparecerão aqui.</p>
          ) : (
            <div className="space-y-2">
              {recentItems.map((item) => (
                <HomeItemButton
                  key={`${item.type}:${item.id}`}
                  icon={iconForRecent(item.type)}
                  title={item.name}
                  meta={item.type}
                  onClick={() => onOpenRecent(item)}
                />
              ))}
            </div>
          )}
        </HomePanel>

        <HomePanel
          icon={Activity}
          title="Pulso da campanha"
          description="Calendário do mundo e atividades registradas"
          action={{ label: "Campanha", onClick: () => onNavigate("campaign") }}
        >
          <div className="space-y-4">
            <div className="rounded-xl border border-border/70 bg-background/65 p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{calendar?.calendarName || "Calendário da campanha"}</p>
              <p className="mt-1 font-mono text-lg font-semibold text-foreground">
                {calendar ? `Dia ${calendar.day} / ${calendar.month} / ${calendar.year}` : "Não configurado"}
              </p>
              <div className="mt-3 space-y-2">
                {events.length ? events.map((event) => (
                  <div key={event.id} className="flex gap-3 text-xs">
                    <span className="shrink-0 font-mono text-primary">{event.day}/{event.month}</span>
                    <span className="line-clamp-2 text-foreground/90">{event.title}</span>
                  </div>
                )) : <p className="text-xs text-muted-foreground">Nenhum evento futuro registrado.</p>}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Últimos registros</p>
              {activity.length ? (
                <div className="space-y-2">
                  {activity.map((entry) => (
                    <p key={entry.id} className="line-clamp-2 border-l-2 border-primary/45 pl-3 text-xs leading-relaxed text-muted-foreground">{entry.message}</p>
                  ))}
                </div>
              ) : <p className="text-xs text-muted-foreground">Ações da sessão serão registradas aqui.</p>}
            </div>
          </div>
        </HomePanel>
      </div>

      <HomePanel
        icon={FolderOpen}
        title="Suas mesas"
        description="Troque rapidamente de campanha"
        action={{ label: "Gerenciar mesas", onClick: () => onNavigate("dashboard") }}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {otherTables.map((table) => (
            <button
              type="button"
              key={table.id}
              aria-current={table.id === data.activeTableId ? "true" : undefined}
              onClick={() => { if (table.id !== data.activeTableId) onOpenTable(table.id); }}
              className={`group flex min-h-32 flex-col justify-between rounded-xl border p-4 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${table.id === data.activeTableId ? "border-primary/45 bg-primary/10" : "border-border/70 bg-background/60 hover:border-primary/35 hover:bg-accent/50"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="line-clamp-2 text-sm font-semibold text-foreground">{table.name}</p>
                {table.id === data.activeTableId && <Badge variant="success">Atual</Badge>}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{data.systems.find((item) => item.id === table.systemId)?.name ?? "Sistema"}</p>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground/90">{table.description || "Sem descrição"}</p>
            </button>
          ))}
        </div>
        {data.tables.length > otherTables.length && (
          <p className="mt-3 text-xs text-muted-foreground">Mais {data.tables.length - otherTables.length} mesa(s) disponíveis em Gerenciar.</p>
        )}
      </HomePanel>
    </main>
  );
}
