# Correção de hidratação SSR / React — Mesa do Mestre

## Sintoma

Na inicialização em desenvolvimento do Next.js 16/React 19, o overlay pode informar:

> A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.

A comparação relatada no seletor `#mdm-current-table` mostrava `disabled={null}` no servidor e `disabled={true}` no cliente. Esse tipo de divergência indica que o HTML inicial e a primeira renderização React no navegador não coincidiram.

## Alterações

- `SystemWorkspace` passa por um guard de hidratação baseado em `useSyncExternalStore` com `getServerSnapshot` retornando `false`. O servidor e o cliente durante a hidratação exibem o **mesmo estado de carregamento**; o workspace interativo é montado após a hidratação. Isso é apropriado para este aplicativo local em que a interface principal depende de estado do navegador.
- O valor inicial do relógio de atividade de edição deixa de ser `Date.now()` durante a renderização. O timestamp continua sendo atualizado quando o usuário ativa/interage com o modo de edição.
- `Topbar` desativa o seletor enquanto a API carrega ou não há mesas, mostra placeholder explícito e só seleciona um `tableId` presente na lista.
- Não há mudanças em SQLite, API, conteúdo de fichas ou permissões de leitura/edição.

## Como atualizar e limpar o build local (Windows PowerShell)

Interrompa `npm run dev` com `Ctrl+C`. Na pasta do repositório:

```powershell
git pull
if (Test-Path .next) { Remove-Item .next -Recurse -Force }
npm run dev
```

Abra `http://localhost:3000` e faça `Ctrl+Shift+R` no navegador.

O indicador **stale** do Turbopack pode representar uma divergência temporária entre HTML/JS de builds distintos. Reiniciar o servidor e remover apenas `.next` é seguro para o banco: **não apague a pasta `.local` nem arquivos `.sqlite`**.

## Aceitação

1. Abrir a página com `Ctrl+Shift+R` no navegador após reiniciar o servidor.
2. Não deve haver aviso de hidratação no carregamento.
3. Após a API responder, a lista de mesas deve ficar habilitada e selecionar a mesa correta.
4. Testar troca rápida entre duas mesas e verificar que a seleção não volta a um estado antigo.
5. Confirmar Leitura como padrão; após ativar Edição, usar importação e salvamento normalmente.
6. Conferir a Home e outras seções; a tela de carregamento só aparece durante a hidratação inicial.

## CI

```bash
npm install
npx tsc --noEmit
npm run build
```

Observação: TypeScript e build não substituem o teste de hidratação num navegador. O comportamento deve ser conferido na instalação local.
