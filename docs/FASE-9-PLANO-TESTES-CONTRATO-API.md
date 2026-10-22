# Fase 9 — plano de testes de contrato da API

Status: planejamento. Nenhuma migration foi aplicada e nenhuma matrícula real foi gravada.

## Objetivo

Preparar testes do endpoint `POST /api/enrollments` antes de ativar a persistência. O endpoint atual recebe curso, ano, cota e um subconjunto dos dados do estudante; ele ainda não representa as sete etapas do formulário.

## Casos HTTP

| ID | Cenário | Resultado esperado |
|---|---|---|
| HTTP-01 | Origem diferente | 403, sem chamada à RPC |
| HTTP-02 | Sem sessão válida | Rejeição, sem chamada à RPC |
| HTTP-03 | Content-Type ausente ou não JSON | 415 |
| HTTP-04 | JSON malformado ou corpo vazio | 400 |
| HTTP-05 | Corpo maior que 16 KiB com Content-Length | 413 |
| HTTP-06 | Corpo maior que 16 KiB sem Content-Length confiável | 413; exige limite aplicado ao stream real |
| HTTP-07 | Objeto raiz nulo, array ou tipo incorreto | 400 |
| HTTP-08 | Campo desconhecido no objeto raiz ou estudante | 400, conforme schemas strict |

## Casos de validação

| ID | Entrada | Resultado esperado |
|---|---|---|
| VAL-01 | courseId ausente ou UUID inválido | 400, sem RPC |
| VAL-02 | Ano fracionário, tipo errado ou fora de 2020–2100 | 400 |
| VAL-03 | Cota fora da enumeração permitida | 400 |
| VAL-04 | Nome ausente, curto demais ou acima do limite | 400 |
| VAL-05 | CPF inválido | 400 |
| VAL-06 | Data de calendário inexistente ou futura | 400 |
| VAL-07 | E-mail inválido | 400 |
| VAL-08 | UF com formato inválido | 400 |
| VAL-09 | Campo textual recebido como número ou booleano | 400 sem coerção silenciosa |
| VAL-10 | Strings acima dos limites | 400 |

## Casos de integração e segurança

| ID | Cenário | Resultado esperado |
|---|---|---|
| INT-01 | Curso inexistente ou inativo | Rejeição sem matrícula parcial |
| INT-02 | Usuário sem perfil operacional ou perfil inativo | Acesso negado |
| INT-03 | Falha ao criar registro relacionado | Rollback integral |
| INT-04 | Requisições concorrentes | Protocolo único e regra de unicidade consistente |
| INT-05 | Chamada direta à RPC | Grants e autorização impedem bypass |
| INT-06 | Usuário sem permissão consulta dados médicos/documentos | Acesso negado por RLS/ACL |
| INT-07 | RPC retorna resposta incompleta ou tipos incorretos | API retorna erro controlado sem detalhes internos |

## Execução necessária

1. Implementar testes unitários para validação e leitura limitada do corpo HTTP.
2. Implementar testes da rota com autenticação e Supabase simulados.
3. Executar integração apenas em projeto de desenvolvimento isolado após revisão do schema.
4. Executar `npm test`, `npm run lint`, `npx tsc --noEmit` e `npm run build`.
5. Confirmar execução real do GitHub Actions e registrar os resultados.
6. Corrigir falhas, revisar RLS/grants e solicitar aprovação antes de qualquer migration.

## Bloqueadores conhecidos

- O endpoint limita o corpo principalmente por `Content-Length`; esse cabeçalho não garante limite quando ausente ou não confiável.
- A API não persiste ainda filiação, responsável legal, saúde e documentos.
- A ficha oficial “Ficha Ok 2026” e as decisões institucionais ainda precisam de confirmação.
- Não há evidência confirmada de CI verde.

## Critérios de aceite

- [x] Cenários e resultados esperados documentados.
- [ ] Testes automatizados implementados e executados com evidência.
- [ ] CI verde confirmado.
- [ ] Contrato completo aprovado com base na ficha oficial.
- [ ] Revisão de segurança e autorização formal concluídas.

**Conclusão:** esta fase documenta os testes necessários; não afirma que eles já passaram. Backend e migrations permanecem bloqueados até completar o contrato, executar os testes e obter autorização explícita.
