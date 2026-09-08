"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAsyncAction } from "@/hooks";
import { Button } from "@/components/ui/button";

/**
 * Downloads the organizer's sales report.
 *
 * The PDF is composed in an edge function rather than here: the figures come
 * from `organizer_stats`, which refuses anyone who is not staff, so the
 * document can never contain more than the person asking for it may see.
 */
export function ReportDownload({ slug }: { slug: string }) {
  const download = useAsyncAction(async () => {
    const { data, error } = await createClient().functions.invoke("organizer-report", {
      body: { slug },
    });

    if (error) throw new Error("Could not build the report. Please try again.");

    const blob = data instanceof Blob ? data : new Blob([data as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    try {
      const link = document.createElement("a");
      link.href = url;
      link.download = `${slug}-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      link.click();
    } finally {
      // Revoked on the next frame: Safari needs the URL to survive the click.
      requestAnimationFrame(() => URL.revokeObjectURL(url));
    }

    toast.success("Report downloaded");
  });

  return (
    <Button variant="outline" size="md" loading={download.pending} onClick={() => download.run()}>
      <Download /> Download report
    </Button>
  );
}
