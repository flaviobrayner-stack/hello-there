# Fase 19 — mapa de conclusão contra a especificação original

**Projeto:** Sistema de Matrícula 2026 — ETE Maria José Vasconcelos  
**Branch:** feature/sistema-matricula-2026  
**Status:** mapa de escopo e dependências; não é aceite funcional.

## Fonte de requisitos

A especificação arquivada no projeto aponta como referências:
- Formulário atual: https://docs.google.com/forms/d/e/1FAIpQLSdBSXHcUTp3mFYsDxW_NJOxaRZQwE5R1P0BeHOoz9P9oYCnHw/viewform?usp=header
- Modelo oficial “Ficha Ok 2026”: https://docs.google.com/document/d/1Qb2-R98xRzPZJFifwKsRT4EgNwcPQDmFBMY3ywakjVk/edit?tab=t.0

A leitura direta do Google Docs não foi possível nesta sessão, e o conector Google Drive aparece indisponível por configuração administrativa. Portanto, a descrição abaixo deriva da especificação arquivada, não de uma conferência visual do documento oficial.

## Entregáveis funcionais exigidos

1. Ficha de matrícula.
2. Observações.
3. Documentação para matrícula.
4. Comprovante de matrícula.
5. Ficha de saúde.
6. Instrumento de concessão de imagem e som da voz.
7. Resumo de contato.
8. Termo de compromisso educacional.
9. PDF quando solicitado e preservação das versões anteriores.

## Matriz de estado atual e trabalho restante

| Área | Estado observado no código/documentos | Próxima entrega necessária |
|---|---|---|
| Formulário em etapas | UI de sete etapas com estado local | Persistência real e retomada segura após autenticação, somente após contrato aprovado |
| Identificação e estudante | API aceita apenas subset de campos | Contrato versionado com todos os campos aprovados e validação servidor |
| Filiação e responsável | UI coleta dados, contrato atual não persiste | Separar mãe, pai e responsável legal; não presumir vínculo |
| Saúde e emergência | Campos na UI, ausentes no POST atual | Persistência segregada e autorização específica; excluir de listagens gerais |
| Documentos anexados | UI guarda nomes/estado local, sem upload real | Upload privado, verificação real de conteúdo, políticas de acesso e prazo |
| Cursos e cotas | Cursos estáticos na UI | Catálogo persistido, curso ativo/ano e regras de cota configuráveis |
| Revisão e conclusão | Verificação local; não representa gravação | Revisão de campos, pendências e resultado real da transação |
| Protocolo e duplicidade | Proposta SQL, não instalada | Regra institucional, idempotência e concorrência testadas |
| Geração de documentos | Não integrada ao Google Workspace | Acesso autorizado ao modelo, cópia, substituição de marcadores, PDF e histórico |
| Dashboard | Não conectado a dados reais | Consultas com escopo mínimo, métricas, filtros e mascaramento |
| Exportação | Não comprovada como funcional e segura | CSV/XLSX com autorização, minimização e auditoria |
| Usuários e perfis | Helpers de autenticação existem; schema não instalado | Provisionamento seguro, bloqueio, redefinição e teste de papéis |
| Auditoria | Estrutura proposta em SQL | Registrar eventos sem CPF completo, saúde, tokens ou conteúdo de documentos |
| RLS/Storage | Apenas proposta de SQL; Storage não configurado | Revisão independente e testes negativos em ambiente de desenvolvimento |
| Qualidade | Workflow previsto; CI sem execução confirmada | Testes, lint, TypeScript e build verdes com resultado registrado |

## Regras de negócio que precisam continuar configuráveis

- Formato do número de matrícula.
- Cursos disponíveis por ano.
- Tipos de cota e documentos condicionais.
- Documentos que bloqueiam conclusão.
- Prazo de entrega da ficha 18.
- Obrigatoriedade do termo de imagem.
- Pacote único versus arquivos separados.
- Quem pode ver documentos gerados.
- Campo “3.7.3” do formulário, cujo título não está identificado na especificação arquivada.

## Critérios de aceite do sistema completo

- [ ] Cadastro completo com persistência de todas as seções aprovadas.
- [ ] Salvamento de rascunho e retomada sem perda de dados.
- [ ] Busca de estudante e prevenção de duplicidade sem sobrescrita silenciosa.
- [ ] Cálculo de idade derivado da data de nascimento.
- [ ] Campos condicionais de PCD, transporte e cota.
- [ ] Documentos pendentes/entregues/conferidos/recusados/não se aplica.
- [ ] Upload e download privados testados contra acesso cruzado.
- [ ] Revisão com inconsistências e campos obrigatórios faltantes.
- [ ] Geração dos oito artefatos a partir de cópia do modelo oficial, preservando o original.
- [ ] PDF e histórico de versões testados.
- [ ] Dashboard admin e permissões de operador testados no backend.
- [ ] Exportação protegida e logs de auditoria sem dados sensíveis.
- [ ] Testes negativos e positivos executados; CI e build aprovados.
- [ ] Diff do schema, políticas e integrações apresentado para revisão antes de qualquer migration definitiva.

## Bloqueios externos

O acesso ao Google Drive/Docs não está disponível por configuração administrativa nesta sessão. Para concluir a integração com o modelo oficial, é necessário habilitar o conector ou disponibilizar uma cópia exportada do documento. Não alterar o modelo original nem inventar o conteúdo de campos não visíveis.

## Estado de segurança

Nenhuma migration foi aplicada. O backend deve continuar desabilitado. A UI não pode afirmar que salvou ou concluiu uma matrícula enquanto o contrato completo não estiver persistido e verificado.
