import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const workbook = Workbook.create();

const sheets = [
  ["Alunos", ["id", "nome", "whatsapp", "email", "plano", "turmasEscolhidas", "statusCadastro", "statusPagamento", "dataEntrada", "diaVencimento", "formaPagamento", "observacoes"], []],
  ["Planos", ["id", "nome", "valor", "aulasPorSemana", "descricao", "destaque"], [
    ["PLANO_1X", "1x por semana", 80, 1, "Acesso a 1 aula por semana", false],
    ["PLANO_2X", "2x por semana", 100, 2, "Acesso a 2 aulas por semana", false],
    ["PLANO_3X", "3x por semana", 130, 3, "Acesso a 3 aulas por semana", false],
    ["PLANO_PREMIUM", "Plano Apoiadora Premium", 150, "ilimitado", "Acesso livre a todas as aulas em qualquer local", true],
  ]],
  ["Turmas", ["id", "nome", "local", "dias", "horario", "endereco", "capacidade", "ativa"], [
    ["TURMA_GANCHOS", "Ganchos de Fora", "Ganchos de Fora", "terça,quinta", "18h30", "Salão da Capela", "", true],
    ["TURMA_PALMAS", "Palmas", "Palmas", "segunda,quarta", "19h", "2.0 Lounge", 25, true],
    ["TURMA_CALHEIROS", "Calheiros", "Calheiros", "terça,quinta", "20h15", "ao lado do Berlanda", 15, true],
  ]],
  ["Aulas", ["id", "turmaId", "data", "diaSemana", "horario", "local", "endereco", "status"], []],
  ["Confirmacoes", ["id", "alunoId", "aulaId", "dataConfirmacao", "status"], []],
  ["Presencas", ["id", "alunoId", "nomeAluno", "whatsapp", "turma", "local", "dataAula", "horario", "dataValidacao", "status", "validadoPor", "observacao"], []],
  ["Pagamentos", ["id", "alunoId", "plano", "valor", "vencimento", "dataPagamento", "status", "metodo"], []],
  ["Desafios", ["id", "titulo", "descricao", "tipo", "meta", "ativo", "statusVisual"], []],
  ["Conquistas", ["id", "alunoId", "nomeAluno", "tipo", "titulo", "coreografia", "dataConquista", "observacao"], []],
];

for (const [name, headers, rows] of sheets) {
  const sheet = workbook.worksheets.add(name);
  const endColumn = String.fromCharCode(64 + headers.length);
  sheet.getRange(`A1:${endColumn}1`).values = [headers];

  if (rows.length > 0) {
    sheet.getRange(`A2:${endColumn}${rows.length + 1}`).values = rows;
  }

  const header = sheet.getRange(`A1:${endColumn}1`);
  header.format = {
    fill: "#07124D",
    font: { bold: true, color: "#FFFFFF" },
    horizontalAlignment: "center",
    verticalAlignment: "center",
  };
  header.format.rowHeight = 28;
  sheet.freezePanes.freezeRows(1);

  headers.forEach((label, columnIndex) => {
    let width = Math.min(220, Math.max(85, label.length * 9 + 24));
    if (["descricao", "observacoes", "turmasEscolhidas", "endereco"].includes(label)) width = 220;
    if (["nome", "email", "local", "titulo"].includes(label)) width = 170;
    sheet.getRangeByIndexes(0, columnIndex, Math.max(2, rows.length + 1), 1).format.columnWidth = width;
  });
}

const outputDirectory = path.join(process.cwd(), "outputs", "central-zumba-do-cris");
await fs.mkdir(outputDirectory, { recursive: true });
const outputPath = path.join(outputDirectory, "central-zumba-do-cris-base-limpa.xlsx");
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);

const checks = [];
for (const [name, headers, rows] of sheets) {
  const endColumn = String.fromCharCode(64 + headers.length);
  const range = `${name}!A1:${endColumn}${Math.max(2, rows.length + 1)}`;
  const inspection = await workbook.inspect({
    kind: "table",
    range,
    include: "values",
    tableMaxRows: 5,
    tableMaxCols: 12,
  });
  checks.push(inspection.ndjson);

  await workbook.render({
    sheetName: name,
    range: `A1:${endColumn}${Math.max(3, rows.length + 1)}`,
    scale: 1,
  });
}

console.log(JSON.stringify({ outputPath, checks }));
