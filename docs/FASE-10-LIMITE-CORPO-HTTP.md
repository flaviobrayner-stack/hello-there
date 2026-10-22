# Fase 10 — limite real do corpo HTTP

**Branch:** `feature/sistema-matricula-2026`  
**Status:** implementação registrada; execução de testes/CI ainda precisa ser confirmada.

## Alterações

- Criado `src/lib/server/request-body.ts`, que lê o stream da requisição e interrompe a leitura ao ultrapassar o limite em bytes.
- A leitura não depende de `Content-Length`; esse cabeçalho pode estar ausente ou não ser confiável.
- O texto é decodificado como UTF-8 estrito e o JSON é interpretado dentro de tratamento de erro.
- O endpoint `POST /api/enrollments` agora usa o leitor limitado com teto de 16 KiB antes da validação Zod.
- Respostas esperadas: 413 para corpo excessivo; 400 para JSON inválido ou corpo ilegível.
- Criados testes unitários para JSON válido, limite sem Content-Length, UTF-8 multibyte, JSON malformado, UTF-8 inválido, corpo ausente e limite inválido.

## Arquivos

- `src/lib/server/request-body.ts`
- `src/lib/server/request-body.test.ts`
- `src/routes/api.enrollments.ts`

## Limites conhecidos

- Os testes foram adicionados ao repositório, mas ainda não há evidência nesta etapa de que foram executados localmente ou pelo GitHub Actions.
- Testes do helper não substituem testes HTTP completos com autenticação e RPC simuladas.
- A integração ainda recebe apenas um subconjunto dos campos da matrícula.
- Nenhuma migration foi aplicada e o backend não foi ativado para gravação real.

## Próximos critérios

1. Confirmar que `npm test`, lint, TypeScript e build passam.
2. Confirmar a execução do GitHub Actions.
3. Criar testes de rota com dependências simuladas sem atingir dados reais.
4. Continuar o alinhamento do contrato com a ficha oficial e as decisões institucionais.
