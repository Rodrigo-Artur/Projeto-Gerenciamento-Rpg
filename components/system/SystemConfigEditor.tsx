"use client";

import { Save, Settings2 } from "lucide-react";
import { useState } from "react";

import type { RpgSystemConfig, RulebookData } from "@/types/rulebook";

const fallback: RpgSystemConfig = {
  attributes: ["Força", "Constituição", "Destreza", "Inteligência", "Sabedoria", "Carisma"],
  resources: ["HP", "Energia", "Redução", "Regeneração"],
  sheetCategories: ["players", "criminosos", "policia-umck", "ameacas-pesadas", "simbiontes", "bosses", "aliados", "monstros", "custom"],
  ruleCategories: ["combate", "testes", "atributos", "defesa-dano", "personagem", "progressao", "habilidades", "armaduras", "equipamentos", "npcs", "regras-da-casa"],
  conditions: ["Agarrado", "Amedrontado", "Atordoado", "Caído", "Exposto", "Sangrando", "Envenenado", "Paralisado"],
};

function toText(items: string[]) {
  return items.join("\n");
}

function fromText(value: string) {
  return Array.from(new Set(value.split("\n").map((item) => item.trim()).filter(Boolean)));
}

export function SystemConfigEditor({ data, action }: { data: RulebookData; action: (payload: Record<string, unknown>) => Promise<unknown> }) {
  const initial = data.systemConfig ?? fallback;
  const [attributes, setAttributes] = useState(toText(initial.attributes));
  const [resources, setResources] = useState(toText(initial.resources));
  const [sheetCategories, setSheetCategories] = useState(toText(initial.sheetCategories));
  const [ruleCategories, setRuleCategories] = useState(toText(initial.ruleCategories));
  const [conditions, setConditions] = useState(toText(initial.conditions));

  async function save() {
    await action({
      action: "save-system-config",
      tableId: data.activeTableId,
      systemId: data.activeSystemId,
      config: {
        attributes: fromText(attributes),
        resources: fromText(resources),
        sheetCategories: fromText(sheetCategories),
        ruleCategories: fromText(ruleCategories),
        conditions: fromText(conditions),
      },
    });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-amber-400"><Settings2 className="h-4 w-4" />Configuração do sistema</p>
        <h2 className="mt-1 text-2xl font-bold text-zinc-100">Definições compartilhadas</h2>
        <p className="mt-1 text-sm text-zinc-500">Estas listas pertencem ao sistema de RPG e ficam disponíveis em todas as mesas que o utilizam.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ConfigArea label="Atributos" help="Um por linha. Ex.: Força, Destreza, Espírito." value={attributes} onChange={setAttributes} />
        <ConfigArea label="Recursos" help="Um por linha. Ex.: HP, Mana, Sanidade, Energia." value={resources} onChange={setResources} />
        <ConfigArea label="Categorias de ficha" help="Um ID por linha. Podem ser totalmente customizadas." value={sheetCategories} onChange={setSheetCategories} />
        <ConfigArea label="Categorias de regras" help="Um ID por linha. Define a organização das regras." value={ruleCategories} onChange={setRuleCategories} />
      </div>
      <ConfigArea label="Condições de combate" help="Usadas como sugestões rápidas no tracker de combate." value={conditions} onChange={setConditions} />
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-sm text-zinc-400">
        <p className="font-semibold text-amber-300">Exemplo de sistema completamente diferente</p>
        <p className="mt-2">Você pode trocar os seis atributos por Corpo, Mente e Espírito; substituir HP/Energia por Sanidade e Mana; e criar categorias próprias como Investigadores, Criaturas, Relíquias ou qualquer outra estrutura.</p>
      </div>
      <div className="flex justify-end"><button onClick={() => void save()} className="primary-button"><Save className="h-4 w-4" />Salvar configuração</button></div>
    </div>
  );
}

function ConfigArea({ label, help, value, onChange }: { label: string; help: string; value: string; onChange: (value: string) => void }) {
  return <label className="form-label block">{label}<span className="mt-1 block text-[11px] font-normal normal-case tracking-normal text-zinc-600">{help}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} rows={8} className="field mt-2" /></label>;
}
