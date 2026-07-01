import type {
  LabeledValue,
  NpcSheet,
  PlayerAbility,
  PlayerSheet,
  RuleArticle,
  SheetCategory,
} from "@/types/rulebook";

const values = (entries: [string, string][]): LabeledValue[] =>
  entries.map(([label, value]) => ({ label, value }));

const ability = (
  name: string,
  type: string,
  scale: string,
  cost: string,
  test: string,
  effect: string,
  limit?: string
): PlayerAbility => ({ name, type, scale, cost, test, effect, limit });

const npc = ({
  id,
  category,
  name,
  role,
  description,
  stats,
  notes,
}: {
  id: string;
  category: SheetCategory;
  name: string;
  role: string;
  description: string;
  stats: [string, string][];
  notes: string[];
}): NpcSheet => ({
  id,
  category,
  name,
  role,
  description,
  stats: values(stats),
  notes,
});

export const initialRuleArticles: RuleArticle[] = [
  {
    id: "kaiju-visao-geral",
    category: "personagem",
    title: "Kaiju RPG: visão geral para o mestre",
    summary:
      "Resumo operacional do sistema: raças jogáveis, conceito do personagem e o que o mestre precisa controlar.",
    tags: ["kaiju-rpg", "mestre", "base"],
    content:
      "O Kaiju RPG usa quatro raças jogáveis principais: Humano, Kaiju, Meio-Kaiju e Espírito. Todas as outras ideias devem ser tratadas como variações, linhagens, funções, caminhos, contratos, mutações, origens ou estados especiais.\n\nAntes de números, cada personagem precisa responder: o que ele é, como sobrevive nesse mundo e qual problema ou limitação carrega. Um personagem poderoso sem preço tende a ficar menos interessante.\n\nPara o mestre, o ponto principal é manter identidade e contrajogo. Humanos vencem por tecnologia, preparo, armadura e equipe. Kaijus vencem por força, resistência, regeneração e evolução. Meio-Kaijus vencem por versatilidade e corpo modificado. Espíritos vencem por conceito, vínculo, função e manifestação.\n\nUse esta biblioteca como manual prático durante a sessão: abra uma regra, uma ficha e ajuste os painéis conforme precisar.",
  },
  {
    id: "atributos-e-escala",
    category: "atributos",
    title: "Atributos e escala de poder",
    summary:
      "Seis atributos principais, usos comuns e referência rápida de escala para interpretar valores.",
    tags: ["atributos", "escala", "valores"],
    content:
      "Todo personagem possui seis atributos principais: Força, Constituição, Destreza, Inteligência, Sabedoria e Carisma. Eles são usados em testes, combate, habilidades, interações e resistências.\n\nForça representa poder físico bruto. Constituição representa vigor e durabilidade. Destreza representa velocidade, reflexo e precisão. Inteligência representa raciocínio, ciência e tecnologia. Sabedoria representa percepção, instinto e sensibilidade espiritual. Carisma representa presença, comando e força emocional.\n\nEscala aproximada: 1 a 3 é humano comum; 4 a 6 humano treinado; 7 a 10 elite humana; 11 a 20 sobre-humano; 21 a 40 Meio-Kaiju, Kaiju menor ou usuário de armadura avançada; 41 a 80 Kaiju poderoso; 81 a 120 ameaça lendária; 121+ escala mítica.",
  },
  {
    id: "testes-e-dificuldades",
    category: "testes",
    title: "Testes, vantagem e dificuldade",
    summary:
      "Regra padrão de rolagem, CDs sugeridas, vantagem, desvantagem, crítico e falha crítica.",
    tags: ["testes", "d20", "dificuldade"],
    content:
      "Quando uma ação tiver risco de falha, peça um teste. A rolagem padrão é: 1d20 + atributo + bônus situacionais. O resultado precisa alcançar ou superar a dificuldade definida pelo mestre.\n\nDificuldades sugeridas: Muito fácil 5, Fácil 8, Normal 12, Difícil 16, Muito difícil 20, Extremo 24, Lendário 30 e Mítico 40+.\n\nCom vantagem, role 2d20 e use o maior. Com desvantagem, role 2d20 e use o menor. Vantagem e desvantagem não acumulam várias vezes; se aparecerem ao mesmo tempo, elas se anulam.\n\nNo 20 natural, o personagem consegue sucesso crítico. Em ataque, a sugestão é adicionar +1 dado de dano da arma ou habilidade. No 1 natural, ocorre falha crítica: crie complicação, mas não humilhe o jogador.",
  },
  {
    id: "combate-rodadas",
    category: "combate",
    title: "Combate: rodadas, iniciativa e turno",
    summary:
      "Fluxo básico de combate para o mestre conduzir cenas de ação sem se perder.",
    tags: ["combate", "rodadas", "turnos"],
    content:
      "O combate é dividido em rodadas. Uma rodada representa um período curto de ação intensa, no qual todos os participantes têm chance de agir.\n\nNo início do combate, todos rolam iniciativa: 1d20 + Destreza. A ordem vai do maior resultado para o menor. Armaduras, módulos, habilidades, emboscadas e surpresa podem alterar essa ordem.\n\nNo turno, cada personagem possui: 1 ação principal, 1 movimento, 1 ação rápida e 1 reação por rodada.\n\nAção principal: atacar, usar habilidade, defender ativamente, usar item complexo, carregar ataque, ajudar aliado, interagir com mecanismo, agarrar, correr com esforço ou preparar ação.\n\nMovimento: andar, correr curta distância, reposicionar-se, levantar do chão, entrar ou sair de cobertura, aproximar-se ou afastar-se.\n\nAção rápida: sacar arma, falar frase curta, ativar comunicador, trocar postura, pegar item simples, apontar alvo, abrir porta comum ou marcar alvo com sensor.\n\nReação: usada fora do turno, em resposta a evento. Exemplos: esquivar, bloquear, proteger aliado, ativar escudo, usar módulo de emergência ou habilidade defensiva.\n\nAtaques extras devem ter limite. Sugestão: Tier 1 até 2 ataques por rodada; Tier 2 até 3; Tier 3 até 4; Tier 4 até 5; Tier 5+ até 6 ou mais com permissão do mestre. Exceções precisam de custo, recarga ou risco.",
  },
  {
    id: "ataque-defesa-dano",
    category: "defesa-dano",
    title: "Ataque, defesa, dano, redução e regeneração",
    summary:
      "Resumo de resolução ofensiva e defensiva, incluindo contrajogo para defesas fortes.",
    tags: ["ataque", "defesa", "dano", "redução"],
    content:
      "Para atacar, role 1d20 + atributo de ataque + bônus. Ataque corpo a corpo pesado usa Força. Ataque corpo a corpo ágil usa Destreza. Ataque à distância pode usar Destreza ou Inteligência. Ataque tecnológico usa Inteligência. Ataque espiritual usa Sabedoria ou Carisma. Ataque de conceito usa o atributo que melhor combina com o conceito da entidade.\n\nQuando um personagem é atacado, ele pode tentar se defender. Esquiva normalmente usa 1d20 + Destreza. Outras defesas podem usar Constituição, armadura, escudo, módulo, habilidade ou proteção espiritual, conforme a situação.\n\nO mestre deve manter contrajogo: toda defesa forte precisa ter fraqueza, toda regeneração forte precisa ter forma de ser bloqueada e toda habilidade poderosa precisa ter custo, recarga, risco ou preparação.\n\nSe uma defesa, regeneração ou redução estiver travando o combate, crie pontos fracos: dano específico, elemento contrário, ataque em ponto vulnerável, contenção, supressão de regeneração, dano verdadeiro, desgaste de recurso ou consequência narrativa.",
  },
  {
    id: "criacao-personagem",
    category: "personagem",
    title: "Criação de personagem",
    summary:
      "Etapas práticas para criar personagens jogáveis no Kaiju RPG.",
    tags: ["criação", "personagem", "ficha"],
    content:
      "Ordem sugerida para criar personagem: definir conceito, escolher raça base, escolher variação, escolher função ou caminho, distribuir atributos, definir HP inicial, definir defesa, redução e regeneração, escolher habilidades iniciais, escolher equipamento inicial, definir recurso de evolução, criar fraqueza/risco/limitação, escrever histórico curto e revisar com o mestre.\n\nHumano: HP inicial 30, bônus racial +3 em Inteligência, 1 habilidade básica, equipamento conforme função e autorização do mestre. Funções humanas incluem Combatente Físico, Atirador/Longa Distância, Estrategista, Técnico de Armadura e Comandante.\n\nKaiju: HP inicial 50, 1 habilidade kaiju, Redução de Dano inicial 1d4+2, Regeneração inicial 1d4+2, evolução por Energia K e fraqueza obrigatória.\n\nMeio-Kaiju: híbrido artificial, arma viva, experimento ou mutação. Deve ter risco de instabilidade, compatibilidade, mutação ou controle.\n\nEspírito: evolui por conceito, vínculo, contrato, hospedeiro, manifestação e reconhecimento. Deve ser definido pelo que representa e pela relação com pessoas, lugares ou promessas.",
  },
  {
    id: "progressao-e-evolucao",
    category: "progressao",
    title: "Progressão e evolução",
    summary:
      "Como cada raça cresce, quais recursos usa e quais riscos o mestre deve acompanhar.",
    tags: ["progressão", "evolução", "recursos"],
    content:
      "Cada raça evolui de um jeito. Humanos evoluem por treino, estudo, experiência, tecnologia e armaduras. Kaijus evoluem por Energia K, batalhas, instinto, sobrevivência e adaptação. Meio-Kaijus evoluem por orbes, núcleos, experimentos, mutações e compatibilidade biológica. Espíritos evoluem por conceito, vínculo, contratos, hospedeiros, manifestação e reconhecimento.\n\nToda evolução importante precisa ter custo: tempo, treino, estudo, recurso, Energia K, orbes, núcleos, contrato, risco, mutação, vínculo ou consequência narrativa.\n\nA evolução deve reforçar a identidade do personagem. Um Humano estrategista melhora análise, comando e tecnologia. Um Kaiju predador fica mais brutal, resistente ou adaptável. Um Meio-Kaiju instável ganha poder e risco. Um Espírito guardião protege melhor aquilo que representa.\n\nEvoluções especiais não devem ser simples compras de ficha. Elas devem acontecer por narrativa, descoberta, preço ou autorização do mestre.",
  },
  {
    id: "habilidades-balanceamento",
    category: "habilidades",
    title: "Habilidades: criação, escala e balanceamento",
    summary:
      "Modelo oficial de habilidade, tipos, escalas, custos, recarga e limites de poder.",
    tags: ["habilidades", "balanceamento", "escala"],
    content:
      "Habilidade é qualquer poder, técnica, mutação, módulo, contrato, ataque especial, passiva ou reação que permita fazer algo além de uma ação comum. Toda habilidade precisa ter estrutura, escala, custo e limite.\n\nModelo oficial: Nome; Raça/Origem; Tipo; Escala; Custo; Teste; Alcance; Duração; Recarga; Dano/Cura/Defesa; Efeito; Limitação; Consequência.\n\nTipos: Ativa, Passiva, Reação e Transformação. Escalas: Comum, Especial, Rara, Suprema e Lendária.\n\nDano alto precisa ter pelo menos um freio: recarga, preparação, custo de HP, gasto de recurso, rebote, risco de falha, vulnerabilidade durante uso, condição específica ou consequência narrativa.\n\nCura forte não deve vir junto com dano forte e defesa forte na mesma ficha sem grande limitação.",
  },
  {
    id: "armaduras-e-equipamentos",
    category: "armaduras",
    title: "Armaduras Kaiju, módulos e equipamentos",
    summary:
      "Referência para humanos preparados, tecnologia, armaduras, módulos e itens especiais.",
    tags: ["armaduras", "módulos", "equipamentos"],
    content:
      "Humanos combatentes contra kaijus normalmente não devem ser balanceados apenas como soldados comuns com armas anti-kaiju. Quando preparados para enfrentar kaijus, eles usam Armaduras Kaiju, feitas com tecnologia, materiais kaiju e módulos de combate.\n\nEstágios de domínio de Armadura Kaiju: 0 sem compatibilidade, 1 compatível, 2 treinado, 3 especialista, 4 sincronizado, 5 ressonância kaiju. Estágios altos devem ter risco narrativo.\n\nTipos de módulo: arma, defesa, mobilidade, sensor, contenção, supressão de regeneração, resistência elemental e análise de núcleo.\n\nItens importantes devem registrar nome, tipo, efeito, limitações, dono atual, origem, se é público ou secreto, e se está ligado a missão, NPC, facção ou consequência.",
  },
  {
    id: "regras-da-casa",
    category: "regras-da-casa",
    title: "Regras da casa e decisões do mestre",
    summary:
      "Espaço para registrar ajustes próprios, exceções, decisões de mesa e limites de balanceamento.",
    tags: ["mestre", "customizado", "decisões"],
    content:
      "Use regras da casa para adaptar o sistema ao tom da sua mesa. Toda regra da casa deve ter explicação curta, motivo, exemplo de uso e limite.\n\nQuando uma regra nova deixar o jogo lento, confuso ou forte demais, marque para revisão pós-sessão.\n\nRegistre decisões do mestre que podem voltar depois: como uma condição funciona, como um poder interage com outro, qual custo foi usado em uma cena especial e qual exceção foi permitida.\n\nPara sistemas próprios, o mais importante é rastrear consequências. Se uma habilidade, linhagem, armadura ou poder narrativo aparece, anote o preço dela e quando ela deve voltar para a história.",
  },
];

export const initialNpcSheets: NpcSheet[] = [
  npc({
    id: "janie",
    category: "criminosos",
    name: "Janie",
    role: "Criminosa ágil / infiltradora social",
    description: "Motivo da prisão: roubar um banco. Humana comum de Tier 1, focada em Destreza e Carisma.",
    stats: [
      ["Tier", "Tier 1"], ["HP", "34"], ["Raça/Base", "Humano"], ["Variação", "Humano comum"],
      ["For", "1"], ["Con", "1"], ["Des", "6"], ["Int", "1"], ["Sab", "0"], ["Car", "6"],
      ["Iniciativa", "1d20 + 6"], ["Defesa", "Esquiva 1d20+6; blefe/negociação 1d20+6"],
      ["Ataque/Dano", "Ataque leve ou pistola roubada: 1d6+Destreza"], ["Alcance", "2m ou arma curta 10m"],
      ["Redução", "Nenhuma"], ["Regeneração", "Nenhuma"], ["Equipamento", "Ferramentas de arrombamento simples, arma leve roubada ou improvisada"],
    ],
    notes: [
      "Fuga de Banco: ação rápida ou movimento; 1d20+Destreza; reposiciona até 6m, entra em cobertura ou escapa de agarrão simples.",
      "Cara de Inocente: ação principal social; 1d20+Carisma; distrai, mente ou ganha tempo para esconder item, fugir ou reposicionar aliados.",
      "Fraqueza: Constituição baixa; se for pega sem cobertura ou plano de fuga, cai rápido. Sabedoria 0 a deixa vulnerável a armadilhas e sustos.",
    ],
  }),
  npc({
    id: "roni",
    category: "criminosos",
    name: "Roni",
    role: "Estrategista social / golpista",
    description: "Motivo da prisão: passou um golpe em uma cidade inteira. Humano comum de Tier 1, perigoso em cenas sociais e frágil em combate físico.",
    stats: [
      ["Tier", "Tier 1"], ["HP", "30"], ["Raça/Base", "Humano"], ["Variação", "Humano comum"],
      ["For", "0"], ["Con", "0"], ["Des", "0"], ["Int", "8"], ["Sab", "1"], ["Car", "8"],
      ["Iniciativa", "1d20 + 0"], ["Defesa", "Defesa social 1d20+Carisma; defesa tecnológica/estratégica 1d20+Inteligência"],
      ["Ataque/Dano", "Arma improvisada 1d4; truque tecnológico 1d6+Inteligência se houver equipamento"],
      ["Alcance", "1,5m ou dispositivo 10m"], ["Redução", "Nenhuma"], ["Regeneração", "Nenhuma"],
      ["Equipamento", "Documentos falsos, comunicador, dispositivos de trapaça"],
    ],
    notes: [
      "Golpe Perfeito: ação principal; 1d20+Carisma ou Inteligência contra Sabedoria/Inteligência; alvo fica Enganado por 1 rodada e sofre -1d4 no próximo teste relevante.",
      "Plano de Saída: reação; 1d20+Inteligência DT 12; dá +2 no próximo teste de fuga ou cobertura.",
      "Fraqueza: quase inútil em luta física direta; depende de fala, plano ou tecnologia.",
    ],
  }),
  npc({
    id: "fraudas-geraldo",
    category: "criminosos",
    name: "Fraudas - Geraldo",
    role: "Combatente físico atrasado",
    description: "Humano bruto anômalo. Motivo da prisão: abandonou famílias e recusou pensão/fraldas. Tier 2 pela Força sobre-humana.",
    stats: [
      ["Tier", "Tier 2 pela Força sobre-humana"], ["HP", "50"], ["Raça/Base", "Humano"], ["Variação", "Humano bruto anômalo"],
      ["For", "15"], ["Con", "5"], ["Des", "5"], ["Int", "0"], ["Sab", "0"], ["Car", "8"],
      ["Iniciativa", "1d20 + 5"], ["Defesa", "Bloqueio 1d20+5 ou esquiva 1d20+5"],
      ["Ataque/Dano", "Soco bruto 1d8+Força; agarrão 1d20+Força"], ["Alcance", "2m"],
      ["Redução", "Nenhuma; pode usar Resistir como reação para +1d6"], ["Regeneração", "Nenhuma"],
    ],
    notes: [
      "Brutalidade de Mau Pagador: ação principal; 1d20+Força; causa 2d8+Força e empurra 3m se superar defesa por 5+.",
      "Atraso Crônico de 5 Minutos: no início de cena urgente testa 1d20+Sabedoria DT 12; se falhar age por último e perde ação rápida.",
      "Fraqueza: forte, mas lento para decidir, fácil de manipular e péssimo contra truques.",
    ],
  }),
  npc({
    id: "bola-oito-bernardo",
    category: "criminosos",
    name: "Bola Oito - Bernardo",
    role: "Combatente ágil / arma improvisada",
    description: "Humano criminoso violento de Tier 1 elite. Usa uma bola oito como arma.",
    stats: [
      ["Tier", "Tier 1 elite"], ["HP", "42"], ["Raça/Base", "Humano"], ["Variação", "Humano criminoso violento"],
      ["For", "3"], ["Con", "3"], ["Des", "8"], ["Int", "1"], ["Sab", "1"], ["Car", "3"],
      ["Iniciativa", "1d20 + 8"], ["Defesa", "Esquiva 1d20+8; aparar/improvisar 1d20+8"],
      ["Ataque/Dano", "Bola oito ou arremesso: 1d8+Destreza"], ["Alcance", "2m ou arremesso 8m"],
      ["Redução", "Nenhuma"], ["Regeneração", "Nenhuma"], ["Equipamento", "Bola oito pesada; objetos de bar ou prisão"],
    ],
    notes: [
      "Mira no Olho: ação rápida para mirar + ação principal; 1d20+Destreza; dano normal +1d8 e Cegueira Parcial por 1 rodada se houver olho/sensor exposto.",
      "Arma de Sinuca: passiva; usa Destreza com a bola oito e ganha +2 para esconder, sacar ou recuperar essa arma.",
      "Fraqueza: previsível se provocarem sua agressividade ou tirarem sua arma.",
    ],
  }),
  npc({
    id: "nerd-pate",
    category: "criminosos",
    name: "Nerd - Pate",
    role: "Técnico / estrategista",
    description: "Motivo da prisão: hackeou a UMCK. Humano técnico de Tier 1 focado em Inteligência e Sabedoria.",
    stats: [
      ["Tier", "Tier 1"], ["HP", "42"], ["Raça/Base", "Humano"], ["Variação", "Humano técnico"],
      ["For", "1"], ["Con", "3"], ["Des", "2"], ["Int", "8"], ["Sab", "5"], ["Car", "0"],
      ["Iniciativa", "1d20 + 2"], ["Defesa", "Tecnológica 1d20+8; percepção 1d20+5; esquiva 1d20+2"],
      ["Ataque/Dano", "Choque de dispositivo 1d8+Inteligência contra alvo tecnológico; arma leve 1d6+Destreza"],
      ["Alcance", "Dispositivo 10m; arma leve 10m"], ["Redução", "Nenhuma"], ["Regeneração", "Nenhuma"],
      ["Equipamento", "Notebook/terminal portátil, ferramentas de invasão, cabos, comunicador"],
    ],
    notes: [
      "Invasão UMCK: ação principal; 1d20+Inteligência contra DT do sistema ou defesa tecnológica; abre portas, desliga sensores, trava comunicadores ou aplica -1d6 em teste tecnológico.",
      "Leitura de Padrão: ação rápida; 1d20+Sabedoria ou Inteligência DT 12; próximo aliado recebe +2 contra alvo/sistema marcado.",
      "Fraqueza: ruim em interação social direta e depende de acesso tecnológico para brilhar.",
    ],
  }),
  npc({
    id: "ligeirinho",
    category: "criminosos",
    name: "Ligeirinho",
    role: "Combatente ágil / fugitivo",
    description: "Humano extremamente veloz, Tier 2 pela Destreza 10. Matou 3 homens sem levar um soco e quase fugiu da polícia.",
    stats: [
      ["Tier", "Tier 2 pela Destreza 10"], ["HP", "30"], ["Raça/Base", "Humano"], ["Variação", "Humano extremamente veloz"],
      ["For", "1"], ["Con", "0"], ["Des", "10"], ["Int", "3"], ["Sab", "2"], ["Car", "0"],
      ["Iniciativa", "1d20 + 10"], ["Defesa", "Esquiva 1d20+10"],
      ["Ataque/Dano", "Golpes rápidos 1d8+Destreza; sequência: dois ataques leves 1d6+Destreza se gastar ação principal"],
      ["Alcance", "2m"], ["Redução", "Nenhuma"], ["Regeneração", "Nenhuma"], ["Equipamento", "Roupas leves, faca ou arma improvisada pequena"],
    ],
    notes: [
      "Sem Levar um Soco: reação; esquiva com vantagem +Destreza; se superar o ataque evita dano e move 3m.",
      "Quase Impossível de Pegar: movimento + ação rápida; 1d20+Destreza DT 12; reposiciona até 15m e ganha +2 na próxima esquiva.",
      "Fraqueza: HP baixo, Constituição 0 e Carisma 0; se for atingido, agarrado, cansado ou preso em área sem rota, cai rapidamente.",
    ],
  }),
  npc({
    id: "policial-comum-fisico",
    category: "policia-umck",
    name: "Policial comum - físico",
    role: "Soldado de contenção corpo a corpo",
    description: "Humano comum treinado, Tier 1, focado em contenção física e atuação em formação.",
    stats: [
      ["Tier", "Tier 1"], ["HP", "42"], ["Raça/Base", "Humano"], ["Variação", "Humano comum treinado"],
      ["For", "3"], ["Con", "3"], ["Des", "5"], ["Int", "2"], ["Sab", "1"], ["Car", "0"],
      ["Iniciativa", "1d20 + 5"], ["Defesa", "Esquiva 1d20+5 ou bloqueio 1d20+3"], ["Ataque/Dano", "Cacetete: 2d4+Força"],
      ["Alcance", "4m"], ["Redução", "Nenhuma; pode usar Resistir para +1d6 como reação"], ["Regeneração", "Nenhuma"],
      ["Equipamento", "Cacetete extensível, algemas, rádio, colete leve"],
    ],
    notes: ["Formação de Contenção: passiva; com outro policial a até 4m recebe +2 em agarrar, bloquear passagem ou proteger aliado.", "Fraqueza: sem armadura pesada; contra kaijus, simbiontes ou área precisa de apoio e cobertura."],
  }),
  npc({
    id: "policial-comum-armas",
    category: "policia-umck",
    name: "Policial comum - armas",
    role: "Soldado de contenção com arma laser",
    description: "Atirador comum de Tier 1 com arma laser e equipamento policial básico.",
    stats: [
      ["Tier", "Tier 1"], ["HP", "44"], ["Raça/Base", "Humano"], ["Variação", "Humano comum treinado"],
      ["For", "1"], ["Con", "2"], ["Des", "2"], ["Int", "1"], ["Sab", "1"], ["Car", "1"],
      ["Iniciativa", "1d20 + 2"], ["Defesa", "Esquiva 1d20+2 ou cobertura"], ["Ataque/Dano", "Arma laser: 1d10+Inteligência"],
      ["Alcance", "10m"], ["Redução", "Nenhuma; colete leve apenas narrativo salvo melhoria"], ["Regeneração", "Nenhuma"],
      ["Equipamento", "Arma laser, bateria, rádio, algemas, colete leve"],
    ],
    notes: ["Tiro de Supressão: ação principal; 1d20+Destreza ou Inteligência; se errar por até 3, alvo sofre -1d4 no próximo avanço ou ataque.", "Fraqueza: pouco dano contra redução alta; precisa mirar ponto fraco ou atuar em grupo."],
  }),
  npc({
    id: "capitao-jack",
    category: "policia-umck",
    name: "Capitão da Instalação - Jack",
    role: "Comandante / atirador tático",
    description: "Oficial da instalação, alcance operacional 50m. Tier 2, perigoso à distância e em comando.",
    stats: [
      ["Tier", "Tier 2"], ["HP", "60"], ["Raça/Base", "Humano"], ["Variação", "Humano comandante treinado"],
      ["For", "2"], ["Con", "2"], ["Des", "10"], ["Int", "5"], ["Sab", "6"], ["Car", "1"],
      ["Iniciativa", "1d20 + 10"], ["Defesa", "Esquiva 1d20+10; leitura tática 1d20+6; tecnologia 1d20+5"],
      ["Ataque/Dano", "Fuzil de precisão UMCK: 2d8+Destreza ou Inteligência"], ["Alcance", "50m"],
      ["Redução", "Colete/armadura leve: 1d4 contra disparos comuns"], ["Regeneração", "Nenhuma"],
      ["Equipamento", "Fuzil de precisão, comunicador de comando, chave de segurança, colete tático"],
    ],
    notes: ["Ordem de Fogo: ação rápida; 1d20+Carisma ou Sabedoria DT 12; aliado recebe +2 no próximo ataque ou defesa.", "Tiro do Capitão: ação principal; 1d20+Destreza; 3d10+Destreza e ignora 4 de Redução se alvo estiver marcado/ponto fraco exposto.", "Fraqueza: HP moderado e Constituição baixa; vulnerável se cercado ou sem linha de comando."],
  }),
  npc({
    id: "menta-gern",
    category: "policia-umck",
    name: "Convidada UMCK - Menta / Gern",
    role: "Atiradora especial / infiltradora",
    description: "Agente UMCK de elite, Tier 3 nomeada. Protege e vigia Erik/Erick, Herdeiro do Sangue Dourado.",
    stats: [
      ["Tier", "Tier 3 nomeada"], ["HP", "50"], ["Raça/Base", "Humano"], ["Variação", "Agente UMCK de elite"],
      ["For", "5"], ["Con", "5"], ["Des", "15"], ["Int", "8"], ["Sab", "8"], ["Car", "0"],
      ["Iniciativa", "1d20 + 15"], ["Defesa", "Esquiva 1d20+15; percepção 1d20+8; tecnologia 1d20+8"],
      ["Ataque/Dano", "Arma de precisão: 2d10+1d6+Inteligência"], ["Alcance", "20m"],
      ["Redução", "Traje furtivo leve: 1d4 contra disparos comuns"], ["Regeneração", "Nenhuma"],
      ["Equipamento", "Arma de precisão UMCK, traje furtivo, visor tático, munição especial"],
    ],
    notes: ["Olho de Águia: passiva rara; contra alvo marcado/ponto vital exposto acerta ponto fraco, dobra dano contra comuns; contra bosses adiciona +1 dado e ignora 4 de Redução.", "Invisibilidade Total: ação principal; detectável por 1d20+Sabedoria/sensor contra DT 24; dura até 3 rodadas ou ataque chamativo.", "Tiro Carregado: 3 turnos carregando; 1d20+Destreza ou Inteligência; causa 80 fixo + dano da arma; se falhar no carregamento perde carga e fica Exposta.", "Fraqueza: HP baixo para o Tier; vulnerável se furtividade for anulada ou forçada ao corpo a corpo contra tanque."],
  }),
  npc({
    id: "tank",
    category: "ameacas-pesadas",
    name: "Tank",
    role: "Tanque / guarda de choque",
    description: "Inimigo humano de contenção pesada com blindagem, Tier 2, focado em bloqueio e proteção.",
    stats: [
      ["Tier", "Tier 2"], ["HP", "100"], ["Raça/Base", "Humano"], ["Variação", "Humano com blindagem pesada"],
      ["For", "5"], ["Con", "10"], ["Des", "1"], ["Int", "1"], ["Sab", "1"], ["Car", "3"],
      ["Iniciativa", "1d20 + 1"], ["Defesa", "Bloqueio 1d20+10; esquiva 1d20+1"], ["Ataque/Dano", "Golpe pesado: 2d6+Força"],
      ["Alcance", "2m"], ["Redução", "Frontal 2d20+Constituição; costas/articulações/ponto fraco 1d6+Constituição"], ["Regeneração", "Nenhuma"],
      ["Equipamento", "Blindagem pesada, escudo ou placas de choque"],
    ],
    notes: ["Parede Viva: reação rara; aplica redução frontal 2d20+Constituição também em aliado adjacente/atrás dele.", "Fraqueza: extremamente lento; costas, terreno difícil, armadilhas e controle de movimento reduzem sua ameaça."],
  }),
  npc({
    id: "juggernaut",
    category: "ameacas-pesadas",
    name: "Juggernaut",
    role: "Tanque de choque / boss de instalação",
    description: "Unidade pesada de armadura experimental. Trate como mini-boss ou ameaça especial, não como policial comum.",
    stats: [
      ["Tier", "Tier 3, com habilidades supremas/lendárias"], ["HP", "150 HP de armadura/corpo integrado"], ["Raça/Base", "Humano com Armadura Kaiju"], ["Variação", "Armadura Juggernaut experimental"],
      ["For", "20"], ["Con", "15"], ["Des", "5"], ["Int", "0"], ["Sab", "0"], ["Car", "0"],
      ["Iniciativa", "1d20 + 5"], ["Defesa", "Bloqueio 1d20+15; esquiva 1d20+5"], ["Ataque/Dano", "Soco da armadura: 2d8+Força"],
      ["Alcance", "3,5m"], ["Redução", "Ataques leves sem ponto fraco causam dano mínimo 1 ou são anulados; ataques médios/pesados Redução 2d12"], ["Regeneração", "Nenhuma natural"],
      ["Equipamento", "Armadura Juggernaut pesada, núcleos de carga nas pernas e punhos"],
    ],
    notes: ["Investida: suprema; 2 turnos carregando; ataque com vantagem +Força; 4d20+Força+Constituição; se errar fica inutilizado 3 rodadas e vulnerável.", "Soco Carregado: ação principal; 1d20+Força; 2d12+Força e empurra 3m; 2 cargas por dia/cena longa.", "Explosão de Dano Acumulado: quando acumular 200 de dano recebido, todos no alcance testam 1d20+Des/Con contra DT 35; dano acumulado zera após explosão.", "Roubo de Vitalidade: ação rápida; próximo ataque que acertar cura 50% do dano final causado.", "Modo Juggernaut: lendária de boss; ativa em 1000 de dano causado+recebido acumulados; 4 turnos com +50% físicos, vantagem e HP dobrado temporariamente.", "Fraqueza: depende de carga, espaço e núcleos; juntas/núcleo, fogo e ações coordenadas abrem janelas de dano."],
  }),
  npc({
    id: "symbionte-tank",
    category: "simbiontes",
    name: "Symbionte - tipo tank",
    role: "Tanque regenerativo",
    description: "Organismo simbionte pesado. Usa traços raciais de simbionte com contrajogo por fogo e som alto.",
    stats: [
      ["Tier", "Tier 3"], ["HP", "200"], ["Raça/Base", "Meio-Kaiju / organismo simbionte"], ["Variação", "Tank biológico"],
      ["For", "10"], ["Con", "15"], ["Des", "6"], ["Int", "2"], ["Sab", "2"], ["Car", "0"],
      ["Iniciativa", "1d20 + 6"], ["Defesa", "Bloqueio 1d20+15 ou esquiva 1d20+6"], ["Ataque/Dano", "Pancada ou garra pesada: 2d8+Força"],
      ["Alcance", "4m"], ["Redução", "2d8+2; Carapaça Resistente +2d12 por 2 turnos"], ["Regeneração", "2d12+5; com Alteração 2d12+12"],
      ["Equipamento", "Corpo simbionte blindado"],
    ],
    notes: ["Carapaça Resistente: ação rápida; por 2 turnos reduz +2d12 além da redução racial; fogo em abertura ignora extra.", "Alteração de Regeneração: passiva rara; regeneração muda para 2d12+12; fogo ainda bloqueia por 5 turnos.", "Fraqueza: fogo e som alto são contrajogo; evite somar resistências extras além da carapaça."],
  }),
  npc({
    id: "symbionte-agil",
    category: "simbiontes",
    name: "Symbionte - tipo ágil",
    role: "Predador rápido",
    description: "Organismo simbionte veloz, Tier 2, muito perigoso se alcançar o alvo, mas frágil se controlado.",
    stats: [
      ["Tier", "Tier 2"], ["HP", "30"], ["Raça/Base", "Meio-Kaiju / organismo simbionte"], ["Variação", "Ágil"],
      ["For", "0"], ["Con", "0"], ["Des", "15"], ["Int", "0"], ["Sab", "0"], ["Car", "0"],
      ["Iniciativa", "1d20 + 15"], ["Defesa", "Esquiva 1d20+15; frágil contra controle de área"], ["Ataque/Dano", "Garras rápidas 1d8+Destreza; Sangramento +2d6 por 2 turnos"],
      ["Alcance", "2m"], ["Redução", "2d8+2 racial, mas pode reduzir contra dano esmagador"], ["Regeneração", "2d12+5 racial"],
      ["Equipamento", "Corpo simbionte leve"],
    ],
    notes: ["Sangramento: passiva especial; ao acertar corpo a corpo, alvo sofre 2d6 no final do turno por 2 turnos.", "Pulo: movimento; 1d20+Destreza; salta até 15m ignorando obstáculos baixos e terreno difícil leve.", "Fraqueza: HP baixo e atributos mentais 0; fogo bloqueia sua sobrevivência."],
  }),
  npc({
    id: "symbionte-longo-alcance",
    category: "simbiontes",
    name: "Symbionte - tipo longo alcance",
    role: "Atirador biológico",
    description: "Organismo simbionte de projéteis, Tier 2, focado em disparos biológicos à distância.",
    stats: [
      ["Tier", "Tier 2"], ["HP", "45"], ["Raça/Base", "Meio-Kaiju / organismo simbionte"], ["Variação", "Longo alcance"],
      ["For", "0"], ["Con", "0"], ["Des", "5"], ["Int", "15"], ["Sab", "0"], ["Car", "0"],
      ["Iniciativa", "1d20 + 5"], ["Defesa", "Esquiva 1d20+5; defesa mental/percepção quase nula"], ["Ataque/Dano", "Disparo biológico: 2d20+Inteligência"],
      ["Alcance", "20m para disparo; corpo a corpo 2m"], ["Redução", "2d8+2 racial"], ["Regeneração", "2d12+5 racial"],
      ["Equipamento", "Estruturas biológicas de disparo"],
    ],
    notes: ["Disparo: ação principal; 1d20+Inteligência; 2d20+Inteligência e alvo sofre -2d4 no próximo teste de ataque ou defesa.", "Fraqueza: corpo frágil e Sabedoria 0; corpo a corpo ou som alto derrubam eficiência."],
  }),
  npc({
    id: "symbionte-controle-grupo",
    category: "simbiontes",
    name: "Symbionte - tipo controle de grupo",
    role: "Controle / agarrão",
    description: "Organismo simbionte de contenção, Tier 2, usa gosma e tentáculos para prender alvos.",
    stats: [
      ["Tier", "Tier 2"], ["HP", "60"], ["Raça/Base", "Meio-Kaiju / organismo simbionte"], ["Variação", "Controle de grupo"],
      ["For", "6"], ["Con", "6"], ["Des", "6"], ["Int", "0"], ["Sab", "0"], ["Car", "0"],
      ["Iniciativa", "1d20 + 6"], ["Defesa", "Bloqueio, esquiva ou agarrão 1d20+6"], ["Ataque/Dano", "Zack Q 2d8 ao bater alvos; ataque simples 1d8+Força"],
      ["Alcance", "Gosma 8m; Zack Q 10m"], ["Redução", "2d8+2 racial"], ["Regeneração", "2d12+5 racial"],
      ["Equipamento", "Gosma simbionte e tentáculos de contenção"],
    ],
    notes: ["Gosma: ação principal; 1d20+Força; não causa dano, reduz movimento e acumula até 3 stacks; DTs 12/16/20 para escapar.", "Zack Q: ação principal; 1d20+Força; segura até dois alvos e causa 2d8 em cada alvo preso.", "Fraqueza: sem dano explosivo; fogo e som quebram pressão da gosma e tentáculos."],
  }),
  npc({
    id: "symbionte-chicote",
    category: "simbiontes",
    name: "Symbionte - tipo chicote",
    role: "Assassino de alcance",
    description: "Organismo simbionte de alcance extremo, Tier 2, minion perigoso com HP extremamente baixo.",
    stats: [
      ["Tier", "Tier 2, minion perigoso"], ["HP", "10"], ["Raça/Base", "Meio-Kaiju / organismo simbionte"], ["Variação", "Chicote"],
      ["For", "5"], ["Con", "0"], ["Des", "15"], ["Int", "0"], ["Sab", "0"], ["Car", "0"],
      ["Iniciativa", "1d20 + 15"], ["Defesa", "Esquiva 1d20+15, mas cai rápido se travado"], ["Ataque/Dano", "Chicotada: 2d12+Destreza"],
      ["Alcance", "15m"], ["Redução", "2d8+2 racial"], ["Regeneração", "2d12+5 racial"], ["Equipamento", "Membros em forma de chicote"],
    ],
    notes: ["Chicotada: ação principal; 1d20+Destreza; 2d12+Destreza; pode puxar objeto leve ou desarmar se superar defesa por 5+.", "Fraqueza: HP muito baixo; se chicote for preso, cortado, queimado ou enrolado sofre desvantagem até se soltar."],
  }),
  npc({
    id: "symbionte-general",
    category: "simbiontes",
    name: "Symbionte General / Boss",
    role: "Boss assimilador",
    description: "Chefe simbionte, Tier 5. Usa traços raciais próprios e DT de som reduzida para 10.",
    stats: [
      ["Tier", "Tier 5"], ["HP", "1000"], ["Raça/Base", "Kaiju / Meio-Kaiju simbionte superior"], ["Variação", "General simbionte"],
      ["For", "50"], ["Con", "30"], ["Des", "25"], ["Int", "0"], ["Sab", "0"], ["Car", "0"],
      ["Iniciativa", "1d20 + 25"], ["Defesa", "Bloqueio 1d20+30; esquiva 1d20+25; ataques mentais exploram Sabedoria 0"],
      ["Ataque/Dano", "Golpe titânico 4d12+Força; agarrão/consumir usa Constituição"], ["Alcance", "4m corpo a corpo; maior se assimilar habilidades"],
      ["Redução", "2d20+2 racial; Carapaça Resistente adiciona +2d12 por 2 turnos"], ["Regeneração", "2d12+8 racial; ao Consumir regenera 2d20 adicionais"],
      ["Equipamento", "Massa simbionte colossal, núcleos assimilados"],
    ],
    notes: ["Consumir: ação principal; alvo faz 1d20+Constituição contra DT 15, com desvantagem se agarrado; se consumido, General ganha +1 em todos atributos e regenera 2d20 HP.", "Carapaça Resistente: ação rápida; por 2 turnos reduz +2d12 além da redução racial; não protege contra fogo em abertura, dano verdadeiro ou ponto fraco exposto.", "Fusão com Simbiontes: ação principal; assimila simbionte adjacente/derrotado e ganha uma habilidade dele: Carapaça, Pulo, Disparo, Gosma, Zack Q ou Chicotada.", "Fraqueza: fogo é vulnerabilidade severa e bloqueia regeneração por 5 turnos; sons altos usam DT 10; Sabedoria 0 permite estratégias mentais, armadilhas, iscas e controle narrativo."],
  }),
];

export const initialPlayerSheets: PlayerSheet[] = [
  {
    id: "erick-medina-andrade",
    characterName: "Erick Medina Andrade",
    playerName: "Erick Medina Andrade",
    role: "Mentalista tático / controlador / suporte psíquico / usuário de simbionte",
    tier: "Tier 3; pico físico Tier 4 quando Anti-Scaris está em 100%",
    concept:
      "Humano paranormal com Sangue Dourado adormecido e hospedeiro do simbionte kaiju Anti-Scaris. Atua com controle mental, proteção psíquica, comunicação em grupo, detecção de impurezas e combate físico amplificado pelo simbionte.",
    status: values([
      ["HP Base", "36"], ["HP Total Atual", "57"], ["Pontos de Ação", "20/24"], ["Resistência Base", "16"],
      ["Resistência Total", "32"], ["Poder Paranormal", "16"], ["Barra Anti-Scaris", "100/100"],
    ]),
    attributes: values([
      ["Força", "4 / 19 com Anti-Scaris 100%"], ["Constituição", "4 / 19 com Anti-Scaris 100%"],
      ["Destreza", "7 / 22 com Anti-Scaris 100%"], ["Carisma", "5"], ["Inteligência", "10"], ["Sabedoria", "6"],
    ]),
    resources: values([
      ["Poder Paranormal", "Inteligência + Sabedoria = 16"],
      ["Sangue Dourado Adormecido", "+5 HP máximo; vantagem 1 vez por sessão contra Energia K, ambiente extremo ou presença kaiju intensa"],
      ["Anti-Scaris", "Barra de Força 100/100; bônus físico varia conforme porcentagem"],
      ["Descanso Curto", "Sugestão: recupera 20 pontos da Barra de Força"],
      ["Descanso Longo", "Sugestão: Barra de Força volta para 100/100"],
    ]),
    abilities: [
      ability("Corpo e Mente Paranormal", "Passiva", "Rara", "Sempre ativa", "—", "Recebe HP e resistência adicional equivalentes ao Poder Paranormal. Na ficha atual: +16 HP e +16 resistência.", "Pode ser convertida em Redução de Dano Paranormal 1d8+2 contra dano mental, espiritual, paranormal ou possessão."),
      ability("Reflexo Paranormal", "Passiva", "Especial", "Sempre ativa quando aplicável", "+1d4 em testes paranormais", "Aplica-se a leitura mental, defesa mental, controle mental, comunicação mental, percepção psíquica, resistência contra possessão e testes usando Poder Paranormal.", "Não se aplica a ações físicas comuns, armas comuns, ataques corpo a corpo ou testes sociais normais."),
      ability("Mira Paranormal", "Passiva", "Especial", "Sempre ativa quando aplicável", "+1d4 em armas de longa distância", "Aplica-se a pistolas, rifles, armas anti-kaiju de disparo, armas de precisão e disparos feitos com mira.", "Não soma com Reflexo Paranormal no mesmo teste, salvo cena especial autorizada pelo mestre."),
      ability("Ler Mentes", "Ativa", "Rara", "Ação principal ou concentração", "1d20 + Poder Paranormal contra 1d20 + Sabedoria ou Carisma do alvo", "Lê pensamentos superficiais e permite comunicação mental com alvo em até 75 metros ou linha de visão."),
      ability("Rede Mental", "Extensão de Ler Mentes", "Especial", "Concentração", "—", "Conecta até 6 pessoas em até 75 metros ou linha de visão para comunicação mental.", "Cai se Erick perder concentração, ficar inconsciente ou sofrer interferência mental forte."),
      ability("Controle Mental", "Ativa", "Rara / Suprema conforme alvo", "Ação principal + concentração", "1d20 + Poder Paranormal contra 1d20 + Sabedoria ou Carisma do alvo", "Pode sugerir, distrair, paralisar por instantes, forçar ação simples, impedir ação hostil ou controlar ação complexa com permissão do mestre.", "Não controla automaticamente bosses, kaijus lendários, espíritos superiores, entidades sem mente comum ou seres de tier muito superior."),
      ability("Proteção Mental", "Reação ou Ativa", "Rara", "Reação para defender ou ação principal para manter barreira", "1d20 + Poder Paranormal", "Tenta bloquear dano mental, controle mental, possessão, invasão psíquica, ilusão mental ou influência paranormal. Como barreira sustentada, aliados conectados à rede recebem +2 contra efeitos mentais ou possessão.", "Contra efeitos lendários ou entidades muito superiores, não anula automaticamente; reduz, concede vantagem ou protege parcialmente."),
      ability("Geração Constituinte-Matéria", "Ativa", "Rara", "10 a 30 pontos da Barra de Força do Anti-Scaris", "Depende do uso; ataque usa 1d20 + Força ou Destreza", "Cria matéria simbiótica para defesa, ataque ou utilidade. Defesa: escudo de 20 HP por 10 pontos. Ofensivo: 2d8 + Força por 15 pontos. Utilitário: corda, cobertura, camuflagem, ferramenta simples ou extensão corporal.", "Criações grandes, complexas ou permanentes exigem custo maior e aprovação do mestre."),
      ability("Senso de Impureza", "Passiva / Ativa", "Especial", "Conforme cena", "1d20 + Sabedoria ou Poder Paranormal", "Detecta simbiontes, radiação, narcóticos, vírus, doenças, toxinas, substâncias malignas, corrupção biológica e impurezas kaiju.", "Impurezas muito sutis, espirituais ou conceituais podem exigir teste maior."),
      ability("Limpeza Corporal Interna", "Ativa", "Rara", "Ação principal + 10 pontos da Barra de Força", "1d20 + Constituição ou Poder Paranormal", "Remove ou reduz toxinas, drogas, doenças, vírus, infecções, impurezas biológicas e resíduos kaiju.", "Contra infecções kaiju fortes, parasitas especiais, possessão ou corrupção espiritual, pode exigir várias rodadas ou teste difícil."),
      ability("Senso de Perigo", "Reação / Passiva", "Rara", "1 vez por rodada", "Esquiva +1d12", "Quando Erick é alvo de ataque físico detectável, Anti-Scaris percebe perigo de todas as direções e adiciona +1d12 na esquiva.", "Não funciona contra ataques mentais invisíveis, dano inevitável, áreas sem rota de fuga, efeitos lendários sem aviso ou armadilhas conceituais."),
    ],
    notes: [
      "Esta é uma ficha de player, não um NPC.",
      "O mestre deve acompanhar principalmente Poder Paranormal, HP total, Resistência Total e Barra de Força do Anti-Scaris.",
      "Anti-Scaris não multiplica dano diretamente; ele aumenta atributos físicos pela Barra de Força.",
      "Se combinar poder simbiótico ofensivo com poder paranormal ofensivo, escolha um como efeito principal e o outro como bônus secundário.",
      "Instinto Kaiju só deve surgir com excesso de poder kaiju, sobrecarga, gasto de 30+ pontos da Barra em uma habilidade, Sangue Dourado desperto ou energia kaiju bruta. Não surge por poderes paranormais puros.",
    ],
  },
];
