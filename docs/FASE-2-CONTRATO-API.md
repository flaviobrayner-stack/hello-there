# Fase 2 — contrato de API proposto

**Status:** especificação preliminar para revisão; não representa endpoints implementados.  
**Ambiente:** somente desenvolvimento após aprovação do modelo e das permissões.  
**Não autorizado por este documento:** executar migrations, criar serviços/projetos, usar dados reais ou publicar em produção.

## Princípios

1. Toda rota administrativa exige sessão autenticada e verificação de perfil ativo no servidor.
2. A autorização é aplicada no servidor e reforçada por RLS no banco; esconder botões no frontend não é segurança.
3. Negar por padrão. O papel `operador` não pode alterar o próprio papel, o autor do registro, o estado de conta ou configurações institucionais.
4. Dados médicos ficam fora de respostas de matrícula e dashboard. Devem usar permissão específica, finalidade justificada e auditoria.
5. CPF, dados de saúde, tokens, conteúdo de arquivos e segredos nunca entram em logs comuns.
6. Operações críticas devem ser transacionais, idempotentes quando aplicável e cobertas por testes de autorização positiva e negativa.
7. A API não expõe caminhos arbitrários de Storage, links públicos permanentes ou credenciais do Google.

## Rotas candidatas

Os caminhos são ilustrativos; a implementação deve respeitar a arquitetura efetiva do projeto Lovable/TanStack Start.

| Método e rota | Finalidade | Regra mínima |
|---|---|---|
| `GET /api/session` | Perfil da sessão atual | Exige usuário autenticado e perfil ativo; nunca permite escolher o papel pelo cliente |
| `GET /api/courses` | Listar cursos ativos | Autenticação obrigatória para uso administrativo |
| `GET /api/enrollments` | Listar matrículas com paginação e filtros permitidos | Verificar escopo do operador; excluir campos de saúde e minimizar CPF |
| `POST /api/enrollments` | Criar matrícula/rascunho | Validar schema no servidor; atribuir `created_by` pela sessão; protocolo gerado no servidor |
| `GET /api/enrollments/:id` | Consultar matrícula | Validar acesso ao registro; retornar somente campos necessários |
| `PATCH /api/enrollments/:id` | Atualizar dados permitidos | Lista explícita de campos editáveis por papel/estado; rejeitar campos privilegiados enviados pelo cliente |
| `POST /api/enrollments/:id/cancel` | Cancelar matrícula | Papel autorizado, justificativa obrigatória e evento de auditoria |
| `GET /api/enrollments/:id/documents` | Consultar checklist documental | Aplicar regras configuradas e não permitir que o cliente altere a obrigatoriedade |
| `POST /api/enrollments/:id/documents/upload-url` | Solicitar autorização de upload | Verificar matrícula, tipo, tamanho permitido e permissão; destino privado gerado pelo servidor |
| `POST /api/documents/:id/check` | Conferir/recusar documento | Papel autorizado; guardar autor, data e justificativa quando recusado |
| `POST /api/enrollments/:id/generated-documents` | Solicitar geração documental | Verificar estado e pendências; usar cópia do modelo oficial; salvar histórico e resultado |
| `GET /api/enrollments/:id/health` | Consultar dados médicos | Separado da API geral; negar por padrão até autorização institucional específica |
| `GET /api/admin/audit-logs` | Consultar auditoria | Admin autorizado; filtros/paginação; sem conteúdo sensível desnecessário |
| `POST /api/admin/users` | Provisionar colaborador | Admin autorizado; criação segura sem permitir que cliente defina privilégios arbitrários |

## Validação e respostas

- Validar tipos, limites, enumerações, datas, normalização de CPF/CEP/telefone e tamanho dos textos no servidor.
- Usar paginação limitada; não retornar conjuntos completos por padrão.
- Rejeitar propriedades desconhecidas em operações privilegiadas ou aplicar allowlist estrita de campos.
- Respostas de erro devem ser estáveis e não revelar existência de CPF, matrícula ou conta de terceiros.
- Códigos esperados: `400` entrada inválida; `401` sessão ausente/expirada; `403` sem permissão; `404` recurso indisponível ou não autorizado conforme política anti-enumeração; `409` conflito de estado/duplicidade; `413` arquivo excede limite; `415` tipo de arquivo não aceito; `429` limite de tentativas; `500` erro genérico com identificador de correlação.
- Não retornar stack trace, SQL, tokens, chaves ou conteúdo de documentos ao cliente.

## Testes obrigatórios por operação

| Cenário | Resultado esperado |
|---|---|
| Sem sessão | Bloqueio sem dados privados |
| Usuário desativado | Bloqueio mesmo com sessão válida |
| Operador tenta mudar papel/estado/criador | Rejeição; nenhum dado alterado |
| Operador acessa matrícula fora do escopo | Bloqueio e sem vazamento por busca/contagem |
| Operador tenta ler dados de saúde | Bloqueio por padrão |
| Cliente envia campos extras privilegiados | Rejeição ou descarte explícito; nunca confiar no valor |
| Dois cadastros simultâneos | Protocolo sem colisão; conflitos tratados com segurança |
| Upload com MIME/extensão divergentes | Rejeição após validação real do arquivo |
| Upload para matrícula de terceiro | Bloqueio antes de emitir autorização |
| URL assinada expirada | Acesso negado |
| Documento obrigatório pendente | Geração/conclusão bloqueada conforme regra aprovada |
| Erro na integração Google | Falha controlada, registro sem segredo e possibilidade de retentativa segura |
| Cancelamento repetido | Estado consistente e auditoria sem duplicar efeito |
| Tentativa de enumerar CPF/protocolo | Resposta que não confirma dados de terceiros |

## Condições para implementação

Antes de transformar esta proposta em código conectado a dados persistentes, aprovar:
- decisões institucionais em `docs/FASE-2-DECISOES-PENDENTES.md`;
- modelo e políticas em `docs/drafts/schema-review.sql`;
- matriz de papéis, escopo de matrícula e acesso a dados de saúde;
- lista oficial de documentos, regras de bloqueio e prazos;
- local e permissões da pasta institucional do Google Drive.

A implementação deve começar em ambiente de desenvolvimento isolado, com dados sintéticos e testes automatizados. Migrações só podem sair da pasta de rascunhos após revisão técnica e autorização explícita; produção exige aprovação separada.
