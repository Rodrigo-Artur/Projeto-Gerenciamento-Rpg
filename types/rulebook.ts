export type RuleCategory =
  | "combate"
  | "testes"
  | "atributos"
  | "defesa-dano"
  | "personagem"
  | "progressao"
  | "habilidades"
  | "armaduras"
  | "equipamentos"
  | "npcs"
  | "regras-da-casa";

export type SheetCategory =
  | "players"
  | "criminosos"
  | "policia-umck"
  | "ameacas-pesadas"
  | "simbiontes";

export type RpgSystem = {
  id: string;
  name: string;
  description: string;
};

export type RpgTable = {
  id: string;
  systemId: string;
  name: string;
  description: string;
};

export type TableNote = {
  id: string;
  title: string;
  content: string;
  isPrivate: boolean;
};

export type SessionPlan = {
  id: string;
  title: string;
  summary: string;
  scenes: string[];
  linkedRefs: string[];
  notes: string[];
};

export type ActivityEntry = {
  id: string;
  scope: "system" | "table";
  action: string;
  targetType: string;
  targetName: string;
  createdAt: string;
};

export type RuleArticle = {
  id: string;
  category: RuleCategory;
  title: string;
  summary: string;
  content: string;
  tags: string[];
};

export type LabeledValue = {
  label: string;
  value: string;
};

export type NpcSheet = {
  id: string;
  category: SheetCategory;
  name: string;
  role: string;
  description: string;
  stats: LabeledValue[];
  notes: string[];
};

export type PlayerAbility = {
  name: string;
  type: string;
  scale: string;
  cost: string;
  test: string;
  effect: string;
  limit?: string;
};

export type PlayerSheet = {
  id: string;
  characterName: string;
  playerName: string;
  role: string;
  tier: string;
  concept: string;
  status: LabeledValue[];
  attributes: LabeledValue[];
  resources: LabeledValue[];
  abilities: PlayerAbility[];
  notes: string[];
};

export type RulebookContent = {
  rules: RuleArticle[];
  npcs: NpcSheet[];
  players: PlayerSheet[];
  notes: TableNote[];
  sessions: SessionPlan[];
};

export type RulebookData = RulebookContent & {
  systems: RpgSystem[];
  tables: RpgTable[];
  activeTableId: string;
  activeSystemId: string;
  history: ActivityEntry[];
};

export type OpenPanel =
  | {
      id: string;
      type: "rule";
      refId: string;
      title: string;
    }
  | {
      id: string;
      type: "npc";
      refId: string;
      title: string;
    }
  | {
      id: string;
      type: "player";
      refId: string;
      title: string;
    }
  | {
      id: string;
      type: "note";
      refId: string;
      title: string;
    }
  | {
      id: string;
      type: "session";
      refId: string;
      title: string;
    };
