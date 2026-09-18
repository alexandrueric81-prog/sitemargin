import { expect, test } from "@playwright/test";

test("pagina de start se afișează în română", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "SiteMargin",
  );
  await expect(page.getByText("Etapa 2: schelet de proiect")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "ro");
});
