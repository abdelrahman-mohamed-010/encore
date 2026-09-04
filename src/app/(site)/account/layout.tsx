import Link from "next/link";
import { Heart, Receipt, Settings, Ticket } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { Avatar } from "@/components/ui/misc";

const TABS = [
  { href: "/account/tickets", label: "Tickets", icon: Ticket },
  { href: "/account/orders", label: "Orders", icon: Receipt },
  { href: "/account/saved", label: "Saved", icon: Heart },
  { href: "/account/settings", label: "Settings", icon: Settings },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();

  return (
    <div className="container-page py-10 md:py-12">
      <header className="flex items-center gap-4">
        <Avatar src={profile.avatar_url} name={profile.full_name ?? profile.email} size="xl" />
        <div className="min-w-0">
          <h1 className="display-3 truncate text-ink">{profile.full_name ?? "Your account"}</h1>
          <p className="mt-1 truncate text-base text-ink-3">{profile.email}</p>
        </div>
      </header>

      <nav className="mt-8 flex items-center gap-6 overflow-x-auto border-b border-hairline no-scrollbar">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 border-transparent pb-2.5 text-base font-medium text-ink-3 transition-colors hover:text-ink-2"
          >
            <tab.icon className="size-4" />
            {tab.label}
          </Link>
        ))}
      </nav>

      <div className="mt-8">{children}</div>
    </div>
  );
}
