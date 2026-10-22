# Fase 18 — critérios de prontidão para a próxima integração

**Projeto:** Sistema de Matrícula 2026  
**Branch:** feature/sistema-matricula-2026  
**Status:** checklist de revisão; não representa aprovação para produção.

## Estado verificado
- O projeto Supabase está ativo.
- Em 2026-10-22 foi aplicada a migration `20261022155150_matricula_2026_initial_schema` no projeto Supabase.
- A verificação posterior encontrou 12 tabelas no schema `public`, todas com RLS habilitado, e nenhuma tabela contém dados de matrícula.
- A migration `20261022155227_secure_enrollment_rpc_execution` revogou a execução da RPC de matrícula para `PUBLIC`, `anon` e `authenticated` enquanto o contrato não for aprovado.
- Os arquivos correspondentes foram registrados em `supabase/migrations/` nesta branch.
- O pipeline CI/testes do projeto ainda não foi confirmado.

## Pendências que impedem a liberação
1. Receber e conferir a ficha oficial “Ficha Ok 2026”.
2. Confirmar os campos obrigatórios, catálogos de cursos e regras de cotas.
3. Aprovar regras de CPF, rematrícula, duplicidade, protocolo e correções.
4. Completar o contrato de dados para estudante, filiação, responsável, saúde e documentos.
5. Revisar as permissões por papel e por matrícula, incluindo os dados sensíveis.
6. Especificar armazenamento privado de documentos e regras de upload/download.
7. Testar a rota HTTP real com Supabase simulado.
8. Testar a autorização diretamente no banco em ambiente de desenvolvimento.
9. Executar testes, lint, TypeScript e build e guardar o resultado do CI.
10. Revisar a migration já aplicada, corrigir os avisos de segurança e aprovar formalmente o contrato antes de habilitar a RPC.

## Condições mínimas para aceite
- A interface não pode afirmar que uma matrícula foi salva se os dados completos não tiverem sido persistidos.
- Falhas parciais precisam resultar em rollback e mensagem segura.
- Nenhuma informação de saúde ou documento pode aparecer em listagens gerais ou logs.
- Chamadas sem sessão válida, perfil ativo e permissão correta precisam falhar.
- Os testes precisam cobrir reenvio, concorrência, dados inválidos e acesso cruzado entre operadores.
- Chaves privilegiadas não podem ser enviadas ao navegador.

## Decisão
A estrutura inicial foi aplicada por autorização explícita, mas o backend de matrícula continua desabilitado. Usar apenas dados fictícios; não habilitar a RPC nem conectar o formulário real até concluir revisão de segurança, provisionamento de perfis, contrato completo e testes.
