export type EventSearchParams = Record<string, string | string[] | undefined>;

export function single(params: EventSearchParams, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

/** Translate the "when" chip into an explicit window the RPC understands. */
export function dateWindow(when?: string): { from?: string; to?: string } {
  if (!when) return {};
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (when === "today") {
    const end = new Date(startOfDay);
    end.setDate(end.getDate() + 1);
    return { from: now.toISOString(), to: end.toISOString() };
  }
  if (when === "weekend") {
    const day = startOfDay.getDay();
    const friday = new Date(startOfDay);
    friday.setDate(friday.getDate() + ((5 - day + 7) % 7));
    const monday = new Date(friday);
    monday.setDate(friday.getDate() + 3);
    return { from: friday.toISOString(), to: monday.toISOString() };
  }
  const days = when === "week" ? 7 : when === "month" ? 30 : 0;
  if (!days) return {};
  const end = new Date(startOfDay);
  end.setDate(end.getDate() + days);
  return { from: now.toISOString(), to: end.toISOString() };
}

/** Builds the `search_events` RPC args shared by the page and the "load more" route. */
export function buildSearchEventsArgs(params: EventSearchParams, limit: number, offset: number) {
  const window = dateWindow(single(params, "when"));
  return {
    p_query: single(params, "q") ?? undefined,
    p_category_slug: single(params, "category") ?? undefined,
    p_city: single(params, "city") ?? undefined,
    p_from: window.from,
    p_to: window.to,
    p_free_only: single(params, "free") === "1",
    p_featured_only: single(params, "featured") === "1",
    p_organizer_slug: single(params, "organizer") ?? undefined,
    p_sort: single(params, "sort") ?? "soonest",
    p_limit: limit,
    p_offset: offset,
  };
}
