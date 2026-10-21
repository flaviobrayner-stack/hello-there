# Fase 2 — revisão técnica do schema e da segurança

**Status: proposta para revisão; não é autorização para executar SQL.**  
**Escopo:** análise do modelo original “Sistema de Matrícula 2026”, com foco em CPF/rematrícula, RLS, privilégios, auditoria e bootstrap do primeiro administrador.

## Regra de mudança

- O SQL continua em `docs/drafts/schema-review.sql`; não foi movido para `supabase/migrations`.
- Nenhum SQL foi executado no Supabase, nenhuma tabela foi criada e nenhum dado foi alterado.
- O modelo original “Ficha Ok 2026” e os documentos Google Forms/Docs não foram modificados.
- Os cursos iniciais não foram inventados: a lista oficial deve ser fornecida/confirmada pela escola.
- Os flags `MATRICULA_BACKEND_ENABLED` e `MATRICULA_ACCESS_POLICY_APPROVED` devem continuar desligados até revisão, teste em desenvolvimento e aprovação explícita.

## Modelo de dados revisado

| Tabela | Finalidade e regra de acesso proposta |
|---|---|
| `profiles` | Um perfil por usuário de Auth; papel `admin` ou `operador`, ativo/inativo. Leitura do próprio perfil ou pelo admin. Sem escrita de papel pelo navegador. |
| `courses` | Catálogo configurável; equipe vê somente cursos ativos; administração de catálogo restrita ao admin. Sem seed até confirmar lista oficial. |
| `students` | Identidade da pessoa, separada das matrículas. CPF normalizado, quando informado, tem índice único parcial. Escritas diretas bloqueadas; usar RPC validada. |
| `enrollments` | Uma matrícula por estudante/ano letivo, com protocolo único, curso, status, cotas e criador. Operador vê apenas matrículas criadas por sua própria conta enquanto o escopo institucional estiver pendente. |
| `parents_guardians` | Mãe, pai e responsável vinculados à matrícula; operadores só leem registros de matrículas próprias nesta proposta conservadora. |
| `health_records` | Dados de saúde separados; somente admin ativo na proposta inicial. A escola precisa aprovar expressamente se outro profissional/papel terá acesso. |
| `documents` | Status e metadados dos documentos; arquivos devem ficar em Storage privado. Sem DML direto genérico. |
| `generated_documents` | Histórico e versão de documentos gerados; links não devem ser públicos. Escrita por fluxo servidor/integração confiável. |
| `audit_logs` | Eventos de auditoria, sem CPF completo, conteúdo de saúde ou conteúdo de arquivos em metadados. Leitura somente admin; escrita por servidor/RPC. |
| `document_rules` | Configuração de documentos obrigatórios, bloqueios e prazos; leitura pela equipe e edição pelo admin. Os valores continuam pendentes de validação contra o modelo oficial. |
| `app_settings` | Configurações administrativas; somente admin. |
| `enrollment_protocol_sequences` | Contador por ano; RLS habilitada, sem grants/policies de acesso direto. Somente RPC revisada pode incrementar. |

## Decisões e regras propostas

### CPF e rematrícula

Recomendação para decisão da escola: tratar `students` como a pessoa e `enrollments` como cada matrícula/ano. Assim, um CPF normalizado não pode identificar duas pessoas, mas a mesma pessoa pode ter matrículas em anos letivos diferentes.

- A RPC do rascunho passou a tentar localizar o estudante pelo CPF antes de inserir um novo registro.
- Se encontrar a pessoa, a proposta reutiliza o registro sem sobrescrever silenciosamente dados pessoais já existentes.
- O índice único parcial impede duplicidade mesmo em requisições concorrentes.
- CPF vazio ainda permite um cadastro sem chave de deduplicação; isso requer conferência manual e auditoria.
- **Ainda pendente:** validar dígitos verificadores do CPF no servidor, criar fluxo seguro para correção de CPF e decidir como reconciliar registros legados/duplicados.
- Não tratar apenas a consulta prévia do frontend como proteção contra duplicidade.

### Acesso e RLS

- O helper `current_active_role()` usa `search_path = ''` e tem privilégios de execução restritos a `authenticated`.
- O SQL inclui revogações explícitas para `anon` e `authenticated`, grants de leitura e DML restrito às tabelas de configuração.
- A tabela de sequência não recebe privilégios de acesso direto.
- O operador só consulta matrículas que criou, além dos dados de estudante associados a essas matrículas, até que a escola aprove um escopo mais amplo.
- Dados de saúde ficam exclusivos de admin nesta proposta conservadora.
- Não há permissão direta genérica para inserir/alterar matrículas, estudantes, responsáveis, documentos ou auditoria; essas operações precisam de RPCs específicas, validação de campos e auditoria.
- O `GRANT EXECUTE` da RPC de criação permanece comentado até revisão formal.

**Limitação importante:** estas policies são um ponto de partida para revisão, não uma certificação de segurança. Ainda precisam de testes de integração no Supabase, análise de owner/SECURITY DEFINER, privilégios efetivos e tentativas negativas com contas admin, operador, conta inativa e usuário sem perfil.

## Bootstrap seguro do primeiro administrador

Não haverá cadastro público nem endpoint que permita ao usuário escolher o próprio papel.

Procedimento proposto, somente depois de aprovar a migration em ambiente de desenvolvimento:

1. O responsável autorizado cria/verifica a conta do primeiro administrador em Supabase Auth por canal controlado.
2. Confirma identidade, e-mail e UUID da conta fora do navegador.
3. Um responsável técnico com acesso administrativo ao projeto executa manualmente uma operação de provisionamento revisada no SQL Editor, vinculando o UUID verificado ao perfil `admin`.
4. Confirma que o perfil está ativo e que a conta consegue entrar; testa também que uma conta comum não pode criar ou elevar o próprio perfil.
5. Registra quem autorizou e quando. Não inserir senhas, tokens, chaves secretas ou credenciais no repositório.
6. Não adicionar endpoint público de bootstrap nem deixar um segredo de bootstrap permanente.

O SQL de provisionamento ainda não está incluído como migration executável: deve ser preparado com o UUID real somente no ambiente autorizado e após a aprovação institucional. Não executar com valores fictícios ou em produção sem autorização expressa.

## Pontos que ainda impedem uso real

1. A RPC ainda não grava todos os campos do formulário original, dados completos de filiação/responsáveis, dados de saúde e metadados de documentos.
2. A regra de cota PCD e a consistência com os dados PCD do estudante precisam de validação no servidor.
3. O estado `rascunho`, conclusão, cancelamento, edição e transições de status precisam de RPCs específicas e regras institucionais aprovadas.
4. O protocolo `MAT-AAAA-000001` é apenas candidato; formato final ainda pendente.
5. Falta validação de dígitos verificadores do CPF no servidor.
6. Falta definir como operadores podem editar dados de uma pessoa que possua matrículas criadas por equipes diferentes.
7. Falta a política de retenção, correção, cancelamento e descarte de dados.
8. Falta política e configuração de Storage privado, validação real do tipo/tamanho de arquivo e links temporários.
9. Falta provisionamento e teste do primeiro admin; não há perfil institucional criado.
10. Falta definir e carregar lista oficial de cursos e as opções configuráveis do formulário.
11. A integração Google Drive/Docs/PDF não está implementada; o arquivo “Ficha Ok 2026” deve permanecer intacto e ser copiado antes de preencher.
12. Ainda não existem testes de integração SQL/RLS executados contra um Supabase de desenvolvimento.

## Plano de validação antes de qualquer migration

- [ ] Comparar todos os campos e condicionais com o Forms e o “Ficha Ok 2026”.
- [ ] Aprovar CPF/rematrícula e procedimento para CPF ausente, inválido ou corrigido.
- [ ] Aprovar escopo de leitura/edição de operadores.
- [ ] Aprovar protocolo, status, documentos bloqueantes e prazos.
- [ ] Revisar grants/revokes, RLS, owner e execução da RPC `SECURITY DEFINER`.
- [ ] Testar usuário anônimo, conta sem perfil, conta inativa e operador tentando ler matrícula alheia.
- [ ] Testar operador tentando alterar papel, status, curso, `created_by`, logs e configurações.
- [ ] Testar isolamento de saúde e arquivos privados.
- [ ] Testar duas criações simultâneas com mesmo CPF e mesmo ano; confirmar um estudante e matrículas/protocolos coerentes.
- [ ] Testar CPF sem pontuação, CPF inválido, CPF ausente e CPF já existente.
- [ ] Testar rollback completo quando falhar a criação da matrícula ou auditoria.
- [ ] Testar bootstrap e recuperação de acesso do administrador em ambiente de desenvolvimento.
- [ ] Ensaiar backup/restauração e rollback.
- [ ] Registrar aprovação institucional explícita antes de mover o SQL para migrations.

## Situação atual

A branch contém apenas a revisão documental e um SQL de rascunho. Nenhuma migration foi aplicada; o banco Supabase informado continua sendo tratado como vazio. Não ativar o backend nem usar dados reais com esta versão.
