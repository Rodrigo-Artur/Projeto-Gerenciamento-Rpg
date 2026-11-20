# Mesa do Mestre 6.0 — Primeira entrega: contas e novidades

## Escopo já implementado nesta branch
- Registro de contas com nome, e-mail e senha (scrypt com salt individual) e escolha inicial entre Mestre, Jogador e Ambos
- Login/logout usando Auth.js v5 com cookies de sessão protegidos pelo framework
- Google OAuth preparado, mas só funciona após configurar AUTH_GOOGLE_ID e AUTH_GOOGLE_SECRET
- Contas Google e e-mail/senha **não são vinculadas automaticamente por e-mail**, evitando tomada de conta
- SQLite: novas tabelas auth_users, auth_accounts, campaign_members, user_release_reads e auth_login_attempts; dados das fichas não são alterados
- Rate limit básico persistente para registro e login no servidor único
- Verificação de conta no servidor em /, /player, /focus e em GET/POST/PUT de /api/rulebook
- APIs legadas restritas provisoriamente ao proprietário — qualquer outra conta entra no onboarding e **não enxerga os dados antigos**
- Central em /updates com categorias de mudança, versões 5.0, 5.1 e 6.0-preview, links de PR, estado de leitura por usuário e navegação pela sidebar

## Atenção: esta entrega NÃO conclui a versão 6.0
O módulo de convites, papel por campanha, separação de sistemas entre mestres, recuperação de senha, verificação de e-mail, gerenciamento de dispositivos e OAuth final dependem de etapas posteriores. Também não há acesso aos tokens do Owlbear ou integração OBS nesta primeira entrega.

O perfil escolhido no cadastro é apenas uma **preferência**, jamais autorização. Não exponha o app ao público sem revisão de segurança e testes multiusuário. **Mantenha Cloudflare Access ativo.**

## Implantação segura (executar somente após homologação)
1. Criar backup do volume existente (.local/mesa-do-mestre.sqlite) usando processo consistente do SQLite. Guardar uma cópia fora da unidade e verificar o backup.
2. Configurar um segredo aleatório estável AUTH_SECRET e AUTH_URL=https://mesa.rodrigoartur.com.br no container do servidor. Nunca commitar o segredo.
3. Registrar OAuth de Google no Google Cloud, consent screen e URI de redirecionamento: https://mesa.rodrigoartur.com.br/api/auth/callback/google. Configurar AUTH_GOOGLE_ID e AUTH_GOOGLE_SECRET no container. Se ausentes, o botão Google não aparece.
4. Instalar e iniciar a nova versão em ambiente de teste primeiro. Verificar que login e POST /api/rulebook sem cookie retornam 401, e usuários comuns recebem 403, sem conteúdo privado.
5. Criar a conta do proprietário pelo formulário. **Não conceder proprietário automaticamente ao primeiro cadastro**.
6. Executar script administrativo offline, uma única vez, com o volume SQLite real montado e após backup:
   node scripts/grant-legacy-owner.mjs --email EMAIL_CONFIRMADO --confirm
   O comando precisa ocorrer no mesmo ambiente que monta /app/.local. No MooniServer (imagem Docker),
   por exemplo, após atualizar o código fonte:
   docker run --rm -v mooniserver-mesa_mesa-data:/app/.local -v /home/mooniserver/services/mesa-do-mestre/scripts:/app/scripts:ro -w /app mooniserver/mesa-do-mestre:local node scripts/grant-legacy-owner.mjs --email EMAIL_CONFIRMADO --confirm
   Note: não executar antes de o cadastro existir. Se a imagem Docker ainda não tiver o esquema novo, primeiro inicie a aplicação para criar as tabelas.
7. Fazer login com proprietário e confirmar que as mesas e fichas antigas estão intactas.
8. Só após revisão integral de permissões por campanha e APIs da 6.1 considerar remover o login Cloudflare Access.

## Testes mínimos
- E-mail e senha corretos/incorretos; senha mínima de 12 caracteres
- Múltiplas contas com os três perfis; nenhum usuário ganha papéis administrativos por escolher Mestre
- Anônimo: / redireciona ao login, /api/rulebook retorna 401, /api/releases/read retorna 401
- Usuário comum: / exibe onboarding, /api/rulebook retorna 403
- Proprietário provisionado offline: abre a Home e o banco legado
- Sem credenciais Google: nenhum botão Google; com credenciais Google válidas: fluxo com email verificado
- /updates exibe notas e permite marcar leitura somente da própria conta
- Não há exposição das APIs pelo link da Tela Jogador ou janela destacada
- Validação técnica: npx tsc --noEmit, npm run build

## Próximo incremento
Concluir 6.0.2–6.0.5: vinculação explícita de métodos de login, recuperação e verificação de e-mail, sessões revogáveis, convites, papéis por campanha e migração do proprietário com teste de isolamento completo.

