# Fase 5 — automação de qualidade no GitHub

**Branch:** `feature/sistema-matricula-2026`  
**Status:** workflow adicionado; resultado de execução depende do GitHub Actions. A existência do workflow não significa que os checks passaram.

## O que foi feito

Foi criado `.github/workflows/quality-checks.yml`, para executar em pushes na branch de trabalho e nas branches principais, em pull requests para `main`/ `master`, ou manualmente.

A rotina:
1. configura Node.js 22;
2. instala dependências usando o manifesto do projeto;
3. executa `npm test`;
4. executa `npm run lint`;
5. executa `npx tsc --noEmit`.

O repositório não tinha lockfile encontrado nos caminhos convencionais (`package-lock.json`, `pnpm-lock.yaml` ou `yarn.lock`). Por isso, o workflow usa `npm install` em vez de `npm ci`. Recomenda-se versionar um lockfile para builds reprodutíveis.

## Próxima ação após a execução

- Consultar os checks da branch/PR no GitHub Actions.
- Corrigir erros reais de testes, lint ou TypeScript antes de conectar a validação à API.
- Considerar adicionar um lockfile versionado para tornar a instalação determinística.
- Só depois expandir a validação para a ficha oficial confirmada e planejar testes de integração.

## Limites

Nenhuma migration, alteração de schema ou gravação de dados no Supabase foi realizada. O workflow testa código; não testa ainda as políticas RLS, RPC, Storage ou regras institucionais de matrícula.
