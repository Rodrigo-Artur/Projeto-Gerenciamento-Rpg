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

export type RulebookData = {
  rules: RuleArticle[];
  npcs: NpcSheet[];
  players: PlayerSheet[];
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
    };
