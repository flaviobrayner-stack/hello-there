# Fase 16 — plano de validação do contrato v2

**Projeto:** Sistema de Matrícula 2026 — ETE Maria José Vasconcelos  
**Branch:** `feature/sistema-matricula-2026`  
**Status:** plano de testes e critérios de aceite. Não habilita endpoint nem banco.

## Objetivo

Preparar uma fronteira de validação isolada para o envelope proposto na Fase 15. A versão 2 ainda não é contrato institucional aprovado e não deve substituir o endpoint atual.

## Testes estruturais necessários

- Aceitar apenas `schema_version = 2`.
- Rejeitar propriedades desconhecidas no envelope e em cada objeto aninhado.
- Exigir UUID válido para curso e para token de upload emitido por endpoint futuro.
- Rejeitar combinações inconsistentes de `quota.is_quota` e `quota.quota_type`.
- Limitar o tamanho de textos, listas de responsáveis e documentos.
- Validar enumerações de vínculo familiar, situação, tipo sanguíneo e fator RH apenas como valores provisórios, pendentes da ficha oficial.
- Rejeitar vínculos familiares e tipos documentais duplicados.
- Exigir `confirmation.reviewed = true` e uma versão explícita do aviso de privacidade.
- Não aceitar do cliente protocolo, estado de matrícula, identificador de conferente, caminho de Storage, timestamps de auditoria ou permissões.
- Garantir que erros não incluam valores recebidos, CPF, dados médicos ou caminhos internos.

## Testes semânticos que exigem decisão institucional

- CPF e CEP: formato, ausência permitida, correção e deduplicação.
- Datas: validade de calendário, data futura e política de idade.
- Cotas: catálogo oficial, elegibilidade e documentos exigidos por categoria.
- Pais e responsáveis: casos excepcionais, guarda legal e número permitido de vínculos.
- Saúde: campos realmente necessários, acesso por função e retenção.
- Documentos: catálogo oficial, formatos/tamanhos, obrigatoriedade e prazo.
- Ano letivo e curso: catálogo ativo, período de inscrição e disponibilidade.
- Matrículas repetidas: regra de idempotência e reenvio após falha.

## Critérios de aceite antes de conectar à API

1. Receber e comparar a ficha oficial “Ficha Ok 2026”.
2. Aprovar formalmente nomes, obrigatoriedade, catálogos e regras.
3. Criar testes unitários para payload válido, versão errada, chaves extras, tipos inválidos, limites, duplicidades e combinações inconsistentes.
4. Fazer testes de rota com Supabase simulado, incluindo falha parcial da RPC, acesso negado, curso inativo, concorrência e reenvio.
5. Revisar RPC, grants/revokes, `search_path`, RLS e policies de Storage.
6. Executar e confirmar testes, lint, TypeScript e build no CI.
7. Obter autorização explícita antes de qualquer migration no projeto Supabase.
8. Manter as flags de backend desativadas até a aprovação completa.

## Limites desta fase

Nenhum endpoint novo foi conectado, nenhuma migration foi aplicada, nenhum arquivo foi enviado ao Storage e nenhuma matrícula real foi gravada. O token de arquivo no exemplo da Fase 15 é conceitual; ainda não existe serviço que o emita ou valide.
