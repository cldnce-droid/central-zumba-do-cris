# Google Sheets - configuração

## Abas da planilha

Crie estas abas com os cabeçalhos exatamente como descritos:

- `Alunos`: id, nome, whatsapp, email, plano, status, dataEntrada,
  diaVencimento, turmasEscolhidas, formaPagamento, observacoes
- `Planos`: id, nome, valor, aulasPorSemana, descricao, destaque
- `Turmas`: id, nome, local, dias, horario, endereco, capacidade, ativa
- `Aulas`: id, turmaId, data, diaSemana, horario, local, endereco, status
- `Confirmacoes`: id, alunoId, aulaId, dataConfirmacao, status
- `Presencas`: id, alunoId, aulaId, data, compareceu, validadoPor, observacao
- `Pagamentos`: id, alunoId, plano, valor, vencimento, dataPagamento, status,
  metodo
- `Desafios`: id, titulo, descricao, tipo, meta, ativo, statusVisual

Em campos de lista, use vírgulas. Exemplo: `Ganchos de Fora, Palmas`.

## Conta de serviço

1. No Google Cloud, crie ou selecione um projeto.
2. Ative a API Google Sheets.
3. Crie uma conta de serviço e gere uma chave JSON.
4. Compartilhe a planilha com o e-mail da conta de serviço como Editor.

Nunca envie o JSON ao GitHub e nunca use a chave privada no navegador.

## Variáveis da Vercel

Em `Settings > Environment Variables`, cadastre:

```text
GOOGLE_SHEETS_ID
GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_PRIVATE_KEY
ADMIN_PASSWORD
```

`GOOGLE_SHEETS_ID` é o trecho entre `/d/` e `/edit` na URL da planilha.
Cole a chave privada completa em `GOOGLE_PRIVATE_KEY`. O código aceita quebras
de linha reais ou `\n`.

Use uma senha forte e exclusiva em `ADMIN_PASSWORD`. O acesso administrativo
é feito em `/professor-login`. O servidor cria um cookie `httpOnly` válido por
8 horas; a senha não fica no bundle público.

Depois de configurar as variáveis, faça um novo deploy.

## Testes

1. Cadastro: envie `/cadastro` e confira uma nova linha em `Alunos`.
2. Aluno: use em `/entrar` o WhatsApp salvo na planilha.
3. Confirmação: entre como aluno ativo, confirme uma aula e confira
   `Confirmacoes`.
4. Professor: entre por `/professor-login`, altere status, pagamento ou
   presença e confira as abas correspondentes.
5. Saída: clique em `Sair` e confirme o redirecionamento para o login.

Sem uma sessão válida, `/professor` redireciona para o login e as rotas
administrativas respondem com erro `401`. Cadastro, login do aluno, leituras e
confirmações continuam públicos. Sem Google Sheets configurado, o app continua
usando mocks e `localStorage`.
