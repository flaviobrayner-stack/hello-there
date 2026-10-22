# Fase 14 — auditoria da integração entre formulário e API

**Projeto:** Sistema de Matrícula 2026 — ETE Maria José Vasconcelos  
**Branch:** `feature/sistema-matricula-2026`  
**Status:** auditoria estática concluída; integração de gravação deliberadamente não ativada.

## 1. Constatações verificadas no código

### Formulário da interface

Em `src/routes/index.tsx`, o cadastro é um fluxo de sete etapas mantido em estado React local. O próprio formulário informa que os campos são demonstrativos e não salvam dados.

- O botão **Salvar rascunho** somente mostra um aviso; não faz requisição.
- O botão final **Validar revisão** somente verifica a caixa de confirmação e exibe uma mensagem; não envia a matrícula.
- Os arquivos selecionados são representados pelos nomes em estado local. O navegador não envia os bytes para o servidor.
- A lista de documentos e os seus estados também são mantidos localmente.
- A interface coleta filiação, responsável legal, saúde e emergência, mas esses dados não compõem o contrato de gravação atual.

### Endpoint de matrículas

Em `src/routes/api.enrollments.ts`, o POST aceita apenas `courseId`, `academicYear`, `quotaType` e um objeto `student` parcial. O endpoint chama `rpc/create_enrollment_transaction` com esse subconjunto.

O endpoint não recebe os dados de filiação, responsável legal, saúde, emergência ou conteúdo dos documentos do formulário atual. Além disso, a interface de curso usa opções locais e o endpoint espera um UUID de curso, portanto a conversão e a validação de catálogo ainda precisam ser conectadas.

### Banco e segurança

O SQL em `docs/drafts/schema-review.sql` continua sendo um rascunho. Não é evidência de que tabelas, RPC, grants ou políticas RLS existam no projeto Supabase. O backend permanece condicionado a duas variáveis de ambiente e não deve ser habilitado antes da revisão.

## 2. Decisão segura desta fase

**Não conectar o botão final ao POST atual.** Fazer isso daria a impressão de concluir uma matrícula completa, embora somente parte dos dados fosse enviada e persistida.

Também não criar uma migration nem ativar o backend com base apenas na matriz técnica existente. A ficha oficial “Ficha Ok 2026” ainda não foi identificada no repositório.

## 3. Bloqueios para a integração completa

1. Obter e aprovar a ficha oficial de matrícula e a lista de documentos exigidos.
2. Confirmar catálogo de cursos ativos e IDs usados pelo banco.
3. Aprovar o contrato completo e versionado do payload, incluindo filiação e responsável legal.
4. Definir o fluxo de dados sensíveis de saúde, com autorização restrita, retenção e auditoria.
5. Definir upload seguro de documentos (tipos e tamanho máximos, bucket privado, caminhos não previsíveis, políticas Storage e validação server-side).
6. Revisar o SQL, a RPC, a propriedade e o `search_path` das funções, grants, RLS e acesso direto via Data API.
7. Testar concorrência, duplicidade, rollback, perfil inativo, chamada direta da RPC e acesso indevido.
8. Executar testes, lint, TypeScript e build no CI; registrar os resultados reais.
9. Só então solicitar aprovação explícita para aplicar migration e habilitar o backend em ambiente controlado.

## 4. Escopo não alterado

- Nenhuma migration foi aplicada.
- Nenhuma matrícula real foi criada ou enviada.
- Nenhum usuário ou privilégio foi alterado.
- Nenhuma chave privilegiada foi adicionada ao cliente.
- A gravação real continua desabilitada até revisão e homologação.

## 5. Próximo passo recomendado

A próxima fase deve obter a ficha oficial e comparar campo a campo com a interface e o SQL. Se a ficha não estiver disponível, a alternativa segura é obter a aprovação institucional explícita da matriz de campos existente antes de escrever um contrato de API completo.
