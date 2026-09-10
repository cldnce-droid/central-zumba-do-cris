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

## Quando aparecer erro 404

O erro 404 significa que a implantacao salva na Vercel nao existe mais ou nao
esta publicada como Aplicativo da Web. Para corrigir:

1. Salve o codigo deste documento no Apps Script.
2. Clique em **Implantar > Nova implantacao**.
3. Em **Tipo**, escolha **Aplicativo da Web**.
4. Em **Executar como**, escolha **Eu**.
5. Em **Quem pode acessar**, escolha **Qualquer pessoa**.
6. Clique em **Implantar** e copie a nova URL completa terminada em `/exec`.
7. Na Vercel, substitua o valor de `GOOGLE_APPS_SCRIPT_URL` pela nova URL.
8. Confirme que `GOOGLE_APPS_SCRIPT_SECRET` tem o mesmo valor de
   `SCRIPT_SECRET` e faca um novo redeploy.

O app tambem aceita somente o codigo da implantacao iniciado por `AKfy`, mas a
URL completa e a opcao recomendada.

```javascript
const SCRIPT_SECRET = "COLOQUE_UM_SEGREDO_FORTE_AQUI";

const ACTIONS = {
  getAlunos: () => readRows("Alunos"),
  createAluno: (data) => createAluno(data),
  updateAluno: (data) => updateRow("Alunos", data),
  deleteAluno: (data) => deleteAluno(data),
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
  createConquista: (data) => createConquistaUnica(data),
  consultarSeloPatriota: (data) => patriota(data, false),
  solicitarSeloPatriota: (data) => patriota(data, true),
  listarSolicitacoesSelos: () => { ensureSelosSheet(); return readRows("SolicitacoesSelos"); },
  concederSelo: (data) => concederSelo(data),
  decidirSelo: (data) => decidirSelo(data),
  updateConquista: (data) => updateRow("Conquistas", data),
  deleteRow: (data) => deleteRow(data.sheetName, data.id)
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

    // Reads do not wait behind writes. Mutations are serialized to avoid duplicates.
    const lock = /^get/.test(payload.action) ? null : LockService.getScriptLock();
    if (lock && !lock.tryLock(4000)) throw new Error("A base está ocupada. Aguarde alguns segundos e tente novamente.");
    try {
      const data = handler(payload.data || {});
      return jsonResponse({ ok: true, data: data });
    } finally { if (lock) { try { SpreadsheetApp.flush(); } finally { lock.releaseLock(); } } }
  } catch (error) {
    console.error("Falha no Apps Script:", error.message);
    return jsonResponse({ ok: false, error: String(error.message || "Não foi possível processar a solicitação.") });
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

  {
    const duplicate = readRows("Alunos").some(
      (row) => String(row.whatsapp || "").replace(/\D/g, "") === whatsapp
    );
    if (duplicate) throw new Error("Já existe um cadastro com este WhatsApp.");
    return createRow("Alunos", Object.assign({}, data, { whatsapp: whatsapp }));
  }
}

function findRowNumber(sheet, headers, id) {
  const column = headers.indexOf("id");
  if (column < 0) throw new Error("Coluna id não encontrada.");
  const count = sheet.getLastRow() - 1;
  if (count < 1) return -1;
  const ids = sheet.getRange(2, column + 1, count, 1).getValues();
  const index = ids.findIndex(row => String(row[0]) === String(id));
  return index < 0 ? -1 : index + 2;
}

function updateRow(name, data) {
  if (!data.id) throw new Error("ID obrigatório.");
  const sheet = getSheet(name);
  const headers = getHeaders(sheet);
  if (name === "Alunos" && Object.prototype.hasOwnProperty.call(data, "statusPagamento") && headers.indexOf("statusPagamento") < 0) {
    throw new Error("Adicione a coluna statusPagamento na aba Alunos, com esta escrita exata.");
  }
  const row = findRowNumber(sheet, headers, data.id);
  if (row < 0) throw new Error("Registro não encontrado.");
  const columns = headers.map((header, index) => ({ header, index })).filter(({ header }) => header !== "id" && Object.prototype.hasOwnProperty.call(data, header));
  // A payment toggle reads just IDs and writes just one cell.
  if (columns.length === 1) {
    sheet.getRange(row, columns[0].index + 1).setValue(normalizeValue(data[columns[0].header]));
  } else if (columns.length) {
    const values = sheet.getRange(row, 1, 1, headers.length).getValues()[0];
    columns.forEach(({ header, index }) => values[index] = normalizeValue(data[header]));
    sheet.getRange(row, 1, 1, headers.length).setValues([values]);
  }
  return data;
}

function deleteRow(name, id) {
  if (!id) throw new Error("ID obrigatório.");
  const sheet = getSheet(name);
  const headers = getHeaders(sheet);
  const idColumn = headers.indexOf("id");
  if (idColumn < 0) throw new Error("Coluna id não encontrada.");

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { deleted: false };

  const rows = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  const index = rows.findIndex((row) => String(row[idColumn]) === String(id));
  if (index < 0) return { deleted: false };

  sheet.deleteRow(index + 2);
  return { deleted: true };
}

function deleteRowsByField(name, field, value) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) return 0;
  const headers = getHeaders(sheet);
  const fieldColumn = headers.indexOf(field);
  if (fieldColumn < 0) return 0;

  let deleted = 0;
  for (let row = sheet.getLastRow(); row >= 2; row--) {
    const currentValue = sheet.getRange(row, fieldColumn + 1).getValue();
    if (String(currentValue) === String(value)) {
      sheet.deleteRow(row);
      deleted++;
    }
  }
  return deleted;
}

function deleteAluno(data) {
  const alunoId = data && data.id;
  if (!alunoId) throw new Error("ID do aluno obrigatório.");

  const deletedAluno = deleteRow("Alunos", alunoId);
  const relatedDeleted =
    deleteRowsByField("Confirmacoes", "alunoId", alunoId) +
    deleteRowsByField("Presencas", "alunoId", alunoId) +
    deleteRowsByField("Pagamentos", "alunoId", alunoId) +
    deleteRowsByField("Mensalidades", "alunoId", alunoId);

  return {
    deleted: Boolean(deletedAluno.deleted),
    relatedDeleted
  };
}

function upsertRow(name, data) {
  if (!data.id) return createRow(name, data);
  const existing = readRows(name).some((row) => String(row.id) === String(data.id));
  return existing ? updateRow(name, data) : createRow(name, data);
}

const SELOS = {
  sofa: { titulo: "Venci o Sofá", sufixo: "AGOSTO_SEM_SOFA_2026_08" },
  patriota: { titulo: "Patriota", sufixo: "PATRIOTA_2026_09_07" }
};
function ensureSelosSheet() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  if (!book.getSheetByName("SolicitacoesSelos")) {
    const sheet = book.insertSheet("SolicitacoesSelos");
    sheet.appendRow(["id", "alunoId", "nomeAluno", "whatsapp", "selo", "status", "dataSolicitacao", "dataDecisao"]);
  }
}
function findAluno(id) {
  const aluno = readRows("Alunos").find(row => String(row.id) === String(id));
  if (!aluno) throw new Error("Aluna não encontrada.");
  return aluno;
}
function findConquista(alunoId, title) {
  return readRows("Conquistas").find(row => String(row.alunoId) === String(alunoId) && String(row.titulo).toLowerCase() === title.toLowerCase());
}
function createConquistaUnica(data) {
  if (!data.id || !data.alunoId || !data.titulo) throw new Error("Dados do selo incompletos.");
  const headers = getHeaders(getSheet("Conquistas"));
  ["id", "alunoId", "nomeAluno", "tipo", "titulo", "dataConquista", "observacao"].forEach(header => {
    if (headers.indexOf(header) < 0) throw new Error("Adicione a coluna " + header + " na aba Conquistas.");
  });
  const existing = findConquista(data.alunoId, String(data.titulo));
  return existing || createRow("Conquistas", data);
}
function concederSelo(data) {
  const selo = SELOS[data.selo];
  if (!selo) throw new Error("Selo inválido.");
  const aluno = findAluno(data.alunoId);
  const conquista = createConquistaUnica({
    id: "CONQ_" + aluno.id + "_" + selo.sufixo, alunoId: aluno.id, nomeAluno: aluno.nome,
    tipo: "desafio", titulo: selo.titulo, coreografia: "", dataConquista: new Date().toISOString().slice(0, 10),
    observacao: "Concedido pelo professor. " + String(data.motivo || "")
  });
  // Keep a pending/rejected request consistent when the professor grants manually.
  if (data.selo === "patriota") {
    ensureSelosSheet();
    const id = "SOL_" + aluno.id + "_PATRIOTA_2026_09_07";
    if (readRows("SolicitacoesSelos").some(row => String(row.id) === id)) {
      updateRow("SolicitacoesSelos", { id: id, status: "aprovada", dataDecisao: new Date().toISOString() });
    }
  }
  return { status: "aprovada", conquista: conquista };
}
function patriota(data, solicitar) {
  const aluno = findAluno(data.alunoId);
  const digits = value => String(value || "").replace(/\D/g, "");
  if (!digits(data.whatsapp) || digits(aluno.whatsapp) !== digits(data.whatsapp) || String(aluno.statusCadastro || aluno.status) !== "ativo") {
    throw new Error("Entre com o WhatsApp do seu cadastro ativo para solicitar o selo.");
  }
  const conquista = findConquista(aluno.id, SELOS.patriota.titulo);
  if (conquista) return { status: "aprovada", conquista: conquista };
  ensureSelosSheet();
  const id = "SOL_" + aluno.id + "_PATRIOTA_2026_09_07";
  const existing = readRows("SolicitacoesSelos").find(row => String(row.id) === id);
  if (existing) return { status: existing.status, solicitacao: existing };
  if (!solicitar) return { status: "disponivel" };
  const row = { id: id, alunoId: aluno.id, nomeAluno: aluno.nome, whatsapp: aluno.whatsapp,
    selo: "patriota", status: "solicitada", dataSolicitacao: new Date().toISOString(), dataDecisao: "" };
  createRow("SolicitacoesSelos", row);
  return { status: "solicitada", solicitacao: row };
}
function decidirSelo(data) {
  ensureSelosSheet();
  const row = readRows("SolicitacoesSelos").find(row => String(row.id) === String(data.id));
  if (!row) throw new Error("Solicitação não encontrada.");
  const existing = findConquista(row.alunoId, SELOS.patriota.titulo);
  // A repeated approval is safe; a stale rejection cannot revoke a granted badge.
  if (existing) {
    updateRow("SolicitacoesSelos", { id: row.id, status: "aprovada", dataDecisao: row.dataDecisao || new Date().toISOString() });
    return { status: "aprovada", conquista: existing };
  }
  if (row.status !== "solicitada") return { status: row.status };
  if (data.aprovar === true) return concederSelo({ alunoId: row.alunoId, selo: "patriota", motivo: "Participação no aulão especial de 7 de setembro de 2026 aprovada." });
  updateRow("SolicitacoesSelos", { id: row.id, status: "recusada", dataDecisao: new Date().toISOString() });
  return { status: "recusada" };
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

## Atualização de setembro: selos e desempenho

Publique o código acima como uma nova versão da implantação existente e faça o deploy dos arquivos do app. Mantenha seu SCRIPT_SECRET atual. A aba SolicitacoesSelos é criada automaticamente, sem apagar dados existentes. A aba Conquistas deve existir com os cabeçalhos id, alunoId, nomeAluno, tipo, titulo, coreografia, dataConquista, observacao.

Pagamentos passam a atualizar uma única célula de Alunos. O servidor serializa gravações e impede duplicar selos. Solicitações de Patriota não concedem selos: somente a ação autenticada do professor aprova.
