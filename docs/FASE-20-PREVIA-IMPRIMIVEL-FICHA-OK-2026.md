# Fase 20 — prévia imprimível baseada na Ficha Ok 2026

**Branch:** `feature/sistema-matricula-2026`  
**Status:** implementação de prévia visual na interface; homologação visual e funcional pendente.

## Arquivos alterados/criados

- `public/secretaria-educacao.svg`: logomarca extraída da imagem do PDF anexado e incorporada como PNG transparente dentro de SVG.
- `src/components/enrollment-document-preview.tsx`: pacote de impressão com CSS específico para papel, cabeçalhos, campos, linhas e quebras de página.
- `src/routes/index.tsx`: central de documentação conectada à prévia; usa os valores digitados no formulário da sessão atual.

## Conteúdo e organização visual

A prévia contempla as oito partes indicadas na especificação:
1. Ficha de matrícula.
2. Observações e informações complementares.
3. Documentação para matrícula.
4. Comprovante de matrícula estudantil.
5. Ficha de saúde.
6. Instrumento de concessão de imagem e som da voz.
7. Resumo de contato.
8. Termo de compromisso educacional.

O layout tenta seguir a sequência do PDF de sete páginas, incluindo a folha horizontal para documentação/comprovante e a continuação do termo de compromisso. O botão **Imprimir / Salvar PDF** chama a impressão do navegador.

## Privacidade e comportamento

- A prévia recebe apenas o estado local do formulário atual.
- Não grava dados, não chama o endpoint de matrícula e não envia arquivos.
- Os campos que não estão disponíveis no formulário permanecem em branco.
- O PDF original anexado não é alterado.
- A data impressa é gerada no momento da impressão; o prazo de 29/01/2026 da Ficha 18 aparece como texto de referência do modelo e precisa ser confirmado pela escola.

## Diferenças e limitações que não devem ser ocultadas

- A prévia é uma reconstrução HTML/CSS, não uma cópia digital certificada do PDF original. Espaçamentos, quebras e tipografia precisam de comparação visual página a página.
- O texto do instrumento de imagem e algumas cláusulas do termo de compromisso foram reconstituídos a partir do texto extraído; devem ser conferidos com o PDF oficial antes de uso jurídico ou institucional.
- O formulário atual ainda não coleta todos os campos impressos, como RG/CPF completos de mãe e pai, profissão, local de trabalho, detalhes de filiação e todos os dados do responsável. Esses campos ficam vazios até que a UI seja ampliada.
- A logomarca foi extraída do PDF fornecido; a homologação deve confirmar escala, nitidez e alinhamento na impressão.
- Não foi possível executar build, lint ou testes neste ambiente. O clone local do repositório falhou por indisponibilidade de resolução de `github.com`; a consulta ao status/execuções não retornou evidência de CI para os commits recentes.

## Próxima revisão necessária

1. Comparar a impressão com cada página do PDF original e ajustar margens, alinhamento, tamanho de fontes e quebras.
2. Conferir literalmente o instrumento de imagem e o termo de compromisso com a direção/assessoria responsável.
3. Ampliar o formulário para coletar todos os campos que constam no modelo.
4. Rodar o CI do GitHub e corrigir falhas de build ou lint.
5. Só depois da homologação visual e jurídica, considerar a prévia como modelo institucional aprovado.

**Nenhuma migration foi aplicada e a prévia não conclui nem persiste matrículas reais.**
