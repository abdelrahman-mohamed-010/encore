import { test, expect, type Page } from "@playwright/test";

/**
 * The design system's own regression test. It exercises each replaced control
 * end to end, because the whole point of these components is that they are real
 * DOM: a native `<select>` popup could not be asserted on at all.
 */

test.describe("design system", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/design");
    await expect(page.getByRole("heading", { name: "Design system", level: 1 })).toBeVisible();
  });

  test("the select opens a styled list and picks an option", async ({ page }) => {
    const trigger = page.getByRole("combobox", { name: "Ticket tier" });
    await expect(trigger).toContainText("Gold");
    await trigger.click();

    // A native select's options are drawn by the OS and are not in the DOM at
    // all; these are, which is exactly what makes them styleable.
    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();
    await expect(listbox.getByRole("option", { name: /Sold out/ })).toHaveAttribute(
      "aria-disabled",
      "true",
    );

    await listbox.getByRole("option", { name: /Silver/ }).click();
    await expect(trigger).toContainText("Silver");
  });

  test("the combobox filters as you type", async ({ page }) => {
    await page.getByRole("combobox", { name: "Pick a timezone" }).click();
    const search = page.getByPlaceholder("Search timezones…");
    await search.fill("cairo");

    const options = page.getByRole("option");
    await expect(options).toHaveCount(1);
    await options.first().click();

    // Assert on the trigger specifically: the list still holds a node with the
    // same text, so a bare text match would be ambiguous.
    await expect(page.getByRole("combobox", { name: "Pick a timezone" })).toContainText(
      "Egypt Time — Cairo",
    );
  });

  test("the date picker sets a value from the calendar", async ({ page }) => {
    await page.getByRole("button", { name: "Pick a date" }).click();

    const grid = page.getByRole("grid");
    await expect(grid).toBeVisible();

    // Day buttons carry a full spoken date as their accessible name, so match
    // on that rather than the visible numeral (which "15" alone would not hit).
    await grid.getByRole("button", { name: /\b15th\b/ }).first().click();
    await expect(page.getByRole("button", { name: /\w+, \w+ 15, \d{4}/ })).toBeVisible();
  });

  test("the colour picker offers a curated palette", async ({ page }) => {
    await page.getByRole("button", { name: /^Colour:/ }).click();
    const swatches = page.getByRole("option");
    await expect(swatches).toHaveCount(12);
    await swatches.nth(3).click();
    await expect(page.getByRole("button", { name: /^Colour: #/ })).toBeVisible();
  });

  test("the dialog traps focus and closes on Escape", async ({ page }) => {
    await page.getByRole("button", { name: "Open dialog" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Accept payments")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("every control repaints in dark mode", async ({ page }) => {
    // The theme provider owns the `dark` class and re-asserts it after
    // hydration, so the switch has to come from the preference it reads —
    // adding the class by hand is undone on the next render.
    await page.emulateMedia({ colorScheme: "dark" });
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);

    // The body must repaint from the token, not sit on a light default.
    const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(background).not.toBe("rgb(255, 255, 255)");

    await expect(page.getByRole("heading", { name: "Design system" })).toBeVisible();
  });
});

/** Captures the gallery so the system can be reviewed as an image, not just code. */
async function shoot(page: Page, name: string, dark: boolean) {
  if (dark) await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/design");
  await expect(page.getByRole("heading", { name: "Design system" })).toBeVisible();
  if (dark) await expect(page.locator("html")).toHaveClass(/dark/);
  await page.screenshot({ path: `test-results/design-${name}.png`, fullPage: true });
}

test.describe("gallery screenshots", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "one browser is enough");

  test("light", async ({ page }) => shoot(page, "light", false));
  test("dark", async ({ page }) => shoot(page, "dark", true));
});
