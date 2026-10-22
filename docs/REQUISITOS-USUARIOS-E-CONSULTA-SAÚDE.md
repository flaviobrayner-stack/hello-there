# Solicitação de usuários e consulta de saúde — revisão

Esta especificação registra os pedidos de administração e não cria contas nem altera o banco.

## Perfis solicitados

| Nome de exibição | Perfil desejado | Situação |
| --- | --- | --- |
| Arthur — jose.apsilva7@adm.educacao.pe.gov.br | operador | E-mail informado; conta ainda não criada |
| Taty — tatyany.oaraujo@adm.educacao.pe.gov.br | operador | E-mail informado; conta ainda não criada |
| Fabio Ariamateia — fabiojarimateia@adm.educacao.pe.gov.br | admin | E-mail informado; conta ainda não criada |

A conta deve ser criada pelo fluxo seguro do Supabase Auth e vinculada a um registro em `profiles` com o mesmo UUID do usuário autenticado. Não usar senhas compartilhadas, não inserir contas fictícias e não conceder privilégios apenas com base no nome de exibição. Os e-mails institucionais foram fornecidos. A criação efetiva ainda exige provisionamento seguro pelo Supabase Auth, configuração administrativa autorizada e vínculo do perfil com o UUID autenticado. Não há senha compartilhada nem credenciais de administrador no repositório.

## Revisão ortográfica

- O documento HTML raiz define `lang="pt-BR"`.
- A verificação ortográfica do navegador foi ativada globalmente no corpo da aplicação.
- Campos de texto devem manter verificação ortográfica habilitada; isso depende do dicionário e das configurações do navegador. Não equivale a uma revisão gramatical automática por inteligência artificial.

## Consulta de saúde

- Busca de estudantes por nome, com limite de resultados.
- Exibe alergias medicamentosas e alimentares, medicação controlada, observações de saúde e contato de emergência.
- Resposta sem cache e sem incluir dados médicos na listagem geral de matrículas.
- A rota exige sessão autenticada e papel `admin`; as políticas RLS de saúde precisam continuar restritas e ser testadas no Supabase antes de habilitar o backend.
- O SQL em `docs/drafts/schema-review.sql` é apenas uma proposta de revisão. As colunas de alergia alimentar ainda precisam ser incluídas em uma migration revisada e aprovada antes de ativar essa consulta.
- Nenhuma migration foi aplicada e nenhuma conta real foi criada nesta alteração.
