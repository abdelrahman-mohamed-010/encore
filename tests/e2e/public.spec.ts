import { expect, test } from "@playwright/test";

test.describe("home page", () => {
  test("shows the hero, categories and live events", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("Find your next");
    // The live count is a kicker above the headline, not a link.
    await expect(page.getByText(/events on sale right now/i)).toBeVisible();
    await expect(page.getByRole("link", { name: "Discover events" }).first()).toBeVisible();

    // Categories come from the database, not a hardcoded list.
    await expect(page.getByRole("link", { name: "Music", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Theatre", exact: true })).toBeVisible();

    // The featured event is rendered from the search RPC.
    await expect(page.getByRole("heading", { name: "Cairokee — Roots Live" }).first()).toBeVisible();
  });

  test("marks up prices and sold-out state on event cards", async ({ page }) => {
    await page.goto("/");
    const card = page.locator('a[href="/events/cairokee-roots-live"]').first();
    await expect(card).toContainText("From $45");
    await expect(card).toContainText("Featured");
  });

  test("search sends the visitor to the browse page with the query applied", async ({ page }) => {
    await page.goto("/");

    // The hero search streams in behind a Suspense boundary, so wait for it to
    // exist before acting: otherwise `.last()` can resolve to the header field
    // on fill and the hero field on submit, sending an empty query.
    const search = page.getByRole("searchbox", { name: "Search events" }).last();
    await expect(search).toBeVisible();

    await search.fill("Aida");
    await search.press("Enter");

    await expect(page).toHaveURL(/\/events\?q=Aida/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Aida");
  });
});

test.describe("browse page", () => {
  test("lists events and reports the count", async ({ page }) => {
    await page.goto("/events");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Browse events");
    await expect(page.getByText(/3 events on sale/)).toBeVisible();
    await expect(page.locator('a[href^="/events/"]').first()).toBeVisible();
  });

  test("filtering by category narrows the results and shows a removable chip", async ({ page }) => {
    await page.goto("/events?category=theatre");

    await expect(page.getByRole("heading", { name: "Aida — Opening Night" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Cairokee — Roots Live" })).toHaveCount(0);

    const chip = page.getByRole("button", { name: /Remove filter Theatre/i });
    await expect(chip).toBeVisible();
    await chip.click();
    await expect(page).toHaveURL("/events");
  });

  test("the free filter keeps only events with a zero-price tier", async ({ page }) => {
    await page.goto("/events?free=1");
    await expect(page.getByRole("heading", { name: "RiseUp Summit 2026" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Cairokee — Roots Live" })).toHaveCount(0);
  });

  test("an empty result set explains itself instead of showing a blank grid", async ({ page }) => {
    await page.goto("/events?q=zzzznothingmatchesthis");
    await expect(page.getByText("No events match those filters")).toBeVisible();
    await expect(page.getByRole("link", { name: "Clear filters" })).toBeVisible();
  });
});

test.describe("event detail", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/events/cairokee-roots-live");
  });

  test("renders the event, venue and ticket tiers", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cairokee — Roots Live");
    await expect(page.getByText("Cairo International Stadium").first()).toBeVisible();
    await expect(page.getByText("General Admission")).toBeVisible();
    await expect(page.getByText("Golden Circle")).toBeVisible();
    await expect(page.getByText("16+")).toBeVisible();
  });

  test("the ticket stepper respects availability and per-order limits", async ({ page }) => {
    const add = page.getByRole("button", { name: "Add one General Admission" });
    const remove = page.getByRole("button", { name: "Remove one General Admission" });

    // Nothing selected: the total is zero and you cannot go below it.
    await expect(remove).toBeDisabled();
    await expect(page.getByRole("button", { name: /Sign in to book|Get tickets/ })).toBeDisabled();

    await add.click();
    await add.click();
    await expect(page.getByText("$90", { exact: true })).toBeVisible();

    // Eight is the per-order maximum for this tier; the control disables itself
    // on arrival rather than letting the buyer exceed it.
    for (let i = 2; i < 8; i += 1) await add.click();
    await expect(add).toBeDisabled();
    await expect(page.getByText("$360", { exact: true })).toBeVisible();
  });

  test("a sold-out tier cannot be added to the order", async ({ page }) => {
    await expect(page.getByText("VIP Lounge")).toBeVisible();
    await expect(page.getByRole("button", { name: "Add one VIP Lounge" })).toBeDisabled();
    await expect(page.getByText("Sold out").first()).toBeVisible();
  });

  test("low stock is called out on the tier", async ({ page }) => {
    await expect(page.getByText("6 left")).toBeVisible();
  });

  test("an anonymous visitor is sent to sign in before holding tickets", async ({ page }) => {
    await page.getByRole("button", { name: "Add one General Admission" }).click();
    await page.getByRole("button", { name: "Sign in to book" }).click();
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

test.describe("organizer storefront", () => {
  test("shows the organizer and only their events", async ({ page }) => {
    await page.goto("/organizers/cairo-live-nation");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Cairo Live Nation");
    await expect(page.getByText("Verified")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Cairokee — Roots Live" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Aida — Opening Night" })).toHaveCount(0);
  });
});

test.describe("pricing", () => {
  test("reads the fee from platform settings rather than hardcoding it", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByText("5%")).toBeVisible();
    await expect(page.getByText("+ $0.99")).toBeVisible();
  });
});
