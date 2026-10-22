# Fase 2 — contrato de dados e mapa da ficha

**Projeto:** Sistema de Matrícula 2026 — ETE Maria José Vasconcelos  
**Branch:** `feature/sistema-matricula-2026`  
**Status:** mapeamento estático elaborado a partir dos campos existentes em `src/routes/index.tsx`. Ainda depende de comparação com a ficha oficial “Ficha Ok 2026” e de decisões institucionais. **Não é autorização para migração nem para uso com dados reais.**

## 1. Limites desta revisão

A busca no repositório pela ficha oficial não encontrou um arquivo identificável como “Ficha Ok 2026”. Por isso, este documento descreve o formulário atual do sistema, sem afirmar que ele representa integralmente o documento oficial. Antes de aprovar o schema, a secretaria deve fornecer/confirmar a versão oficial e conferir campo por campo.

## 2. Mapa de campos existentes

| Etapa da interface | Campos atuais | Destino proposto no rascunho | Observação |
|---|---|---|---|
| Identificação | ano letivo fixo 2026, curso, cotista, tipo de cota | `enrollments.academic_year`, `course_id`, `is_quota`, `quota_type` | Cursos estão codificados em opções estáticas; precisam ser carregados de `courses`. Normalizar rótulos para enums internos no servidor. |
| Estudante | nome completo, nome social, CPF, RG, órgão expedidor, nascimento, naturalidade, sexo, estado civil, telefone, e-mail, endereço, bairro, cidade, UF, CEP, raça/cor, PCD, tipo PCD, transporte escolar, tipo de transporte, escola de origem, tamanho de camisa, Bolsa Família | `students` | O banco rascunhado tem colunas correspondentes. Idade é derivada da data de nascimento e não deve ser armazenada como fonte independente. CPF/CEP devem ser normalizados no servidor. PCD/tipo de deficiência e Bolsa Família exigem acesso mínimo e justificativa de coleta. |
| Filiação | nome e situação da mãe; nome e situação do pai | duas linhas em `parents_guardians`, com `relationship_type` e `status` | A RPC precisa gravar os dois vínculos e preservar estados como “não informado”, “falecido” e “não se aplica”, sem inventar nomes. |
| Responsável legal | nome, vínculo, CPF | linha própria em `parents_guardians`, `is_legal_guardian=true` | Não assumir que mãe/pai é responsável. O contrato atual da interface ainda não coleta RG, contato, endereço, profissão ou local de trabalho do responsável; confirmar se a ficha oficial exige esses dados. |
| Saúde | seguro de saúde, hospital credenciado, hospital indicado pela família, alergia medicamentosa e detalhes, medicação controlada e detalhes, tipo sanguíneo, fator RH, pessoa/telefone/parentesco de emergência, observações de saúde e detalhes | `health_records` | Dados sensíveis. Só endpoint e papel autorizado podem consultar. Não enviar em listagens gerais, logs, analytics ou respostas de dashboard. |
| Documentação | nomes de arquivos selecionados localmente; lista visual de documentos e estados em memória | `documents` e Storage privado | Hoje só os nomes ficam no estado do navegador; nenhum arquivo é enviado. O estado visual não é persistido. Precisamos de regras oficiais por tipo, metadados validados no servidor e armazenamento privado. |
| Confirmação/revisão | confirmação final e revisão visual | estado do formulário; possivelmente auditoria/estado da matrícula | A confirmação não substitui consentimento ou base legal. Registrar somente eventos de negócio necessários e auditáveis. |

## 3. Lacunas encontradas entre a interface e o rascunho

1. **Alergia alimentar:** o schema já tem `food_allergy` e `food_allergy_details`, mas não existe pergunta correspondente no formulário atual. Confirmar se consta na ficha oficial e, se sim, adicionar antes de ativar o fluxo.
2. **Filiação e responsável:** a tabela permite armazenar dados adicionais, mas a interface coleta apenas nome/situação da mãe e do pai, e nome/vínculo/CPF do responsável. Não preencher os campos restantes com valores presumidos.
3. **Documentos:** seleção de arquivo não é upload. Não tratar um nome de arquivo no browser como documento entregue, conferido ou guardado.
4. **Cursos:** opções de curso estão fixas no frontend; é preciso usar IDs de cursos ativos do banco e rejeitar IDs inexistentes/inativos no servidor.
5. **Protocolo e conclusão:** protocolo deve ser criado no servidor dentro da mesma transação que cria matrícula e registros relacionados. Não concluir matrícula com base apenas no estado visual do formulário.
6. **Campos obrigatórios:** vários campos do estudante são opcionais na interface; não impor obrigatoriedade nova sem confirmar a ficha/regra oficial. O servidor deve validar limites, formato e campos permitidos.
7. **Identidade/CPF:** a unicidade de CPF no rascunho continua pendente de aprovação institucional e não deve ser aplicada sem política de correção, rematrícula e cadastro sem CPF.
8. **Idade:** é calculada no frontend, mas deve ser recalculada quando necessária no servidor a partir da data de nascimento e da data de referência.
9. **Privacidade:** os campos de saúde e potencialmente PCD/Bolsa Família precisam de política de acesso específica e retenção definida.
10. **Ficha oficial:** a busca pelo nome “Ficha Ok 2026” não encontrou o documento no repositório; equivalência com o modelo original ainda não está validada.

## 4. Contrato de gravação proposto para a futura RPC

A futura RPC transacional deve aceitar um payload versionado e estrito, por exemplo `schema_version`, `academic_year`, `course_id`, `quota`, `student`, `parents`, `legal_guardian`, `health` e `documents`. Este é apenas um agrupamento conceitual, não uma assinatura final.

Regras necessárias antes de implementar:

- rejeitar chaves desconhecidas e tipos incorretos;
- validar e normalizar CPF, CEP, telefone, UF, datas, enums e tamanhos;
- derivar o usuário criador de `auth.uid()`/sessão verificada, nunca do payload do cliente;
- gerar protocolo no servidor sem colisão concorrente;
- criar matrícula, estudante, vínculos de filiação/responsável, saúde e pendências documentais na mesma transação;
- não aceitar caminhos de Storage arbitrários fornecidos pelo cliente;
- gravar auditoria sem CPF completo, conteúdo médico, tokens ou segredos;
- autorizar o chamador antes de gravar e verificar as políticas RLS/grants;
- responder com protocolo e estado mínimo, nunca retornar conteúdo médico na resposta de criação;
- manter a função sem acesso de execução público até concluir revisão de privilégios e testes.

## 5. Matriz mínima de dados e acesso para testes

| Perfil de teste | Matrículas próprias | Matrículas de outros operadores | Dados de saúde | Gerenciar usuários/papéis | Auditoria |
|---|---|---|---|---|---|
| Sem sessão / anon | negar | negar | negar | negar | negar |
| Operador ativo | escopo a confirmar; rascunho limita ao criador | negar até decisão institucional | negar | negar | sem acesso geral |
| Administrador ativo | permitir conforme política aprovada | permitir conforme política aprovada | somente via fluxo restrito e auditado | conforme função administrativa | leitura restrita |
| Usuário inativo | negar | negar | negar | negar | negar |

Esta matriz é proposta para testes; o escopo dos operadores continua pendente de decisão formal.

## 6. Testes exigidos antes de migrar

- payload válido de matrícula completa com dados sintéticos;
- payload com campos desconhecidos, tipos inválidos, datas inválidas e enums não aceitos;
- CPF inválido, duplicado e ausente, conforme regra aprovada;
- rematrícula da mesma pessoa em ano diferente;
- falha intencional no meio da RPC para confirmar rollback integral;
- duas matrículas concorrentes para verificar protocolo sem colisão;
- operador tentando ler saúde, alterar papel, consultar matrícula fora do escopo e chamar RPC sem permissão;
- usuário inativo e usuário sem sessão tentando ler e gravar;
- validação de todos os vínculos e estados da mãe/pai/responsável;
- arquivo com MIME/extensão divergentes, excesso de tamanho, acesso a objeto de outro estudante e URL expirada;
- auditoria sem conteúdo médico ou identificadores desnecessários;
- backup/restauração e procedimento de rollback em ambiente isolado.

## 7. Decisões necessárias para fechar o contrato

- [ ] Conferir este mapa com a ficha oficial “Ficha Ok 2026”.
- [ ] Confirmar se há campos adicionais na ficha oficial, especialmente filiação, responsável e alergia alimentar.
- [ ] Aprovar regra de CPF e rematrícula.
- [ ] Definir escopo de acesso dos operadores.
- [ ] Aprovar documentos obrigatórios, bloqueadores de conclusão e prazo da Ficha 18.
- [ ] Aprovar formato e exposição do protocolo.
- [ ] Definir retenção, correção, cancelamento e descarte dos dados.
- [ ] Definir armazenamento de documentos e responsáveis institucionais.

## 8. Estado do banco

Nenhuma tabela ou migração foi criada por esta etapa. O SQL em `docs/drafts/schema-review.sql` continua sendo rascunho e não deve ser executado antes da revisão, dos testes e da autorização explícita.
