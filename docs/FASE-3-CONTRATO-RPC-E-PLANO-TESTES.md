# Fase 3 — contrato seguro da RPC e plano de testes

**Projeto:** Sistema de Matrícula 2026  
**Branch:** `feature/sistema-matricula-2026`  
**Status:** especificação técnica de implementação e testes; não é migration e não autoriza ativar o backend.

## Objetivo

Definir os requisitos que a operação de criação de matrícula precisa cumprir antes de conectar o formulário completo ao Supabase. Esta fase não executa SQL e não grava dados.

## 1. Resultado da revisão da RPC atual

A função `public.create_enrollment_transaction` em `docs/drafts/schema-review.sql` deve continuar desabilitada. Ela ainda não é compatível com a ficha inteira.

Lacunas e riscos confirmados na leitura estática:

1. Recebe apenas `p_student`, curso, ano e cota; não recebe filiação, responsável legal, saúde ou documentos.
2. Insere somente um subconjunto dos campos do estudante. Ficam sem persistência, entre outros, órgão expedidor, naturalidade, sexo, estado civil, bairro, tipo de transporte, tamanho de camisa, Bolsa Família e parte das informações pessoais.
3. Não cria os registros relacionados de `parents_guardians`, `health_records` e `documents`.
4. Não rejeita explicitamente chaves desconhecidas no JSON; a função ignora campos que não lê. Isso pode mascarar divergência entre frontend e backend.
5. A checagem de conflito de identidade compara nome completo literalmente após trim/caixa baixa. A política para nome social, acentos, alteração de nome e CPF corrigido ainda precisa ser definida.
6. A sequência de protocolo é incrementada antes de todas as validações terminarem. O rollback da transação deve impedir gravação parcial, mas os testes precisam comprovar esse comportamento e a ausência de colisões.
7. O código é `SECURITY DEFINER`; proprietário efetivo, privilégios, `search_path`, grants/revokes e políticas RLS devem passar por revisão independente antes de qualquer grant de execução.
8. O uso de `auth.uid()` e a consulta ao perfil ativo são boas barreiras iniciais, mas não substituem testes com conta inativa, conta sem perfil e chamadas diretas à RPC.
9. Não existe política aprovada para transições de estado, cancelamento, correção de cadastro, rematrícula e documentos bloqueadores.
10. A função não deve ser exposta à interface até que seu contrato e os testes estejam completos.

## 2. Contrato futuro recomendado

O formato abaixo é conceitual e precisa ser validado com a ficha oficial antes de virar assinatura SQL. O servidor deve aceitar uma estrutura estrita e versionada, não confiar em campos de autorização enviados pelo navegador.

- `schema_version`: versão explícita do contrato.
- `academic_year`: ano permitido pela regra institucional.
- `course_id`: UUID de curso ativo no banco.
- `quota`: `is_quota` e `quota_type`, consistentes entre si.
- `student`: todos os campos aprovados da seção de identificação.
- `parents`: situações e nomes da mãe e do pai, sem presumir que sejam responsáveis.
- `legal_guardian`: identidade e vínculo do responsável selecionado.
- `health`: campos de saúde que constarem na ficha oficial; armazenados em tabela separada.
- `documents`: apenas tipos/status esperados. Upload e caminhos de Storage devem usar fluxo separado autorizado pelo servidor.
- O usuário criador deve sempre vir de `auth.uid()` da sessão verificada, nunca do payload.
- Protocolo e estado inicial são definidos no servidor; não aceitar `created_by`, `protocol`, `status` ou IDs de registros internos enviados pelo cliente.
- Resposta limitada a identificador, protocolo e estado; nunca devolver detalhes de saúde.

### Validação e normalização

- Rejeitar payload nulo, array, JSON não objeto, versão não suportada, chaves desconhecidas e campos com tipo errado.
- Validar limites de tamanho e remover espaços externos sem alterar silenciosamente o significado dos nomes.
- Normalizar CPF/CEP/telefone para dígitos, validar CPF no servidor e aplicar a política institucional aprovada para ausência, duplicidade e correção.
- Validar data real e impedir datas futuras de nascimento; calcular idade quando necessária no servidor.
- Validar UF, sexo, estado civil, raça/cor, transporte, tamanho de camisa, tipos de cota e estados de filiação contra listas aprovadas.
- Não inferir valores ausentes nem converter “não informado” em “não se aplica”.
- Conferir se a pessoa identificada por CPF é compatível com os dados recebidos; divergências devem retornar erro controlado e exigir procedimento de correção auditado.
- Confirmar que o curso está ativo e que a regra de cota é válida.
- Criar estudante/matrícula, vínculos, saúde, pendências documentais e auditoria na mesma transação, se e somente se o contrato oficial exigir todos esses registros nesse momento.
- Não persistir nomes de arquivo como se fossem arquivos armazenados.

## 3. Matriz de testes obrigatórios

Os testes devem rodar em projeto/ambiente de desenvolvimento com dados sintéticos e usuários de teste. Não usar dados reais de estudantes.

| ID | Cenário | Resultado esperado |
|---|---|---|
| RPC-01 | Operador ativo, payload mínimo válido | Cria matrícula em estado inicial aprovado e retorna protocolo. |
| RPC-02 | Administrador ativo, payload válido | Permite a operação conforme política aprovada. |
| RPC-03 | Sem sessão / chamada anônima | Negada; nenhum registro criado. |
| RPC-04 | Usuário autenticado sem perfil | Negada; nenhum registro criado. |
| RPC-05 | Perfil inativo | Negada; nenhum registro criado. |
| RPC-06 | JSON nulo, array ou tipo incorreto | Negada com erro controlado. |
| RPC-07 | Chave não reconhecida | Rejeitada, não ignorada silenciosamente. |
| RPC-08 | CPF inválido ou sequência repetida | Negada; nenhum registro criado. |
| RPC-09 | CPF válido existente, mesma pessoa | Reutiliza identidade conforme regra aprovada, sem sobrescrita silenciosa. |
| RPC-10 | CPF existente com divergência de identidade | Negada e orienta correção auditada. |
| RPC-11 | CPF ausente | Segue somente a política aprovada para cadastro sem CPF. |
| RPC-12 | Curso inexistente ou inativo | Negada; nenhum registro criado. |
| RPC-13 | Cota inconsistente ou tipo não permitido | Negada; nenhum registro criado. |
| RPC-14 | Falha forçada ao gravar responsável/saúde/auditoria | Rollback integral; sem matrícula ou estudante órfão. |
| RPC-15 | Duas requisições simultâneas para o mesmo CPF | Sem duplicação da identidade; resultado conforme política de matrícula/ano. |
| RPC-16 | Duas matrículas simultâneas | Protocolos únicos, sem colisão. |
| ACL-01 | Operador consulta matrícula criada por outro operador | Negada até decisão institucional em contrário. |
| ACL-02 | Operador lê `health_records` | Negada. |
| ACL-03 | Operador altera papel, criador, protocolo ou estado por DML direto | Negada. |
| ACL-04 | Usuário comum tenta chamar RPC sem grant | Negada. |
| ACL-05 | Admin consulta saúde pelo endpoint autorizado | Permitida e auditada, sem cache. |
| ACL-06 | Conta inativa tenta ler tabela via REST | Negada pelas políticas/servidor. |
| DOC-01 | Upload com MIME real divergente da extensão | Rejeitado. |
| DOC-02 | Arquivo maior que o limite aprovado | Rejeitado. |
| DOC-03 | Operador tenta baixar arquivo de outra matrícula | Negado; objeto em bucket privado. |
| DOC-04 | Link temporário expirado | Não permite acesso. |
| AUD-01 | Inspeção de logs e metadados | Sem CPF completo, dados médicos, tokens ou conteúdo de documentos. |

## 4. Critérios de aprovação

Não considerar a etapa concluída até que:

- [ ] A ficha oficial “Ficha Ok 2026” tenha sido conferida campo a campo.
- [ ] A instituição tenha aprovado CPF/rematrícula, permissões de operadores, protocolo, estados, documentos e retenção.
- [ ] A assinatura da RPC corresponda ao contrato aprovado e todos os campos obrigatórios sejam gravados.
- [ ] Uma revisão independente tenha validado proprietário, `SECURITY DEFINER`, `search_path`, grants/revokes, RLS e privilégios efetivos.
- [ ] Testes positivos e negativos da matriz sejam executados em ambiente de desenvolvimento.
- [ ] Advisors de segurança e performance sejam revisados após mudanças no ambiente de desenvolvimento.
- [ ] Upload e armazenamento estejam configurados como privados e testados.
- [ ] Backup/restauração e rollback sejam ensaiados.
- [ ] O usuário responsável autorize explicitamente a migração, após receber o diff final.

## 5. Estado do projeto após esta fase

- Nenhuma migração foi executada.
- Nenhuma tabela foi criada no Supabase por este trabalho.
- O backend deve continuar desabilitado com `MATRICULA_BACKEND_ENABLED=false` e `MATRICULA_ACCESS_POLICY_APPROVED=false`.
- O SQL em `docs/drafts/schema-review.sql` permanece rascunho, não deve ser movido para migrations nem executado ainda.
- A implementação de uma RPC completa fica condicionada à confirmação da ficha oficial e das decisões institucionais pendentes.
