# Mesa do Mestre v5.1 — B4: carregamento, erro e estados vazios

## Objetivo

Concluir a fase 5.1 com estados visuais coerentes para requisições, falhas e listas sem conteúdo. **Nenhuma migração de SQLite, alteração de schema ou API** é necessária.

## Estados de carregamento
- `WorkspaceLoading`: skeleton responsivo com texto e região acessível (`role=status`).
- Durante a troca de mesa, os painéis deixam de exibir os dados da mesa anterior enquanto a resposta está pendente.
- `app/loading.tsx`: fallback consistente do Next.js para carregamento de rota.
- A Home já possuía skeleton; o workspace agora aplica o estado global de carregamento antes da renderização de qualquer seção.

## Falhas de leitura
- `useWorkspaceApi` separa `loadError` de `saveError`.
- Falha na **primeira abertura**, sem dados em memória: estado de erro em tela inteira com botão **Tentar novamente**.
- Falha após outra mesa já ter sido carregada: alerta não bloqueante informa que os dados visíveis são anteriores e oferece nova tentativa.
- A repetição do carregamento usa o **último destino solicitado**, não o ID da mesa antiga — importante se a troca de mesa falhou.
- Os dados anteriormente carregados não são substituídos por arrays vazios nem apagados após erro HTTP.

## Salvamento
- O hook conta requisições de salvamento em andamento e fornece estado semântico `loading | saving | saved | error`.
- `Topbar` apresenta indicador visual/textual apropriado com estado `aria-live`.
- Erro de gravação exibe alerta persistente com descrição da falha e orientação para verificar dados antes de tentar novamente.
- O usuário pode dispensar o alerta, mas o status de falha permanece até uma nova confirmação de gravação/carregamento apropriado; não deve aparecer falsamente como `Salvo`.
- **Não repetimos automaticamente requisições de escrita**, especialmente exclusões, importações, restaurações ou ações não idempotentes. Em caso de timeout, a gravação pode ter sido concluída no servidor; repetir sem conferir poderia duplicar uma ação.
- O autosave existente mantém seu estado de erro local e pode ser acionado novamente pelo botão de salvar do editor.

## Estados vazios
- `WorkspaceListEmpty` para listas de regras, fichas, mundo, sessões, combates, templates, relações de campanha, atividade e backups.
- Listas filtradas distinguem **nenhum resultado** de **nenhum conteúdo cadastrado**, com **Limpar filtro** quando aplicável.
- O Histórico diferencia carregar versões, erro HTTP (com nova tentativa) e ausência real de versões.
- `app/error.tsx` apresenta fallback para erros inesperados de renderização da rota, com botão de reiniciar aquela tela (não substitui tratamento de erros assíncronos).

## Arquivos principais
- `hooks/useWorkspaceApi.ts`
- `components/ui/workspace-feedback.tsx`
- `components/system/SystemWorkspace.tsx`
- `components/layout/Topbar.tsx`
- `components/system/{RulesView,SheetsView,WorldView,SessionsView,CombatView,TemplatesView,HistoryView,CampaignToolsView}.tsx`
- `app/{error,loading}.tsx`

## Checklist manual de aceite

1. Abrir a aplicação normalmente e observar skeleton durante carregamento.
2. Trocar Mesa A → Mesa B. Durante a consulta, A não deve permanecer na área de conteúdo.
3. Interromper temporariamente o servidor, recarregar, verificar o erro inicial e o botão **Tentar novamente** após reiniciar.
4. Com Mesa A carregada, interromper o servidor e tentar Mesa B. Verificar alerta mostrando que o conteúdo anterior permanece; reiniciar e tentar novamente deve carregar **B**.
5. Em modo Edição, interromper o servidor e tentar salvar uma nota. Verificar indicador vermelho e orientação. Reiniciar e salvar novamente apenas após verificar estado remoto/local.
6. Em Regras, Fichas e Mundo, aplicar filtro sem correspondências e usar **Limpar filtro**.
7. Em Sessões/Combate/Templates, abrir uma mesa vazia: mostrar estado explicativo, não uma área sem texto.
8. Selecionar conteúdo no Histórico e simular falha HTTP da consulta de versões; deve haver erro e botão de nova tentativa.
9. Confirmar que Modo Leitura, atalhos, abas B3 e busca B2 continuam funcionando.
10. Confirmar ausência de avisos de hidratação.

## Validação automatizada

```bash
npm install
npx tsc --noEmit
npm run build
```

TypeScript e build confirmam integração/compilação. Testes de rede, comportamento no navegador e salvamento em sessão real continuam sendo necessários para homologação funcional.

## Próxima fase

Com B4 concluída, a infraestrutura visual e a experiência principal da versão 5.1 estarão implementadas. A próxima fase planejada é **5.2 — painéis divididos, abas e personalização do workspace**.
