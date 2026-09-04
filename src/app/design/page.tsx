import type { Metadata } from "next";
import { DesignGallery } from "./gallery";

export const metadata: Metadata = {
  title: "Design system",
  description: "Every token and component in the Tazkarti interface, on one page.",
  robots: { index: false, follow: false },
};

export default function DesignPage() {
  return <DesignGallery />;
}
