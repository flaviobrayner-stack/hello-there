# Fase 2 — Revisão de backend, segurança e integrações
**Projeto:** Sistema de Matrícula 2026 — Escola Técnica Estadual Maria José Vasconcelos  
**Status:** proposta para revisão; não aprovada para implantação  
**Base técnica:** Lovable / React + Supabase (Postgres, Auth, Storage e Edge Functions)

> **Importante:** este documento e `docs/drafts/schema-review.sql` são artefatos de revisão. Não executar SQL, não mover para `supabase/migrations`, não criar buckets, não ativar credenciais e não aplicar mudanças em produção antes de revisão e aprovação explícitas.

## 1. Escopo desta fase

- Definir a arquitetura de backend, as entidades e os relacionamentos.
- Definir a matriz de permissões e os pontos que precisam de decisão institucional.
- Especificar rotas administrativas protegidas.
- Planejar armazenamento privado, auditoria e integração com Google Workspace.
- Definir testes obrigatórios antes de habilitar dados reais.

Fora do escopo até a aprovação: migrações aplicadas, provisionamento de Supabase, cadastro de usuários reais, importação de dados pessoais, upload real, envio de e-mail ou criação de documentos no Drive.

## 2. Arquivos de referência

- `docs/drafts/schema-review.sql` — proposta SQL com tabelas, índices e políticas RLS iniciais.
- `docs/sistema-matricula-2026-plano-revisao.md` — estado da interface e limitações da demonstração.
- Google Docs oficial “Ficha Ok 2026”: https://docs.google.com/document/d/1Qb2-R98xRzPZJFifwKsRT4EgNwcPQDmFBMY3ywakjVk/edit?tab=t.0
- Google Forms de referência: https://docs.google.com/forms/d/e/1FAIpQLSdBSXHcUTp3mFYsDxW_NJOxaRZQwE5R1P0BeHOoz9P9oYCnHw/viewform?usp=header

O documento Google Docs original é somente leitura para a integração: toda geração futura deve criar uma cópia e substituir marcadores nessa cópia. Nunca sobrescrever o modelo.

## 3. Entidades e relacionamentos propostos

| Entidade | Finalidade | Relacionamentos / observações |
|---|---|---|
| `profiles` | Perfil de colaborador, papel e estado ativo | `id` vinculado a `auth.users`; papéis `admin` e `operador` |
| `courses` | Cursos configuráveis | Referenciada por matrículas |
| `students` | Dados pessoais e endereço do estudante | Separada da matrícula para permitir rematrícula sem duplicar pessoa |
| `enrollments` | Protocolo, ano letivo, curso, cota, estado e responsável pelo cadastro | Vincula estudante, curso e usuário criador |
| `parents_guardians` | Blocos de mãe, pai e responsável legal | Vinculados à matrícula; situação explícita, sem presumir que a mãe é responsável |
| `health_records` | Saúde, alergias, medicação e emergência | Tabela separada com política mais restritiva; não retornar em consultas gerais |
| `documents` | Status, metadados e caminho privado do arquivo | Vinculada à matrícula; status e regras configuráveis |
| `generated_documents` | Histórico imutável de gerações e versões | Guarda IDs/URLs, template, status e erro; versões anteriores nunca são excluídas automaticamente |
| `document_rules` | Regras de obrigatoriedade, bloqueio e prazo | Configuração administrativa, incluindo prazo da Ficha 18 |
| `app_settings` | Configurações operacionais | Formato do número, pasta de destino, pacote/arquivos separados e permissões |
| `audit_logs` | Trilha de auditoria | Escrita via operação confiável no servidor; leitura administrativa |

### Ajustes necessários antes de transformar o rascunho em migration

1. Definir se o CPF único é por pessoa ou por ano letivo. A proposta separa estudantes e matrículas, mas a restrição de unicidade precisa ser validada para não impedir rematrículas legítimas.
2. Rever a modelagem de mãe/pai/responsável e a necessidade de mais de um responsável por matrícula.
3. Formalizar quais documentos bloqueiam a conclusão e se a Ficha 18 pode ter entrega posterior.
4. Definir política de retenção, correção e cancelamento de dados, incluindo dados sensíveis e documentos gerados.
5. Revisar tipos, campos obrigatórios, índices e regras de atualização de `updated_at`.

## 4. Matriz de acesso proposta

| Recurso / ação | Admin | Operador |
|---|---|---|
| Dashboard administrativo | Sim | Não, salvo decisão futura |
| Consultar e editar matrículas | Sim | Sim, dentro do escopo autorizado |
| Criar matrícula / salvar rascunho | Sim | Sim |
| Cancelar ou apagar registros | Cancelar com justificativa; exclusão física desabilitada por padrão | Não |
| Conferir documentos | Sim | Somente se autorizado/configurado |
| Gerar documentos | Sim | Somente se autorizado/configurado |
| Criar, bloquear e redefinir usuários | Sim, por fluxo administrativo seguro | Não |
| Alterar papéis e configurações sensíveis | Sim | Não |
| Ler dados médicos detalhados | Acesso restrito e auditado | Bloqueado por padrão até decisão formal |
| Ler logs de auditoria | Sim | Não |
| Exportar dados | Sim, com auditoria e minimização | Somente se autorizado, com mascaramento |

### Requisitos de segurança obrigatórios

- Ativar RLS em todas as tabelas expostas à API.
- Negar por padrão; permissões devem ser concedidas por operação e papel.
- Não confiar em menu oculto ou validação do navegador como controle de acesso.
- Proteger contra elevação de privilégio: usuário operador não pode editar seu papel, estado ativo, criador da matrícula ou autor da conferência.
- Restringir escrita de auditoria a função/servidor confiável; cliente não pode fabricar eventos.
- Não conceder acesso direto público a tabelas, arquivos, documentos ou dados pessoais.
- Buckets privados, limites de tamanho/MIME, caminhos imprevisíveis, verificação de autorização e URLs assinadas com expiração curta.
- Não registrar CPF completo, dados médicos, conteúdo de documentos ou tokens nos logs.
- Proteger segredos Google/Supabase exclusivamente em variáveis seguras de servidor/Edge Function; nunca no bundle do navegador.
- Implementar limitação de tentativas, sessão segura, fluxo de recuperação de senha e desativação de usuários.
- Rever LGPD, base legal, acesso mínimo, retenção, exportação e procedimento de incidente com a instituição.

O SQL atual é apenas um ponto de partida: as policies ainda precisam de escopo por matrícula, grants/revokes explícitos, provisionamento seguro de perfil, política de Storage e testes negativos de autorização.

## 5. Rotas propostas

As rotas abaixo são um plano; só devem ser protegidas e ligadas a dados reais depois de implementar Auth e validar a sessão no servidor.

| Rota | Acesso | Finalidade |
|---|---|---|
| `/login` | Pública, sem dados de matrícula | Login de colaborador por e-mail e senha |
| `/` | Redireciona conforme sessão e papel | Entrada da aplicação |
| `/admin/dashboard` | Admin | Indicadores e pendências agregadas; sem detalhes de saúde |
| `/admin/matriculas` | Admin | Busca, filtros, consulta e ações administrativas |
| `/admin/matriculas/nova` | Admin e operador autenticados | Cadastro em etapas e salvamento de rascunho |
| `/admin/matriculas/$id` | Admin e operador autorizado | Visualização e edição conforme política |
| `/admin/matriculas/$id/documentos` | Admin; operador se autorizado | Checklist, upload e conferência |
| `/admin/matriculas/$id/gerar-documentos` | Admin; operador se autorizado | Solicitar geração e acompanhar status |
| `/admin/documentos-gerados` | Papel autorizado | Histórico de documentos e versões |
| `/admin/cursos` | Admin | Cadastro e ativação de cursos |
| `/admin/regras-documentos` | Admin | Obrigatoriedade, bloqueios e prazos |
| `/admin/usuarios` | Admin | Gerenciamento de colaboradores |
| `/admin/auditoria` | Admin | Consulta à trilha de auditoria |
| `/admin/configuracoes` | Admin | Formato de matrícula, integração, templates e permissões |

Rotas e handlers devem verificar sessão e papel no servidor, além das policies do banco. IDs recebidos pela URL não são prova de autorização. A rota pública de cadastro de estudantes **não deve existir**.

## 6. Fluxo transacional de matrícula

1. Usuário autenticado inicia um rascunho; o servidor define `created_by`, data/hora e ano permitido.
2. O servidor normaliza e valida os campos, verifica CPF e procura pessoa existente sem revelar dados a usuários sem permissão.
3. Ao concluir, uma operação transacional gera protocolo/número único, grava matrícula e vínculos, calcula pendências e registra auditoria.
4. A conclusão é bloqueada quando houver campo obrigatório faltante ou documento configurado como bloqueador.
5. A geração de documentos ocorre depois da conclusão e em processo assíncrono; falha de Google não deve apagar a matrícula.
6. Repetições de requisição devem ser idempotentes para não criar matrícula ou pacote duplicado.
7. Cancelamento deve ser lógico, justificado e auditado; não excluir histórico nem versões anteriores.

O formato do protocolo ainda não foi definido. Não fixar um padrão definitivo sem configuração ou decisão institucional.

## 7. Upload e Storage privado

- Tipos aceitos inicialmente: PDF, JPEG e PNG; confirmar limites e necessidade de outros formatos.
- Validar MIME real, extensão e tamanho no servidor; não confiar somente no atributo `accept` do navegador.
- Não usar bucket público nem URLs permanentes.
- Caminhos devem usar IDs internos, sem CPF ou nome no nome do arquivo.
- Download por URL assinada curta, após checagem de autorização e vínculo com a matrícula.
- Registrar quem enviou, quando, status de conferência e quem conferiu.
- Decidir prazo de retenção e processo de substituição de arquivo.
- Dados de saúde e documentos médicos exigem controle adicional, separado do checklist comum.

## 8. Plano de integração Google Workspace

### Configuração necessária
- Conta institucional responsável pela integração.
- Método de autenticação aprovado pela organização (OAuth ou conta de serviço, conforme políticas do Google Workspace).
- ID da pasta de destino configurado como segredo/configuração do servidor, com acesso mínimo.
- Confirmação de permissões de Drive/Docs e de quem pode abrir os documentos gerados.
- Revisão dos marcadores no template “Ficha Ok 2026”; não editar o original.

### Fluxo planejado
1. Uma Edge Function recebe uma solicitação autenticada e autorizada, com ID da matrícula.
2. O servidor busca os dados necessários com permissões mínimas e cria uma cópia do template oficial na pasta configurada.
3. Substitui apenas marcadores únicos definidos na especificação; escapa/normaliza valores e trata campos vazios.
4. Gera pacote completo ou arquivos separados conforme configuração ainda pendente.
5. Se solicitado, exporta PDF e grava-o no Storage privado; os links públicos não são permitidos.
6. Registra tipo, versão do template, ID/URL do Doc, URL privada/assinada do PDF, usuário, timestamps, status e erro.
7. Falhas são repetíveis sem criar cópias ilimitadas; cada nova versão fica no histórico e nenhuma versão anterior é apagada automaticamente.

### Oito partes do modelo oficial
1. Ficha de matrícula.
2. Observações.
3. Documentação para matrícula.
4. Comprovante de matrícula.
5. Ficha de saúde.
6. Instrumento de concessão de imagem e som da voz.
7. Resumo de contato.
8. Termo de compromisso educacional.

O responsável legal selecionado deve preencher os termos correspondentes; não presumir que é a mãe. Confirmar se o contrato de imagem é obrigatório e como registrar consentimento/recusa.

## 9. Plano de testes antes de qualquer implantação

- RLS: sem sessão, operador, admin, usuário inativo e tentativa de acessar outra matrícula.
- Escalada de privilégio: operador tenta alterar papel, `created_by`, conferente, status protegido ou configurações.
- Dados de saúde não aparecem em listagens, exports gerais nem logs.
- CPF duplicado, rematrícula, concorrência na geração do protocolo e requisições repetidas.
- Todos os tipos de cota e documentos condicionais; Ficha 18 com e sem prazo posterior.
- Upload de arquivo inválido, excessivo, acesso a arquivo de outra matrícula e URL expirada.
- Geração de cada uma das oito partes, pacote, PDF, falha externa e repetição idempotente.
- Exportações autorizadas com mascaramento e auditoria.
- Backup/recuperação, retenção e cancelamento sem apagar histórico.
- Verificar que o modelo oficial nunca foi alterado.

## 10. Decisões pendentes para aprovação

1. Regra de unicidade de CPF e rematrícula.
2. Quais campos e documentos bloqueiam conclusão; prazo da Ficha 18.
3. Operadores podem conferir documentos? Gerar documentos? Exportar?
4. Quem pode visualizar dados de saúde e documentos gerados.
5. Formato de protocolo/número de matrícula.
6. ID da pasta Drive e credenciais institucionais aprovadas.
7. Pacote único ou arquivos separados; PDF padrão ou sob demanda.
8. Contrato de imagem obrigatório ou opcional e como registrar a escolha.
9. Campo “3.7.3” sem título visível no formulário original.
10. Regras de retenção, correção, cancelamento e demais requisitos LGPD.

## 11. Critério de saída da Fase 2

Só após revisão institucional explícita:
- ajustar o SQL e as policies;
- preparar migrations versionadas e testadas em ambiente de desenvolvimento;
- configurar Auth e Storage privados;
- implementar Edge Functions e rotas protegidas;
- validar com contas de teste admin/operador;
- apresentar diff e resultados para revisão antes de qualquer implantação em produção.

**Nenhuma migração foi executada nesta fase.**
