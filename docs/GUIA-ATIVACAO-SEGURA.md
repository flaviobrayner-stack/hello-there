# Guia de integração e ativação segura — Sistema de Matrícula 2026

## Situação atual

A implementação está na branch `feature/sistema-matricula-2026`, no PR #2. O backend permanece bloqueado por desenho e o Supabase ainda não tem o esquema/perfis confirmados. A interface de matrícula inclui campos que ainda não são persistidos integralmente: filiação, responsável legal, dados de saúde e checklist de documentos. **Não usar o formulário com dados reais enquanto esses pontos não estiverem integrados e testados.**

O arquivo `docs/drafts/schema-review.sql` é apenas uma proposta para revisão. Não movê-lo para `supabase/migrations` nem executá-lo antes da revisão técnica e da aprovação institucional.

## Variáveis de ambiente do servidor

Configurar no ambiente de servidor usado para executar o TanStack Start (não em variáveis `VITE_*`):

- `SUPABASE_URL`: URL do projeto de desenvolvimento.
- `SUPABASE_PUBLISHABLE_KEY`: chave publicável do projeto.
- `MATRICULA_BACKEND_ENABLED=false` até concluir a revisão e os testes.
- `MATRICULA_ACCESS_POLICY_APPROVED=false` até a aprovação explícita da matriz de permissões e RLS.

Nunca configurar chave `service_role`/secret no navegador, no Git ou em variáveis expostas ao cliente. A chave publicável não cria usuários nem substitui a revisão das políticas.

## Sequência obrigatória para liberar uso real

1. Confirmar que o projeto Supabase é um ambiente de desenvolvimento separado de produção.
2. Revisar o esquema, as relações e os campos com a especificação “Ficha Ok 2026”, inclusive todos os campos de estudante, filiação, responsável, saúde e documentos.
3. Aprovar formalmente a regra de CPF/rematrícula, escopo dos operadores, documentos obrigatórios, protocolo, retenção e acesso aos dados de saúde.
4. Ajustar a RPC transacional para persistir o formulário completo e gravar auditoria na mesma transação; rejeitar campos não permitidos.
5. Testar RLS/grants com perfis sintéticos de administrador, operador, usuário inativo e usuário sem sessão. Verificar especialmente que operador não lê saúde e não acessa matrículas fora do escopo.
6. Aplicar somente uma migration revisada no ambiente de desenvolvimento e validar rollback, concorrência de protocolo, CPF duplicado e operações sem permissão.
7. Criar contas pelo fluxo administrativo seguro do Supabase Auth e associar cada UUID a um perfil aprovado. Não inserir senha no código nem criar contas apenas por e-mail.
8. Concluir integração de cursos reais, salvamento, responsáveis, saúde e documentos; validar uploads em Storage privado antes de habilitar envio de arquivos.
9. Homologar com dados sintéticos, revisar logs e controles LGPD e só então habilitar as flags no ambiente de desenvolvimento.
10. Fazer aprovação separada antes de qualquer uso em produção.

## Perfis solicitados — ainda não provisionados

- Arthur — `jose.apsilva7@adm.educacao.pe.gov.br` — operador.
- Taty — `tatyany.oaraujo@adm.educacao.pe.gov.br` — operador.
- Fabio Ariamateia — `fabiojarimateia@adm.educacao.pe.gov.br` — administrador.

Os nomes/e-mails são requisitos documentados, não confirmação de contas existentes. O perfil administrador deve ser atribuído somente após validar a identidade e o UUID da conta.

## Critério de pronto para uso

O sistema só pode ser considerado pronto quando a criação de matrícula salvar todos os campos necessários, o protocolo for gerado no servidor, os dados sensíveis tiverem acesso mínimo, os arquivos estiverem protegidos e os testes de autorização passarem. O sucesso do build/CI não comprova esses requisitos de integração.
