import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <Logo />
      <p className="eyebrow mt-10">404</p>
      <h1 className="display-2 mt-3 text-ink">We could not find that page</h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-2">
        The event may have been unpublished, or the link might be out of date.
      </p>
      <div className="mt-8 flex gap-3">
        <Button asChild variant="solid" size="lg">
          <Link href="/events">Browse events</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
