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
  | "regras-da-casa"
  | (string & {});

export type SheetCategory =
  | "players"
  | "criminosos"
  | "policia-umck"
  | "ameacas-pesadas"
  | "simbiontes"
  | "bosses"
  | "aliados"
  | "monstros"
  | "custom"
  | (string & {});

export type Visibility = "master" | "players";

export type ContentMeta = {
  visibility?: Visibility;
  favorite?: boolean;
  archived?: boolean;
  templateId?: string;
  customFields?: Record<string, unknown>;
  imageUrl?: string;
  imageAlt?: string;
  createdAt?: string;
  updatedAt?: string;
  lastOpenedAt?: string;
};

export type RpgSystem = {
  id: string;
  name: string;
  description: string;
};

export type RpgSystemConfig = {
  attributes: string[];
  resources: string[];
  sheetCategories: string[];
  ruleCategories: string[];
  conditions: string[];
};

export type RpgTable = {
  id: string;
  systemId: string;
  name: string;
  description: string;
};

export type ContentRef = {
  type: "rule" | "npc" | "player" | "note" | "session" | "entity" | "handout" | "library";
  id: string;
  label?: string;
};

export type TableNote = {
  id: string;
  title: string;
  content: string;
  isPrivate: boolean;
  tags?: string[];
  favorite?: boolean;
  visibility?: Visibility;
};

export type SessionPlan = {
  id: string;
  title: string;
  summary: string;
  scenes: string[];
  linkedRefs: string[];
  linkedItems?: ContentRef[];
  notes: string[];
  status?: "planned" | "running" | "completed";
  sessionNumber?: number;
  scheduledFor?: string;
  visibility?: Visibility;
};

export type ActivityEntry = {
  id: string;
  scope: "system" | "table";
  action: string;
  targetType: string;
  targetName: string;
  createdAt: string;
  targetId?: string;
  snapshotId?: string;
  details?: string;
};

export type RuleArticle = {
  id: string;
  category: RuleCategory;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  meta?: ContentMeta;
};

export type LabeledValue = {
  label: string;
  value: string;
};

export type StructuredAbility = {
  id: string;
  name: string;
  type: string;
  scale?: string;
  cost?: string;
  test?: string;
  range?: string;
  duration?: string;
  cooldown?: string;
  damage?: string;
  effect: string;
  limitation?: string;
  currentCooldown?: number;
  uses?: number;
  maxUses?: number;
  resourceName?: string;
  resourceCost?: number;
  rollExpression?: string;
  trigger?: "manual" | "hp-half" | "hp-quarter" | "round-start" | "round-end";
};

export type NpcSheet = {
  id: string;
  category: SheetCategory;
  name: string;
  role: string;
  description: string;
  stats: LabeledValue[];
  notes: string[];
  abilities?: StructuredAbility[];
  meta?: ContentMeta;
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
  structuredAbilities?: StructuredAbility[];
  notes: string[];
  meta?: ContentMeta;
};

export type TemplateFieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "checkbox"
  | "list"
  | "stats"
  | "abilities";

export type TemplateField = {
  id: string;
  label: string;
  type: TemplateFieldType;
  required?: boolean;
  defaultValue?: string | number | boolean | string[];
  options?: string[];
  section?: string;
  helpText?: string;
};

export type SheetTemplate = {
  id: string;
  systemId: string;
  name: string;
  description: string;
  kind: "player" | "npc" | "boss" | "monster" | "companion" | "custom";
  fields: TemplateField[];
  defaultCategory?: SheetCategory;
};

export type WorldEntityType = "item" | "location" | "faction" | "quest" | "timeline" | "calendar-event";

export type WorldEntity = {
  id: string;
  tableId: string;
  type: WorldEntityType;
  name: string;
  summary: string;
  content: string;
  tags: string[];
  visibility: Visibility;
  favorite: boolean;
  archived: boolean;
  data?: Record<string, unknown>;
};

export type TimedCondition = {
  id: string;
  name: string;
  remainingRounds?: number;
  tick?: "start" | "end";
  effect?: string;
};

export type CombatParticipant = {
  id: string;
  sourceType: "player" | "npc" | "custom";
  sourceId?: string;
  name: string;
  initiative: number;
  hpCurrent: number;
  hpMax: number;
  tempHp?: number;
  armorClass?: number;
  conditions: string[];
  timedConditions?: TimedCondition[];
  resources: LabeledValue[];
  abilities: StructuredAbility[];
  hidden?: boolean;
  phase?: string;
  imageUrl?: string;
};

export type CombatState = {
  id: string;
  tableId: string;
  name: string;
  round: number;
  turnIndex: number;
  status: "prepared" | "active" | "finished";
  participants: CombatParticipant[];
  notes: string[];
  updatedAt?: string;
};

export type BackupSummary = {
  id: string;
  tableId: string;
  reason: string;
  createdAt: string;
};

export type LibraryItemType = "rule" | "npc" | "player" | "entity" | "template" | "encounter" | "custom";

export type LibraryItem = {
  id: string;
  systemId?: string;
  type: LibraryItemType;
  name: string;
  description: string;
  tags: string[];
  imageUrl?: string;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ContentPack = {
  id: string;
  name: string;
  description: string;
  libraryItemIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type CampaignRelation = {
  id: string;
  tableId: string;
  sourceType: "npc" | "player" | "entity";
  sourceId: string;
  sourceName: string;
  targetType: "npc" | "player" | "entity";
  targetId: string;
  targetName: string;
  relation: string;
  note?: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  day: number;
  month: number;
  year: number;
  description?: string;
  visibility?: Visibility;
};

export type WorldCalendar = {
  day: number;
  month: number;
  year: number;
  monthName?: string;
  calendarName?: string;
  events: CalendarEvent[];
};

export type SessionLogEntry = {
  id: string;
  tableId: string;
  sessionId?: string;
  kind: "system" | "combat" | "note" | "content" | "manual" | "snapshot";
  message: string;
  createdAt: string;
};

export type SessionSnapshot = {
  id: string;
  tableId: string;
  sessionId?: string;
  label: string;
  createdAt: string;
  summary?: string;
};

export type SnapshotComparison = {
  fromId: string;
  toId: string;
  added: string[];
  removed: string[];
  changed: string[];
  summary: string;
};

export type Handout = {
  id: string;
  tableId: string;
  title: string;
  content: string;
  imageUrl?: string;
  visibility: Visibility;
  revealedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceRuntime = {
  activeSessionId?: string;
  quickNotes: string[];
  calendar: WorldCalendar;
};

export type WorkspaceTab = {
  id: string;
  type: string;
  refId?: string;
  title: string;
  view: string;
  pinned?: boolean;
};

export type ImportConflict = {
  section: "rules" | "npcs" | "players" | "notes" | "sessions" | "templates" | "entities";
  id: string;
  name: string;
};

export type ImportPreview = {
  counts: Record<string, number>;
  conflicts: ImportConflict[];
  formatVersion: number;
  packageType: string;
};

export type MesaImportPackage = {
  format: "mesa-do-mestre" | "mesa-do-mestre-import-json";
  version: number;
  packageType: "system" | "table" | "system+table-content" | "content";
  exportedAt?: string;
  system?: Partial<RpgSystem>;
  table?: Partial<RpgTable>;
  data: Partial<RulebookContent> & {
    templates?: SheetTemplate[];
    entities?: WorldEntity[];
  };
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
  templates?: SheetTemplate[];
  entities?: WorldEntity[];
  combats?: CombatState[];
  backups?: BackupSummary[];
  systemConfig?: RpgSystemConfig;
  library?: LibraryItem[];
  packs?: ContentPack[];
  relations?: CampaignRelation[];
  runtime?: WorkspaceRuntime;
  sessionLog?: SessionLogEntry[];
  sessionSnapshots?: SessionSnapshot[];
  handouts?: Handout[];
};

export type OpenPanel =
  | { id: string; type: "rule"; refId: string; title: string }
  | { id: string; type: "npc"; refId: string; title: string }
  | { id: string; type: "player"; refId: string; title: string }
  | { id: string; type: "note"; refId: string; title: string }
  | { id: string; type: "session"; refId: string; title: string }
  | { id: string; type: "entity"; refId: string; title: string };
