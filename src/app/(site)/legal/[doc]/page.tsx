import { notFound } from "next/navigation";
import type { Metadata } from "next";

const DOCS = {
  terms: {
    title: "Terms of service",
    body: [
      "These terms cover use of Tazkarti as a ticket buyer and as an event organizer. By creating an account you agree to them.",
      "Organizers are responsible for the events they publish: the description, the pricing, admission, and honouring the refund policy they set. Tazkarti provides the platform and collects a service fee on paid orders; it is not the promoter of any event listed here.",
      "Payments for organizers who have connected Stripe are processed on that organizer's own Stripe account. The organizer is the merchant of record for those sales, and payouts follow their Stripe schedule.",
      "Tickets are personal. Reselling above face value, or presenting a ticket you do not hold, may result in refused admission without a refund.",
      "We may suspend an account that abuses the platform, publishes unlawful content, or attempts to defraud buyers.",
    ],
  },
  privacy: {
    title: "Privacy policy",
    body: [
      "We collect what is needed to sell you a ticket and let you into an event: your name, email address, optional phone number, and the orders and tickets attached to your account.",
      "When you buy a ticket, the organizer of that event can see your name, email and ticket details so they can admit you and contact you about changes to the event.",
      "Card details are handled by Stripe and never touch Tazkarti's servers. We store only the payment reference needed to reconcile and refund an order.",
      "Ticket QR codes carry a server-side secret. Scanning verifies both the code and the secret, so a screenshot of a code cannot be used to admit someone else.",
      "You can update or delete your profile at any time from account settings. Deleting your account removes your profile; order records are retained where an organizer or the law requires them for accounting.",
    ],
  },
} as const;

type DocKey = keyof typeof DOCS;

export async function generateStaticParams() {
  return Object.keys(DOCS).map((doc) => ({ doc }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ doc: string }>;
}): Promise<Metadata> {
  const { doc } = await params;
  const entry = DOCS[doc as DocKey];
  return { title: entry?.title ?? "Not found" };
}

export default async function LegalPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  const entry = DOCS[doc as DocKey];
  if (!entry) notFound();

  return (
    <div className="container-narrow py-14">
      <h1 className="display-2 text-ink">{entry.title}</h1>
      <p className="mt-3 text-sm text-ink-3">
        Last updated {new Date().getFullYear()}. This is a demonstration document and is not legal advice.
      </p>
      <div className="mt-8 space-y-5">
        {entry.body.map((paragraph, index) => (
          <p key={index} className="text-md leading-[1.75] text-ink-2">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}
