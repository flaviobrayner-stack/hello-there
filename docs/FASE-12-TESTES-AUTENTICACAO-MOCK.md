# Fase 12 — testes de autenticação com Supabase simulado

**Branch:** `feature/sistema-matricula-2026`  
**Status:** casos de teste adicionados; execução ainda não confirmada.

## Implementação

Foi criado `src/lib/server/matricula-api-auth.test.ts`, que substitui `fetch` por respostas sintéticas e usa valores de ambiente de teste. Nenhuma conexão real com Supabase é necessária para esses casos.

Cenários cobertos:
- backend desabilitado: resposta 503 e nenhuma chamada externa;
- ausência de credenciais: 401 e nenhuma chamada externa;
- token inválido: 401 e nenhuma consulta de perfil;
- perfil operacional inativo: 403;
- perfil operacional ativo: autenticação aceita e uso da publishable key e do token do usuário;
- falha de rede: 503 sem expor detalhes internos da exceção.

## Limitações

- Estes são testes unitários de `authenticateStaff`, não testes end-to-end do handler TanStack Start.
- A autorização final de dados continua dependendo das políticas RLS e dos grants no PostgreSQL.
- O teste não prova que a suíte passa até que seja executada.
- Não houve chamada ao Supabase real, escrita de dados, criação de usuário ou migration.

## Validação a executar

```sh
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Registrar os resultados e corrigir falhas antes de considerar a etapa aprovada. O workflow do GitHub Actions precisa ter uma execução observável; status vazio não significa sucesso.

## Estado

**Etapa de escrita de testes concluída, validação pendente.** O contrato de matrícula ainda é parcial e a ficha oficial “Ficha Ok 2026” segue necessária para completar a integração.
