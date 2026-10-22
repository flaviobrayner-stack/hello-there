# Fase 8 — matriz de campos da matrícula

**Projeto:** Sistema de Matrícula 2026 — ETE Maria José Vasconcelos  
**Branch:** `feature/sistema-matricula-2026`  
**Status:** inventário técnico do formulário atual e proposta de mapeamento. **Não é especificação oficial aprovada, não autoriza migration e não habilita persistência real.**

## 1. Fonte e limites

Matriz elaborada pela leitura estática de `src/routes/index.tsx`, `src/routes/api.enrollments.ts`, `docs/drafts/schema-review.sql` e dos documentos de fases anteriores. O repositório não contém uma cópia identificada e confirmada da ficha oficial “Ficha Ok 2026”. Assim:

- “Obrigatório na interface” descreve apenas o comportamento atual, não uma regra institucional.
- “Destino proposto” indica o rascunho de banco e ainda precisa ser conferido com o schema final.
- Campos com status **confirmar** não devem receber obrigatoriedade, default ou regra de negócio inventados.
- Não foram criadas migrations, não houve gravação no Supabase e não foi ativado o backend.

## 2. Identificação da matrícula

| Campo na interface | Tipo atual | Obrigatoriedade atual | Destino proposto | Validação / decisão pendente |
|---|---|---|---|---|
| Ano letivo | Ano fixo exibido como 2026 | Fixo na interface | `enrollments.academic_year` | Servidor deve validar ano autorizado; confirmar período de matrícula |
| Curso | Rótulo selecionado em opções locais | Depende de seleção | `enrollments.course_id` → `courses.id` | Substituir opções fixas por cursos ativos; verificar ID e disponibilidade no servidor |
| Cotista | Sim/Não | Estado inicial “Não” | `enrollments.is_quota` | Default atual da UI não comprova elegibilidade; confirmar regra institucional |
| Tipo de cota | Rótulo selecionado | Depende de cotista | `enrollments.quota_type` | Mapear rótulos para enum estável no servidor; comprovação e critérios pendentes |

## 3. Dados do estudante

| Campo | Tipo esperado | Obrigatoriedade atual | Destino proposto | Sensibilidade / validação |
|---|---|---|---|---|
| Nome completo (`student`) | Texto | Obrigatório em validação do formulário/API | `students.full_name` | Trim e limite; preservar grafia e acentos |
| Nome social | Texto | Opcional | `students.social_name` | Acesso restrito conforme necessidade; não usar como chave de deduplicação sem política |
| CPF | Texto formatado | Pode ser vazio; validado se informado | `students.cpf_digits` | Normalizar dígitos e validar no servidor; política de ausência, duplicidade, correção e rematrícula pendente |
| RG | Texto | Opcional | `students.rg` | Confirmar formato e necessidade |
| Órgão expedidor | Texto | Opcional | `students.rg_issuer` | Confirmar formato/limite |
| Data de nascimento | Data ISO `YYYY-MM-DD` | Opcional no schema da API; formulário valida quando informada | `students.birth_date` | Data real, não futura; regra de idade ainda depende da instituição |
| Naturalidade | Texto | Opcional | `students.birthplace` | Confirmar se deve separar cidade/UF |
| Sexo | Seleção/texto | Opcional | `students.sex` | Vocabulário permitido deve vir da ficha oficial; não inventar enum |
| Estado civil | Seleção/texto | Opcional | `students.marital_status` | Vocabulário permitido a confirmar |
| Telefone | Texto formatado | Opcional | `students.phone` | Normalizar dígitos; aceitar formatos brasileiros permitidos |
| E-mail | Texto | Opcional | `students.email` | Validar formato e limite; definir se pode ser de responsável |
| Endereço | Texto | Opcional | `students.address` | Confirmar limite e se inclui número/complemento |
| Bairro | Texto | Opcional | `students.neighborhood` | Confirmar limite |
| Cidade | Texto | Opcional | `students.city` | Confirmar regra de município |
| UF | Código de estado | Estado inicial PE | `students.state` | Validar contra lista oficial de UFs; default PE precisa aprovação |
| CEP | Texto formatado | Opcional | `students.cep_digits` | Persistir dígitos; exatamente 8 quando informado |
| Raça/cor | Seleção/texto | Opcional | `students.race_color` | Campo potencialmente sensível; opções devem seguir ficha/padrão oficial |
| PCD | Sim/Não | Estado inicial “Não” | `students.pcd` | Dado sensível; justificar coleta, limitar acesso e retenção |
| Tipo de deficiência | Texto/seleção | Condicional a PCD | `students.pcd_type` | Definir lista oficial e regra de condicionalidade |
| Transporte escolar | Sim/Não | Estado inicial “Não” | `students.school_transport` (nome a confirmar no SQL) | Confirmar finalidade e regra do campo |
| Tipo de transporte | Seleção | Condicional a transporte “Sim” | `students.transport_type` (nome a confirmar no SQL) | Enum a confirmar |
| Escola de origem | Texto | Opcional | `students.previous_school` | Confirmar se escola, município e rede precisam campos separados |
| Tamanho da farda/camisa | Seleção | Opcional | `students.shirt_size` | Opções atuais PP/P/M/G/GG/XGG; validar com a escola |
| Bolsa Família | Sim/Não | Estado inicial “Não” | `students.bolsa_familia` | Informação socioeconômica sensível; confirmar base/finalidade e acesso mínimo |
| Idade calculada | Derivada da data | Exibida na revisão | Não persistir como fonte primária | Calcular no servidor quando necessária, com data de referência explícita |

**Observação:** os nomes entre parênteses em “Destino proposto” são nomes conceituais quando o nome exato da coluna precisa ser conferido no SQL completo. Não aplicar rename ou migration com base nesta tabela isoladamente.

## 4. Filiação

| Campo | Tipo | Obrigatoriedade atual | Destino proposto | Validação / decisão pendente |
|---|---|---|---|---|
| Nome da mãe | Texto | Opcional na UI | `parents_guardians`, vínculo “mãe” | Preservar estado separado do nome; confirmar regras para nome ausente |
| Situação da mãe | Seleção | Estado inicial “Informado” | `parents_guardians.status` | Valores visíveis devem ser comparados com enum do banco; não criar nomes presumidos |
| Nome do pai | Texto | Opcional na UI | `parents_guardians`, vínculo “pai” | Preservar estado separado do nome |
| Situação do pai | Seleção | Estado inicial “Informado” | `parents_guardians.status` | Valores visíveis devem ser comparados com enum do banco |

Não inferir que mãe ou pai é o responsável legal. O modelo precisa distinguir vínculo de filiação de responsabilidade legal e permitir situações excepcionais aprovadas pela instituição.

## 5. Responsável legal

| Campo | Tipo | Obrigatoriedade atual | Destino proposto | Validação / decisão pendente |
|---|---|---|---|---|
| Nome do responsável | Texto | Obrigatório na etapa atual | Registro próprio em `parents_guardians` | Confirmar tamanho e identificação |
| Vínculo com estudante | Seleção | Obrigatório na etapa atual | `relationship_type` ou campo específico, conforme SQL final | Opções atuais: mãe, pai, outro responsável legal; confirmar casos como tutor/guarda |
| CPF do responsável | Texto formatado | Opcional | `parents_guardians.cpf_digits` | Normalizar/validar se informado; política para responsável sem CPF pendente |

**Lacuna:** a UI atual não coleta RG, telefone, e-mail, endereço, profissão ou local de trabalho do responsável. Não adicionar como obrigatórios até conferir a ficha oficial.

## 6. Saúde e emergência — acesso restrito

| Campo | Tipo | Obrigatoriedade atual | Destino proposto | Sensibilidade / validação |
|---|---|---|---|---|
| Possui plano/seguro de saúde | Sim/Não | Estado inicial “Não” | `health_records.health_insurance` | Dado de saúde/assistência; acesso mínimo |
| Hospital credenciado | Texto | Condicional conforme interface | `health_records.accredited_hospital` | Confirmar significado e relação com plano |
| Hospital indicado pela família | Texto | Opcional | `health_records.family_hospital` | Acesso restrito |
| Alergia medicamentosa | Sim/Não | Estado inicial “Não” | `health_records.medication_allergy` | Sensível; detalhes não devem aparecer em dashboard geral |
| Detalhes de alergia | Texto | Condicional | `health_records.allergy_details` | Limite, autorização e acesso restrito |
| Medicação controlada | Sim/Não | Estado inicial “Não” | `health_records.controlled_medication` | Sensível; confirmar a redação da ficha |
| Detalhes da medicação | Texto | Condicional | `health_records.medication_details` | Não registrar em logs |
| Tipo sanguíneo | Seleção | Opcional | `health_records.blood_type` | Validar A/B/AB/O no servidor, se confirmado |
| Fator RH | Seleção | Opcional | `health_records.rh_factor` | Validar +/−, se confirmado |
| Contato de emergência (telefone) | Texto | Opcional | `health_records.emergency_phone` | Normalizar telefone |
| Nome da pessoa de emergência | Texto | Opcional | `health_records.emergency_name` | Confirmar tamanho |
| Vínculo da pessoa de emergência | Texto/seleção | Opcional | `health_records.emergency_relationship` | Vocabulário a confirmar |
| Observações de saúde | Sim/Não | Estado inicial “Não” | `health_records.health_notes` | Sensível; acesso restrito |
| Detalhes de saúde | Texto | Condicional | `health_records.health_notes_details` | Sensível; não enviar para listagens, analytics ou logs |

**Lacuna confirmada:** o rascunho SQL prevê alergia alimentar e detalhes, mas o estado atual do formulário não possui pergunta explícita de alergia alimentar. Conferir a ficha oficial antes de decidir se deve ser acrescentada.

## 7. Documentos

A interface lista os tipos abaixo. O estado de seleção e conferência é mantido em memória; a seleção de um arquivo no navegador **não** significa que ele foi enviado, guardado ou validado.

| Documento exibido | Obrigatório na UI atual | Condição / observação | Destino futuro |
|---|---|---|---|
| Certidão de nascimento | Sim | Regra institucional a confirmar | Registro em `documents` + arquivo no Storage privado |
| RG e CPF | Sim | Pode envolver dois arquivos distintos; definir regra | Tipos documentais separados ou regra composta aprovada |
| Ficha de matrícula da secretaria | Sim | Confirmar se é formulário gerado ou arquivo recebido | `documents` e/ou `generated_documents` conforme processo |
| Duas fotos 3×4 | Sim | Confirmar formato e se são dois arquivos | `documents` + Storage privado |
| Comprovante de residência com CEP | Sim | Regra e validade a confirmar | `documents` + Storage privado |
| Cartão de vacina atualizado | Sim | Documento com dado de saúde; acesso restrito | `documents` + Storage privado e política específica |
| Ficha 18 | Sim | Prazo/bloqueio pendentes de decisão | `documents` + Storage privado |
| Comprovante de renda familiar | Condicional | UI exige se cotista e cota “Renda” | Regra configurável; sensibilidade socioeconômica |
| Comprovante de vulnerabilidade socioeconômica | Condicional | UI exige se cotista e cota “Vulnerabilidade” | Regra configurável; sensibilidade socioeconômica |

O banco proposto tem campos de status, nome, MIME, tamanho, caminho privado e datas de entrega/conferência. Esses campos só podem ser escritos por fluxo autorizado no servidor. Não aceitar `storage_path`, status “conferido” ou identificador de conferente confiado ao navegador.

## 8. Confirmação e campos de controle

| Item | Situação atual | Regra segura proposta |
|---|---|---|
| Confirmação final (`confirmed`) | Estado booleano da interface | Não é autorização automática de persistência nem substitui base legal/aviso de privacidade |
| Estado da matrícula | Rótulos exibidos no painel | Definido no servidor conforme fluxo aprovado; cliente não escolhe status |
| Protocolo | Esperado como retorno da RPC | Gerado transacionalmente no servidor; nunca fornecido pelo cliente |
| Criador da matrícula | Derivado da sessão autenticada | Derivar da identidade validada no servidor, não do payload |
| Arquivos selecionados | Nomes guardados em estado local | Não considerar upload nem persistência até confirmação do Storage privado |
| Estado de documento | Mapa em memória na interface | O servidor determina estados de entrega/conferência após autorização |

## 9. Contrato futuro sugerido (conceitual, não aprovado)

O contrato pode ser versionado em grupos `identification`, `student`, `parents`, `legal_guardian`, `health` e `documents`, mas os nomes definitivos e a estrutura devem seguir a ficha oficial e o modelo de dados aprovado. Deve:

- rejeitar campos desconhecidos, tipos errados e payloads acima do limite medido por bytes realmente lidos;
- validar todos os campos no servidor, não apenas no navegador;
- distinguir campos omitidos, vazios, “não informado”, “falecido” e “não se aplica” quando a ficha exigir essa diferença;
- persistir a matrícula e os registros relacionados atomicamente, com rollback integral em caso de falha;
- manter dados médicos em tabela/fluxo com autorização específica;
- receber uploads por fluxo separado, privado e autenticado;
- não aceitar do cliente protocolo, status, criador, papel, IDs internos ou caminho de Storage;
- responder com protocolo/estado mínimo e não devolver dados sensíveis.

## 10. Pendências necessárias para aprovação

- [ ] Receber e conferir a versão oficial da “Ficha Ok 2026” e todos os anexos.
- [ ] Confirmar quais campos são obrigatórios por regra institucional.
- [ ] Confirmar os valores permitidos para sexo, estado civil, raça/cor, transporte, situações de filiação e vínculos de responsáveis.
- [ ] Aprovar política de CPF ausente, duplicado, corrigido e rematrícula.
- [ ] Aprovar elegibilidade e documentação de cotas.
- [ ] Aprovar documentos bloqueadores, prazo da Ficha 18 e exceções.
- [ ] Aprovar acesso a saúde, PCD, Bolsa Família e documentos sensíveis.
- [ ] Confirmar retenção, correção, cancelamento, auditoria e aviso de privacidade.
- [ ] Revisar nomes exatos das colunas e contrato da RPC com o SQL completo.
- [ ] Executar testes de contrato, segurança, RLS, transação e concorrência em ambiente de desenvolvimento.
- [ ] Autorizar explicitamente migration e ativação somente após a revisão.

## 11. Conclusão

Esta matriz representa o que o código atual coleta, não uma confirmação de conformidade com a ficha oficial. Ela pode orientar a revisão da secretaria e a próxima implementação, mas não deve ser usada sozinha para tornar obrigatórios campos, criar restrições definitivas ou habilitar matrículas reais. Backend e migrations devem permanecer bloqueados até aprovação formal.
