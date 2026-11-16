import {
  BookOpen, FileText, FolderOpen, Library, Settings2,
  Swords, Users, type LucideIcon,
} from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";

export type WorkspaceEmptyKind =
  | "rules" | "sheets" | "world" | "sessions"
  | "combat" | "templates" | "library";

const icons: Record<WorkspaceEmptyKind, LucideIcon> = {
  rules: BookOpen,
  sheets: Users,
  world: FolderOpen,
  sessions: FileText,
  combat: Swords,
  templates: Settings2,
  library: Library,
};

type WorkspaceEmptyProps = {
  kind: WorkspaceEmptyKind;
  title: string;
  description?: string;
};

/**
 * Um estado vazio consistente em módulos com lista e editor.
 * Não inclui ações que contornariam o Modo Leitura.
 */
export function WorkspaceEmpty({ kind, title, description }: WorkspaceEmptyProps) {
  const Icon = icons[kind];
  return (
    <div className="flex h-full min-h-48 items-center justify-center p-4 sm:p-6">
      <EmptyState
        className="w-full max-w-lg border-border/70 bg-card/55"
        icon={<Icon aria-hidden="true" />}
        title={title}
        description={description}
      />
    </div>
  );
}
