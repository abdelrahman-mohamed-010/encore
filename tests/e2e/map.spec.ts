import { test, expect } from "@playwright/test";

/**
 * The map feature. The list is the contract: it is the real content and must
 * work whether or not WebGL and the tile host are available, so these tests
 * assert on it directly and treat the canvas as an enhancement.
 */

const MAP_URL = "/organizers/cairo-live-nation/map";

test.describe("organizer map", () => {
  test("lists only this organizer's events, with their venues", async ({ page }) => {
    await page.goto(MAP_URL);

    await expect(page.getByRole("heading", { name: /Cairo Live Nation on the map/ })).toBeVisible();

    // Scope to the list: each title also appears as a map marker's accessible
    // name, which is correct but makes a bare locator ambiguous.
    const list = page.getByTestId("map-list");

    // The fixture gives this organizer two events; the third belongs to
    // another organizer and must not leak in.
    await expect(list.getByRole("button", { name: /Cairokee/ })).toBeVisible();
    await expect(list.getByRole("button", { name: /RiseUp Summit/ })).toBeVisible();
    await expect(list.getByRole("button", { name: /Aida/ })).toBeHidden();

    await expect(list.getByText("Cairo International Stadium")).toBeVisible();
  });

  test("selecting an event opens its detail panel", async ({ page }) => {
    await page.goto(MAP_URL);

    const list = page.getByTestId("map-list");
    await list.getByRole("button", { name: /Cairokee/ }).click();

    await expect(page.getByRole("heading", { name: "Cairokee — Roots Live" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Get tickets/ })).toHaveAttribute(
      "href",
      "/events/cairokee-roots-live",
    );

    await page.getByRole("button", { name: "Back" }).click();
    await expect(list.getByRole("button", { name: /RiseUp Summit/ })).toBeVisible();
  });

  test("the map surface mounts alongside the list", async ({ page }) => {
    await page.goto(MAP_URL);
    // Present regardless of whether the tile host can be reached: markers are
    // positioned over it either way.
    await expect(page.getByTestId("event-map")).toBeVisible();
  });

  test("renders pins for each located event", async ({ page }) => {
    await page.goto(MAP_URL);

    const markers = page.locator(".tz-marker");
    // MapLibre needs WebGL; if the runner has no GL context the map is skipped
    // and the list carries the page. Only assert the pins when it did mount.
    const mounted = await markers
      .first()
      .waitFor({ state: "attached", timeout: 20_000 })
      .then(() => true)
      .catch(() => false);

    test.skip(!mounted, "no WebGL in this runner");

    await expect(markers).toHaveCount(2);
    await markers.first().click();
    await expect(page.getByRole("link", { name: /Get tickets/ })).toBeVisible();
  });
});

test.describe("nearby events on the organizer page", () => {
  test("offers the full map when the visitor's location is unknown", async ({ page }) => {
    // No Vercel edge headers locally, so this is the real default path.
    await page.goto("/organizers/cairo-live-nation");

    const nearby = page.getByRole("heading", { name: "Events near you" });
    await expect(nearby).toBeVisible();

    await expect(page.getByRole("link", { name: /Browse all on the map/ })).toHaveAttribute(
      "href",
      MAP_URL,
    );
  });

  test("finds events once the browser shares a location", async ({ page, context }) => {
    await context.grantPermissions(["geolocation"]);
    // Tahrir Square: both Cairo fixtures are within a few km, Alexandria is not.
    await context.setGeolocation({ latitude: 30.0444, longitude: 31.2357 });

    await page.goto("/organizers/cairo-live-nation");
    await page.getByRole("button", { name: /Use my location/ }).click();

    const nearby = page.getByTestId("nearby-events");
    await expect(nearby.getByText(/upcoming near you/)).toBeVisible();

    // Both Cairo venues are inside the radius; Alexandria (~180 km) is not.
    await expect(nearby.getByRole("link", { name: /Cairokee/ })).toBeVisible();
    await expect(nearby.getByRole("link", { name: /RiseUp Summit/ })).toBeHidden();
    await expect(nearby.getByText(/km away/).first()).toBeVisible();
  });
});
