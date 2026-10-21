# Sistema de Matrícula 2026 — plano de implementação e revisão

## Estado desta entrega
- Protótipo de interface no branch `feature/sistema-matricula-2026`.
- Não foi executada nenhuma migração de banco nem provisionado backend.
- O rascunho SQL para schema e RLS está em `docs/drafts/schema-review.sql`, fora da pasta de migrations e explicitamente marcado como não executável antes de revisão.
- CI (testes unitários, lint e build de produção) passou em https://github.com/flaviobrayner-stack/hello-there/actions/runs/39624908589.
- Nenhum dado real deve ser cadastrado: a validação de CPF e os estados documentais são locais e não substituem validação/duplicidade no servidor.
- Os nomes e números do painel são exemplos fictícios. Alterações feitas no protótipo existem apenas no estado da sessão.
- O modelo Google Docs “Ficha Ok 2026” é tratado como fonte oficial e não deve ser editado; a integração deve criar cópias.

## Inspeção do projeto original
- Aplicação Lovable com React 19, TypeScript, Vite 8 e TanStack Start/Router.
- Rotas baseadas em arquivos em `src/routes`; a página inicial original era um placeholder.
- `src/routeTree.gen.ts` é gerado automaticamente e não deve ser editado manualmente.
- `src/routes/__root.tsx` fornece shell, metadados, QueryClient e tratamento de erros; preservamos os provedores e o `Outlet`.
- `src/styles.css` já continha tokens semânticos Tailwind v4 em OKLCH.
- `AGENTS.md` informa que o projeto sincroniza com Lovable e alerta para não reescrever histórico publicado.
- Dependências incluem Lucide React e utilitários de UI; não foi necessário adicionar dependências.

## Funcionalidades de interface implementadas nesta fase
- Dashboard responsivo e navegação administrativa.
- Lista de matrículas com busca, filtro de status e impressão/exportação do navegador.
- Fluxo de cadastro de sete etapas: identificação, estudante, filiação, responsável legal, saúde, documentos e revisão.
- Dados pessoais ampliados: nome social, RG, naturalidade, contatos, endereço, raça/cor, escola de origem, farda e Bolsa Família.
- Máscaras de CPF, telefone e CEP; validação local dos dígitos verificadores do CPF; cálculo de idade por data civil e bloqueio de data futura.
- Campos condicionais para cota, PCD, transporte, alergia, medicação e informações adicionais de saúde.
- Checklist documental por tipo de cota, status local, indicador de progresso e resumo de pendências obrigatórias.
- Seleção local de fotos/PDFs para testar a experiência; os arquivos não são enviados nem persistidos.
- Navegação entre etapas com validação dos campos essenciais e dados controlados preservados durante a sessão.
- Páginas de documentação e configurações pendentes; aviso explícito sobre ausência de backend e dados demonstrativos.
- Testes unitários para CPF, idade e máscaras em `src/lib/enrollment-validation.test.ts`.
- Workflow GitHub Actions em `.github/workflows/checks.yml`: testes, lint e build passaram no run [39624547987](https://github.com/flaviobrayner-stack/hello-there/actions/runs/39624547987).

## Modelo de dados proposto — para revisão, não executar ainda
1. `profiles`: id (FK auth.users), nome, email, papel (admin/operador), ativo, timestamps.
2. `enrollments`: id UUID, protocolo único, ano letivo, curso, status (rascunho/em análise/concluída/cancelada), cotista, tipo de cota, operador responsável, datas, timestamps.
3. `students`: id UUID, enrollment_id, nome completo, nome social, CPF normalizado, RG, órgão expedidor, nascimento, naturalidade, sexo, estado civil, telefone, email, endereço, CEP, cidade/UF, raça/cor, PCD/tipo, transporte/tipo, escola de origem, uniforme, Bolsa Família. Definir a regra de unicidade de CPF após confirmar se um estudante pode ter mais de uma matrícula ao longo dos anos.
4. `parents_guardians`: id, enrollment_id, tipo de vínculo, situação, nome, documentos de identificação, contatos, endereço, profissão e trabalho; responsável legal explicitamente selecionado.
5. `health_records`: enrollment_id, seguro/hospital, alergias, medicação controlada, dados de emergência, tipo sanguíneo/RH, observações de saúde. Tabela separada e acesso mais restrito.
6. `documents`: id, enrollment_id, tipo, status, caminho privado no Storage, data de entrega/conferência, usuário conferente, observação e prazo.
7. `generated_documents`: id, enrollment_id, tipo, versão do template, ID/URL do Google Doc, URL do PDF, data, usuário, status e erro; manter versões anteriores.
8. `audit_logs`: id, ator, ação, tabela/registro, timestamp, metadados mínimos; evitar registrar CPF, dados de saúde, conteúdo de documentos ou segredos nos metadados.
9. `courses`, `document_rules` e `app_settings`: listas e parâmetros administráveis, incluindo documentos bloqueantes, formato de protocolo, prazo da Ficha 18, exigência de autorização de imagem, formato de pacote, pasta de destino e campo 3.7.3.

## Rascunho de políticas de segurança — revisar antes de implementar
- Ativar RLS em todas as tabelas expostas pela API.
- Negar por padrão a usuários anônimos todo acesso a dados de matrícula.
- `admin`: acesso administrativo conforme política explicitamente aprovada.
- `operador`: criar/editar e consultar matrículas conforme atribuições aprovadas; não pode criar usuários, mudar papéis, apagar registros ou alterar configurações sensíveis.
- Dados de saúde: policy separada, acesso apenas para papéis autorizados; nunca incluir campos de saúde nas consultas gerais de dashboard.
- `audit_logs`: inserção via lógica de servidor confiável; leitura apenas para admin autorizado; sem acesso de escrita arbitrária pelo cliente.
- Storage privado, buckets separados ou prefixos por matrícula, limite de tamanho/tipo de arquivo e políticas para cada operação; usar URLs assinadas de curta duração.
- Não confiar em controles visuais do frontend: verificar sessão e papel no servidor/Edge Functions e no banco.
- Não colocar service-role keys ou credenciais do Google no frontend; usar secrets de servidor.
- Testes negativos obrigatórios: anon, operador tentando ação de admin, leitura cruzada, acesso a dados de saúde e URLs de arquivos expiradas.

## Rotas propostas
- `/login`: autenticação administrativa; sem cadastro público de estudantes.
- `/`: dashboard, protegido por sessão e papel admin.
- `/matriculas`: consulta e filtros.
- `/matriculas/nova` e `/matriculas/$id`: cadastro/edição e revisão por etapas.
- `/documentacao`: conferência de documentos.
- `/documentos-gerados`: histórico e downloads autorizados.
- `/configuracoes`: admin.
- `/usuarios`: admin para gestão de perfis, bloqueio e redefinição conforme suporte disponível.

## Integração Google Workspace
1. Confirmar acesso e permissões ao modelo “Ficha Ok 2026” e à pasta de destino; não modificar o original.
2. Criar credenciais OAuth/service account de forma apropriada, com escopo mínimo e segredos somente no servidor.
3. Configurar Edge Function para copiar o template, substituir marcadores únicos, salvar o ID/URL da cópia e produzir PDF quando solicitado.
4. Gerar pacote ou arquivos separados conforme decisão administrativa; gravar versão do template e nunca apagar versões anteriores.
5. Testar com dados fictícios; verificar todos os oito documentos/seções: ficha de matrícula, observações, documentação, comprovante, saúde, concessão de imagem e voz, resumo de contato e termo de compromisso.
6. Registrar falhas sem incluir dados pessoais sensíveis nos logs.

## Questões a decidir antes de schema/migrações definitivas
- Formato oficial do número de matrícula/protocolo.
- Pasta de destino do Drive e conta de serviço/autorização.
- Quais documentos bloqueiam a conclusão e prazo da Ficha 18.
- Se autorização de imagem/voz é obrigatória.
- Pacote único ou arquivos separados.
- Quais papéis podem visualizar/baixar cada documento.
- Significado do campo “3.7.3” sem título visível.
- Regra de identidade do estudante/CPF entre anos letivos e tratamento de registros existentes.
- Lista oficial de cursos, cidades, tamanhos de farda e outras opções fixas.
- Definição de retenção, cancelamento e exportação de dados pessoais.

## Próximas fases
1. Revisar este plano, o schema e as policies RLS.
2. Confirmar decisões administrativas e opções pendentes.
3. Implementar backend de autenticação, banco, RLS e Storage em ambiente de desenvolvimento.
4. Implementar operações reais e auditoria; retirar dados fictícios.
5. Integrar Google Docs/Drive e geração de PDF.
6. Executar testes funcionais, segurança e acessibilidade com dados sintéticos.
7. Aprovar migrações e somente então planejar a implantação definitiva.
