import type { NpcSheet, PlayerSheet, RuleArticle } from "@/types/rulebook";

export const initialRuleArticles: RuleArticle[] = [
  {
    id: "kaiju-visao-geral",
    category: "personagem",
    title: "Kaiju RPG: visão geral para o mestre",
    summary:
      "Resumo operacional do sistema: raças jogáveis, conceito do personagem e o que o mestre precisa controlar.",
    tags: ["kaiju-rpg", "mestre", "base"],
    content:
      "O Kaiju RPG usa quatro raças jogáveis principais: Humano, Kaiju, Meio-Kaiju e Espírito. Todas as outras ideias devem ser tratadas como variações, linhagens, funções, caminhos, contratos, mutações, origens ou estados especiais.\n\nAntes de números, cada personagem precisa responder: o que ele é, como sobrevive nesse mundo e qual problema ou limitação carrega. Um personagem poderoso sem preço tende a ficar menos interessante.\n\nPara o mestre, o ponto principal é manter identidade e contrajogo. Humanos vencem por tecnologia, preparo, armadura e equipe. Kaijus vencem por força, resistência, regeneração e evolução. Meio-Kaijus vencem por versatilidade e corpo modificado. Espíritos vencem por conceito, vínculo, função e manifestação.\n\nUse esta biblioteca como manual prático durante a sessão: abra uma regra, uma ficha de player e ajuste os painéis conforme precisar.",
  },
  {
    id: "atributos-e-escala",
    category: "atributos",
    title: "Atributos e escala de poder",
    summary:
      "Seis atributos principais, usos comuns e referência rápida de escala para interpretar valores.",
    tags: ["atributos", "escala", "valores"],
    content:
      "Todo personagem possui seis atributos principais: Força, Constituição, Destreza, Inteligência, Sabedoria e Carisma. Eles são usados em testes, combate, habilidades, interações e resistências.\n\nForça representa poder físico bruto: ataques pesados, agarrar, empurrar, levantar peso, quebrar objetos, imobilizar e causar dano físico.\n\nConstituição representa vigor e durabilidade: resistir a dano, venenos, radiação, dor, ambientes extremos e efeitos físicos.\n\nDestreza representa velocidade, reflexo e precisão: esquiva, corrida, salto, armas leves, armas de fogo, furtividade, acrobacia e iniciativa.\n\nInteligência representa raciocínio, ciência e tecnologia: operar armas complexas, analisar kaijus, hackear sistemas, estudar Energia K, identificar fraquezas e usar módulos tecnológicos.\n\nSabedoria representa percepção, instinto e sensibilidade espiritual: perceber ameaças, sentir Energia K, resistir a ilusões, lidar com espíritos e manter autocontrole.\n\nCarisma representa presença, comando e força emocional: liderar, intimidar, negociar, inspirar aliados, formar pactos e lidar com entidades conscientes.\n\nEscala aproximada: 1 a 3 é humano comum; 4 a 6 humano treinado; 7 a 10 elite humana; 11 a 20 sobre-humano; 21 a 40 Meio-Kaiju, Kaiju menor ou usuário de armadura avançada; 41 a 80 Kaiju poderoso; 81 a 120 ameaça lendária; 121+ escala mítica.",
  },
  {
    id: "testes-e-dificuldades",
    category: "testes",
    title: "Testes, vantagem e dificuldade",
    summary:
      "Regra padrão de rolagem, CDs sugeridas, vantagem, desvantagem, crítico e falha crítica.",
    tags: ["testes", "d20", "dificuldade"],
    content:
      "Quando uma ação tiver risco de falha, peça um teste. A rolagem padrão é: 1d20 + atributo + bônus situacionais. O resultado precisa alcançar ou superar a dificuldade definida pelo mestre.\n\nDificuldades sugeridas: Muito fácil 5, Fácil 8, Normal 12, Difícil 16, Muito difícil 20, Extremo 24, Lendário 30 e Mítico 40+.\n\nExemplos rápidos: derrubar porta usa Força; resistir a veneno kaiju usa Constituição; desviar de escombros usa Destreza; hackear sistema da UMCK usa Inteligência; perceber criatura translúcida usa Sabedoria; intimidar inimigo usa Carisma.\n\nCom vantagem, role 2d20 e use o maior. Com desvantagem, role 2d20 e use o menor. Vantagem e desvantagem não acumulam várias vezes; se aparecerem ao mesmo tempo, elas se anulam.\n\nNo 20 natural, o personagem consegue sucesso crítico. Em ataque, a sugestão é adicionar +1 dado de dano da arma ou habilidade. No 1 natural, ocorre falha crítica: crie complicação, mas não humilhe o jogador.",
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
      "Para atacar, role 1d20 + atributo de ataque + bônus. O atributo usado depende do tipo de ataque.\n\nAtaque corpo a corpo pesado usa Força. Ataque corpo a corpo ágil usa Destreza. Ataque à distância pode usar Destreza ou Inteligência. Ataque tecnológico usa Inteligência. Ataque espiritual usa Sabedoria ou Carisma. Ataque de conceito usa o atributo que melhor combina com o conceito da entidade.\n\nQuando um personagem é atacado, ele pode tentar se defender. Esquiva normalmente usa 1d20 + Destreza. Outras defesas podem usar Constituição, armadura, escudo, módulo, habilidade ou proteção espiritual, conforme a situação.\n\nO mestre deve manter contrajogo: toda defesa forte precisa ter fraqueza, toda regeneração forte precisa ter forma de ser bloqueada e toda habilidade poderosa precisa ter custo, recarga, risco ou preparação.\n\nSe uma defesa, regeneração ou redução estiver travando o combate, crie pontos fracos: dano específico, elemento contrário, ataque em ponto vulnerável, contenção, supressão de regeneração, dano verdadeiro, desgaste de recurso ou consequência narrativa.",
  },
  {
    id: "criacao-personagem",
    category: "personagem",
    title: "Criação de personagem",
    summary:
      "Etapas práticas para criar personagens jogáveis no Kaiju RPG.",
    tags: ["criação", "personagem", "ficha"],
    content:
      "Ordem sugerida para criar personagem: definir conceito, escolher raça base, escolher variação, escolher função ou caminho, distribuir atributos, definir HP inicial, definir defesa, redução e regeneração, escolher habilidades iniciais, escolher equipamento inicial, definir recurso de evolução, criar fraqueza/risco/limitação, escrever histórico curto e revisar com o mestre.\n\nHumano: HP inicial 30, bônus racial +3 em Inteligência, 1 habilidade básica, equipamento conforme função e autorização do mestre. Funções humanas incluem Combatente Físico, Atirador/Longa Distância, Estrategista, Técnico de Armadura e Comandante.\n\nKaiju: HP inicial 50, 1 habilidade kaiju, Redução de Dano inicial 1d4+2, Regeneração inicial 1d4+2, evolução por Energia K e fraqueza obrigatória.\n\nMeio-Kaiju: híbrido artificial, arma viva, experimento ou mutação. Deve ter risco de instabilidade, compatibilidade, mutação ou controle.\n\nEspírito: evolui por conceito, vínculo, contrato, hospedeiro, manifestação e reconhecimento. Deve ser definido pelo que representa e pela relação com pessoas, lugares ou promessas.\n\nO mestre controla evoluções especiais como Sangue Dourado, mutações raras, vínculos espirituais únicos, núcleos lendários, despertar da Terra Oca e poderes relacionados a entidades míticas.",
  },
  {
    id: "progressao-e-evolucao",
    category: "progressao",
    title: "Progressão e evolução",
    summary:
      "Como cada raça cresce, quais recursos usa e quais riscos o mestre deve acompanhar.",
    tags: ["progressão", "evolução", "recursos"],
    content:
      "Cada raça evolui de um jeito. Humanos evoluem por treino, estudo, experiência, tecnologia e armaduras. Kaijus evoluem por Energia K, batalhas, instinto, sobrevivência e adaptação. Meio-Kaijus evoluem por orbes, núcleos, experimentos, mutações e compatibilidade biológica. Espíritos evoluem por conceito, vínculo, contratos, hospedeiros, manifestação e reconhecimento.\n\nToda evolução importante precisa ter custo: tempo, treino, estudo, recurso, Energia K, orbes, núcleos, contrato, risco, mutação, vínculo ou consequência narrativa.\n\nA evolução deve reforçar a identidade do personagem. Um Humano estrategista melhora análise, comando e tecnologia. Um Kaiju predador fica mais brutal, resistente ou adaptável. Um Meio-Kaiju instável ganha poder e risco. Um Espírito guardião protege melhor aquilo que representa.\n\nA ficha deve registrar raça base, variação, caminho de evolução, nível/estágio, recurso de evolução, pontos disponíveis, habilidades disponíveis para criar, evoluções especiais e consequências acumuladas.\n\nEvoluções especiais não devem ser simples compras de ficha. Elas devem acontecer por narrativa, descoberta, preço ou autorização do mestre.",
  },
  {
    id: "habilidades-balanceamento",
    category: "habilidades",
    title: "Habilidades: criação, escala e balanceamento",
    summary:
      "Modelo oficial de habilidade, tipos, escalas, custos, recarga e limites de poder.",
    tags: ["habilidades", "balanceamento", "escala"],
    content:
      "Habilidade é qualquer poder, técnica, mutação, módulo, contrato, ataque especial, passiva ou reação que permita fazer algo além de uma ação comum. Toda habilidade precisa ter estrutura, escala, custo e limite.\n\nModelo oficial: Nome; Raça/Origem; Tipo; Escala; Custo; Teste; Alcance; Duração; Recarga; Dano/Cura/Defesa; Efeito; Limitação; Consequência.\n\nTipos: Ativa, Passiva, Reação e Transformação. Ativas são usadas no turno. Passivas ficam sempre ativas ou disparam por condição. Reações respondem a eventos fora do turno. Transformações alteram corpo, armadura, espírito ou estado do personagem.\n\nEscalas: Comum, Especial, Rara, Suprema e Lendária. Comum deve ter impacto pequeno. Especial tem custo moderado ou recarga curta. Rara é marcante e forte, mas precisa de custo, risco ou condição. Suprema muda o rumo de combate e exige preparação, custo alto, recarga longa ou consequência. Lendária é narrativa e exige permissão do mestre.\n\nDano alto precisa ter pelo menos um freio: recarga, preparação, custo de HP, gasto de recurso, rebote, risco de falha, vulnerabilidade durante uso, condição específica ou consequência narrativa.\n\nCura forte não deve vir junto com dano forte e defesa forte na mesma ficha sem grande limitação.",
  },
  {
    id: "armaduras-e-equipamentos",
    category: "armaduras",
    title: "Armaduras Kaiju, módulos e equipamentos",
    summary:
      "Referência para humanos preparados, tecnologia, armaduras, módulos e itens especiais.",
    tags: ["armaduras", "módulos", "equipamentos"],
    content:
      "Humanos combatentes contra kaijus normalmente não devem ser balanceados apenas como soldados comuns com armas anti-kaiju. Quando preparados para enfrentar kaijus, eles usam Armaduras Kaiju, feitas com tecnologia, materiais kaiju e módulos de combate.\n\nA evolução tecnológica pode conceder armas, armaduras, módulos kaiju, sensores, drones, implantes, ferramentas, veículos e sistemas de contenção. Essa evolução não muda necessariamente o corpo humano; muda o que ele consegue fazer.\n\nEstágios de domínio de Armadura Kaiju: 0 sem compatibilidade, 1 compatível, 2 treinado, 3 especialista, 4 sincronizado, 5 ressonância kaiju. Estágios altos devem ter risco narrativo.\n\nTipos de módulo: arma, defesa, mobilidade, sensor, contenção, supressão de regeneração, resistência elemental e análise de núcleo.\n\nItens importantes devem registrar nome, tipo, efeito, limitações, dono atual, origem, se é público ou secreto, e se está ligado a missão, NPC, facção ou consequência.",
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

export const initialNpcSheets: NpcSheet[] = [];

export const initialPlayerSheets: PlayerSheet[] = [
  {
    id: "erick-medina-andrade",
    characterName: "Erick Medina Andrade",
    playerName: "Erick Medina Andrade",
    role:
      "Mentalista tático / controlador / suporte psíquico / usuário de simbionte",
    tier:
      "Tier 3; pico físico Tier 4 quando Anti-Scaris está em 100%",
    concept:
      "Humano paranormal com Sangue Dourado adormecido e hospedeiro do simbionte kaiju Anti-Scaris. Atua com controle mental, proteção psíquica, comunicação em grupo, detecção de impurezas e combate físico amplificado pelo simbionte.",
    status: [
      { label: "HP Base", value: "36" },
      { label: "HP Total Atual", value: "57" },
      { label: "Pontos de Ação", value: "20/24" },
      { label: "Resistência Base", value: "16" },
      { label: "Resistência Total", value: "32" },
      { label: "Poder Paranormal", value: "16" },
      { label: "Barra Anti-Scaris", value: "100/100" },
    ],
    attributes: [
      { label: "Força", value: "4 / 19 com Anti-Scaris 100%" },
      { label: "Constituição", value: "4 / 19 com Anti-Scaris 100%" },
      { label: "Destreza", value: "7 / 22 com Anti-Scaris 100%" },
      { label: "Carisma", value: "5" },
      { label: "Inteligência", value: "10" },
      { label: "Sabedoria", value: "6" },
    ],
    resources: [
      { label: "Poder Paranormal", value: "Inteligência + Sabedoria = 16" },
      { label: "Sangue Dourado Adormecido", value: "+5 HP máximo; vantagem 1 vez por sessão contra Energia K, ambiente extremo ou presença kaiju intensa" },
      { label: "Anti-Scaris", value: "Barra de Força 100/100; bônus físico varia conforme porcentagem" },
      { label: "Descanso Curto", value: "Sugestão: recupera 20 pontos da Barra de Força" },
      { label: "Descanso Longo", value: "Sugestão: Barra de Força volta para 100/100" },
    ],
    abilities: [
      {
        name: "Corpo e Mente Paranormal",
        type: "Passiva",
        scale: "Rara",
        cost: "Sempre ativa",
        test: "—",
        effect:
          "Recebe HP e resistência adicional equivalentes ao Poder Paranormal. Na ficha atual: +16 HP e +16 resistência.",
        limit:
          "Pode ser convertida em Redução de Dano Paranormal 1d8+2 contra dano mental, espiritual, paranormal ou possessão, se o mestre preferir.",
      },
      {
        name: "Reflexo Paranormal",
        type: "Passiva",
        scale: "Especial",
        cost: "Sempre ativa quando aplicável",
        test: "+1d4 em testes paranormais",
        effect:
          "Aplica-se a leitura mental, defesa mental, controle mental, comunicação mental, percepção psíquica, resistência contra possessão e testes usando Poder Paranormal.",
        limit:
          "Não se aplica a ações físicas comuns, armas comuns, ataques corpo a corpo ou testes sociais normais.",
      },
      {
        name: "Mira Paranormal",
        type: "Passiva",
        scale: "Especial",
        cost: "Sempre ativa quando aplicável",
        test: "+1d4 em armas de longa distância",
        effect:
          "Aplica-se a pistolas, rifles, armas anti-kaiju de disparo, armas de precisão e disparos feitos com mira.",
        limit:
          "Não soma com Reflexo Paranormal no mesmo teste, salvo cena especial autorizada pelo mestre.",
      },
      {
        name: "Ler Mentes",
        type: "Ativa",
        scale: "Rara",
        cost: "Ação principal ou concentração",
        test: "1d20 + Poder Paranormal contra 1d20 + Sabedoria ou Carisma do alvo",
        effect:
          "Lê pensamentos superficiais e permite comunicação mental com alvo em até 75 metros ou linha de visão.",
      },
      {
        name: "Rede Mental",
        type: "Extensão de Ler Mentes",
        scale: "Especial",
        cost: "Concentração",
        test: "—",
        effect:
          "Conecta até 6 pessoas em até 75 metros ou linha de visão para comunicação mental.",
        limit:
          "Cai se Erick perder concentração, ficar inconsciente ou sofrer interferência mental forte.",
      },
      {
        name: "Controle Mental",
        type: "Ativa",
        scale: "Rara / Suprema conforme alvo",
        cost: "Ação principal + concentração",
        test: "1d20 + Poder Paranormal contra 1d20 + Sabedoria ou Carisma do alvo",
        effect:
          "Pode sugerir, distrair, paralisar por instantes, forçar ação simples, impedir ação hostil ou controlar ação complexa com permissão do mestre.",
        limit:
          "Não controla automaticamente bosses, kaijus lendários, espíritos superiores, entidades sem mente comum ou seres de tier muito superior.",
      },
      {
        name: "Proteção Mental",
        type: "Reação ou Ativa",
        scale: "Rara",
        cost: "Reação para defender ou ação principal para manter barreira",
        test: "1d20 + Poder Paranormal",
        effect:
          "Tenta bloquear dano mental, controle mental, possessão, invasão psíquica, ilusão mental ou influência paranormal. Como barreira sustentada, aliados conectados à rede recebem +2 contra efeitos mentais ou possessão.",
        limit:
          "Contra efeitos lendários ou entidades muito superiores, não anula automaticamente; reduz, concede vantagem ou protege parcialmente.",
      },
      {
        name: "Geração Constituinte-Matéria",
        type: "Ativa",
        scale: "Rara",
        cost: "10 a 30 pontos da Barra de Força do Anti-Scaris",
        test: "Depende do uso; ataque usa 1d20 + Força ou Destreza",
        effect:
          "Cria matéria simbiótica para defesa, ataque ou utilidade. Defesa: escudo de 20 HP por 10 pontos. Ofensivo: 2d8 + Força por 15 pontos. Utilitário: corda, cobertura, camuflagem, ferramenta simples ou extensão corporal.",
        limit:
          "Criações grandes, complexas ou permanentes exigem custo maior e aprovação do mestre.",
      },
      {
        name: "Senso de Impureza",
        type: "Passiva / Ativa",
        scale: "Especial",
        cost: "Conforme cena",
        test: "1d20 + Sabedoria ou Poder Paranormal",
        effect:
          "Detecta simbiontes, radiação, narcóticos, vírus, doenças, toxinas, substâncias malignas, corrupção biológica e impurezas kaiju.",
        limit:
          "Impurezas muito sutis, espirituais ou conceituais podem exigir teste maior.",
      },
      {
        name: "Limpeza Corporal Interna",
        type: "Ativa",
        scale: "Rara",
        cost: "Ação principal + 10 pontos da Barra de Força",
        test: "1d20 + Constituição ou Poder Paranormal",
        effect:
          "Remove ou reduz toxinas, drogas, doenças, vírus, infecções, impurezas biológicas e resíduos kaiju.",
        limit:
          "Contra infecções kaiju fortes, parasitas especiais, possessão ou corrupção espiritual, pode exigir várias rodadas ou teste difícil. Falha pode causar dano, perda de barra ou efeito parcial.",
      },
      {
        name: "Senso de Perigo",
        type: "Reação / Passiva",
        scale: "Rara",
        cost: "1 vez por rodada",
        test: "Esquiva +1d12",
        effect:
          "Quando Erick é alvo de ataque físico detectável, Anti-Scaris percebe perigo de todas as direções e adiciona +1d12 na esquiva.",
        limit:
          "Não funciona contra ataques mentais invisíveis, dano verdadeiro inevitável, áreas sem rota de fuga, efeitos lendários sem aviso ou armadilhas conceituais.",
      },
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
