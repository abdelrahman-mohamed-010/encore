"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { format, isSameDay } from "date-fns";
import { Calendar as CalendarIcon, Clock, MapPin, Ticket, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";

import { EmptyState } from "@/components/ui/empty-state";import { formatMoney } from "@/lib/format";
import type { EventSearchResult } from "@/lib/types";

export function EventTimeline({
  events,
  organizerName,
}: {
  events: EventSearchResult[];
  organizerName: string;
}) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);

  const eventDays = React.useMemo(
    () => events.filter((e) => e.starts_at).map((e) => new Date(e.starts_at)),
    [events],
  );

  const visibleEvents = React.useMemo(() => {
    if (!selectedDate) return events;
    return events.filter((e) => e.starts_at && isSameDay(new Date(e.starts_at), selectedDate));
  }, [events, selectedDate]);

  const groupedEvents: Record<string, EventSearchResult[]> = {};
  for (const event of visibleEvents) {
    const dayKey = event.starts_at ? format(new Date(event.starts_at), "yyyy-MM-dd") : "tba";
    if (!groupedEvents[dayKey]) groupedEvents[dayKey] = [];
    groupedEvents[dayKey].push(event);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0">
        <div className="mb-8 flex items-center justify-between gap-3">
          <h2 className="display-3 text-ink">Events Schedule</h2>
          <Badge tone="neutral" size="sm" className="rounded-full">
            <CalendarIcon className="mr-1 size-3" />
            {visibleEvents.length} {selectedDate ? "on this day" : "upcoming"}
          </Badge>
        </div>

        {visibleEvents.length === 0 ? (
          <EmptyState
            className="mt-6"
            title={selectedDate ? "Nothing on this day" : "Nothing on sale right now"}
            description={
              selectedDate
                ? "Pick another date, or clear the filter to see everything."
                : `Check back soon for the next ${organizerName} experience.`
            }
          />
        ) : (
          <div className="relative pl-6 sm:pl-8 before:absolute before:bottom-3 before:left-2 before:top-3 before:w-0.5 before:bg-hairline">
            {Object.entries(groupedEvents).map(([dayKey, dayEvents]) => {
              const dateObj = dayKey !== "tba" ? new Date(dayEvents[0].starts_at) : null;
              const monthDay = dateObj ? format(dateObj, "MMM d") : "Dates TBA";
              const weekday = dateObj ? format(dateObj, "EEEE") : "";

              return (
                <div key={dayKey} className="relative mb-10 last:mb-0">
                  <span className="absolute -left-3.75 top-1.5 size-3 -translate-x-1/2 rounded-full border-2 border-paper bg-line-2 shadow-xs sm:-left-5.75" />

                  <div className="mb-4 flex items-baseline gap-2">
                    <h3 className="text-lg font-bold text-ink">{monthDay}</h3>
                    {weekday && <span className="text-sm font-medium text-ink-3">{weekday}</span>}
                  </div>

                  <div className="space-y-4">
                    {dayEvents.map((event) => {
                      const timeString = event.starts_at ? format(new Date(event.starts_at), "h:mm a") : "";
                      const locationLabel = event.is_online
                        ? "Online event"
                        : [event.venue_name, event.city].filter(Boolean).join(" · ") || "Venue TBA";

                      return (
                        <Link
                          key={event.id}
                          href={`/events/${event.slug}`}
                          className="group flex flex-col justify-between gap-4 overflow-hidden rounded-2xl bg-card p-5 sm:flex-row sm:items-center"
                        >
                          <div className="flex min-w-0 flex-1 flex-col justify-center">
                            {timeString && (
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber">
                                <Clock className="size-3.5" />
                                <span>{timeString}</span>
                              </div>
                            )}

                            <h4 className="mt-1.5 text-lg font-bold text-ink transition-colors group-hover:text-brand-600 sm:text-xl">
                              {event.title}
                            </h4>

                            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-2">
                              <span className="flex items-center gap-1">
                                <MapPin className="size-3.5 text-ink-3" />
                                <span className="truncate">{locationLabel}</span>
                              </span>
                            </div>

                            <div className="mt-3 flex items-center gap-2">
                              <span className="inline-flex items-center rounded-lg bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700 dark:bg-green-950/50 dark:text-green-300">
                                {event.min_price_cents === 0
                                  ? "Free"
                                  : event.min_price_cents
                                    ? `From ${formatMoney(event.min_price_cents, event.currency)}`
                                    : "On sale"}
                              </span>
                            </div>
                          </div>

                          <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-xl bg-sunken sm:h-28 sm:w-28">
                            {event.cover_image_url ? (
                              <Image
                                src={event.cover_image_url}
                                alt={event.title}
                                fill
                                sizes="(max-width: 640px) 100vw, 112px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex size-full items-center justify-center bg-gradient-to-br from-sunken to-sunken-2 text-ink-3">
                                <Ticket className="size-8 opacity-40" />
                              </div>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-2xl bg-card p-3">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            modifiers={{ hasEvent: eventDays }}
            modifiersClassNames={{
              hasEvent: "after:absolute after:top-1 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-brand-500",
            }}
          />
          {selectedDate && (
            <button
              type="button"
              onClick={() => setSelectedDate(undefined)}
              className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
            >
              <X className="size-3.5" />
              Clear filter
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
