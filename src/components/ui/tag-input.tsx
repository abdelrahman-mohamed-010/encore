"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { MAX_TAGS, MAX_TAG_LENGTH, normaliseTags, splitTags } from "@/lib/validation/common";
import { cn } from "@/lib/utils";

/**
 * Tag entry.
 *
 * Committed tags are chips inside the field rather than text the organiser has
 * to punctuate correctly, so "rock, live" can never be stored as one tag named
 * "rock, live". Typing filters tags the platform already uses — reusing an
 * existing spelling is one keystroke, inventing a near-duplicate takes a
 * deliberate second one — which is what keeps tag search worth having.
 *
 * The field is the same filled slab as `Input`: grey at rest, lifting to the
 * card colour with a focus ring, so a form of these still reads as one column.
 */

const MAX_SUGGESTIONS = 8;

type Option = { label: string; isNew: boolean };

export function TagInput({
  value,
  onChange,
  suggestions = [],
  placeholder = "Add a tag…",
  max = MAX_TAGS,
  disabled,
  id,
  onBlur,
  ref,
  className,
  "aria-invalid": ariaInvalid,
  "aria-describedby": describedBy,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  /** Tags already in use elsewhere, offered as you type. */
  suggestions?: string[];
  placeholder?: string;
  max?: number;
  disabled?: boolean;
  id?: string;
  onBlur?: () => void;
  /** Forwarded to the text input, so a form library can focus it on error. */
  ref?: React.Ref<HTMLInputElement>;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  const [draft, setDraft] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listId = React.useId();

  // Kept locally for focus handling and handed to the caller's ref as well.
  function captureInput(node: HTMLInputElement | null) {
    inputRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  }

  const full = value.length >= max;
  const draftTag = draft.trim().replace(/\s+/g, " ");

  const options = React.useMemo<Option[]>(() => {
    if (full) return [];

    const taken = new Set(value.map((tag) => tag.toLowerCase()));
    const query = draftTag.toLowerCase();

    const matches = suggestions
      .filter((tag) => !taken.has(tag.toLowerCase()))
      .filter((tag) => !query || tag.toLowerCase().includes(query))
      .slice(0, MAX_SUGGESTIONS)
      .map((label) => ({ label, isNew: false }));

    // Offer the typed text as a new tag unless it already exists somewhere —
    // an exact match is reachable through the suggestion above it.
    const exists =
      taken.has(query) || matches.some((option) => option.label.toLowerCase() === query);

    return draftTag && !exists ? [...matches, { label: draftTag, isNew: true }] : matches;
  }, [suggestions, value, draftTag, full]);

  // Clamped rather than trusted: the list shrinks as tags are added, and a
  // stale index would commit the wrong tag on Enter.
  const activeIndex = Math.min(active, Math.max(options.length - 1, 0));

  function edit(next: string) {
    setDraft(next);
    // The list is rebuilt under a new query, so the old highlight means nothing.
    setActive(0);
  }

  function add(tag: string) {
    onChange(normaliseTags([...value, tag]).slice(0, max));
    edit("");
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
    inputRef.current?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case "Enter": {
        const option = options[activeIndex];
        // With nothing to commit, Enter belongs to the form as it would in any
        // other field.
        if (!option) return;
        event.preventDefault();
        add(option.label);
        return;
      }
      case ",": {
        event.preventDefault();
        if (draftTag && !full) add(draftTag);
        return;
      }
      case "Backspace": {
        if (draft || value.length === 0) return;
        event.preventDefault();
        removeAt(value.length - 1);
        return;
      }
      case "ArrowDown": {
        if (options.length === 0) return;
        event.preventDefault();
        setOpen(true);
        setActive((activeIndex + 1) % options.length);
        return;
      }
      case "ArrowUp": {
        if (options.length === 0) return;
        event.preventDefault();
        setActive((activeIndex - 1 + options.length) % options.length);
        return;
      }
      case "Escape": {
        if (!open) return;
        event.preventDefault();
        setOpen(false);
      }
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const text = event.clipboardData.getData("text");
    // A single tag is left to type itself in, so it can still be edited.
    if (!/[,\n]/.test(text)) return;
    event.preventDefault();
    onChange(normaliseTags([...value, ...splitTags(text)]).slice(0, max));
    edit("");
  }

  function handleBlur(event: React.FocusEvent<HTMLDivElement>) {
    // Moving between the chips and the input is not leaving the field.
    if (event.currentTarget.contains(event.relatedTarget)) return;
    setOpen(false);
    // Text left in the box is a tag the organiser meant to add.
    if (draftTag && !full) add(draftTag);
    onBlur?.();
  }

  return (
    <div className={cn("relative", className)} onBlur={handleBlur}>
      <div
        onMouseDown={(event) => {
          // Clicking the padding focuses the input rather than doing nothing,
          // which is what makes the whole slab feel like one field.
          if (event.target === event.currentTarget) {
            event.preventDefault();
            inputRef.current?.focus();
          }
        }}
        className={cn(
          "flex min-h-(--size-field) w-full flex-wrap items-center gap-1.5 rounded-md bg-sunken p-1.5",
          "transition-[background-color,box-shadow] duration-150",
          "hover:bg-sunken-2",
          "focus-within:bg-card focus-within:shadow-[0_0_0_2px_var(--color-focus)] focus-within:hover:bg-card",
          ariaInvalid && "bg-card shadow-[0_0_0_2px_var(--color-critical)]",
          disabled && "cursor-not-allowed opacity-55 hover:bg-sunken",
        )}
      >
        {value.map((tag, index) => (
          <span
            key={tag}
            className="inline-flex h-8 items-center gap-1 rounded-lg bg-card pl-2.5 pr-1 text-sm font-medium text-ink shadow-e1"
          >
            {tag}
            <button
              type="button"
              disabled={disabled}
              aria-label={`Remove ${tag}`}
              onClick={() => removeAt(index)}
              className="grid size-5 place-items-center rounded-[5px] text-ink-3 transition-colors hover:bg-btn hover:text-ink disabled:pointer-events-none"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </span>
        ))}

        <input
          ref={captureInput}
          id={id}
          value={draft}
          disabled={disabled || full}
          placeholder={full ? `${max} tags is the maximum` : placeholder}
          maxLength={MAX_TAG_LENGTH}
          autoComplete="off"
          role="combobox"
          aria-expanded={open && options.length > 0}
          aria-controls={open && options.length > 0 ? listId : undefined}
          aria-activedescendant={
            open && options.length > 0 ? `${listId}-${activeIndex}` : undefined
          }
          aria-invalid={ariaInvalid}
          aria-describedby={describedBy}
          onChange={(event) => {
            edit(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          className="h-8 min-w-32 flex-1 bg-transparent px-1.5 text-md text-ink placeholder:text-ink-3 outline-none disabled:cursor-not-allowed"
        />
      </div>

      {open && options.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="surface-pop absolute z-50 mt-1.5 max-h-64 w-full overflow-y-auto overscroll-contain p-1.5"
        >
          {options.map((option, index) => (
            <li
              key={`${option.isNew ? "new" : "tag"}:${option.label}`}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              data-highlighted={index === activeIndex ? "" : undefined}
              className="pop-item"
              onMouseMove={() => setActive(index)}
              // Keep focus in the input so the field never blurs mid-click.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => add(option.label)}
            >
              {option.isNew ? (
                <>
                  <Plus className="size-4 shrink-0 text-ink-3" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">
                    Add <span className="font-semibold">{option.label}</span>
                  </span>
                </>
              ) : (
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
