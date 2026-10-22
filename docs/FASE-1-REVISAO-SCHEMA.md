# Fase 1 — revisão técnica inicial do schema

**Status:** revisão estática inicial concluída; schema ainda NÃO aprovado para execução.
**Ambiente Supabase:** `matricula_ete_mjv` (`oreeyfyidnhpkwnxubpw`).
**Escopo desta etapa:** revisar o rascunho SQL e corrigir defeitos evidentes sem executar DDL, criar tabelas ou alterar dados.

## Correções realizadas no rascunho

Arquivo revisado: `docs/drafts/schema-review.sql`.

1. **Sintaxe da função de validação de CPF:** o delimitador do bloco PL/pgSQL estava incorreto (`AS $`). Corrigido para `AS $$`.
2. **Mapeamento do endereço na RPC:** a lista de valores de `INSERT INTO public.students` não fornecia `city` e deslocava o estado/CEP para colunas incorretas. Foi incluído o valor de cidade e alinhada a ordem cidade, estado e CEP com as colunas declaradas.

## Bloqueios encontrados antes de qualquer execução

- A RPC `create_enrollment_transaction` ainda persiste apenas parte dos campos do estudante. Não grava todos os dados previstos na ficha, os responsáveis legais, os dados de saúde nem o checklist documental.
- A RPC permanece sem `GRANT EXECUTE`; não deve ser liberada até completar o contrato, revisar o proprietário e testar privilégios e autorização.
- O modelo de CPF único por estudante e o fluxo de correção/reconciliação de identidade precisam de aprovação institucional.
- As regras de acesso dos operadores ainda são provisórias (somente matrículas criadas pelo próprio usuário); a escola precisa confirmar o escopo operacional.
- A política de acesso aos dados de saúde está restrita ao perfil `admin` no rascunho, mas precisa de testes negativos e positivos com usuários de teste.
- O provisionamento de perfis e das três contas institucionais ainda não está implementado.
- Upload privado, políticas do Storage, limites e validação de arquivos ainda não estão definidos.
- Ainda faltam testes automatizados de migração, rollback, concorrência de protocolo, CPF, RLS, RPC e acesso por papel.

## Estado do projeto verificado

Na inspeção inicial do projeto Supabase, o schema `public` estava sem tabelas e não havia migrações registradas. Não foi executada nenhuma migração durante esta revisão.

## Próxima validação necessária

1. Revisar o contrato completo da ficha e mapear cada campo para sua tabela.
2. Definir as regras institucionais pendentes e fechar a matriz de permissões.
3. Preparar testes de banco com dados sintéticos e validar sintaxe, transações, grants e RLS em ambiente isolado.
4. Só depois da revisão e autorização explícita, transformar o rascunho em uma migração versionada e aplicá-la em desenvolvimento.

**Não usar dados reais e não ativar o backend** até que esses bloqueios sejam resolvidos e os testes de autorização passem.
