# Fase 2 — decisões institucionais pendentes

**Projeto:** Sistema de Matrícula 2026 — Escola Técnica Estadual Maria José Vasconcelos  
**Status:** recomendações para decisão; nenhuma opção abaixo está aprovada ou aplicada.  
**Regra de segurança:** este documento não autoriza migrações, provisionamento de serviços, importação de dados reais ou publicação em produção.

Este registro transforma as dúvidas técnicas em decisões objetivas. As recomendações são pontos de partida para revisão pela direção/secretaria e pelo responsável por proteção de dados.

## 1. CPF e rematrícula

**Pergunta:** como identificar a mesma pessoa sem impedir uma matrícula em outro ano letivo?

**Recomendação para aprovação:** manter CPF normalizado por estudante e único quando informado; guardar as matrículas separadamente por ano letivo. Antes de aceitar cadastros sem CPF ou corrigir CPF, definir um procedimento de conferência manual e auditoria. A restrição atual do SQL é apenas uma proposta e não deve ser aplicada até esta decisão.

- [ ] Aprovar a recomendação
- [ ] Alterar a regra (descrever abaixo)

**Decisão / observações:** _pendente_

## 2. Escopo de acesso dos operadores

**Pergunta:** todos os operadores podem consultar e editar todas as matrículas?

**Recomendação para aprovação:** negar acesso por padrão; conceder somente funções necessárias. Até existir uma definição institucional de escopo, operadores não devem acessar dados médicos detalhados, alterar papéis/contas, exportar em massa, cancelar matrículas ou consultar logs de auditoria. Toda consulta ou alteração sensível deve ser autorizada no servidor e testada com uma conta de operador.

- [ ] Aprovar a recomendação
- [ ] Operadores limitados por equipe/unidade/curso (especificar)
- [ ] Outro escopo (descrever abaixo)

**Decisão / observações:** _pendente_

## 3. Documentos bloqueadores e prazo da Ficha 18

**Pergunta:** quais documentos impedem concluir a matrícula e qual é a regra da Ficha 18?

**Recomendação para aprovação:** configurar cada tipo de documento com `obrigatório`, `bloqueia conclusão` e `prazo`; não codificar exceções fixas na interface. Se a Ficha 18 puder ser entregue depois, registrar o prazo e manter a matrícula com pendência visível até a conferência, conforme regra institucional. A lista definitiva precisa ser comparada com o modelo oficial antes de ativar validações.

- [ ] Aprovar a abordagem configurável
- [ ] Ficha 18 é bloqueadora
- [ ] Ficha 18 pode ser entregue posteriormente até: _preencher_
- [ ] Outros documentos / exceções: _preencher_

**Decisão / observações:** _pendente_

## 4. Formato do protocolo de matrícula

**Pergunta:** qual formato o protocolo deve seguir?

**Recomendação para aprovação:** gerar no servidor, de forma transacional e sem colisões; não confiar em contador no navegador. Formato candidato para avaliação: `MAT-2026-000001`, com sequência por ano letivo. O formato final deve considerar se o protocolo pode ser divulgado em documentos externos e não deve conter CPF, data de nascimento ou outro dado pessoal.

- [ ] Aprovar o formato candidato
- [ ] Usar outro formato: _preencher_

**Decisão / observações:** _pendente_

## 5. Google Drive e permissões

**Pergunta:** onde os documentos finais serão guardados e quem pode acessá-los?

**Recomendação para aprovação:** utilizar uma pasta institucional controlada pela escola, com acesso mínimo, sem links públicos. A aplicação deverá criar cópias do modelo oficial e gravar documentos apenas após autorização explícita e teste em ambiente de desenvolvimento. Credenciais devem ficar no servidor; o navegador não recebe tokens de serviço. Definir proprietário institucional, gestores, operadores autorizados, retenção e procedimento de revogação.

- Pasta institucional / ID: _pendente_
- Proprietário responsável: _pendente_
- Quem pode visualizar: _pendente_
- Quem pode gerar/editar: _pendente_
- Política de retenção e descarte: _pendente_
- [ ] Aprovar a abordagem de acesso mínimo e cópia do modelo

## 6. Critérios mínimos antes de conectar dados reais

- [ ] Revisão do modelo de dados e dos campos frente à ficha oficial.
- [ ] Matriz de permissões aprovada pela instituição.
- [ ] Regras documentais e prazos aprovados.
- [ ] Política de retenção, correção, cancelamento e resposta a incidentes definida.
- [ ] RLS e grants/revokes revisados; testes negativos para acesso indevido aprovados.
- [ ] Dados de saúde isolados e com acesso restrito/auditado.
- [ ] Upload privado validado por tamanho, tipo real do arquivo, autorização e expiração de links.
- [ ] Auditoria escrita no servidor, sem CPF completo, conteúdo médico ou segredos em logs.
- [ ] Geração de protocolo concorrente testada.
- [ ] Integração com Drive testada em pasta de teste com documentos fictícios.
- [ ] Backup, restauração e procedimento de rollback ensaiados.
- [ ] Aprovação explícita antes de qualquer migração ou implantação em produção.

## 7. Registro da aprovação

- Responsável(is) pela decisão: _pendente_
- Data: _pendente_
- Decisões aprovadas / exceções: _pendente_

Até o preenchimento e a aprovação deste registro, todas as opções permanecem propostas. A interface de matrícula deve continuar sendo tratada como demonstração e não deve receber dados reais.
