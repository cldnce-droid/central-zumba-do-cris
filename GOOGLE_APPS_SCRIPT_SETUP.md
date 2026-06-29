# Google Apps Script - configuração

## 1. Criar o Web App

1. Abra a planilha oficial no Google Sheets.
2. Acesse **Extensões > Apps Script**.
3. Apague o conteúdo inicial do editor e cole o código abaixo.
4. Troque `COLOQUE_UM_SEGREDO_FORTE_AQUI` por um segredo forte e exclusivo.
5. Clique em **Implantar > Nova implantação**.
6. Selecione **Aplicativo da Web**.
7. Em **Executar como**, escolha **Eu**.
8. Em **Quem pode acessar**, escolha **Qualquer pessoa**.
9. Autorize o acesso solicitado e copie a URL terminada em `/exec`.

```javascript
const SCRIPT_SECRET = "COLOQUE_UM_SEGREDO_FORTE_AQUI";

const ACTIONS = {
  getAlunos: () => readRows("Alunos"),
  createAluno: (data) => createAluno(data),
  updateAluno: (data) => updateRow("Alunos", data),
  getPlanos: () => readRows("Planos"),
  createPlano: (data) => createRow("Planos", data),
  updatePlano: (data) => updateRow("Planos", data),
  getTurmas: () => readRows("Turmas"),
  createTurma: (data) => createRow("Turmas", data),
  updateTurma: (data) => updateRow("Turmas", data),
  getAulas: () => readRows("Aulas"),
  createAula: (data) => createRow("Aulas", data),
  updateAula: (data) => updateRow("Aulas", data),
  getConfirmacoes: () => readRows("Confirmacoes"),
  createConfirmacao: (data) => upsertRow("Confirmacoes", data),
  updateConfirmacao: (data) => updateRow("Confirmacoes", data),
  getPresencas: () => readRows("Presencas"),
  upsertPresenca: (data) => upsertRow("Presencas", data),
  getPagamentos: () => readRows("Pagamentos"),
  upsertPagamento: (data) => upsertRow("Pagamentos", data),
  getMensalidades: () => readRows("Mensalidades"),
  upsertMensalidade: (data) => upsertRow("Mensalidades", data),
  getDesafios: () => readRows("Desafios"),
  createDesafio: (data) => createRow("Desafios", data),
  updateDesafio: (data) => updateRow("Desafios", data),
  getConquistas: () => readRows("Conquistas"),
  createConquista: (data) => createRow("Conquistas", data),
  updateConquista: (data) => updateRow("Conquistas", data)
};

function doGet() {
  return jsonResponse({
    ok: true,
    message: "Central Zumba do Cris - Apps Script ativo"
  });
}

function doPost(e) {
  try {
    const payload = JSON.parse((e.postData && e.postData.contents) || "{}");

    if (!payload.secret || payload.secret !== SCRIPT_SECRET) {
      return jsonResponse({ ok: false, error: "Não autorizado." });
    }

    const handler = ACTIONS[payload.action];
    if (!handler) {
      return jsonResponse({ ok: false, error: "Ação inválida." });
    }

    const data = handler(payload.data || {});
    return jsonResponse({ ok: true, data: data });
  } catch (error) {
    console.error("Falha no Apps Script:", error.message);
    return jsonResponse({ ok: false, error: "Não foi possível processar a solicitação." });
  }
}

function getSheet(name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) throw new Error("Aba não encontrada: " + name);
  return sheet;
}

function getHeaders(sheet) {
  const lastColumn = sheet.getLastColumn();
  if (!lastColumn) throw new Error("A aba não possui cabeçalhos.");
  return sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String);
}

function readRows(name) {
  const sheet = getSheet(name);
  const headers = getHeaders(sheet);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  return sheet.getRange(2, 1, lastRow - 1, headers.length).getValues()
    .filter((row) => row.some((value) => value !== ""))
    .map((row) => {
      const item = {};
      headers.forEach((header, index) => item[header] = serializeValue(row[index]));
      return item;
    });
}

function createRow(name, data) {
  const sheet = getSheet(name);
  const headers = getHeaders(sheet);
  sheet.appendRow(headers.map((header) => normalizeValue(data[header])));
  return data;
}

function createAluno(data) {
  const whatsapp = String(data.whatsapp || "").replace(/\D/g, "");
  if (!whatsapp) throw new Error("WhatsApp obrigatório.");

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const duplicate = readRows("Alunos").some(
      (row) => String(row.whatsapp || "").replace(/\D/g, "") === whatsapp
    );
    if (duplicate) throw new Error("Já existe um cadastro com este WhatsApp.");
    return createRow("Alunos", Object.assign({}, data, { whatsapp: whatsapp }));
  } finally {
    lock.releaseLock();
  }
}

function updateRow(name, data) {
  if (!data.id) throw new Error("ID obrigatório.");
  const sheet = getSheet(name);
  const headers = getHeaders(sheet);
  const idColumn = headers.indexOf("id");
  if (idColumn < 0) throw new Error("Coluna id não encontrada.");

  const rows = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), headers.length).getValues();
  const index = rows.findIndex((row) => String(row[idColumn]) === String(data.id));
  if (index < 0) throw new Error("Registro não encontrado.");

  const current = rows[index];
  const values = headers.map((header, column) =>
    Object.prototype.hasOwnProperty.call(data, header)
      ? normalizeValue(data[header])
      : current[column]
  );
  sheet.getRange(index + 2, 1, 1, headers.length).setValues([values]);
  return data;
}

function upsertRow(name, data) {
  if (!data.id) return createRow(name, data);
  const existing = readRows(name).some((row) => String(row.id) === String(data.id));
  return existing ? updateRow(name, data) : createRow(name, data);
}

function normalizeValue(value) {
  if (Array.isArray(value)) return value.join(", ");
  if (value === null || value === undefined) return "";
  return value;
}

function serializeValue(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  return value;
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## 2. Configurar a Vercel

Em **Settings > Environment Variables**, crie:

```text
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/SEU_DEPLOY/exec
GOOGLE_APPS_SCRIPT_SECRET=O_MESMO_SEGREDO_DO_SCRIPT
```

Configure as variáveis em **Production** e também em **Preview**, caso utilize
deploys de teste. O segredo fica somente no servidor e não é enviado ao
navegador.

As variáveis abaixo não são mais necessárias:

```text
GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_PRIVATE_KEY
GOOGLE_SHEETS_ID
```

Depois de salvar as variáveis, faça um novo deploy.

## 3. Testar

1. Abra `/cadastro` e envie um cadastro real.
2. Confirme se uma linha apareceu na aba `Alunos`.
3. Entre em `/professor-login` e ative o aluno.
4. Teste o acesso do aluno pelo WhatsApp em `/entrar`.
5. Confirme uma aula e verifique a aba `Confirmacoes`.

Se a URL ou o segredo não estiverem configurados, o aplicativo mantém o
fallback local e não deixa de funcionar.
## 4. Aba Mensalidades

Crie tambem uma aba chamada `Mensalidades` com estes cabecalhos, exatamente
nesta ordem:

```text
id
alunoId
nome
whatsapp
mesReferencia
plano
valor
vencimento
status
dataPagamento
dataComprovante
metodo
observacao
```

Status usados pelo app:

```text
em_aberto
comprovante_enviado
pago
atrasado
```

No dia 1 de cada mes, a Area do Aluno ja mostra a mensalidade do mes. Quando
a aluna copia a chave PIX e toca em `Comprovante enviado`, o registro aparece
na aba `Financeiro` do Dashboard do Professor para aprovacao.
