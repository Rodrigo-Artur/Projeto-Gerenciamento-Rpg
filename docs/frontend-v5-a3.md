# Mesa do Mestre 5.0 — Fase 1 / A3

## Objetivo

Integrar a base visual das etapas A1/A2 às telas existentes, padronizar estados visuais e garantir que navegação, edição e busca permaneçam utilizáveis. Nenhuma alteração no esquema SQLite ou na API.

## Alterações implementadas

### Busca global mais confiável

- `GlobalSearch` desacoplado da Topbar, com lista acessível de resultados.
- Atalhos já existentes `Ctrl+K` mantidos.
- Navegação com setas, `Enter` e `Escape`; botão de limpar busca.
- Indicadores separados para buscando, erro e nenhum resultado.
- Fechamento ao clicar fora da busca.
- Requisições de pesquisa canceladas durante digitação e mudanças de mesa. Respostas atrasadas não substituem o conteúdo mais recente.

### Troca de mesa e permissões

- A seleção de outra mesa limpa busca, foco temporário e estados de edição antes de carregar dados novos.
- `useWorkspaceApi` desconsidera respostas antigas após o início de um carregamento mais recente, evitando exibir dados da mesa anterior.
- `Desfazer` agora exige Modo Edição, inclusive pelo atalho `Ctrl+Z` fora dos campos.
- `Importar` mantém o bloqueio quando não estiver em Edição.
- Botões de navegação rápida na Home continuam acessíveis mesmo em Modo Leitura.
- O controle de edição permanece no `EditModeSwitch`, sem alterar o mecanismo de autosave já existente.

### Layout responsivo e padronização

- Regras, Fichas, Mundo, Sessões e Combate usam a classe compartilhada `workspace-list-detail`.
- A lista aparece acima do detalhe em telas estreitas, mantendo rolagem separada; em desktop há duas colunas com larguras equivalentes ao layout anterior.
- Botões, campos e labels legados passaram a consumir tokens visuais da A1 para se aproximar dos componentes novos.
- O layout da Home e seus dados permanecem inalterados; a reconstrução da Home pertence à versão 5.1.

## Arquivos alterados

- `components/layout/GlobalSearch.tsx` (novo)
- `components/layout/Topbar.tsx`
- `components/system/SystemWorkspace.tsx`
- `components/system/HomeView.tsx`
- `components/system/RulesView.tsx`
- `components/system/SheetsView.tsx`
- `components/system/WorldView.tsx`
- `components/system/SessionsView.tsx`
- `components/system/CombatView.tsx`
- `hooks/useWorkspaceApi.ts`
- `app/globals.css`

## Verificação funcional recomendada

1. Abrir busca com `Ctrl+K`, digitar, navegar com setas e confirmar com `Enter`; fechar com `Escape`.
2. Digitar uma consulta e trocar de mesa enquanto a busca estiver em andamento; resultados da mesa anterior não devem aparecer.
3. Alternar rapidamente entre duas mesas; a mais recente deve permanecer selecionada.
4. Com Leitura ativa, tentar `Ctrl+Z` e verificar que o banco não sofreu alteração.
5. Ainda em Leitura, usar `Continuar`, `Modo sessão`, `Combate` e `Biblioteca` na Home; navegação deve funcionar.
6. Com Edição ativa, conferir importação e desfazer.
7. Conferir as cinco telas em 1280×720, 1366×768 e resolução menor de tablet.
8. Validar estados de foco, erro de busca e diferentes níveis de zoom.

## Verificação automatizada

```bash
npm install
npx tsc --noEmit
npm run build
```

Limitações desta etapa: componentes internos de cada módulo ainda não foram totalmente convertidos para a nova biblioteca `components/ui`; a migração profunda do conteúdo acontecerá em etapas posteriores. A3 não cria painéis divididos ou a nova Home.
