# Mesa do Mestre v5.1 — B2: busca global e central de comandos

## Entrega

A antiga caixa de busca da Topbar agora abre uma central de comandos em formato de diálogo, acessível via mouse ou `Ctrl+K`. Os resultados da API continuam limitados à mesa selecionada. Nada nesta etapa altera o SQLite, o modelo de personagens, os controles de edição ou os endpoints.

### Sem termo de busca
- **Acessos rápidos**: Início, Modo Sessão, Fichas e Combate
- **Favoritos**: até 5 NPCs, personagens, regras, notas e itens do mundo marcados como favoritos
- **Recentes**: até 5 conteúdos acessados anteriormente (sem duplicar favoritos)
- **Navegação**: todas as outras seções do aplicativo
- **Ferramentas**: exportar mesa, abrir Tela Jogador, alternar modo compacto/tela cheia e abrir administração
- **Mesas**: alternar diretamente para outra campanha

### Ao pesquisar
- Busca textual por título, descrição, palavras relacionadas e acentos para **comandos** (somente no cliente)
- Mantém busca por conteúdos da mesa na API existente, exibidos por tipo (regras, NPCs, jogadores, etc.)
- `>` no início da consulta restringe a pesquisa apenas aos comandos; não chama a API
- Indicadores de carregamento, nenhum resultado e falha da consulta
- A busca usa o debounce/cancelamento já implementado na A3; resultados anteriores não devem substituir os da mesa atual

### Teclado e acessibilidade
- `Ctrl+K`: abre a paleta
- `↑`/`↓`: alteram o item destacado
- `Enter`: abre o item ou executa o comando
- `Esc`: fecha a paleta
- O diálogo usa Radix UI, que gerencia foco e restaura o foco ao fechar
- Lista com grupos, rótulos acessíveis e `aria-activedescendant`

## Arquivos
- `components/layout/GlobalSearch.tsx`: nova paleta modal com sugestões, comandos e resultados
- `components/layout/Topbar.tsx`: gatilho `Ctrl+K`, comandos de navegação e ações não destrutivas
- `components/system/SystemWorkspace.tsx`: integração de favoritos/recentes, abertura de conteúdos e filtro de consultas `>`
- `docs/frontend-v5-b2.md`: documentação e checklist de verificação

## Segurança / compatibilidade
A paleta não executa exclusão, restauração, importação, salvamento ou undo. Os comandos expostos são de navegação, visualização e exportação, podendo ser usados no Modo Leitura. Não há novos registros persistidos.

## Validação recomendada
1. Após atualizar, abrir `http://localhost:3000`, pressionar `Ctrl+K` e navegar com as setas/Enter/Esc.
2. Pesquisar parte do nome de um NPC e abrir seu resultado.
3. Digitar `>combate` e verificar que aparecem só comandos.
4. Verificar favoritos e recentes sem termos digitados.
5. Trocar de mesa pela paleta; favoritos e conteúdo recente devem pertencer à mesa atual.
6. Permanecer em Modo Leitura e verificar que os comandos não modificam fichas.
7. Abrir/fechar em desktop e viewport pequeno; conferir foco e rolagem.
8. Rodar `npx tsc --noEmit` e `npm run build`; testar manualmente o fluxo no navegador.

## Próximas etapas
**B3** tratará da seleção exata e da manutenção de contexto dos registros abertos; **B4** uniformizará estados de carregamento, vazio e erro.
