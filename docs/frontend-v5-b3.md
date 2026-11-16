# Mesa do Mestre v5.1 — B3: Navegação contextual e seleção exata

## Objetivo

Todo clique em um resultado da busca, favorito, conteúdo recente ou aba precisa abrir **o registro correto da mesa correta**, mesmo depois de alternar mesas, mudar o nome de um registro ou recarregar a aplicação. A B3 não modifica API, SQLite ou regras de RPG.

## Implementação

### Resolução central de referências

`lib/workspace-navigation.ts` centraliza a resolução de (tipo, ID) usando somente os dados da **mesa selecionada**:
- `rule` → regra;
- `npc` / `player` → ficha correta e categoria correta;
- `note` / `session` → nota ou sessão específica;
- `item`, `location`, `faction`, `quest`, `timeline`, `calendar-event`, `entity` → registro do mundo e sua categoria real;
- `handout` → Modo Sessão e handout destacado;
- `library` → Biblioteca e entrada destacada.

A identidade do registro vem do ID/tipo, **não do título**. Ao renomear conteúdo, o título da aba é atualizado na próxima carga de dados.

### Abas isoladas por mesa

- Novos IDs: `tableId:type:contentId`, evitando colisões entre campanhas.
- `WorkspaceTab.tableId` permite verificar sua mesa.
- Armazenamento permanece em `mesa-tabs-${tableId}`, com estrutura `{version:2,tabs,activeTabId}`.
- Abas legadas em formato de array e chave `type:id` são lidas e convertidas, **apenas se o registro existir nos dados atuais**.
- Na troca de mesa, abas antigas não aparecem nem são gravadas sobre o histórico de abas da nova mesa.
- Se o registro foi removido ou mudou de mesa, a aba inválida é descartada, sem escolher silenciosamente outra ficha.
- A última aba ativa é lembrada por mesa; a Home continua como tela inicial padrão.

### Seleção dos editores

- `SheetsView` recebe `focusType` e `focusId` em vez de depender da primeira ficha na lista. Abrir um NPC com jogadores cadastrados exibe o NPC correto.
- `SessionsView` distingue notas e sessões pelo tipo, inclusive se IDs forem parecidos.
- `WorldView` troca de categoria preservando o registro coerente; o caso `calendar-event` também é visível.
- `RulesView` mantém a seleção por ID já existente.
- Handouts e biblioteca recebem destaque visual e rolagem até o item aberto.
- `FocusWorkspace` (janela destacada) reconhece os tipos reais das entidades do mundo e entradas da biblioteca.
- Ao clicar em resultado de busca/recente removido, a interface exibe aviso, não abre outro conteúdo.

### Compatibilidade

- Não modifica SQLite, API de leitura/gravação, modelos de personagens ou permissões.
- Leitura, Edição e Editar Item continuam controlados em `SystemWorkspace`.
- O carregamento pós-SSR introduzido na correção de hidratação permanece intacto.
- A migração de abas acontece apenas no armazenamento visual local do navegador.

## Cenários de aceitação

1. Mesa com jogadores + NPCs: `Ctrl+K` → nome de NPC → abre o NPC, não um jogador.
2. Abrir duas fichas, alternar entre suas abas e conferir título e conteúdo específico.
3. Abrir uma nota e uma sessão por favoritos/recentes; cada uma seleciona seu editor.
4. Abrir uma regra e um local por busca, alternando suas abas sem perder foco.
5. Abrir um handout e uma entrada de biblioteca por referência; destacar o item correto.
6. Trocar Mesa A → Mesa B → Mesa A; conferir isolamento e restauração de abas.
7. Recarregar o navegador após deixar diferentes abas abertas nas duas mesas.
8. Renomear e excluir registros; aba renomeada deve atualizar e aba excluída não deve abrir outra ficha.
9. Restaurar dados do armazenamento legado; abas válidas são aproveitadas, inválidas descartadas.
10. Confirmar ausência de erro de hidratação e funcionamento do Modo Leitura.

## Verificações técnicas

```bash
npm install
npx tsc --noEmit
npm run build
```

O CI confere compilação e tipagem. Os cenários de navegação e persistência exigem inspeção interativa em navegador antes da homologação.
