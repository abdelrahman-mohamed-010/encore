"use client";

import * as React from "react";
import {
  BarChart3, CalendarDays, CreditCard, Megaphone, Send, Share2, Ticket, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, StatusDot } from "@/components/ui/badge";
import { Callout, Banner } from "@/components/ui/callout";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/surface";
import { IconChip, DateBlock } from "@/components/ui/field-row";
import { AffixInput, Input, SearchInput, Switch, Textarea } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { DateField, DateTimeField, formatLocalDateTime } from "@/components/ui/date-picker";
import { ColorPicker } from "@/components/ui/color-picker";

import { Meter } from "@/components/ui/meter";
import { EmptyState } from "@/components/ui/empty-state";
import { StatTile } from "@/components/ui/stat-tile";import { Table, TBody, TD, TH, THead, TR, TableWrap } from "@/components/ui/table";
import { Pagination, Steps } from "@/components/ui/nav";
import { Kbd } from "@/components/ui/button";
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { EventCardSkeleton } from "@/features/catalog/components/event-card";
import { cn } from "@/lib/utils";

/**
 * A living inventory of the design system: every token and component rendered
 * from the same source the product uses, so drift is visible immediately rather
 * than discovered on a screen someone forgot to update.
 */

function Row({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border-t border-hairline-soft pt-6 first:border-0 first:pt-0">
      <div>
        <h3 className="text-md font-semibold text-ink">{title}</h3>
        {note && <p className="mt-0.5 max-w-2xl text-sm leading-relaxed text-ink-3">{note}</p>}
      </div>
      <div className="flex flex-wrap items-end gap-3">{children}</div>
    </section>
  );
}

function Swatch({ token, label }: { token: string; label: string }) {
  return (
    <div className="w-full space-y-1.5">
      <div className={`h-12 w-full rounded-lg border border-hairline ${token}`} />
      <p className="truncate font-mono text-2xs text-ink-3">{label}</p>
    </div>
  );
}

const NEUTRALS = ["bg-n-0", "bg-n-50", "bg-n-100", "bg-n-200", "bg-n-300", "bg-n-400", "bg-n-500", "bg-n-600", "bg-n-700", "bg-n-800", "bg-n-900", "bg-n-1000"];
const BRANDS = ["bg-brand-50", "bg-brand-100", "bg-brand-200", "bg-brand-300", "bg-brand-400", "bg-brand-500", "bg-brand-600", "bg-brand-700", "bg-brand-800", "bg-brand-900", "bg-brand-950"];
const TINTS = ["violet", "blue", "cyan", "emerald", "amber", "pink"] as const;

/** Fixed, so the gallery renders identically on every pass and in screenshots. */
const DEMO_DATES = [new Date(2026, 8, 4), new Date(2026, 9, 14)];

export function DesignGallery() {
  const [text, setText] = React.useState("");
  const [select, setSelect] = React.useState("gold");
  const [combo, setCombo] = React.useState("");
  const [date, setDate] = React.useState("");
  const [when, setWhen] = React.useState(formatLocalDateTime(new Date()));
  const [colour, setColour] = React.useState("#7c5cff");
  const [on, setOn] = React.useState(true);
  const [dialog, setDialog] = React.useState(false);
  const [sheet, setSheet] = React.useState(false);

  return (
    <div className="container-page space-y-12 py-12">
      <header className="space-y-2">
        <p className="eyebrow">Encore</p>
        <h1 className="display-2">Design system</h1>
        <p className="max-w-2xl text-md leading-relaxed text-ink-2">
          Every control below is built from Radix behaviour and our own tokens. No native{" "}
          <code className="rounded bg-sunken px-1 py-0.5 font-mono text-sm">&lt;select&gt;</code>,{" "}
          <code className="rounded bg-sunken px-1 py-0.5 font-mono text-sm">date</code> or{" "}
          <code className="rounded bg-sunken px-1 py-0.5 font-mono text-sm">color</code> input
          appears anywhere in the app — the browser draws those popups itself, so they cannot honour
          this palette or dark mode. Toggle the theme and nothing here should break.
        </p>
      </header>

      {/* ---- Colour ------------------------------------------------------- */}
      <Card>
        <CardHeader bordered><CardTitle>Colour</CardTitle></CardHeader>
        <CardBody className="space-y-8">
          <div className="space-y-2">
            <p className="text-sm font-medium text-ink-2">Neutral ramp</p>
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
              {NEUTRALS.map((t) => <Swatch key={t} token={t} label={t.replace("bg-n-", "")} />)}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-ink-2">Brand ramp</p>
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-11">
              {BRANDS.map((t) => <Swatch key={t} token={t} label={t.replace("bg-brand-", "")} />)}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-ink-2">
              Status — meaning, never decoration
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Swatch token="bg-positive" label="positive" />
              <Swatch token="bg-caution" label="caution" />
              <Swatch token="bg-critical" label="critical" />
              <Swatch token="bg-info" label="info" />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-ink-2">
              Tints — decoration, never meaning
            </p>
            <div className="flex flex-wrap gap-3">
              {TINTS.map((tone) => (
                <div key={tone} className="flex items-center gap-2">
                  <IconChip icon={Ticket} tone={tone} size="lg" />
                  <span className="font-mono text-2xs text-ink-3">{tone}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-ink-2">
              Surfaces — three planes, and a lift that carries its own hairline
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {(
                [
                  ["bg-paper", "paper", "The page itself."],
                  ["bg-card", "card", "Anything raised off it."],
                  ["bg-sunken", "sunken", "Fields, chips, wells — pressed in."],
                ] as const
              ).map(([token, name, note]) => (
                <div key={name} className={cn("rounded-xl p-4 shadow-e1", token)}>
                  <p className="font-mono text-2xs text-ink-3">{name}</p>
                  <p className="mt-1 text-sm text-ink-2">{note}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {(
                [
                  ["shadow-e1", "e1", "Resting cards."],
                  ["shadow-e2", "e2", "Hover, and cards that matter more."],
                  ["shadow-pop", "pop", "Menus, popovers, dialogs."],
                ] as const
              ).map(([token, name, note]) => (
                <div key={name} className={cn("rounded-xl bg-card p-4", token)}>
                  <p className="font-mono text-2xs text-ink-3">{name}</p>
                  <p className="mt-1 text-sm text-ink-2">{note}</p>
                </div>
              ))}
            </div>
            <p className="pt-1 text-sm leading-relaxed text-ink-3">
              Each shadow&rsquo;s first layer is a 1px ring rather than a border:
              it stays crisp over a photo or gradient where a real border bands,
              and it lets a card sit on the page as an object with weight.
            </p>
          </div>
        </CardBody>
      </Card>

      {/* ---- Type --------------------------------------------------------- */}
      <Card>
        <CardHeader bordered><CardTitle>Typography</CardTitle></CardHeader>
        <CardBody className="space-y-8">
          <div className="space-y-3">
            <p className="text-sm font-medium text-ink-2">
              Display — Inter, tightened. Headlines only; never UI text.
            </p>
            <p className="display-1">Find your next night out</p>
            <p className="display-2">Find your next night out</p>
            <p className="display-3">Find your next night out</p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-ink-2">
              Flourish — Averia Serif Libre. Event titles and the one emphasised
              word in a headline. Never UI text, where its irregular letterforms
              would read as noise.
            </p>
            <p className="display-2 font-flourish">Cairokee — Roots Live</p>
            <p className="display-3">
              Find your next <span className="font-flourish italic">night out</span>
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-ink-2">
              UI — Inter. Every label, control and table cell.
            </p>
            <div className="space-y-1.5">
              {(
                [
                  ["text-xl", "20 · section headings"],
                  ["text-lg", "17 · card and sheet titles"],
                  ["text-md", "15 · reading copy"],
                  ["text-base", "14 · the default control size"],
                  ["text-sm", "13 · secondary UI, dense rows"],
                  ["text-xs", "12 · hints, meta, badges"],
                ] as const
              ).map(([size, note]) => (
                <p key={size} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className={size}>The quick brown fox</span>
                  <span className="font-mono text-2xs text-ink-3">
                    {size} — {note}
                  </span>
                </p>
              ))}
            </div>
            <p className="eyebrow pt-1">Eyebrow · text-2xs</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-ink-2">
              Numerals — tabular throughout, so a column of prices never jitters.
            </p>
            <p className="numeral text-2xl font-semibold text-ink">$1,284.00</p>
            <p className="font-mono text-sm tnum text-ink-2">0123456789 · 0123456789</p>
          </div>
        </CardBody>
      </Card>

      {/* ---- Buttons ------------------------------------------------------ */}
      <Card>
        <CardHeader bordered><CardTitle>Buttons</CardTitle></CardHeader>
        <CardBody className="space-y-6">
          <Row title="Variants" note="One primary action per view. Everything else is quieter than it.">
            <Button variant="primary">Primary</Button>
            <Button variant="solid">Solid</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="soft">Soft</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="accent">Accent</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="danger">Danger soft</Button>
            <Button variant="link">Link</Button>
          </Row>
          <Row title="Sizes">
            <Button variant="primary" size="xs">Extra small</Button>
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="md">Medium</Button>
            <Button variant="primary" size="lg">Large</Button>
            <Button variant="primary" size="xl">Extra large</Button>
          </Row>
          <Row title="States">
            <Button variant="primary" loading>Saving</Button>
            <Button variant="primary" disabled>Disabled</Button>
            <Button variant="outline"><Ticket /> With icon</Button>
            <Button variant="outline" size="icon" aria-label="Share"><Share2 /></Button>
          </Row>
        </CardBody>
      </Card>

      {/* ---- Controls ----------------------------------------------------- */}
      <Card>
        <CardHeader bordered><CardTitle>Form controls</CardTitle></CardHeader>
        <CardBody className="space-y-6">
          <Row title="Text" note="One height token drives every control, so a filter bar lines up.">
            <Input
              className="w-56"
              placeholder="Text input"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <SearchInput className="w-56" placeholder="Search…" />
            <AffixInput className="w-40" prefix="USD" suffix=".00" placeholder="25" />
            <Input className="w-56" placeholder="Invalid" aria-invalid />
          </Row>

          <Row title="Textarea">
            <Textarea className="w-full max-w-lg" rows={3} placeholder="Multi-line…" />
          </Row>

          <Row
            title="Select"
            note="Radix, not a native select: the list is real DOM, so it inherits the surface, radius and dark mode."
          >
            <SelectField
              aria-label="Ticket tier"
              className="w-48"
              value={select}
              onChange={setSelect}
              options={[
                { value: "gold", label: "Gold", hint: "$120" },
                { value: "silver", label: "Silver", hint: "$80" },
                { value: "bronze", label: "Bronze", hint: "$40" },
                { value: "soldout", label: "Sold out", disabled: true },
              ]}
            />
            <SelectField className="w-40" size="sm" value={select} onChange={setSelect}
              options={[{ value: "gold", label: "Small" }, { value: "silver", label: "Silver" }, { value: "bronze", label: "Bronze" }]} />
          </Row>

          <Row
            title="Combobox"
            note="A select you can type into. Use it past roughly a dozen options."
          >
            <Combobox
              className="w-64"
              label="Pick a timezone"
              value={combo}
              onChange={setCombo}
              clearable
              placeholder="Pick a timezone"
              searchPlaceholder="Search timezones…"
              options={[
                { value: "cairo", label: "Egypt Time — Cairo", hint: "GMT+03:00" },
                { value: "london", label: "United Kingdom Time — London", hint: "GMT+01:00" },
                { value: "paris", label: "Central European Time — Paris", hint: "GMT+02:00" },
                { value: "newyork", label: "Eastern Time — New York", hint: "GMT-04:00" },
                { value: "la", label: "Pacific Time — Los Angeles", hint: "GMT-07:00" },
                { value: "dubai", label: "Gulf Standard Time — Dubai", hint: "GMT+04:00" },
              ]}
            />
          </Row>

          <Row
            title="Date and time"
            note="Replaces datetime-local. Same value format, a calendar we control."
          >
            <div className="w-72"><DateTimeField value={when} onChange={setWhen} /></div>
            <div className="w-56"><DateField value={date} onChange={setDate} /></div>
          </Row>

          <Row title="Colour" note="A curated palette — free choice reliably produces yellow on white.">
            <ColorPicker value={colour} onChange={setColour} />
          </Row>

          <Row title="Switch">
            <Switch checked={on} onCheckedChange={setOn} label="Demo switch" />
            <Switch checked={!on} onCheckedChange={() => setOn(!on)} label="Inverse" />
            <Switch checked disabled onCheckedChange={() => {}} label="Disabled" />
          </Row>
        </CardBody>
      </Card>

      {/* ---- Feedback ----------------------------------------------------- */}
      <Card>
        <CardHeader bordered><CardTitle>Status and feedback</CardTitle></CardHeader>
        <CardBody className="space-y-6">
          <Row title="Badges">
            <Badge>Neutral</Badge>
            <Badge tone="solid">Solid</Badge>
            <Badge tone="accent">Accent</Badge>
            <Badge tone="positive">On sale</Badge>
            <Badge tone="caution">Low stock</Badge>
            <Badge tone="critical">Sold out</Badge>
            <Badge tone="info">Draft</Badge>
            <Badge tone="outline">Pill</Badge>
          </Row>
          <Row title="Status dots">
            <StatusDot tone="positive">Published</StatusDot>
            <StatusDot tone="caution">Pending</StatusDot>
            <StatusDot tone="critical">Refunded</StatusDot>
            <StatusDot>Draft</StatusDot>
          </Row>
          <div className="space-y-3">
            <h3 className="text-md font-semibold text-ink">Callouts</h3>
            <Callout tone="caution" title="Location missing">
              Please enter the location of the event before it starts.
            </Callout>
            <Callout tone="critical" title="Payout blocked">
              Connect a Stripe account before you can sell paid tickets.
            </Callout>
            <Callout tone="positive" title="Payouts active">
              Funds settle to your bank two days after each event.
            </Callout>
          </div>
          <div className="-mx-4 sm:-mx-6">
            <Banner action={<Button size="xs" variant="outline">Verify</Button>}>
              Your email is not verified yet.
            </Banner>
          </div>
        </CardBody>
      </Card>

      {/* ---- Data --------------------------------------------------------- */}
      <Card>
        <CardHeader bordered><CardTitle>Data display</CardTitle></CardHeader>
        <CardBody className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Tickets sold" value="1,284" icon={Ticket} delta={{ value: 12.4, suffix: "%" }} />
            <StatTile label="Gross revenue" value="$48,210" icon={CreditCard} delta={{ value: -3.1, suffix: "%" }} />
            <StatTile label="Attendees" value="962" icon={Users} sub="of 1,200 capacity" />
            <StatTile label="Page views" value="18,405" icon={BarChart3} />
          </div>

          <Row title="Shortcut tiles" note="Decorative tints tell one action from another at a glance.">
            {[
              { icon: Send, tone: "blue", label: "Invite guests" },
              { icon: Megaphone, tone: "violet", label: "Send a blast" },
              { icon: Share2, tone: "pink", label: "Share event" },
            ].map(({ icon, tone, label }) => (
              <button
                key={label}
                type="button"
                className="flex flex-1 items-center gap-3 rounded-2xl bg-card shadow-e1 p-4 text-left transition-colors hover:bg-sunken"
              >
                <IconChip icon={icon} tone={tone as "blue"} size="xl" />
                <span className="text-base font-medium text-ink">{label}</span>
              </button>
            ))}
          </Row>

          <Row title="Capacity meter">
            <div className="w-full max-w-sm space-y-3">
              <Meter value={962} max={1200} label="Attendees" tone="accent" />
              <Meter value={1150} max={1200} label="Nearly full" tone="caution" />
            </div>
          </Row>

          <div className="space-y-3">
            <h3 className="text-md font-semibold text-ink">Table</h3>
            <TableWrap className="rounded-xl border border-hairline">
              <Table>
                <THead>
                  <TR>
                    <TH>Attendee</TH><TH>Ticket</TH><TH>Status</TH><TH numeric>Paid</TH>
                  </TR>
                </THead>
                <TBody>
                  {[
                    ["Nour Hassan", "Gold", "positive", "Checked in", "$120.00"],
                    ["Omar Farid", "Silver", "caution", "Not scanned", "$80.00"],
                    ["Layla Mostafa", "Bronze", "critical", "Refunded", "$40.00"],
                  ].map(([name, tier, tone, status, paid]) => (
                    <TR key={name}>
                      <TD className="font-medium">{name}</TD>
                      <TD>{tier}</TD>
                      <TD><StatusDot tone={tone as "positive"}>{status}</StatusDot></TD>
                      <TD numeric>{paid}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </TableWrap>
          </div>

          <Row title="Date block">
            <DateBlock date={DEMO_DATES[0]} />
            <DateBlock date={DEMO_DATES[1]} />
          </Row>
        </CardBody>
      </Card>

      {/* ---- Navigation --------------------------------------------------- */}
      <Card>
        <CardHeader bordered><CardTitle>Navigation</CardTitle></CardHeader>
        <CardBody className="space-y-6">
          <Row title="Steps">
            <div className="w-full max-w-xl">
              <Steps steps={["Tickets", "Details", "Payment", "Done"]} current={1} />
            </div>
          </Row>
          <Row title="Pagination">
            <Pagination page={4} pageCount={12} hrefFor={(p) => `?page=${p}`} />
          </Row>
          <Row title="Keyboard hints">
            <span className="flex items-center gap-1.5 text-sm text-ink-2">
              Open search <Kbd>⌘</Kbd> <Kbd>K</Kbd>
            </span>
          </Row>
        </CardBody>
      </Card>

      {/* ---- Overlays ----------------------------------------------------- */}
      <Card>
        <CardHeader bordered><CardTitle>Overlays</CardTitle></CardHeader>
        <CardBody>
          <Row title="Dialog and sheet" note="Centred dialog on desktop, drag-dismissable sheet on touch.">
            <Button variant="outline" onClick={() => setDialog(true)}>Open dialog</Button>
            <Button variant="outline" onClick={() => setSheet(true)}>Open sheet</Button>
          </Row>
        </CardBody>
      </Card>

      {/* ---- Loading ------------------------------------------------------ */}
      <Card>
        <CardHeader bordered><CardTitle>Loading and empty</CardTitle></CardHeader>
        <CardBody className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <EventCardSkeleton /><EventCardSkeleton /><EventCardSkeleton />
          </div>
          <EmptyState
            icon={CalendarDays}
            title="No events yet"
            description="Create your first event and it will appear here."
            action={<Button variant="primary">Create event</Button>}
          />
        </CardBody>
      </Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Accept payments</DialogTitle>
            <DialogDescription>
              Connect a Stripe account to start selling paid tickets. It takes about five minutes.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Callout tone="info">Payouts land in your own account — we never hold your funds.</Callout>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialog(false)}>Cancel</Button>
            <Button variant="primary">Connect Stripe</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={sheet} onOpenChange={setSheet}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Filter events</SheetTitle>
            <SheetDescription>Narrow the list down to what you are looking for.</SheetDescription>
          </SheetHeader>
          <SheetBody className="space-y-4 py-2">
            <SelectField
              value={select}
              onChange={setSelect}
              options={[
                { value: "gold", label: "Gold" },
                { value: "silver", label: "Silver" },
                { value: "bronze", label: "Bronze" },
              ]}
            />
            <DateField value={date} onChange={setDate} />
          </SheetBody>
          <SheetFooter className="flex gap-2">
            <Button variant="ghost" block onClick={() => setSheet(false)}>Cancel</Button>
            <Button variant="primary" block onClick={() => setSheet(false)}>Apply</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
