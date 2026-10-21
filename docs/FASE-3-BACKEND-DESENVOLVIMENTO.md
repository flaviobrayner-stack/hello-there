# Backend de desenvolvimento — Sistema de Matrícula 2026

**Estado:** camada inicial de API adicionada à branch de trabalho. Ainda não está conectada a uma instância Supabase e permanece bloqueada por configuração.

## Código implementado

- `src/lib/server/matricula-api.ts`: autenticação de token Supabase, verificação de perfil ativo, uso exclusivo da chave pública/anon no servidor e respostas sem detalhes internos.
- `src/routes/api.courses.ts`: endpoint `GET /api/courses`, exige colaborador autenticado.
- `src/routes/api.enrollments.ts`: `GET /api/enrollments` com projeção explícita/paginação fixa e `POST /api/enrollments` com validação Zod, limite de corpo e chamada a RPC transacional.
- `src/lib/server/matricula-api.test.ts`: testes dos bloqueios de ativação.
- `.env.example`: nomes das variáveis de ambiente, sem credenciais reais.
- `docs/drafts/schema-review.sql`: proposta de `create_enrollment_transaction`, sequência anual concorrente, registro de auditoria e geração de protocolo.

## Como a API protege o acesso

1. Exige um access token Supabase válido.
2. Confirma a identidade pelo endpoint de Auth do Supabase.
3. Confirma que existe perfil institucional ativo com papel `admin` ou `operador`.
4. Encaminha o token do próprio usuário ao PostgREST, para que as políticas RLS sejam aplicadas; não usa service-role key.
5. Retorna apenas campos administrativos necessários na listagem, sem dados médicos, responsáveis ou caminhos de arquivos.
6. Mantém criação dentro de uma única transação no banco para evitar matrículas órfãs e colisão de protocolo.

## Configuração ainda bloqueada por padrão

As rotas administrativas retornam HTTP 503 até que todas estas variáveis sejam configuradas no ambiente **de servidor**:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `MATRICULA_BACKEND_ENABLED=true`
- `MATRICULA_ACCESS_POLICY_APPROVED=true`

Os dois últimos flags devem permanecer `false` até a instituição aprovar as regras, a migration revisada estar aplicada em um projeto Supabase de desenvolvimento e os testes de autorização passarem. O arquivo `.env.example` mantém ambos desligados.

**Não configurar credenciais em variáveis `VITE_*` e nunca usar a service-role key neste fluxo.** A chave anon é pública, mas a autorização depende de sessão válida e RLS. Segredos de integração devem ficar em ambiente seguro de servidor.

## Dependências externas antes de usar

- Criar/selecionar um projeto Supabase **de desenvolvimento** com autorização institucional.
- Revisar e transformar `docs/drafts/schema-review.sql` em migration aprovada, incluindo grants explícitos da RPC somente para `authenticated`.
- Ajustar RLS para o escopo real dos operadores; as policies no rascunho são preliminares e amplas demais para uso real sem revisão.
- Criar cursos e perfis de colaboradores por processo administrativo seguro.
- Implementar a tela de login e sessão no frontend; os endpoints protegidos exigem token e a interface atual ainda é demonstrativa.
- Definir deduplicação de CPF/rematrícula e regras documentais antes de cadastrar estudantes reais.
- Testar duplicidade, rollback, concorrência, contas desativadas, acesso fora do escopo, campos privilegiados e dados de saúde.

## Endpoints

| Endpoint | Estado |
|---|---|
| `GET /api/courses` | Implementado; exige token e perfil ativo |
| `GET /api/enrollments` | Implementado; exige token e RLS |
| `POST /api/enrollments` | Implementado para chamar RPC transacional; depende da migration aprovada e do grant |
| Upload de documentos | Não implementado; deve usar Storage privado e autorização de servidor |
| Dados médicos | Não expostos pela API geral |
| Geração Google Docs/PDF | Não implementada |
| Gestão de usuários | Não implementada |

## Critério para habilitação

Não habilitar os flags nem usar dados reais até concluir a revisão de `docs/FASE-2-DECISOES-PENDENTES.md`, validar as policies e testar em Supabase de desenvolvimento. Não executar este SQL de rascunho diretamente em produção.
