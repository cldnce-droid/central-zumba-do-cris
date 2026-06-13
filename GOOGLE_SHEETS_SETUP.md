# Google Sheets - configuração da Fase 8

## 1. Criar a planilha

Crie uma planilha e adicione estas abas, mantendo exatamente estes nomes e
cabeçalhos na primeira linha:

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

## 2. Criar a conta de serviço

1. No Google Cloud, crie ou selecione um projeto.
2. Ative a API Google Sheets.
3. Crie uma conta de serviço e gere uma chave JSON.
4. Compartilhe a planilha com o e-mail da conta de serviço como Editor.

Nunca envie o arquivo JSON ao GitHub e nunca use a chave privada em código do
navegador.

## 3. Configurar na Vercel

Em `Settings > Environment Variables`, cadastre:

```text
GOOGLE_SHEETS_ID
GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_PRIVATE_KEY
```

`GOOGLE_SHEETS_ID` é o trecho entre `/d/` e `/edit` na URL da planilha.
Cole a chave privada completa em `GOOGLE_PRIVATE_KEY`. O código aceita quebras
de linha reais ou `\n`.

Depois, faça um novo deploy.

## 4. Testar

1. Cadastro: envie `/cadastro` e confirme uma nova linha em `Alunos`.
2. Login: use em `/entrar` o WhatsApp salvo na planilha.
3. Confirmação: entre como aluno ativo e confirme a próxima aula; confira
   `Confirmacoes`.
4. Professor: abra `/professor`, altere status, pagamento ou presença e confira
   as abas correspondentes.

Sem as variáveis configuradas, o app continua usando mocks e `localStorage`.
