import { test, expect } from "@playwright/test";

const HOST_ID = "11111111-1111-4111-8111-111111111111";

test.describe("host profile", () => {
  test("shows who they are, what they have hosted and attended", async ({ page }) => {
    await page.goto(`/u/${HOST_ID}`);

    await expect(page.getByRole("heading", { name: "Karim Fouad", level: 1 })).toBeVisible();
    await expect(page.getByText("Booking live music in Cairo since 2011.")).toBeVisible();
    await expect(page.getByText(/Joined/)).toBeVisible();

    await expect(page.getByText("6").first()).toBeVisible();
    await expect(page.getByText("Hosted")).toBeVisible();
    await expect(page.getByText("Attended")).toBeVisible();

    // Upcoming and past are separate sections, both linking to the event page.
    await expect(page.getByRole("heading", { name: "Hosting" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Cairokee/ })).toHaveAttribute(
      "href",
      "/events/cairokee-roots-live",
    );
    await expect(page.getByRole("heading", { name: "Past events" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Cairo Jazz Nights/ })).toBeVisible();

    // The organizers they run are reachable from here. Scoped to the header:
    // the event rows below also mention the organizer by name.
    await expect(
      page.getByTestId("host-organizers").getByRole("link", { name: /Cairo Live Nation/ }),
    ).toHaveAttribute("href", "/organizers/cairo-live-nation");
  });

  test("an unknown id is a 404, not a crash", async ({ page }) => {
    const response = await page.goto("/u/not-a-uuid");
    // Next returns 200 for a streamed notFound() in a dynamic route, so assert
    // on what the visitor actually sees.
    expect(response?.status()).toBeLessThan(500);
    await expect(page.getByRole("heading", { name: /could not find that page/i })).toBeVisible();
  });

  test("the organizer page links to the person who runs it", async ({ page }) => {
    await page.goto("/organizers/cairo-live-nation");
    await expect(page.getByRole("link", { name: "Karim Fouad" })).toHaveAttribute(
      "href",
      `/u/${HOST_ID}`,
    );
  });
});

test.describe("venue detail", () => {
  test("shows the venue, its address and what is on there", async ({ page }) => {
    await page.goto("/venues/cairo-international-stadium");

    await expect(
      page.getByRole("heading", { name: "Cairo International Stadium", level: 1 }),
    ).toBeVisible();
    await expect(page.getByText("Nasr City, Cairo, EG")).toBeVisible();
    await expect(page.getByText(/Holds 75,000/)).toBeVisible();

    await expect(page.getByRole("link", { name: /Open in Maps/ })).toHaveAttribute(
      "href",
      /google\.com\/maps/,
    );

    await expect(page.getByRole("heading", { name: /What's on here/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Cairokee/ })).toBeVisible();
  });

  test("an event links through to its venue", async ({ page }) => {
    await page.goto("/events/cairokee-roots-live");
    await expect(
      page.getByRole("link", { name: "Cairo International Stadium" }).first(),
    ).toHaveAttribute("href", "/venues/cairo-international-stadium");
  });
});
