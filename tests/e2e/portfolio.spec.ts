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
    ["Quero ser um espaço parceiro", "espacos-parceiros", "Espaço Parceiro"],
    ["Quero ser patrocinador", "patrocinio", "Patrocinadores"]
  ]) {
    await page.goto("/portfolio");
    await page.getByRole("link", { name: button, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/portfolio/${path}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(page.getByRole("button", { name: /Solicitar parceria pelo WhatsApp|Conversar sobre patrocínio/ })).toBeVisible();
    await page.getByRole("link", { name: "Voltar ao portfólio" }).click();
    await expect(page).toHaveURL(/\/portfolio#parcerias$/);
  }
});

test("entrada permanente na inicial abre o portfólio", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("zdc-notification-welcome-seen-v6", "true"));
  await page.goto("/");
  await page.getByRole("link", { name: /Conheça o projeto/ }).click();
  await expect(page).toHaveURL(/\/portfolio$/);
});


test("as duas opções levam o valor da temporada ao WhatsApp", async ({ page }) => {
  await page.route("https://wa.me/**", route => route.fulfill({ body: "Teste" }));
  for (const [index, title, price] of [["0", "Logo nas ventarolas", "500,00"], ["1", "Logo ampliada e presença no circuito", "2.500,00"]]) {
    await page.goto("/portfolio/patrocinio");
    await page.getByLabel("Participação", { exact: true }).selectOption(index);
    await expect(page.locator(".gcr-example")).toHaveCount(2);
    const outbound = page.waitForRequest(request => request.url().startsWith("https://wa.me/"));
    await page.getByRole("button", { name: "Conversar sobre patrocínio" }).click();
    const url = new URL((await outbound).url());
    expect(url.pathname).toBe("/5541984774688");
    expect(url.searchParams.get("text")).toContain(title);
    expect(url.searchParams.get("text")).toContain(price);
  }
});

test("agenda bloqueia o período da temporada e revalida antes do WhatsApp", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/portfolio/agenda", route => {
    calls++;
    return route.fulfill({ json: { busy: [{ start: "2027-01-09T09:00:00-03:00", end: "2027-01-09T09:45:00-03:00" }], checkedAt: new Date().toISOString() } });
  });
  await page.goto("/portfolio/espacos-parceiros");
  await expect(page.locator('select option[value="1"]')).toHaveAttribute("disabled", "");
  await page.getByLabel("Nome do espaço").fill("Espaço Sol & Mar");
  await page.getByLabel("Dia e período").selectOption("2");
  await expect(page.getByLabel("Datas solicitadas").locator("li")).toHaveCount(9);
  await expect(page.getByLabel("Datas solicitadas")).toContainText("19/12/2026");
  await expect(page.getByLabel("Datas solicitadas")).toContainText("13/02/2027");
  await page.getByLabel("Estou ciente").check();
  let outbound = "";
  await page.route("https://wa.me/**", route => { outbound = route.request().url(); return route.fulfill({ body: "Intercepção de teste" }); });
  await page.getByRole("button", { name: "Solicitar parceria pelo WhatsApp" }).click();
  await expect.poll(() => outbound).toContain("5541984774688");
  expect(calls).toBeGreaterThanOrEqual(2);
  const message = new URL(outbound).searchParams.get("text")!;
  expect(message).toContain("Espaço Sol & Mar");
  expect(message).toContain("Sábado à tarde");
  expect(message).toContain("R$ 1.800");
  expect(message).toContain("após pagamento e confirmação do patrocínio");
});

test("falha da agenda não libera uma reserva e páginas cabem no celular", async ({ page }) => {
  await page.route("**/api/portfolio/agenda", route => route.fulfill({ status: 503, json: { error: "offline" } }));
  for (const width of [360, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    for (const path of ["espacos-parceiros", "patrocinio"]) {
      await page.goto(`/portfolio/${path}`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
  await page.goto("/portfolio/espacos-parceiros");
  await page.getByLabel("Nome do espaço").fill("Teste");
  await page.getByLabel("Estou ciente").check();
  await page.getByRole("button", { name: "Solicitar parceria pelo WhatsApp" }).click();
  await expect(page.locator(".proposal-form [role=alert]")).toContainText("Não foi possível consultar");
  await expect(page).toHaveURL(/espacos-parceiros$/);
});
