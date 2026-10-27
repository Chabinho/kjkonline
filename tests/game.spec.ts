import { newGame, STORAGE_KEY } from "../src/game/engine";
import { test, expect } from "@playwright/test";
test("create a character, read the original book, persist and navigate on every screen", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Királynők Útvesztője" }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/landing-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Kaland indítása", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByText("Szerencse itala", { exact: true }).click();
  await page.getByRole("button", { name: "Dobok a karakteremért" }).click();
  await expect(
    page.getByRole("heading", { name: "Yuron sötét napjai" }),
  ).toBeVisible();
  for (let i = 0; i < 4; i++) await page.locator(".choice").first().click();
  await expect(
    page.getByRole("heading", { name: "Az Útvesztő kapuja" }),
  ).toBeVisible();
  await expect(page.locator(".inventory")).toContainText("Fáklya");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Az Útvesztő kapuja" }),
  ).toBeVisible();
  await expect(page.locator(".gold-count")).toContainText("10");
  await page.getByRole("button", { name: /NYUGAT/ }).click();
  await expect(
    page.getByRole("heading", { name: "243. fejezet" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({
    path: `test-results/game-${test.info().project.name}.png`,
    fullPage: true,
  });
});
test("rules dialog traps focus, closes with Escape and motion can be disabled", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Hogyan játszhatok?" }).click();
  await expect(page.getByRole("dialog")).toContainText("Szerencsepróbán");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Háttérmozgás: kikapcsolva" }),
  ).toBeVisible();
});

test("an injury waits for luck, survives reload and resolves only once", async ({
  page,
}) => {
  const game = newGame(() => 6);
  game.section = "40";
  game.visited.push("40");
  game.hero.stamina = 1;
  game.pending = { kind: "injury", amount: 1, source: "Gyomirtó" };
  await page.goto("/");
  await page.evaluate(({ key, save }) => localStorage.setItem(key, save), {
    key: STORAGE_KEY,
    save: JSON.stringify(game),
  });
  await page.reload();
  const luck = page.getByRole("region", { name: "Szerencsepróba" });
  await expect(luck).toBeVisible();
  await expect(page.locator(".choice").first()).toBeDisabled();
  await page.reload();
  await expect(luck).toBeVisible();
  await luck
    .getByRole("button", { name: "Szerencsepróba", exact: true })
    .click();
  await expect(luck).not.toBeVisible();
  const saved = JSON.parse(
    (await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY))!,
  );
  expect(saved.hero.stamina).toBe(1);
  expect(saved.hero.luck).toBe(11);
  expect(saved.pending).toBeNull();
  await expect(page.locator(".choice").first()).toBeEnabled();
});
