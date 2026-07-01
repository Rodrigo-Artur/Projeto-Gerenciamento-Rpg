import type { NpcSheet, RuleArticle } from "@/types/rulebook";

export const initialRuleArticles: RuleArticle[] = [
  {
    id: "combate",
    category: "combate",
    title: "Como funciona o combate",
    summary:
      "Estrutura geral de rodadas, turnos, ações, ataques, defesa e consequências.",
    tags: ["combate", "turnos", "ações"],
    content:
      "O combate é dividido em rodadas. Cada rodada representa alguns segundos dentro da cena.\n\nNo início do combate, todos os participantes rolam iniciativa. A ordem define quem age primeiro, mas o mestre ainda pode ajustar a cena quando isso fizer sentido narrativo.\n\nDurante o próprio turno, uma criatura pode realizar uma ação principal, uma ação secundária e se mover. Alguns efeitos especiais podem conceder reações ou ações extras.\n\nAtaques são resolvidos com uma rolagem contra a defesa do alvo. Se o resultado for igual ou maior que a defesa, o ataque acerta.\n\nDano reduz os pontos de vida do alvo. Quando os pontos de vida chegam a zero, a criatura fica derrotada, inconsciente ou sofre uma consequência definida pelo mestre.\n\nO mestre pode aplicar vantagem, desvantagem, bônus ou penalidades de acordo com a situação narrativa.",
  },
  {
    id: "acoes-em-combate",
    category: "combate",
    title: "Ações em combate",
    summary:
      "Lista de ações comuns que personagens, monstros e NPCs podem realizar em uma rodada.",
    tags: ["combate", "ações", "rodada"],
    content:
      "Ação principal: atacar, conjurar uma habilidade, usar um item importante ou realizar uma manobra complexa.\n\nAção secundária: sacar uma arma, beber uma poção simples, abrir uma porta, dar uma ordem rápida ou interagir com um objeto.\n\nMovimento: o personagem pode se deslocar até o limite permitido pela ficha.\n\nReação: algumas habilidades permitem agir fora do próprio turno.\n\nAções improvisadas são permitidas. O mestre define o teste, a dificuldade e a consequência.",
  },
  {
    id: "testes",
    category: "testes",
    title: "Testes e dificuldades",
    summary:
      "Como resolver testes de atributo, perícias, dificuldades e consequências narrativas.",
    tags: ["testes", "dados", "dificuldade"],
    content:
      "Quando existe risco ou incerteza, o mestre pode pedir um teste.\n\nUm teste normalmente usa: dado principal + atributo + perícia + modificadores.\n\nA dificuldade representa o quão complexo é o desafio. CD 10 é fácil, CD 15 é médio, CD 20 é difícil e CD 25 é extremo.\n\nFalhar em um teste não precisa significar que nada acontece. Pode significar sucesso parcial, custo, dano, atraso ou complicação narrativa.\n\nQuando a falha não tem consequência interessante, o mestre pode permitir sucesso automático para manter o ritmo da sessão.",
  },
  {
    id: "condicoes",
    category: "condicoes",
    title: "Condições e estados",
    summary:
      "Efeitos temporários ou permanentes que afetam personagens, monstros e NPCs.",
    tags: ["condições", "status", "efeitos"],
    content:
      "Condições são estados que alteram o comportamento de uma criatura.\n\nExemplos: ferido, exausto, envenenado, corrompido, inspirado, amedrontado e marcado.\n\nCada condição precisa ter efeito, duração e forma de remoção.\n\nO mestre pode criar condições próprias para representar elementos únicos da campanha.\n\nCondições importantes devem aparecer tanto na ficha quanto nas anotações da sessão.",
  },
  {
    id: "personagem",
    category: "personagem",
    title: "Criação de personagem",
    summary:
      "Resumo de atributos, recursos, origem, classe, evolução e campos customizados.",
    tags: ["personagem", "ficha", "criação"],
    content:
      "A criação de personagem começa pela ideia central: quem é o personagem, o que ele deseja e qual problema ele carrega.\n\nDepois disso, o jogador escolhe origem, classe, arquétipo ou conceito equivalente do sistema.\n\nA ficha deve conter atributos, perícias, recursos principais, habilidades, equipamentos, histórico e anotações.\n\nCampos customizados podem ser criados pelo mestre para representar coisas únicas do sistema, como sanidade, corrupção, vínculo espiritual, fama ou controle elemental.\n\nA evolução deve registrar não apenas números, mas também mudanças importantes na história do personagem.",
  },
  {
    id: "equipamentos",
    category: "equipamentos",
    title: "Equipamentos e itens",
    summary:
      "Organização de armas, armaduras, itens importantes, consumíveis e recompensas.",
    tags: ["itens", "inventário", "recompensas"],
    content:
      "Equipamentos representam ferramentas, armas, armaduras, itens consumíveis e objetos narrativos.\n\nItens comuns podem ter apenas nome e descrição curta. Itens importantes devem ter origem, efeito, valor, limitações e dono atual.\n\nItens mágicos ou especiais precisam ter regras claras para evitar confusão durante a sessão.\n\nO mestre pode marcar itens como públicos, secretos, amaldiçoados ou vinculados a uma missão.\n\nRecompensas devem ser registradas após a sessão para evitar perda de informação.",
  },
  {
    id: "magias",
    category: "magias",
    title: "Magias e poderes",
    summary:
      "Modelo para poderes, técnicas, magias, custos, alcance, duração e restrições.",
    tags: ["magias", "poderes", "habilidades"],
    content:
      "Magias e poderes devem ter nome, custo, alcance, duração, efeito e condição de uso.\n\nPoderes simples podem ser descritos em poucas linhas. Poderes complexos precisam de exemplo.\n\nQuando um poder causa dano, cura, controle ou alteração de cena, a regra deve explicar como resolver o efeito.\n\nO mestre pode classificar poderes por elemento, escola, técnica, círculo, nível ou tipo narrativo.\n\nPoderes criados por jogadores devem passar por revisão antes de entrarem oficialmente no sistema.",
  },
  {
    id: "regras-da-casa",
    category: "regras-da-casa",
    title: "Regras da casa",
    summary:
      "Alterações e decisões próprias do mestre para adaptar o sistema à mesa.",
    tags: ["customizado", "mestre", "regras"],
    content:
      "Regras da casa são alterações criadas para adaptar o sistema ao estilo da mesa.\n\nToda regra da casa deve ter uma explicação curta e exemplos de uso.\n\nEvite criar regras complexas demais sem necessidade.\n\nSe uma regra nova deixar o jogo mais lento, ela deve ser revisada depois da sessão.\n\nRegras da casa importantes devem ficar visíveis para os jogadores antes de serem usadas em jogo.",
  },
];

export const initialNpcSheets: NpcSheet[] = [
  {
    id: "guarda-veterano",
    name: "Guarda Veterano",
    role: "NPC de combate / segurança",
    description:
      "Um guarda experiente, acostumado a proteger portões, escoltar nobres e lidar com aventureiros problemáticos.",
    stats: [
      { label: "PV", value: "24 / 24" },
      { label: "Defesa", value: "15" },
      { label: "Ataque", value: "+5" },
      { label: "Dano", value: "1d8 + 2" },
      { label: "Moral", value: "12" },
    ],
    notes: [
      "Prefere intimidar antes de lutar.",
      "Pode ser subornado se estiver com medo.",
      "Conhece rumores sobre crimes recentes na cidade.",
    ],
  },
  {
    id: "adepto-elemental",
    name: "Adepto Elemental",
    role: "NPC de sistema próprio / conjurador",
    description:
      "Um manipulador elemental iniciante que usa técnicas instáveis e depende muito do ambiente ao redor.",
    stats: [
      { label: "PV", value: "18 / 18" },
      { label: "Defesa", value: "13" },
      { label: "Controle", value: "+6" },
      { label: "Energia", value: "10 / 10" },
      { label: "Vontade", value: "+4" },
    ],
    notes: [
      "Perde força quando está longe do próprio elemento.",
      "Pode ser usado como aliado, rival ou aprendiz.",
      "Bom exemplo para testar regras de recursos customizados.",
    ],
  },
];
