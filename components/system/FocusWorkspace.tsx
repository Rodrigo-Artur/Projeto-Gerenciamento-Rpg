"use client";

import { ExternalLink, Image as ImageIcon } from "lucide-react";

import { useWorkspaceApi } from "@/hooks/useWorkspaceApi";
import type { RulebookData } from "@/types/rulebook";

export function FocusWorkspace() {
  const { data, loading } = useWorkspaceApi(false);
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const type = params.get("type") ?? "";
  const id = params.get("id") ?? "";
  if (loading) return <main className="mdm-module flex min-h-screen items-center justify-center bg-background text-muted-foreground">Carregando painel...</main>;
  const item = resolveItem(data, type, id);
  if (!item) return <main className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Conteúdo não encontrado.</main>;

  return <main className="min-h-screen bg-background p-5 text-foreground"><div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-border bg-card/70"><header className="border-b border-border p-5"><p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary"><ExternalLink className="h-4 w-4" />Painel destacável • {type}</p><h1 className="mt-1 text-2xl font-black">{item.title}</h1>{item.subtitle && <p className="mt-1 text-sm text-muted-foreground">{item.subtitle}</p>}</header>{item.imageUrl ? <img src={item.imageUrl} alt={item.title} referrerPolicy="no-referrer" className="max-h-[420px] w-full object-contain bg-background" /> : null}<div className="space-y-5 p-5">{item.sections.map((section) => <section key={section.title} className="rounded-xl border border-border bg-background p-4"><h2 className="font-semibold text-primary">{section.title}</h2>{section.lines.length ? <div className="mt-3 space-y-2">{section.lines.map((line, index) => <p key={index} className="whitespace-pre-wrap text-sm leading-6 text-foreground/90">{line}</p>)}</div> : <p className="mt-2 text-sm text-muted-foreground/80">Sem conteúdo.</p>}</section>)}</div></div></main>;
}

function resolveItem(data: RulebookData, type: string, id: string) {
  if (type === "npc") {
    const item = data.npcs.find((entry) => entry.id === id); if (!item) return undefined;
    return { title: item.name, subtitle: `${item.category} • ${item.role}`, imageUrl: item.meta?.imageUrl, sections: [{ title: "Descrição", lines: [item.description] }, { title: "Status", lines: item.stats.map((row) => `${row.label}: ${row.value}`) }, { title: "Habilidades", lines: (item.abilities ?? []).map((ability) => `${ability.name} — ${ability.damage ?? ""}\n${ability.effect}`) }, { title: "Notas", lines: item.notes }] };
  }
  if (type === "player") {
    const item = data.players.find((entry) => entry.id === id); if (!item) return undefined;
    return { title: item.characterName, subtitle: `${item.playerName} • ${item.role} • ${item.tier}`, imageUrl: item.meta?.imageUrl, sections: [{ title: "Conceito", lines: [item.concept] }, { title: "Status", lines: item.status.map((row) => `${row.label}: ${row.value}`) }, { title: "Atributos", lines: item.attributes.map((row) => `${row.label}: ${row.value}`) }, { title: "Recursos", lines: item.resources.map((row) => `${row.label}: ${row.value}`) }, { title: "Notas", lines: item.notes }] };
  }
  if (type === "rule") {
    const item = data.rules.find((entry) => entry.id === id); if (!item) return undefined;
    return { title: item.title, subtitle: item.category, imageUrl: item.meta?.imageUrl, sections: [{ title: "Resumo", lines: [item.summary] }, { title: "Regra", lines: [item.content] }, { title: "Tags", lines: item.tags }] };
  }
  if (type === "entity") {
    const item = data.entities?.find((entry) => entry.id === id); if (!item) return undefined;
    const imageUrl = typeof item.data?.imageUrl === "string" ? item.data.imageUrl : undefined;
    return { title: item.name, subtitle: item.type, imageUrl, sections: [{ title: "Resumo", lines: [item.summary] }, { title: "Conteúdo", lines: [item.content] }, { title: "Tags", lines: item.tags }] };
  }
  if (type === "note") {
    const item = data.notes.find((entry) => entry.id === id); if (!item) return undefined;
    return { title: item.title, subtitle: item.isPrivate ? "Nota privada" : "Nota", sections: [{ title: "Conteúdo", lines: [item.content] }] };
  }
  if (type === "session") {
    const item = data.sessions.find((entry) => entry.id === id); if (!item) return undefined;
    return { title: item.title, subtitle: item.status ?? "planned", sections: [{ title: "Resumo", lines: [item.summary] }, { title: "Cenas", lines: item.scenes }, { title: "Notas", lines: item.notes }] };
  }
  if (type === "handout") {
    const item = data.handouts?.find((entry) => entry.id === id); if (!item) return undefined;
    return { title: item.title, subtitle: item.visibility === "players" ? "Revelado" : "Mestre", imageUrl: item.imageUrl, sections: [{ title: "Conteúdo", lines: [item.content] }] };
  }
  return { title: "Conteúdo", subtitle: type, sections: [{ title: "Dados", lines: ["Este tipo de conteúdo não possui visualizador especializado."] }], imageUrl: undefined };
}
