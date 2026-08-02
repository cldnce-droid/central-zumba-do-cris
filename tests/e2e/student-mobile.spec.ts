import { expect, test } from "@playwright/test";

const groups = {
  Calheiros: "https://chat.whatsapp.com/J8wN1cv3qdn9pZEoFpkVWj",
  Palmas: "https://chat.whatsapp.com/B6c5JM9R5nx8IxpZNTK0jp",
  "Ganchos de Fora": "https://chat.whatsapp.com/FPIReSms4UG6dFwk7RY10D"
};

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.evaluate(() =>
    localStorage.setItem(
      "zumba-do-cris-install-prompt-dismissed-v2",
      "true"
    )
  );
  await page.reload();
  await expect(page.locator("body")).toBeVisible();
  expect(errors).toEqual([]);
});

test("instalação é opcional e não bloqueia a Home", async ({ page }) => {
  await page.evaluate(() =>
    localStorage.removeItem("zumba-do-cris-install-prompt-dismissed-v2")
  );
  await page.reload();

  await expect(
    page.getByRole("heading", { name: /adicione o zumba do cris/i })
  ).toBeVisible();
  await page.getByRole("button", { name: /fazer isso mais tarde/i }).click();
  await expect(
    page.getByRole("heading", { name: /adicione o zumba do cris/i })
  ).toBeHidden();
  await expect(
    page.getByRole("link", { name: /entrar na minha área/i })
  ).toBeVisible();
});

test("home abre os três grupos corretos", async ({ page }) => {
  await page.getByRole("button", { name: /entrar no grupo/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();

  for (const [name, href] of Object.entries(groups)) {
    await expect(page.getByRole("link", { name: new RegExp(name, "i") }))
      .toHaveAttribute("href", href);
  }
});

test("planos e PIX funcionam no celular", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByRole("link", { name: /^planos$/i }).first().click();

  await expect(page.getByText("R$80")).toBeVisible();
  await expect(page.getByText("R$100")).toBeVisible();
  await expect(page.getByText("R$130")).toBeVisible();
  await expect(page.getByText("R$150")).toBeVisible();

  await page.getByRole("button", { name: /pagar com pix/i }).click();
  await expect(page.getByText(/chave pix copiada com sucesso/i)).toBeVisible();
});

test("grade oficial e Premium aparecem nas telas públicas", async ({ page }) => {
  await page.getByRole("link", { name: /turmas/i }).first().click();
  await expect(page.getByText("Segunda e quarta")).toBeVisible();
  await expect(page.getByText("Terça e quinta", { exact: true })).toHaveCount(2);

  await page.getByRole("link", { name: /^planos$/i }).first().click();
  await expect(page.getByText("Plano Apoiadora Premium")).toBeVisible();
  await expect(
    page.getByText(/acesso livre a todas as aulas em qualquer local/i)
  ).toBeVisible();
});

test("Premium libera automaticamente todos os locais no cadastro", async ({
  page
}) => {
  await page.goto("/cadastro");
  await page.getByText("Plano Apoiadora Premium", { exact: true }).click();
  await expect(page.locator('input[name="turma"]:checked')).toHaveCount(3);
});

test("desafio Agosto Sem Sofá conta somente presenças aceitas", async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem("alunoAtualId", "ALU_TESTE_SOFA");
    localStorage.setItem(
      "zdc_alunos_remotos",
      JSON.stringify([
        {
          id: "ALU_TESTE_SOFA",
          nome: "Aluna Teste",
          whatsapp: "48999999999",
          email: "",
          plano: "1x",
          status: "ativo",
          statusCadastro: "ativo",
          statusPagamento: "pago",
          dataEntrada: "2026-08-01",
          diaVencimento: 8,
          turmaPrincipal: "Palmas",
          turmasEscolhidas: ["Palmas"],
          observacoes: ""
        }
      ])
    );
    localStorage.setItem(
      "zdc_google_sheets_cache",
      JSON.stringify({
        Presencas: [
          {
            id: "P1",
            alunoId: "ALU_TESTE_SOFA",
            aulaId: "A1",
            dataAula: "2026-08-03",
            status: "aceita",
            compareceu: true
          },
          {
            id: "P2",
            alunoId: "ALU_TESTE_SOFA",
            aulaId: "A2",
            dataAula: "2026-08-10",
            status: "aceita",
            compareceu: true
          },
          {
            id: "P3",
            alunoId: "ALU_TESTE_SOFA",
            aulaId: "A3",
            dataAula: "2026-08-17",
            status: "recusada",
            compareceu: false
          }
        ]
      })
    );
  });

  await page.goto("/minha-area");
  await expect(page.getByText(/desafio agosto sem sofá/i)).toBeVisible();
  await expect(page.getByText("2/3")).toBeVisible();
});

test("WhatsApp de informações possui número e mensagem", async ({ page }) => {
  const link = page.getByRole("link", { name: /dúvidas e informações/i });
  await expect(link).toHaveAttribute(
    "href",
    /wa\.me\/5541984723756\?text=/
  );
});

test("navegação mobile abre turmas, avisos e entrada do aluno", async ({
  page
}) => {
  await page.getByRole("link", { name: /turmas/i }).first().click();
  await expect(page).toHaveURL(/\/turmas$/);

  await page.getByRole("link", { name: /avisos/i }).first().click();
  await expect(page).toHaveURL(/\/avisos$/);
  await expect(page.getByRole("heading", { name: /mural da comunidade/i }))
    .toBeVisible();

  await page.getByRole("link", { name: /minha área/i }).first().click();
  await expect(page).toHaveURL(/\/minha-area$/);
  await expect(page.getByRole("link", { name: /entrar na minha área/i }))
    .toBeVisible();
});
