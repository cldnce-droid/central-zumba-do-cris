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
  await expect(page.locator("body")).toBeVisible();
  expect(errors).toEqual([]);
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

  await expect(page.getByText("R$50")).toBeVisible();
  await expect(page.getByText("R$85")).toBeVisible();
  await expect(page.getByText("R$100")).toBeVisible();

  await page.getByRole("button", { name: /pagar com pix/i }).click();
  await expect(page.getByText(/chave pix copiada com sucesso/i)).toBeVisible();
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
