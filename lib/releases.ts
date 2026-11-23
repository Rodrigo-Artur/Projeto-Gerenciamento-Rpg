export type ReleaseCategory = "new" | "improvement" | "fix" | "security" | "integration";
export type AppRelease = {
  version: string;
  title: string;
  status: "released" | "development";
  date?: string;
  summary: string;
  changes: { category: ReleaseCategory; text: string }[];
  pullRequests?: number[];
};

export const releases: AppRelease[] = [
  {
    version: "6.0.1",
    title: "Sessões em quadro e novos medidores",
    status: "released",
    date: "2026-11-23",
    summary: "Primeira integração de Kibo UI, Gauge UI e Motion Primitives na experiência de mestragem.",
    changes: [
      { category: "new", text: "Visualização Kanban de sessões, com mudança de status por arrasto exclusivamente no Modo Edição." },
      { category: "improvement", text: "Medidores de pontos de vida no combate, com cores para situações críticas." },
      { category: "improvement", text: "Transições suaves nos atalhos da Home, respeitando a preferência por menos movimento." },
      { category: "security", text: "Sem alterações nas permissões existentes ou no banco de dados das campanhas." },
    ],
  },
  {
    version: "6.0.0-preview",
    title: "Contas e Central de Atualizações",
    status: "development",
    summary: "Primeira etapa da evolução para contas e campanhas compartilhadas.",
    changes: [
      { category: "new", text: "Cadastro com e-mail e senha e preferência Mestre, Jogador ou Ambos." },
      { category: "integration", text: "Estrutura de login com Google — depende da configuração OAuth no servidor." },
      { category: "security", text: "Proteção das APIs existentes e isolamento inicial das campanhas legadas." },
      { category: "new", text: "Central de Atualizações com histórico por usuário." },
      { category: "improvement", text: "A migração de propriedade das campanhas ocorrerá após confirmação do administrador." }
    ]
  },
  {
    version: "5.1.0",
    title: "Dashboard e navegação inteligente",
    status: "released",
    summary: "Nova Home, busca e central de comandos, navegação contextual e melhor feedback do sistema.",
    changes: [
      { category: "new", text: "Página inicial com estatísticas da campanha, preparação de sessão e favoritos." },
      { category: "new", text: "Central de comandos Ctrl+K com busca de conteúdo, mesas e navegação." },
      { category: "fix", text: "Seleção exata de fichas e abas isoladas por campanha." },
      { category: "improvement", text: "Estados de carregamento, erro, conteúdo vazio e recuperação de falhas." }
    ],
    pullRequests: [10, 12, 13, 14]
  },
  {
    version: "5.0.0",
    title: "Nova identidade visual",
    status: "released",
    summary: "Design System v5, sidebar, topbar e padronização dos módulos.",
    changes: [
      { category: "new", text: "Tokens de interface, botões, cards, modais e estilos compartilhados." },
      { category: "improvement", text: "Navegação lateral e controles de Leitura e Edição." },
      { category: "fix", text: "Melhorias de responsividade nas telas de regras, fichas, mundo e combate." }
    ],
    pullRequests: [6, 7, 8, 9]
  }
];

export function publishedRelease(version: string) {
  return releases.find((item) => item.version === version && item.status === "released");
}

