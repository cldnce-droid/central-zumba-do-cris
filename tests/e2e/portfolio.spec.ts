import { expect, test } from "@playwright/test";

// Installed Chrome includes H.264 support for the original MP4 media.
test.use({ channel: process.env.PLAYWRIGHT_CHANNEL === "chrome" ? "chrome" : undefined });

test.beforeEach(async ({ page }) => {
  await page.route("https://cdn.onesignal.com/**", (route) => route.abort());
  await page.addInitScript(() => {
    localStorage.setItem("zumba-do-cris-install-manual-complete-v1", "true");
    Object.defineProperty(navigator, "standalone", { value: true });
  });
});

test("portfólio abre diretamente, sem login, pop-up ou download dos vídeos", async ({ page }) => {
  const unexpected: string[] = [];
  page.on("request", (request) => {
    if (/\.mp4(?:\?|$)|\/api\/(sheets|desafios)/.test(request.url())) unexpected.push(request.url());
  });
  await page.goto("/portfolio");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Leve essa energia");
  await page.waitForTimeout(1200);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("video[src]")).toHaveCount(0);
  expect(unexpected).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.locator('a[href="https://www.instagram.com/clproduction333/"]')).toBeVisible();
});

test("vídeos têm fallback, proporção vertical e devolvem foco e posição ao fechar", async ({ page }) => {
  await page.addInitScript(() => {
    Element.prototype.requestFullscreen = () => Promise.reject(new Error("Fullscreen indisponível no teste"));
  });
  await page.goto("/portfolio");
  for (const title of ["Minha experiência a bordo", "Sinta essa energia"]) {
    const trigger = page.getByRole("button", { name: `Assistir: ${title}` });
    await trigger.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const position = await page.evaluate(() => scrollY);
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: title });
    await expect(dialog).toBeVisible();
    const video = dialog.locator("video");
    await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.readyState), { timeout: 15000 }).toBeGreaterThan(0);
    expect(await video.evaluate((element: HTMLVideoElement) => element.videoWidth < element.videoHeight)).toBe(true);
    await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(0);
    await dialog.getByRole("button", { name: "Fechar" }).click();
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await expect(page.locator("video[src]")).toHaveCount(0);
    expect(Math.abs(await page.evaluate(() => scrollY) - position)).toBeLessThan(4);
  }
});

test("os dois interesses têm destinos diferentes e podem voltar ao portfólio", async ({ page }) => {
  for (const [button, path, title] of [
    ["Quero ser um espaço parceiro", "espacos-parceiros", "Espaços parceiros"],
    ["Quero ser patrocinador", "patrocinio", "Patrocínio"]
  ]) {
    await page.goto("/portfolio");
    await page.getByRole("link", { name: button, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/portfolio/${path}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(page.getByText("Proposta em preparação")).toBeVisible();
    await page.getByRole("link", { name: "Voltar ao portfólio" }).click();
    await expect(page).toHaveURL(/\/portfolio#parcerias$/);
  }
});

test("entrada permanente na inicial abre o portfólio", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("zdc-notification-welcome-seen-v6", "true"));
  await page.goto("/");
  await page.getByRole("link", { name: /Conheça a Zumba do Cris/ }).click();
  await expect(page).toHaveURL(/\/portfolio$/);
});
