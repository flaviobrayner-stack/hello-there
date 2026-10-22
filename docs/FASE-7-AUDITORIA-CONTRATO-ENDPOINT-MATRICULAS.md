# Fase 7 — auditoria do contrato do endpoint de matrículas

**Projeto:** Sistema de Matrícula 2026  
**Branch:** `feature/sistema-matricula-2026`  
**Status:** auditoria estática e plano de correção. Nenhuma migration, gravação no Supabase ou ativação de backend foi executada nesta fase.

## 1. Escopo revisado

Foi feita leitura estática de:

- `src/routes/api.enrollments.ts`
- `src/lib/enrollment-validation.ts`
- `src/lib/server/enrollment-validation.ts`
- `docs/FASE-3-CONTRATO-RPC-E-PLANO-TESTES.md`
- `docs/FASE-2-DECISOES-PENDENTES.md`
- `src/routes/index.tsx`

Esta fase documenta incompatibilidades concretas antes de alterar o comportamento da matrícula. O formulário possui sete etapas: identificação, estudante, filiação, responsável, saúde, documentos e revisão. O POST atual não representa esse formulário inteiro.

## 2. Contrato atualmente aceito pelo POST /api/enrollments

O endpoint exige sessão institucional válida, valida origem, exige JSON, limita o tamanho anunciado pelo cabeçalho `content-length` e valida um objeto estrito com:

- `courseId`: UUID.
- `academicYear`: inteiro de 2020 a 2100; o padrão é 2026.
- `quotaType`: `escola_publica`, `renda`, `vulnerabilidade`, `pcd` ou `null`.
- `student`: nome completo obrigatório; nome social, CPF, RG, data de nascimento, telefone, e-mail, endereço, cidade, UF, CEP, raça/cor, PCD e escola anterior opcionais.

O payload é enviado à RPC `create_enrollment_transaction` com estudante, curso, ano e cota. O endpoint não encaminha filiação, responsável legal, informações de saúde, contatos de emergência ou metadados de documentos. O endpoint GET, por sua vez, projeta uma lista resumida e evita retornar CPF completo, dados médicos ou conteúdo de documentos.

## 3. Lacunas e riscos identificados

| Área | Situação observada | Consequência / ação necessária |
|---|---|---|
| Contrato de formulário | O POST aceita apenas quatro grupos de dados, com estudante parcial | Não conectar o botão de conclusão do formulário completo a este contrato até mapear todos os campos oficiais |
| Filiação | Não há propriedades de mãe/pai no schema do POST | Definir campos e regras com base na ficha oficial; não inferir que filiação equivale a responsabilidade legal |
| Responsável legal | Não há objeto próprio no schema | Definir vínculo, dados mínimos e validação do responsável antes de persistir |
| Saúde e emergência | Não há objeto de saúde no POST | Separar armazenamento e permissões; acesso mínimo e auditado |
| Documentos | O contrato não recebe arquivos nem metadados de documentos | Criar fluxo privado de upload, validação de tipo/tamanho e autorização separadamente; seleção local não é persistência |
| Cursos | O POST recebe UUID, mas a interface tem opções estáticas | A lista deve vir de cursos ativos no backend; servidor deve validar curso e ano permitidos |
| Cota | Enum validado, mas a regra institucional de elegibilidade está pendente | Não tratar a enumeração como comprovação de elegibilidade |
| Limite do corpo | A checagem atual usa `content-length` | Cabeçalho ausente ou inexato não limita o corpo real; adicionar leitura limitada do corpo antes de habilitar a rota |
| Data | A data é conferida como data de calendário real | Confirmar também regra de idade mínima/máxima, caso exista, com a instituição |
| CPF | Se enviado, deve passar validação; é opcional | Política de ausência, duplicidade, correção e rematrícula continua pendente |
| Erros | A resposta de validação não expõe detalhes de campos inválidos | Melhorar mensagens para uso da interface sem expor dados sensíveis nem detalhes internos |
| RPC | A resposta é verificada superficialmente por presença de `id` e `protocol` | Definir resposta versionada e validar tipos/estado antes de responder sucesso |
| Validação duplicada | Existem um validador de UI e um preflight server-only não conectado | Evitar contratos concorrentes: após aprovar a ficha oficial, consolidar um contrato servidor autoritativo e compartilhar somente regras puras seguras |
| Segurança de execução | O endpoint depende das flags de bloqueio documentadas no módulo de API | Manter backend desligado até revisão de contrato, RLS, grants, testes e aprovação formal |

## 4. Ordem de implementação recomendada

1. Obter e conferir a ficha oficial “Ficha Ok 2026”, inclusive anexos e documentos exigidos.
2. Aprovar a matriz campo a campo: origem na ficha, nome interno, tipo, obrigatoriedade, destino no banco, classificação de sensibilidade e regra de validação.
3. Resolver as decisões institucionais registradas em `FASE-2-DECISOES-PENDENTES.md`.
4. Definir um contrato versionado e estrito para o formulário completo, sem campos de controle confiados ao navegador (`created_by`, protocolo, status ou IDs internos).
5. Implementar validação do corpo por bytes efetivamente lidos e validações de domínio no servidor.
6. Ajustar a RPC e o modelo de dados somente após revisão do SQL, incluindo persistência atômica de estudante, matrícula, filiação e responsável; dados médicos em área restrita.
7. Projetar upload privado de documentos separado do POST JSON, com allowlist, limite de bytes, verificação real do formato, autorização e links temporários.
8. Criar testes unitários e de integração para payloads inválidos, campos desconhecidos, duplicidade, transação/rollback, concorrência, usuário inativo/sem perfil, RLS e acesso indevido.
9. Executar testes e CI, revisar resultados e obter aprovação explícita antes de migration ou ativação em ambiente com dados reais.

## 5. Critérios de aceite desta auditoria

- [x] Contrato atual do POST documentado a partir do código.
- [x] Lacunas entre endpoint e etapas do formulário registradas.
- [x] Riscos de limite de corpo, contrato de resposta e validações duplicadas registrados.
- [x] Nenhuma mudança de runtime ou gravação real foi feita.
- [ ] Ficha oficial e decisões institucionais recebidas/aprovadas.
- [ ] Contrato completo e esquema de dados aprovados.
- [ ] Testes executados com resultado comprovado.
- [ ] Revisão de segurança e autorização formal para migration.

## 6. Estado final

**Não pronto para matrículas reais.** O endpoint existente é uma integração parcial de matrícula para equipe autenticada, não uma implementação completa das sete etapas do formulário. Nenhuma migration foi aplicada e o backend deve continuar bloqueado. O próximo trabalho de código deve partir da ficha oficial e das decisões aprovadas, em vez de inventar campos ou regras institucionais.
