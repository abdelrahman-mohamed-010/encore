"use client";

import * as React from "react";
import Image from "next/image";
import { ImagePlus, Trash2, UploadCloud } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useAsyncAction } from "@/hooks";
import { cn } from "@/lib/utils";

/**
 * Upload an image to the `media` bucket and hand back its public URL.
 *
 * Replaces asking an organizer to paste a URL to a file they host elsewhere,
 * which breaks the moment that host expires or hotlink-blocks us.
 *
 * The value stays a plain URL string, so every consumer — the zod schema, the
 * events table, the `<Image>` on the public page — is unchanged, and an event
 * created before this existed still renders.
 */

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

export type MediaFolder = "avatars" | "organizers" | "events";

/** Mirrors the path convention the storage policies enforce. */
function objectPath(folder: MediaFolder, ownerId: string, file: File) {
  const extension = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  // A fresh name per upload: overwriting in place would leave already-rendered
  // pages pointing at a CDN-cached version of the old image.
  const unique = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return `${folder}/${ownerId}/${unique}.${extension || "jpg"}`;
}

export function ImageUpload({
  value,
  onChange,
  folder,
  ownerId,
  label = "Image",
  hint,
  aspect = "aspect-[16/10]",
  disabled,
  className,
}: {
  value: string;
  onChange: (url: string) => void;
  folder: MediaFolder;
  /** The user id or organizer id that owns this path. */
  ownerId: string;
  label?: string;
  hint?: string;
  aspect?: string;
  disabled?: boolean;
  className?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);

  const upload = useAsyncAction(async (file: File) => {
    if (!ACCEPTED.includes(file.type)) {
      throw new Error("Use a JPEG, PNG, WebP, AVIF or GIF image.");
    }
    if (file.size > MAX_BYTES) {
      throw new Error(`That image is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 5 MB.`);
    }

    const supabase = createClient();
    const path = objectPath(folder, ownerId, file);

    const { error } = await supabase.storage.from("media").upload(path, file, {
      cacheControl: "31536000",
      upsert: false,
    });

    if (error) {
      throw new Error(
        // The policy rejects a path the caller does not own; say what that
        // actually means rather than surfacing "new row violates ...".
        /policy|unauthorized/i.test(error.message)
          ? "You do not have permission to upload for this organizer."
          : error.message,
      );
    }

    const { data } = supabase.storage.from("media").getPublicUrl(path);
    onChange(data.publicUrl);
  });

  function take(files: FileList | null) {
    const file = files?.[0];
    if (file) void upload.run(file);
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!disabled) take(event.dataTransfer.files);
        }}
        className={cn(
          "relative overflow-hidden rounded-lg border border-dashed border-hairline bg-sunken transition-colors",
          aspect,
          dragging && "border-focus bg-sunken-2",
          disabled && "opacity-60",
        )}
      >
        {value ? (
          <>
            <Image
              src={value}
              alt=""
              fill
              sizes="(min-width: 640px) 28rem, 100vw"
              className="object-cover"
              // A pasted third-party URL may be unreachable; without this the
              // optimiser turns a broken link into a 500 on the whole page.
              unoptimized={!value.includes("/storage/v1/object/public/")}
            />
            <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-linear-to-t from-black/60 to-transparent p-2">
              <Button
                type="button"
                variant="soft"
                size="sm"
                disabled={disabled || upload.pending}
                onClick={() => inputRef.current?.click()}
              >
                <UploadCloud /> Replace
              </Button>
              <Button
                type="button"
                variant="soft"
                size="icon-sm"
                aria-label={`Remove ${label.toLowerCase()}`}
                disabled={disabled || upload.pending}
                onClick={() => onChange("")}
              >
                <Trash2 />
              </Button>
            </div>
          </>
        ) : (
          <button
            type="button"
            disabled={disabled || upload.pending}
            onClick={() => inputRef.current?.click()}
            className="flex size-full flex-col items-center justify-center gap-2 text-center transition-colors hover:bg-sunken-2"
          >
            <ImagePlus className="size-5 text-ink-3" aria-hidden />
            <span className="text-sm font-medium text-ink">
              {upload.pending ? "Uploading…" : `Upload ${label.toLowerCase()}`}
            </span>
            <span className="px-4 text-xs text-ink-3">
              {hint ?? "Drag an image here, or click to choose. Up to 5 MB."}
            </span>
          </button>
        )}

        {upload.pending && (
          <div className="absolute inset-0 grid place-items-center bg-card/70">
            <span className="text-sm font-medium text-ink">Uploading…</span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="sr-only"
        aria-label={`${label} file`}
        onChange={(event) => {
          take(event.target.files);
          // Reset so choosing the same file twice still fires a change.
          event.target.value = "";
        }}
      />

      {upload.error && <p className="text-xs text-critical">{upload.error}</p>}
    </div>
  );
}
