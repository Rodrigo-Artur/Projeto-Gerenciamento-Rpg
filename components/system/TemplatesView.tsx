"use client";

import { Plus, Settings2, Trash2 } from "lucide-react";
import { useState } from "react";

import { SystemConfigEditor } from "@/components/system/SystemConfigEditor";
import { WorkspaceEmpty } from "@/components/ui/workspace-empty";
import { WorkspaceListEmpty } from "@/components/ui/workspace-feedback";
import type { RulebookData, SheetCategory, SheetTemplate, TemplateField, TemplateFieldType } from "@/types/rulebook";

const kinds: SheetTemplate["kind"][] = ["player", "npc", "boss", "monster", "companion", "custom"];
const fieldTypes: TemplateFieldType[] = ["text", "textarea", "number", "select", "checkbox", "list", "stats", "abilities"];
const fallbackCategories: SheetCategory[] = ["criminosos", "policia-umck", "ameacas-pesadas", "simbiontes", "bosses", "aliados", "monstros", "custom"];

export function TemplatesView({ data, action }: { data: RulebookData; action: (payload: Record<string, unknown>) => Promise<unknown> }) {
  const templates = data.templates ?? [];
  const [selectedId, setSelectedId] = useState<string>("__config__");
  const selected = templates.find((item) => item.id === selectedId);

  async function createTemplate() {
    const template: SheetTemplate = {
      id: `template-${Date.now()}`,
      systemId: data.activeSystemId,
      name: "Novo template",
      description: "Modelo customizado de ficha.",
      kind: "custom",
      defaultCategory: "custom",
      fields: [
        { id: "name", label: "Nome", type: "text", required: true, section: "Identidade" },
        { id: "notes", label: "Notas", type: "textarea", section: "Notas" },
      ],
    };
    await action({ action: "upsert-template", tableId: data.activeTableId, systemId: data.activeSystemId, item: template });
    setSelectedId(template.id);
  }

  return (
    <div className="mdm-module workspace-list-detail workspace-list-detail--320 grid h-full min-h-0 overflow-hidden">
      <aside className="mdm-list-pane mdm-scroll-area overflow-y-auto border-r border-border bg-card/60 p-4">
        <button onClick={() => setSelectedId("__config__")} className={`mdm-list-entry flex w-full items-center gap-3 rounded-lg border p-3 text-left ${selectedId === "__config__" ? "border-primary/50 bg-primary/10" : "border-border bg-background"}`}>
          <Settings2 className="h-4 w-4 text-primary" />
          <div><p className="font-medium text-foreground">Configuração do sistema</p><p className="text-xs text-muted-foreground">Atributos, recursos e categorias</p></div>
        </button>
        <div className="mt-5 flex items-center justify-between gap-2">
          <div><p className="text-sm font-semibold text-foreground">Templates</p><p className="text-xs text-muted-foreground">{templates.length} modelo(s)</p></div>
          <button onClick={() => void createTemplate()} className="icon-button"><Plus className="h-4 w-4" /></button>
        </div>
        <div className="mt-4 space-y-2">
          {templates.length === 0 && <WorkspaceListEmpty title="Sem templates" description="Ative a Edição para criar seu primeiro modelo de ficha." />}
          {templates.map((template) => (
            <button key={template.id} onClick={() => setSelectedId(template.id)} className={`mdm-list-entry w-full rounded-lg border p-3 text-left ${selected?.id === template.id ? "border-primary/50 bg-primary/10" : "border-border bg-background"}`}>
              <p className="font-medium text-foreground">{template.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{template.kind} • {template.fields.length} campos</p>
            </button>
          ))}
        </div>
      </aside>
      <section className="mdm-detail-pane mdm-scroll-area overflow-y-auto p-6">
        {selectedId === "__config__" ? <SystemConfigEditor key={data.activeSystemId} data={data} action={action} /> : null}
        {selected ? <TemplateEditor key={selected.id} item={selected} data={data} action={action} /> : selectedId !== "__config__" ? <WorkspaceEmpty kind="templates" title="Template não encontrado" description="Selecione outro modelo de ficha ou crie um novo." /> : null}
      </section>
    </div>
  );
}

function TemplateEditor({ item, data, action }: { item: SheetTemplate; data: RulebookData; action: (payload: Record<string, unknown>) => Promise<unknown> }) {
  const [draft, setDraft] = useState(item);
  const categories = (data.systemConfig?.sheetCategories?.filter((item) => item !== "players") ?? fallbackCategories) as SheetCategory[];

  function patchField(index: number, patch: Partial<TemplateField>) {
    setDraft({ ...draft, fields: draft.fields.map((field, current) => current === index ? { ...field, ...patch } : field) });
  }

  function addField() {
    setDraft({
      ...draft,
      fields: [...draft.fields, { id: `field-${Date.now()}`, label: "Novo campo", type: "text", section: "Geral" }],
    });
  }

  async function save() {
    await action({ action: "upsert-template", tableId: data.activeTableId, systemId: data.activeSystemId, item: { ...draft, systemId: data.activeSystemId } });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div><p className="mdm-section-kicker text-xs uppercase tracking-[0.2em] text-primary">Construtor de sistema</p><h2 className="mt-1 text-2xl font-bold">{draft.name}</h2><p className="text-sm text-muted-foreground">As mesas que usam este sistema podem criar fichas a partir deste modelo.</p></div>
        <button onClick={async () => { if (confirm(`Excluir o template ${draft.name}?`)) await action({ action: "delete-template", tableId: data.activeTableId, systemId: data.activeSystemId, id: draft.id }); }} className="icon-button text-destructive"><Trash2 className="h-4 w-4" /></button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Nome" value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} />
        <label className="form-label">Tipo<select value={draft.kind} onChange={(event) => setDraft({ ...draft, kind: event.target.value as SheetTemplate["kind"] })} className="field mt-2">{kinds.map((kind) => <option key={kind}>{kind}</option>)}</select></label>
        <label className="form-label">Categoria padrão<select value={draft.defaultCategory ?? "custom"} onChange={(event) => setDraft({ ...draft, defaultCategory: event.target.value as SheetCategory })} className="field mt-2">{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
        <Field label="Descrição" value={draft.description} onChange={(value) => setDraft({ ...draft, description: value })} />
      </div>

      <div className="rounded-xl border border-border bg-card/60 p-4">
        <div className="flex items-center justify-between"><div><p className="font-semibold text-foreground">Campos da ficha</p><p className="text-xs text-muted-foreground">Defina seções, tipos, opções e valores padrão.</p></div><button onClick={addField} className="secondary-button"><Plus className="h-3.5 w-3.5" />Campo</button></div>
        <div className="mt-4 space-y-3">
          {draft.fields.map((field, index) => (
            <div key={`${field.id}-${index}`} className="rounded-lg border border-border bg-background p-4">
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_180px_1fr_auto]">
                <Field label="ID" value={field.id} onChange={(value) => patchField(index, { id: value })} />
                <Field label="Rótulo" value={field.label} onChange={(value) => patchField(index, { label: value })} />
                <label className="form-label">Tipo<select value={field.type} onChange={(event) => patchField(index, { type: event.target.value as TemplateFieldType })} className="field mt-2">{fieldTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
                <Field label="Seção" value={field.section ?? "Geral"} onChange={(value) => patchField(index, { section: value })} />
                <button onClick={() => setDraft({ ...draft, fields: draft.fields.filter((_, current) => current !== index) })} className="mt-6 icon-button text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <Field label="Valor padrão" value={typeof field.defaultValue === "string" || typeof field.defaultValue === "number" ? String(field.defaultValue) : ""} onChange={(value) => patchField(index, { defaultValue: value })} />
                <Field label="Opções (separadas por vírgula)" value={field.options?.join(", ") ?? ""} onChange={(value) => patchField(index, { options: value.split(",").map((option) => option.trim()).filter(Boolean) })} />
                <Field label="Ajuda" value={field.helpText ?? ""} onChange={(value) => patchField(index, { helpText: value })} />
              </div>
              <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={Boolean(field.required)} onChange={(event) => patchField(index, { required: event.target.checked })} />Campo obrigatório</label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end"><button onClick={() => void save()} className="primary-button">Salvar template</button></div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="form-label">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="field mt-2" /></label>;
}
