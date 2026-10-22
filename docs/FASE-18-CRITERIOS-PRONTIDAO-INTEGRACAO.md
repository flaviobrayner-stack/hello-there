# Fase 18 — critérios de prontidão para a próxima integração

**Projeto:** Sistema de Matrícula 2026  
**Branch:** feature/sistema-matricula-2026  
**Status:** checklist de revisão; não representa aprovação para produção.

## Estado verificado
- O projeto Supabase está ativo.
- A consulta atual não encontrou tabelas no schema public.
- A consulta atual não encontrou migrations registradas.
- O rascunho SQL permanece apenas em docs/drafts/schema-review.sql.
- Não foi confirmada execução dos testes ou do pipeline CI.

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
10. Apresentar o SQL final para revisão e obter autorização explícita antes de aplicar migration.

## Condições mínimas para aceite
- A interface não pode afirmar que uma matrícula foi salva se os dados completos não tiverem sido persistidos.
- Falhas parciais precisam resultar em rollback e mensagem segura.
- Nenhuma informação de saúde ou documento pode aparecer em listagens gerais ou logs.
- Chamadas sem sessão válida, perfil ativo e permissão correta precisam falhar.
- Os testes precisam cobrir reenvio, concorrência, dados inválidos e acesso cruzado entre operadores.
- Chaves privilegiadas não podem ser enviadas ao navegador.

## Decisão
Continuar desenvolvimento apenas em branch de revisão e com dados fictícios. Manter o backend desabilitado. Não aplicar migrations nem criar registros reais até que os itens acima sejam aprovados.
