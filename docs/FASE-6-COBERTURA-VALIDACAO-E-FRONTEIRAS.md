# Fase 6 — cobertura de validação e fronteiras de ativação

**Branch:** `feature/sistema-matricula-2026`  
**Status:** testes de utilitários ampliados; execução real do pipeline ainda precisa ser confirmada no GitHub Actions.

## Alteração entregue

O teste `src/lib/enrollment-validation.test.ts` agora cobre as funções realmente usadas pelo formulário e pela rota de criação:

- normalização e formatação do CPF;
- CPF válido, repetido, com dígito verificador inválido e incompleto;
- cálculo de idade antes/no aniversário usando data de referência fixa;
- datas vazias, inválidas ou futuras;
- formatação de CEP com limite de oito dígitos;
- formatação de telefones celulares e fixos.

Esses testes são unitários e usam dados sintéticos. Eles não acessam o Supabase e não comprovam o comportamento da RPC ou das políticas RLS.

## Revisão da fronteira da API

A rota atual `src/routes/api.enrollments.ts` valida um subconjunto dos campos do estudante e chama `rpc/create_enrollment_transaction`. O contrato ainda não abrange toda a ficha, filiação, responsável legal, dados de saúde e documentos. Por isso, não conectei a validação preliminar da Fase 4 a essa rota: fazê-lo agora poderia rejeitar campos legítimos ou criar a impressão incorreta de que a ficha completa está validada.

A proteção de ativação em `src/lib/server/matricula-api.ts` exige simultaneamente `MATRICULA_BACKEND_ENABLED=true` e `MATRICULA_ACCESS_POLICY_APPROVED=true`, além da configuração do serviço. Essas flags devem permanecer falsas até a revisão aprovada.

## Critérios para a próxima integração

1. Conferir a ficha oficial “Ficha Ok 2026” e registrar os campos obrigatórios/opcionais.
2. Consolidar um único contrato compartilhado entre formulário, endpoint e RPC.
3. Testar o endpoint com sessão ausente, sessão inválida, perfil inativo, papel não autorizado, JSON inválido, campos extras e dados incorretos.
4. Testar RPC e RLS com contas sintéticas e sem acesso a dados reais.
5. Confirmar no GitHub Actions os resultados de teste, lint e TypeScript.
6. Só depois de aprovação formal, planejar migration em ambiente de desenvolvimento.

## Segurança

Nenhuma migration foi executada, nenhuma conta foi criada e nenhum dado foi gravado no Supabase durante esta fase. Não usar o formulário com dados reais até concluir a homologação.
