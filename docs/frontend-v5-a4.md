# Mesa do Mestre v5 · Fase 1 / Etapa A4 — Migração visual

## Escopo

Finalizar o alinhamento **visual** entre as telas existentes e o Design System A1/A2, sem reescrever formulários, regras, fluxo de edição ou banco SQLite. A reconstrução do dashboard/Home (5.1) e os painéis divididos (5.2) ficam para as próximas fases.

## Implementado

- `styles/workspace.css`: classes compartilhadas `mdm-module`, `mdm-list-pane`, `mdm-detail-pane`, `mdm-editor`, `mdm-list-entry`, `mdm-section-card`, `mdm-section-kicker`, `mdm-form-card` e `mdm-scroll-area`. Os layouts de lista/detalhe de 280, 300, 320, 330 e 340 px mantêm suporte responsivo.
- `app/globals.css`: importa os estilos de workspace após os tokens da A1, preservando os estilos de compatibilidade da v4.
- `components/ui/workspace-empty.tsx`: usa `EmptyState` da A1 e ícones para exibir os mesmos estados vazios em diferentes seções, sem ações que contornem o Modo Leitura.
- Regras, Fichas, Mundo, Sessões, Combate, Templates, Biblioteca, Dashboard de gerenciamento, Histórico, Campanha, Modo Sessão e Importação migrados para superfícies, cores e bordas semânticas. A Home recebeu apenas alinhamento básico de paleta.
- Mensagens antigas de ausência de seleção substituídas por componentes reutilizáveis em Regras, Fichas, Mundo, Sessões, Combate, Templates e Biblioteca.
- Telas auxiliares de configuração do sistema, janela destacada e carregamento da Tela Jogador usam as mesmas cores e superfícies do restante da aplicação.
- Cartões do Modo Sessão, Campanha, Dashboard, Histórico e Biblioteca usam o novo padrão visual, com foco legível, responsividade e estados reconhecíveis.

## Segurança e compatibilidade

O trabalho é de apresentação, portanto não modifica:
- `types/rulebook.ts`
- APIs ou ações de criação, salvamento, exclusão e importação
- `.local/mesa-do-mestre.sqlite` e seu schema
- os mecanismos `workspace-readonly`, `workspace-editing` e `workspace-item-edit`
- persistência de abas e as rotinas de restauração/histórico.

O CSS novo fica escopado principalmente em `.mdm-module` para minimizar regressões sobre telas antigas e a Tela Jogador.

## Aceitação e testes

1. Conferir em 1280×720 e 1920×1080: lista à esquerda e detalhe à direita; em viewport estreita, lista acima do detalhe.
2. Conferir estados vazios de Regras, Fichas, Mundo, Sessões, Combate, Biblioteca e Templates.
3. Conferir seleção, favoritos, filtros e rolagem em listas.
4. Confirmar navegação e leitura sem alterações acidentais.
5. Alternar para Edição e confirmar que os controles continuam liberados e o autosave funciona.
6. Conferir Importar, Exportar, histórico e modo jogador.
7. Validar gradientes, contrastes, ícones, imagens externas e cards em todas as áreas.
8. Executar `npx tsc --noEmit` e `npm run build`. Inspeção visual no navegador local permanece necessária antes de considerar a UI homologada.

## Próxima etapa

A fase de infraestrutura visual 5.0 fica pronta após A4. A versão 5.1 terá foco na Home, busca global e navegação orientada à campanha; a 5.2 abordará painéis divididos, abas e persistência avançada.
