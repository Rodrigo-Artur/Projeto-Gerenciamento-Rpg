# Mesa do Mestre 6.0 — ativação em produção / recuperação

## Fluxo de ativação do primeiro proprietário

**Nunca** conceda a propriedade ao primeiro usuário que se cadastrar. Antes da implantação, reserve explicitamente o e-mail fornecido pelo administrador, com um token aleatório de 256 bits e uso único.

1. Faça backup consistente do SQLite de produção e verifique `PRAGMA integrity_check` antes de qualquer alteração.
2. Gere um `AUTH_SECRET` estável para os próximos reinícios, exclusivamente em arquivo privado do servidor. Configure também `AUTH_URL=https://mesa.rodrigoartur.com.br`.
3. Rode o script offline `scripts/bootstrap-owner.mjs --email EMAIL_CONFIRMADO --confirm` **montando o mesmo volume SQLite que a nova aplicação usará**, com as permissões do usuário de serviço do Docker. Ele cria um registro reservado ainda sem senha e imprime uma URL `/activate#token=...` de uso único.
4. Entregue a URL **somente ao proprietário**. A ativação permite escolher a senha; o token aparece apenas no fragmento da URL e é removido da barra de endereço pela interface. Apenas SHA-256 do token é armazenado no SQLite. Validade: sete dias.
5. O endpoint `/api/auth/activate` valida origem, aplica limite de tentativas e, numa transação, ativa a conta, concede propriedade das mesas antigas e consome o token. O segundo uso falha; outras contas não recebem permissão.
6. A página tenta entrar com a nova senha automaticamente. Se o navegador não conseguir iniciar a sessão, basta visitar `/login` e entrar com a senha escolhida.

**Não publicar o token em commits, logs públicos, tickets ou relatórios.** Se expirar ou precisar de substituição, execute novo provisionamento administrativo apenas se não houver proprietário ativado. Nunca tente criar um novo proprietário automaticamente a partir do nome de e-mail digitado no cadastro.

## Implantação em MooniServer

- Container atual: `mooniserver-mesa`
- Volume preservado: `mooniserver-mesa_mesa-data`
- Porta de origem: `127.0.0.1:3000`
- Frontend público: `https://mesa.rodrigoartur.com.br`
- Cloudflare Access: **manter ativo**, inclusive durante o lançamento
- Backup pré-6.0 inicial: `/home/mooniserver/backups/mesa-do-mestre/pre-v6-20261120T133401Z.sqlite`

O arquivo Compose pode declarar:

```yaml
services:
  mesa-do-mestre:
    env_file:
      - .env.auth
    image: mooniserver/mesa-do-mestre:v6-auth-live
```

`.env.auth` deve existir **somente no servidor** e possuir permissão `0600`, com `AUTH_SECRET` (alta entropia) e `AUTH_URL`; deixar `AUTH_GOOGLE_ID` e `AUTH_GOOGLE_SECRET` de fora até que o cliente OAuth válido esteja configurado. `.env.auth` é ignorado pelo Git e pelo contexto Docker.

Depois de construir a imagem e verificar a compatibilidade com um container isolado, faça a troca de imagem preservando o volume. **Nunca rode smoke tests que gerem contas fictícias apontando ao volume público.** A criação de contas de staging ocorre apenas em volume descartável.

O `healthcheck` da aplicação deve aceitar redirecionamento para login ou usar `/api/auth/csrf` como verificação técnica, porque a página inicial protegida redireciona usuários não autenticados.

### Reversão

Armazene o Compose anterior e a imagem anterior. Em caso de falha de login ou carregamento das mesas, **não apague o volume**: restaure o Compose com a imagem anterior e execute `docker compose up -d --no-build`. O código antigo ignora as tabelas `auth_*` adicionais. Restaure o banco inteiro a partir do backup apenas se houver corrupção ou migração destrutiva comprovada e após verificar os writes realizados durante a janela de lançamento.

## Cobertura automatizada

`scripts/smoke-auth-staging.mjs` agora usa um SQLite limpo, cadastra contas não proprietárias, executa o bootstrap do proprietário, confirma que o e-mail reservado não pode ser usurpado, valida token inválido, uso único, login, acessos HTTP 401/403/200, separação do changelog e impossibilidade de criar segundo proprietário. O GitHub Actions executa o smoke test depois do build.

Google OAuth é opcional até o cliente ser configurado no Google Cloud. **Não vincule automaticamente uma conta Google a um login com senha usando apenas e-mail coincidente.** Esse recurso terá fluxo de vínculo explícito no futuro.
