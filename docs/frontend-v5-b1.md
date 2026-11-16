# Mesa do Mestre v5.1 — B1: Home como dashboard de campanha

## Objetivo
Transformar a Home no ponto de entrada prático de cada mesa, mantendo o **Modo Leitura por padrão**, os componentes visuais v5 e toda a lógica de regras, backend e SQLite existentes. A etapa B1 não implementa ainda a paleta de comandos B2 nem o workspace com painéis da 5.2.

## Implementação
- `components/dashboard/home-data.ts`: modelos derivados de dados existentes para sessão ativa/planejada, favoritos, próximos eventos do calendário e formatação segura de datas. Não cria registros nem usa datas simuladas.
- `components/dashboard/HomeHero.tsx`: destaque da campanha, sistema, sessão corrente/planejada, combate ativo e botões para continuar, preparar ou abrir o Modo Sessão.
- `components/dashboard/HomePanels.tsx`: cartões reutilizáveis de métricas, painéis e linhas de conteúdo, com ícones, estados de foco e responsividade.
- `components/system/HomeView.tsx`: reconstrução completa usando Design System v5:
  - Hero da campanha com ações contextuais.
  - Estatísticas reais: players, NPCs, sessões e elementos não arquivados do mundo.
  - Preparação da sessão e primeiras cenas planejadas.
  - Acesso rápido a fichas, regras, combate, mundo, biblioteca e campanha.
  - Favoritos (NPCs, players, regras, entidades e notas).
  - Abertos recentemente, reutilizando o histórico existente da API.
  - Calendário da campanha e últimos registros do log.
  - Lista das mesas existentes, com mesa ativa indicada.
  - Estados de carregamento, início sem mesas e painéis sem conteúdo.
- `components/system/SystemWorkspace.tsx`: integra `loading`, `onOpenContent` e `onNavigate` sem mudar a API. Os atalhos de Home continuam apenas de navegação.

## Contratos e decisões
- Todos os números e nomes vêm de `RulebookData` carregado; sem dados de exemplo no produto.
- A mesa é identificada pelo `activeTableId` e o sistema pela relação `systemId`.
- `onOpenContent` utiliza o mecanismo atual de abrir e registrar conteúdo.
- `onOpenTable` continua realizando a troca segura de mesa criada na A3.
- A Home não tem funções de criação/exclusão, nem muda a seleção de Leitura/Edição.
- Dados atuais de combate, favoritos, logs, calendário e sessões são consumidos como leitura, sem novas tabelas SQLite.
- O atalho Campanha abre o módulo de relações/calendário já existente; não presume que o calendário é a aba inicialmente selecionada.

## Validação automatizada
```bash
npm install
npx tsc --noEmit
npm run build
```

## Inspeção manual recomendada
1. Abrir a Home em 1280×720, 1366×768 e 1920×1080; validar disposição e rolagem.
2. Mesa ativa com sessão em andamento: botão **Continuar sessão** leva ao Modo Sessão.
3. Mesa sem sessão ativa: botão **Preparar sessão** leva à lista de sessões.
4. Conferir métricas, favoritos e lista de recentes sem misturar itens após trocar de mesa.
5. Clicar em favorito, recente e card de mesa; confirmar registro correto e navegação.
6. Conferir informações de evento futuro contra o calendário do mundo.
7. Confirmar estados vazios, skeleton inicial e acesso à seção Gerenciar sem mesas.
8. Confirmar que todos os atalhos operam em Modo Leitura, sem editar a campanha.

## Próximos marcos
- **B2**: busca/paleta de comandos e navegação por teclado melhoradas.
- **B3**: seleção e contextualização de conteúdos abertos.
- **B4**: estados vazios/carregamento/erro refinados entre todas as seções.
