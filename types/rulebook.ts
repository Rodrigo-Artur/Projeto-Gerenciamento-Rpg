export type RuleCategory =
  | "combate"
  | "testes"
  | "condicoes"
  | "personagem"
  | "equipamentos"
  | "magias"
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

export type NpcSheet = {
  id: string;
  name: string;
  role: string;
  description: string;
  stats: {
    label: string;
    value: string;
  }[];
  notes: string[];
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
    };
