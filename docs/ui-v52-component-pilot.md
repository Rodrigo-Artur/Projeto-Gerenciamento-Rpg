# Mesa do Mestre — piloto de UI 5.2 (Kibo, Gauge UI, Motion Primitives)

## Entrega

A proposta é incorporar elementos das bibliotecas curadas pelo Escape the Slop sem substituir a identidade escura e dourada existente, nem alterar o SQLite ou as APIs. Esta primeira entrega é intencionalmente pequena e reversível.

### 1. Sessões: quadro Kanban (Kibo UI)

- Abra **Sessões → Quadro de sessões** para consultar as colunas Planejadas, Em andamento e Concluídas.
- O quadro utiliza o componente de Kanban do Kibo UI (dnd-kit, com suporte a mouse, toque e teclado).
- No **Modo Leitura** o quadro é consultivo; os cartões não são arrastáveis.
- No **Modo Edição** é possível arrastar uma sessão entre colunas; somente a mudança do campo `status` é gravada pela ação `upsert-session` já existente.
- A ordenação manual **não é persistida** porque o modelo `SessionPlan` não possui campo de posição. Arrastar dentro da mesma coluna devolve a ordem anterior.
- A ação mantém os demais dados da sessão (cenas, links e notas); caso falhe, a prévia é revertida e aparece um aviso.
- O botão **Abrir** em cada cartão volta para a ficha da sessão pelo ID correto.
- O quadro é carregado sob demanda para reduzir o peso da tela inicial.

### 2. Combate: medidor de PV (Gauge UI)

- Cada participante recebe um indicador SVG circular, com valor e porcentagem de pontos de vida.
- Verde: acima de 50%; amarelo: de 26% a 50%; vermelho: até 25%.
- A barra horizontal, o número atual/máximo e os controles de +1/-1/+5/-5 continuam presentes.
- O medidor é **somente visual**; não cria um segundo estado de jogo nem grava dados, e conta com rótulo acessível `role=meter`.
- PV inválidos/fora da faixa são limitados apenas no desenho, preservando os dados existentes.

### 3. Home: animação discreta (Motion Primitives)

- O painel de acesso rápido passa a revelar seis atalhos com animação sutil e escalonada.
- Se a pessoa prefere menos movimento (`prefers-reduced-motion`), o componente não aplica a animação inicial.
- A navegação e as ações permanecem idênticas.

## Dependências e licenças

- **Kibo UI Kanban** — https://www.kibo-ui.com/components/kanban — MIT, adaptado para desativação explícita de drag e sensibilidade de gestos.
- **Gauge UI** — https://www.gauge-ui.dev/ — MIT, fonte composicional instalada localmente de `/r/gauge.json`; usa o nosso `cn` e os tokens semânticos atuais.
- **Motion Primitives (Animated Group)** — https://motion-primitives.com/docs/animated-group — MIT, adaptado para React 19 e preferência de movimento reduzido.
- Os avisos originais de licença estão em `third_party/licenses/`.
- Pacotes runtime adicionados: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `tunnel-rat` e `motion`. Não substituímos Radix, Tailwind, Next.js ou o Design System v5.

## Homologação

Execute:

```bash
npm ci
npx tsc --noEmit
npm run build
```

Cenários para validar no navegador:

1. Abrir Sessões no Modo Leitura e clicar no botão Quadro. Os três estados aparecem; tentativa de arrastar não muda dados.
2. Ativar Modo Edição e mover uma sessão de Planejadas para Em andamento. Voltar para Lista e conferir seu status, recarregar a página e confirmar que persistiu.
3. Testar teclado: Tab até cartão, Espaço para pegar, setas, Espaço para soltar, Esc para cancelar. Confirmar que somente edição modifica o banco.
4. Desconectar o servidor de teste e tentar mudar status. Deve exibir aviso e restaurar a coluna anterior.
5. Abrir sessão diretamente pela busca ou aba, verificar que a ficha exata continua sendo aberta.
6. Entrar num combate com PV 100/100, 50/100, 25/100, 0/100, além de 0/0; verificar cores, números e operação dos botões, inclusive quando a sessão atualiza.
7. Na Home, testar os atalhos e a opção de movimento reduzido; conferir a navegação mobile.
8. Validar com conta proprietária e conta sem acesso; componentes visuais não devem alterar as verificações de autorização do servidor.

**Limites desta entrega:** sem integração ao Owlbear ou OBS, sem alteração dos modelos de recursos e sem mudança de permissões; é uma primeira camada de UI para evoluções posteriores.
