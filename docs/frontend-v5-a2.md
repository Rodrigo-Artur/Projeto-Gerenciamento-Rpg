# Mesa do Mestre v5 — Fase 1 / Etapa A2

## Implementação

A2 consolida a navegação e o layout de todas as páginas sem tocar nas tabelas SQLite ou no contrato da API.

### Componentes

- `components/layout/AppShell.tsx`: frame de altura total, rolagem interna e slots de sidebar, topbar, cabeçalho, abas e conteúdo. Preserva eventos de drag and drop.
- `components/layout/AppSidebar.tsx`: navegação agrupada, indicador da mesa/sessão, colapso em desktop e drawer no mobile. Estado de colapso armazenado em `mesa-do-mestre-sidebar-collapsed`.
- `components/layout/Topbar.tsx`: seleção de mesa, nome do sistema, busca global com resultados, status de salvamento, importação, exportação, tela do jogador, desfazer, modo compacto e tela cheia. Eventos continuam encaminhados ao `SystemWorkspace`.
- `components/layout/EditModeSwitch.tsx`: Leitura, Edição e Editar Item, com seleção do bloqueio automático e marcação acessível de estado.
- `components/layout/PageHeader.tsx`: título de contexto, trilha do sistema e indicação do estado de edição.
- `components/system/SystemWorkspace.tsx`: mantém lógica dos hooks, eventos e ações, renderizando componentes layout. A área de conteúdo agora usa a altura disponível, sem altura fixa baseada no cabeçalho antigo.

### Responsividade

Desktop: sidebar de 252 px, recolhível para 76 px. Mobile/tablet estreito: sidebar em drawer acionado pelo menu da Topbar.

### Contratos preservados

- Estado de edição inicia protegido; o timeout e seus atalhos seguem ativos.
- `Ctrl+K`, `Ctrl+Shift+P`, `Ctrl+Shift+C`, `Ctrl+Shift+E` e `Ctrl+Z` continuam tratados pelo `SystemWorkspace`.
- Abas continuam selecionáveis, fecháveis e destacáveis. A reestruturação profunda de suas referências e divisões fica para a etapa 5.2.
- Selecionar mesa continua usando `load(tableId)`.
- Importação, exportação, busca e acesso à Tela Jogador usam as funções existentes.
- `workspace-readonly`, `workspace-item-edit`, `item-editor-scope` e `workspace-editing` continuam aplicados à seção de conteúdo.
- Drag and drop JSON segue encaminhado ao mesmo handler.
- Não há mudança no banco de dados, nos sistemas ou nas fichas.

### Validação

```bash
npm install
npx tsc --noEmit
npm run build
```

Testes manuais sugeridos: alternar mesas, importar no modo Edição, tentar importar no modo Leitura, abrir/fechar/destacar abas, testar atalhos, usar menu móvel, recolher sidebar e recarregar a página, conferir isolamento de fichas ao trocar de mesa.

## A3

A próxima etapa envolverá integração fina dos componentes v5 e refinamento de estados de foco/campo, evitando retrabalho nas próximas fases da Home e dos painéis.
