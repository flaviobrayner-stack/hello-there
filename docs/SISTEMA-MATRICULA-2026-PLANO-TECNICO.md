# Sistema de Matrícula 2026 — plano técnico para revisão

## Estado desta entrega

- Branch: `feature/sistema-matricula-2026`
- Fase: 1 — interface demonstrativa e desenho técnico.
- Nenhuma migração SQL foi executada.
- Nenhuma tabela, bucket, política RLS ou Edge Function foi criada.
- Nenhuma credencial de produção foi adicionada.
- Nenhum dado real de estudante deve ser usado no protótipo.
- O modelo original Google Docs **“Ficha Ok 2026”** deve permanecer intacto.

## Inspeção inicial do repositório

O projeto atual é um scaffold Lovable com React 19, TypeScript, Vite 8 e TanStack Start/Router. A rota inicial era um placeholder; a raiz mantinha idioma inglês e título genérico. O package.json não inclui o cliente Supabase. A rota usa roteamento por arquivos; `src/routeTree.gen.ts` é gerado automaticamente e não deve ser editado manualmente. `AGENTS.md` alerta para não reescrever histórico já publicado porque a branch é sincronizada com Lovable.

## Escopo de produto

Construir um sistema administrativo em português brasileiro para a Escola Técnica Estadual Maria José Vasconcelos, com autenticação e papéis `admin` e `operador`; cadastro único por estudante; idade calculada pela data de nascimento; prevenção de duplicidade de CPF; número de matrícula/protocolo gerado no servidor; formulário em sete etapas; regras condicionais de cotas, PCD, transporte, saúde e documentos; rascunhos; anexos privados; dashboard; auditoria; exportação autorizada; e geração de documentos a partir de uma cópia do modelo oficial.

O modelo oficial contém oito saídas: ficha de matrícula, observações, documentação para matrícula, comprovante de matrícula, ficha de saúde, instrumento de concessão de imagem e som da voz, resumo de contato e termo de compromisso educacional.

## Proposta de modelo relacional (não aplicada)

1. `profiles`: `id` FK para `auth.users`, nome, papel (`admin`/`operador`), ativo, timestamps.
2. `enrollments`: UUID, número de matrícula único, protocolo, ano letivo, curso, responsável pelo cadastro, status, cota e timestamps.
3. `students`: UUID, enrollment/student relationship, nome, nome social, CPF normalizado e único quando informado, RG, nascimento, naturalidade, sexo, estado civil, contatos, endereço, escolaridade anterior, farda, Bolsa Família, PCD e transporte. Avaliar normalização de estudante versus matrícula para evitar duplicidade em anos futuros.
4. `parents_guardians`: estudante/matrícula, tipo de vínculo, situação, dados de contato, relação com o estudante e indicação explícita do responsável legal.
5. `health_records`: relação com estudante/matrícula, seguro, hospital, alergias, medicação, tipo sanguíneo, emergência e observações sensíveis. Acesso separado e mínimo privilégio.
6. `documents`: tipo, status, obrigatoriedade calculada/configurada, datas de entrega/conferência, conferente, prazo e observação.
7. `private_files` (ou metadados equivalentes): chave do objeto no bucket privado, matrícula/estudante, tipo, tamanho, MIME type, autor, timestamps; nunca guardar URLs públicas permanentes.
8. `generated_documents`: tipo, versão de template, ID/URL do Google Docs, URL/objeto do PDF, data, autor, status e erro; não sobrescrever versões antigas.
9. `audit_logs`: ator, ação, entidade, identificador, instante e metadados minimizados, sem duplicar CPF ou conteúdo médico desnecessariamente.
10. `courses`, `enrollment_settings` e `document_rules`: cursos, parâmetros e regras configuráveis, incluindo formato do número, pasta Drive, documentos bloqueantes, prazo da ficha 18, obrigatoriedade do termo de imagem e formato de pacote.

Os nomes e campos acima são proposta de revisão, não schema final. Antes de implementar, validar relações, retenção, índices, exclusão/arquivamento, restrições e necessidade de campos com a escola.

## Autorização e privacidade — proposta para revisão

- Não criar rotas públicas para cadastro de estudantes.
- Exigir sessão autenticada no servidor; proteger também endpoints/Server Functions, não apenas o menu.
- Papel obtido de fonte confiável no backend, nunca de um campo editável pelo usuário.
- Definir grants e políticas RLS específicas para cada operação em cada tabela; revogar permissões desnecessárias de `anon`; testar cenários permitidos e negados.
- Separar acesso a dados de saúde e documentos privados; não incluir saúde em consultas/listas gerais do dashboard.
- Bucket privado com políticas de Storage; downloads por URL assinada de curta duração, após autorização.
- Segredos de Google Workspace e chaves privilegiadas somente em ambiente server-side/secret store, nunca no navegador.
- Auditoria de ações sensíveis, criação/cancelamento, conferência, exportação, geração e alteração de permissões.
- Revisar LGPD, finalidade, minimização, retenção e acesso com a escola antes de usar dados reais.

Referências oficiais para a implementação futura:

- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Storage Access Control: https://supabase.com/docs/guides/storage/security/access-control
- Supabase Secure Data: https://supabase.com/docs/guides/database/secure-data

## Rotas propostas

- `/login`: autenticação de funcionários.
- `/admin/dashboard`: indicadores e gráficos, somente admin.
- `/matriculas`: busca/lista autorizada.
- `/matriculas/nova`: cadastro em sete etapas.
- `/matriculas/$id`: revisão, edição e histórico autorizado.
- `/documentos`: conferência e pendências.
- `/documentos-gerados`: versões e downloads autorizados.
- `/admin/usuarios`: criar, bloquear e redefinir usuários, somente admin.
- `/admin/configuracoes`: cursos, cotas, regras e integrações, somente admin.
- `/admin/auditoria`: logs, somente admin.

## Integração com “Ficha Ok 2026” e Google Workspace

1. Confirmar que a conta de serviço/credencial OAuth possui apenas o acesso necessário à pasta configurada.
2. Confirmar o documento original e preparar os marcadores no modelo em uma cópia de trabalho; não alterar o arquivo original.
3. Mapear todos os marcadores únicos do documento para os campos validados; não inserir dados de exemplo diretamente no template.
4. Criar cópia do modelo por matrícula; preencher a cópia; salvar o ID e a versão do template.
5. Gerar PDF e documentos separados ou pacote conforme configuração aprovada.
6. Registrar cada versão e erro sem apagar versões anteriores.
7. Nunca expor tokens, IDs sensíveis ou links de documentos sem autorização.

## Plano por fases

### Fase 1 — concluída parcialmente nesta branch

- Substituir placeholder por dashboard e protótipo de fluxo de matrícula.
- Usar somente registros fictícios claramente identificados.
- Registrar desenho técnico e pontos de revisão.
- Não conectar backend nem executar migração.

### Fase 2 — revisão antes de backend

- Revisar o schema proposto, papéis, permissões, políticas RLS/Storage, rotas, índices, validação de CPF, regras de conclusão e integração Google.
- Confirmar configurações pendentes do documento original e formulário.
- Aprovar estratégia de ambiente de desenvolvimento e testes com dados sintéticos.

### Fase 3 — backend de desenvolvimento

- Configurar Supabase/Auth, migrations versionadas, tabelas, RLS e bucket privado em ambiente não produtivo.
- Adicionar testes automatizados de autorização para cada tabela/ação.
- Integrar o cliente Supabase apenas após confirmar dependências e variáveis de ambiente.
- Sem dados reais até aprovação de segurança.

### Fase 4 — fluxo completo e documentos

- Implementar validação no servidor, unicidade, salvamento de rascunho, upload privado, auditoria e geração de documentos.
- Criar integração Google por Edge Function/servidor com segredos protegidos.
- Testar os oito documentos e exportações.

### Fase 5 — homologação e produção

- Testar criação, rascunho, CPF duplicado, idade, campos condicionais, cotas, documentos, upload, geração de PDF, acesso admin, bloqueio de não autorizado, filtros, exportação, auditoria e ocultação de dados de saúde.
- Homologação pela escola, revisão de privacidade e autorização explícita antes de aplicar migrações de produção.

## Decisões que continuam pendentes

- Formato do número de matrícula/protocolo.
- ID da pasta Google Drive de destino e método de autenticação.
- Quais documentos bloqueiam a conclusão.
- Prazo posterior da Ficha 18.
- Se o termo de imagem é obrigatório.
- Pacote único ou arquivos separados.
- Quem pode visualizar cada documento gerado.
- Título do campo “3.7.3” sem rótulo visível no formulário.

## Critério de aceite desta fase

A interface demonstra navegação, visão geral, lista de exemplo, formulário de sete etapas, cálculo local de idade e estados condicionais básicos. Ela **não é um sistema operacional de matrícula**: não autentica usuários, não persiste dados, não valida CPF no servidor, não faz upload real, não gera documentos e não substitui as políticas de backend. A próxima fase exige revisão/aprovação do plano antes de qualquer migração definitiva.
