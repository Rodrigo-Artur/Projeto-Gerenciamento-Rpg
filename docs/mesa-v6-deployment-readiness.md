# Mesa do Mestre 6.0 — Homologação da autenticação / preparação do MooniServer

## Estado confirmado em 20/11/2026

- A PR #15 está em modo **rascunho**, não mesclada com `main`.
- O site atual segue hospedado no container `mooniserver-mesa`, ouvindo apenas em `127.0.0.1:3000`, com tráfego externo pelo Cloudflare Tunnel/Access.
- Banco de produção em volume `mooniserver-mesa_mesa-data`, montado em `/app/.local`.
- O SQLite de produção passou no `PRAGMA integrity_check`, resultado `ok`.
- Backup consistente **anterior à migração**: `/home/mooniserver/backups/mesa-do-mestre/pre-v6-20261120T133401Z.sqlite` (352.256 bytes). Mantenha outra cópia offline antes da implantação.
- Código de testes isolado em `/home/mooniserver/dev/mesa-v6`; instância local na porta `3100` e dados de teste em uma pasta `.local` desse diretório. **Não reutilizar a base de teste como base de produção**.
- O programa `scripts/smoke-auth-staging.mjs` usa emails fictícios em `invalid.example` e senhas aleatórias, mas **cria contas e escolhe um proprietário** no banco apontado pelo servidor de teste. Ele se recusa a usar endereço diferente de loopback ou executar com `NODE_ENV=production`.

## Testes integrados que precisam passar

O GitHub Actions agora executa o smoke test de ponta a ponta após o build. O script valida:

- Anônimo recebe HTTP 401 ao consultar/gravar/exportar `/api/rulebook`;
- Cadastro mestre e jogador por e-mail/senha e rejeição de e-mail duplicado;
- Solicitação de cadastro de outra origem rejeitada com HTTP 403;
- Login com senha errada não produz sessão;
- Login válido produz sessão autenticada;
- Conta sem vínculo de propriedade recebe HTTP 403, inclusive para exportação;
- Leitura de changelog fica separada por usuário;
- Provisionamento offline faz a conta proprietária passar a receber HTTP 200;
- Segunda conta NÃO ganha acesso e tentativa de atribuir segundo proprietário é rejeitada.

O teste não exercita o Google OAuth real: depende de credenciais Google Cloud válidas.

## Bloqueios que impedem a implantação pública imediata

1. **Conta proprietária real ainda não definida.** É preciso receber do titular o e-mail exato que ele usará para se registrar; não escolher por inferência. A conta só recebe a propriedade via comando local com `--confirm`.
2. **`AUTH_SECRET` de produção não provisionado.** Deve ser um segredo estável, privado, aleatório. Não incluí-lo no repositório.
3. **Google OAuth não provisionado.** Ao configurar o cliente no Google Cloud, incluir o callback `https://mesa.rodrigoartur.com.br/api/auth/callback/google`, fornecer ID e segredo somente pelo ambiente privado da aplicação.
4. **Controle de acesso por campanha (6.1) ainda não implementado.** Contas normais entram no onboarding sem acesso às campanhas existentes. Não liberar público enquanto a revisão completa das APIs, recuperação de senha e verificação de e-mail não estiver pronta.
5. **Testes em navegador reais ainda são necessários**, especialmente cadastros/Google e navegação nas fichas após login.

## Procedimento de implantação futura — não executar automaticamente

1. Identificar usuário responsável e e-mail da conta proprietária. Configurar os segredos na implantação do Docker, mantendo arquivos secretos com permissões restritas e fora do Git.
2. Salvar uma segunda cópia íntegra do SQLite em outra unidade. Antes de reconstruir, marcar e conservar a imagem Docker atual de rollback.
3. Testar a versão 6.0 com volume e container **separados** e acesso somente via loopback; não montar o volume `mooniserver-mesa_mesa-data` na imagem preview.
4. Implantar a nova imagem preservando o volume de produção, mas **sem remover Cloudflare Access**.
5. Criar a conta proprietária pelo cadastro. Com a base real, executar `node scripts/grant-legacy-owner.mjs --email EMAIL_EXATO --confirm` em processo administrativo que tenha acesso ao mesmo volume SQLite.
6. Confirmar login do proprietário, leitura dos dados históricos, edição de mesa e backups. Confirmar 401 anônimo / 403 para conta sem permissão.
7. Validar logout e recuperação após reiniciar o container, bem como backup/rollback.
8. Somente quando o controle de permissões estiver homologado, decidir se Cloudflare Access pode ser retirado.

**Não executar a atribuição do proprietário em produção sem confirmar expressamente o e-mail correto e testar a rota de recuperação de acesso.**

## Uso do smoke test no desenvolvimento

```bash
# Requer uma instância de teste já iniciada, banco de teste novo e loopback.
# NÃO usar se o servidor/volume for de produção.
MDM_TEST_BASE_URL=http://127.0.0.1:3100 NODE_ENV=test node scripts/smoke-auth-staging.mjs
```

O script valida a base e atribui um proprietário fictício; portanto, use **um banco de teste descartável novo a cada execução**. Essa condição é garantida pela cópia limpa do projeto no GitHub Actions.
