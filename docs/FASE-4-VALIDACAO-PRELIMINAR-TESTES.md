# Fase 4 — validação preliminar e testes unitários

**Branch:** `feature/sistema-matricula-2026`  
**Status:** código e testes adicionados ao repositório; execução dos testes ainda não confirmada. Não é integração com o Supabase nem autorização para migration.

## Arquivos adicionados

- `src/lib/server/enrollment-validation.ts`: funções puras de validação preliminar, normalização de dígitos, verificação matemática de CPF, validação de data de nascimento e validação estrita de um envelope mínimo versionado.
- `src/lib/server/enrollment-validation.test.ts`: testes Vitest para CPF válido/inválido, normalização, payload não objeto, campos desconhecidos, cota inconsistente, versão, UUID e datas inválidas/futuras.

## Limites intencionais

Esta validação cobre apenas o envelope mínimo aprovado para testes técnicos. Ela **não** representa o contrato final da ficha oficial e ainda não está ligada à rota de criação de matrícula. Não deve ser apresentada como validação completa do formulário.

A implementação não faz chamadas de rede, não consulta nem grava no Supabase e não precisa de credenciais. Os testes usam dados sintéticos.

## Próximos passos técnicos

1. Executar `npm test -- src/lib/server/enrollment-validation.test.ts` e `npm run lint` em ambiente de desenvolvimento conectado ao repositório.
2. Corrigir quaisquer erros de TypeScript, lint ou testes observados na execução real.
3. Comparar a validação com a ficha oficial “Ficha Ok 2026” e expandir o schema somente com campos confirmados.
4. Implementar validação de servidor para o payload completo, incluindo responsáveis, saúde e documentos, depois de aprovadas as regras.
5. Conectar a validação à rota POST somente quando o contrato completo estiver aprovado e os testes de autorização/integração estiverem prontos.
6. Manter backend e RPC desabilitados até a revisão independente de RLS, grants, proprietário de `SECURITY DEFINER`, Storage e rollback.

## Segurança e banco

Nenhuma migration foi executada e nenhum dado foi gravado no Supabase por esta fase. Não foram provisionados usuários nem chaves de serviço. Não colocar segredo de serviço no frontend.
