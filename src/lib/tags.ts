import "server-only";
import { createClient } from "@/lib/supabase/server";
import { normaliseTags } from "@/lib/validation/common";

/** How many suggestions the tag field is worth loading; the rest are long-tail. */
const LIMIT = 60;

/**
 * The tags already in use, most common first, so the event form can offer them
 * before an organiser invents a near-duplicate ("standup" vs "stand-up"). Tag
 * search is only as good as the agreement between organisers about spelling.
 */
export async function fetchTagSuggestions(): Promise<string[]> {
  const supabase = await createClient();

  // RLS keeps this to events the viewer may see, which is what we want to
  // suggest anyway — tags nobody can find are not worth proposing.
  const { data } = await supabase
    .from("events")
    .select("tags")
    .eq("status", "published")
    .order("starts_at", { ascending: false })
    .limit(500);

  const uses = new Map<string, { label: string; count: number }>();

  for (const row of data ?? []) {
    for (const tag of normaliseTags(row.tags ?? [])) {
      const key = tag.toLowerCase();
      const seen = uses.get(key);
      if (seen) seen.count += 1;
      else uses.set(key, { label: tag, count: 1 });
    }
  }

  return [...uses.values()]
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, LIMIT)
    .map((entry) => entry.label);
}
