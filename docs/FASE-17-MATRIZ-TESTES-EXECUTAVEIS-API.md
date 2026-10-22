# Fase 17 — matriz executável de testes da API de matrícula

**Projeto:** Sistema de Matrícula 2026 — ETE Maria José Vasconcelos  
**Branch:** `feature/sistema-matricula-2026`  
**Status:** plano de testes; nenhum teste foi declarado executado nesta fase.

## Objetivo

Transformar os riscos identificados nas fases 7, 9, 11, 12 e 14 em casos objetivos para a próxima rodada de testes automatizados da rota TanStack Start `/api/enrollments`. Os testes devem usar Supabase simulado e dados fictícios; não devem criar registros no projeto real.

## Casos obrigatórios para POST

| ID | Cenário | Resultado esperado |
|---|---|---|
| POST-01 | Backend desabilitado | 503, `BACKEND_NOT_ENABLED`, sem chamada de rede |
| POST-02 | Sem sessão ou token inválido | 401, sem chamar RPC |
| POST-03 | Perfil ausente, inativo ou papel não autorizado | 403, sem chamar RPC |
| POST-04 | Origem ausente ou de outro domínio | 403, sem chamar RPC |
| POST-05 | Content-Type diferente de JSON | 415, sem chamar RPC |
| POST-06 | Corpo maior que 16 KiB, mesmo sem Content-Length | 413, sem chamar RPC |
| POST-07 | JSON malformado ou UTF-8 inválido | 400, sem chamar RPC |
| POST-08 | Campo desconhecido no envelope ou estudante | 400, sem chamar RPC |
| POST-09 | UUID de curso malformado | 400, sem chamar RPC |
| POST-10 | CPF inválido | 400, sem chamar RPC |
| POST-11 | Data inexistente ou futura | 400; a regra de data futura precisa ser explicitamente implementada |
| POST-12 | Curso válido mas inexistente/inativo/indisponível no ano | rejeição segura do servidor; verificação ainda precisa ser implementada |
| POST-13 | RPC retorna erro de autorização ou validação | resposta segura, sem detalhes SQL |
| POST-14 | RPC falha por rede | erro 502/503 seguro, sem detalhes internos |
| POST-15 | RPC retorna estrutura inesperada | 502, `INVALID_CREATE_RESPONSE` |
| POST-16 | RPC retorna sucesso mínimo válido | 201, apenas identificador/protocolo/estado aprovado |
| POST-17 | Dados de saúde, responsáveis ou documentos extras no payload atual | rejeitar enquanto contrato completo não estiver aprovado; não descartar silenciosamente |
| POST-18 | Reenvio da mesma solicitação | comportamento idempotente somente após desenho e implementação explícitos |

## Casos obrigatórios para GET

| ID | Cenário | Resultado esperado |
|---|---|---|
| GET-01 | Backend desabilitado, sem sessão ou perfil inativo | 503/401/403 conforme a fronteira de autenticação |
| GET-02 | Consulta válida | no máximo 50 itens e `Cache-Control: no-store` |
| GET-03 | Dados retornados | não incluir CPF completo, saúde, detalhes de responsáveis, conteúdo de documentos ou caminhos de Storage |
| GET-04 | PostgREST retorna erro com detalhes internos | mensagem pública genérica |
| GET-05 | PostgREST retorna objeto em vez de lista | 502, `INVALID_DATA_RESPONSE` |

## Requisitos para os testes da rota

1. Importar o handler exportado pela rota usando o mecanismo de testes compatível com a versão instalada do TanStack Start; não duplicar a lógica da rota no teste.
2. Substituir `fetch` por mocks determinísticos para Auth, perfil e RPC/PostgREST.
3. Verificar status, código JSON, headers, número e ordem das chamadas de rede.
4. Verificar que nenhuma chamada RPC acontece antes de autenticação, origem, content-type, limite de bytes e validação.
5. Verificar que tokens são encaminhados apenas como bearer do usuário e que nenhuma chave privilegiada é usada.
6. Usar exclusivamente nomes, CPFs, telefones e dados de saúde fictícios.
7. Adicionar testes de banco/RLS separados somente após schema aprovado; mocks HTTP não demonstram que as policies do PostgreSQL são seguras.
8. Executar `npm test`, `npm run lint`, `npx tsc --noEmit` e `npm run build`; registrar os resultados reais do CI antes de aprovar o PR.

## Bloqueios conhecidos na implementação atual

- A rota POST usa contrato parcial e chama `create_enrollment_transaction` com somente dados parciais do estudante, curso, ano e cota.
- A data é validada quanto ao calendário, mas não há bloqueio explícito de data futura no schema atual.
- A rota não consulta catálogo de cursos ativos antes de chamar a RPC.
- Não existe contrato de upload para emitir/validar `client_file_token`.
- Não há idempotência documentada ou implementada no contrato atual.
- A forma de resposta da RPC é verificada superficialmente (`id` e `protocol` apenas).
- Os testes existentes cobrem helpers e autenticação simulada, não exercitam o handler real da rota.
- A execução do CI ainda não foi confirmada.

## Decisão de segurança

Não habilitar `MATRICULA_BACKEND_ENABLED` nem `MATRICULA_ACCESS_POLICY_APPROVED` para uso real com base apenas nesta matriz. A ativação depende da ficha oficial, do contrato aprovado, de revisão independente de RLS/RPC/Storage e de execução bem-sucedida dos testes e do build.
