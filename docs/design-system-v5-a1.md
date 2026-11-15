# Mesa do Mestre v5 — Fase 1 / Etapa A1

## Escopo entregue

Fundação de interface **sem mudanças no SQLite, API ou modelo de fichas**.
Os componentes existentes das telas v4 continuam funcionando: a adoção dos novos componentes ocorrerá por área nas etapas A2–C5.

- Tokens de design em `styles/tokens.css`, importados por `app/globals.css`.
- Tokens semânticos disponibilizados ao Tailwind CSS 4 via `@theme inline`: `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `success`, `warning` e `info`.
- Componentes revisados em `components/ui/`: `Button`, `Card`, `Badge`, `Input`, `Textarea`, `Dialog`. Componentes adicionais: `EmptyState`, `Skeleton`, `TextField`.
- Playground visual na rota **/design-system**, sem leitura/escrita de banco.

## Diretrizes visuais

| Uso | Token | Valor inicial |
|---|---|---|
| Canvas | `--mdm-canvas` | #0B0D12 |
| Card | `--mdm-surface` | #151922 |
| Superfície elevada | `--mdm-surface-raised` | #202633 |
| Borda | `--mdm-border` | #364052 |
| Texto | `--mdm-text` | #E9EDF4 |
| Texto secundário | `--mdm-text-muted` | #B0BAC9 |
| Ação/seleção | `--mdm-gold` | #E1B65D |
| Informação | `--mdm-blue` | #78B7EE |
| Sucesso | `--mdm-green` | #66D6A7 |
| Perigo | `--mdm-red` | #F18D94 |

Tokens de espaçamento `--mdm-space-{1,2,3,4,5,6,8}`, raios `--mdm-radius-{sm,md,lg,xl}`, durações `--mdm-duration-{fast,normal}` e sombras `--mdm-shadow-{panel,dialog}` são disponibilizados para componentes e CSS local.

## Exemplos

```tsx
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TextField } from "@/components/ui/text-field";
import { EmptyState } from "@/components/ui/empty-state";

// Botões podem indicar loading, mas devem receber disabled quando
// a ação não é permitida pelo modo Leitura.
<Button variant="default" loading={saving} disabled={!canEdit}>
  Salvar
</Button>
<Badge variant="success">Salvo</Badge>
<Card>
  <CardHeader><CardTitle>NPC</CardTitle></CardHeader>
  <CardContent>Conteúdo</CardContent>
</Card>
<TextField label="Nome" error={error} value={value} onChange={onChange} />
<EmptyState title="Nenhum NPC" description="Crie um NPC para começar." />
```

## Acessibilidade e proteção de dados

- `Dialog` utiliza Radix UI com gerenciamento de foco. Incluir `DialogTitle` e `DialogDescription` no conteúdo.
- `TextField` gera `id`, associa `label` e usa `aria-invalid`/`aria-describedby` e `role=alert` para erros.
- Inputs e botões têm estilo visível de foco via teclado; há resposta a `prefers-reduced-motion` e `prefers-contrast`.
- **Aparência de leitura não é autorização**: botões de salvar/excluir/criar devem checar `canEdit` e fornecer `disabled` ou não serem renderizados. A etapa A1 não muda os mecanismos atuais de autorização.
- A página de demonstração não acessa o banco e não grava dados.

## Validação antes de concluir a etapa

```bash
npm install
npx tsc --noEmit
npm run lint
npm run build
```

Revisão visual: abrir `http://localhost:3000/design-system`, navegar com Tab e Shift+Tab, abrir/fechar o diálogo com Enter/Esc, testar dimensões de tela e o modo de movimento reduzido.

## Próxima etapa (A2)

Extrair `AppShell`, `AppSidebar`, `Topbar`, `PageHeader` e `EditModeSwitch` de `SystemWorkspace.tsx`, mantendo contrato dos hooks e sistema de abas. Não antecipar mudanças no banco nesta fase.
