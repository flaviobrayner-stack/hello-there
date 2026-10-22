# Fase 11 — testes da fronteira de segurança da API

**Branch:** `feature/sistema-matricula-2026`  
**Status:** testes unitários registrados; execução não confirmada.

## O que foi coberto

Criado `src/lib/server/matricula-api-contract.test.ts` com testes unitários isolados para funções da fronteira de segurança:

- backend permanece desabilitado quando as duas flags explícitas não estão aprovadas;
- URL Supabase insegura em HTTP é rejeitada fora de localhost;
- resposta do backend desabilitado é 503 com `Cache-Control: no-store`;
- comparação estrita da origem e rejeição de origem ausente;
- extração do cookie correto, sem confundir nomes com prefixos semelhantes;
- cookie com codificação inválida falha de forma segura;
- cookie de sessão inclui HttpOnly, SameSite=Strict, Secure em HTTPS e tempo de vida limitado;
- respostas de erro do Supabase não revelam texto interno;
- erros JSON mantêm código estável e `no-store`.

## O que estes testes NÃO provam

- Não executam a rota HTTP completa com o framework TanStack Start.
- Não simulam toda a sequência de autenticação com chamadas HTTP interceptadas.
- Não validam políticas RLS, grants, owner da RPC ou integridade transacional no PostgreSQL.
- Não provam que o workflow de CI passou; é necessário consultar uma execução real.
- Não completam o contrato da ficha de matrícula, responsáveis, saúde ou documentos.

## Próximos passos

1. Executar `npm test`, `npm run lint`, `npx tsc --noEmit` e `npm run build`.
2. Corrigir falhas encontradas e registrar os resultados.
3. Acrescentar testes de integração da rota com mocks confiáveis se a configuração do projeto permitir.
4. Obter e conferir a ficha oficial “Ficha Ok 2026”.
5. Manter backend e migrations bloqueados até revisão e autorização explícita.
