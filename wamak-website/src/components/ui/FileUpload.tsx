"use client";

import { useId, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB, UPLOAD_TYPES } from "@/lib/validators";
import { Icon } from "./Icon";

type Props = {
  label: string;
  hint?: string;
  error?: string;
  file: File | null;
  onChange: (file: File | null, error?: string) => void;
};

/**
 * Single-file upload (PDF, JPG, PNG). The native input stays in the
 * accessibility tree; the styled area is its label, so click, keyboard and
 * drag-and-drop all work. Checked here for convenience, and again on the server.
 */
export function FileUpload({ label, hint, error, file, onChange }: Props) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const accept = (f: File | null) => {
    if (!f) return onChange(null);
    if (!(f.type in UPLOAD_TYPES)) return onChange(null, "Upload a PDF, JPG or PNG file.");
    if (f.size > MAX_UPLOAD_BYTES) return onChange(null, `The file is larger than ${MAX_UPLOAD_MB}MB. Send a smaller file, or email it to us.`);
    track("spec_upload", { type: UPLOAD_TYPES[f.type as keyof typeof UPLOAD_TYPES] });
    onChange(f);
  };

  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-small font-semibold text-ink-900" id={`${id}-label`}>
        {label}
      </span>
      {hint && (
        <p id={`${id}-hint`} className="-mt-1 text-small text-ink-600">
          {hint}
        </p>
      )}
      {file ? (
        <div className="flex items-center gap-3 rounded-control border border-field bg-white p-3">
          <Icon name="document" className="shrink-0 text-leaf-700" />
          <p className="min-w-0 flex-1 truncate text-small">
            <span className="font-medium text-ink-900">{file.name}</span>{" "}
            <span className="text-ink-600">({Math.max(1, Math.round(file.size / 1024))} KB)</span>
          </p>
          <button
            type="button"
            onClick={() => {
              if (input.current) input.current.value = "";
              onChange(null);
            }}
            className="inline-flex min-h-11 items-center px-2 text-small font-medium text-ink-600 underline underline-offset-4 hover:text-danger"
          >
            Remove<span className="sr-only"> {file.name}</span>
          </button>
        </div>
      ) : (
        <label
          htmlFor={id}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            accept(e.dataTransfer.files?.[0] ?? null);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-2 rounded-control border border-dashed px-4 py-8 text-center transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-leaf-700",
            drag ? "border-navy-900 bg-mist-100" : "border-field bg-white hover:border-navy-900",
            error && "border-danger",
          )}
        >
          <Icon name="upload" className="text-navy-900" />
          <span className="font-semibold text-navy-900">Upload specification</span>
          <span className="text-small text-ink-600">PDF, JPG or PNG, up to {MAX_UPLOAD_MB}MB. Drag a file here or choose one.</span>
          <input
            ref={input}
            id={id}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            aria-labelledby={`${id}-label`}
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            className="sr-only"
            onChange={(e) => accept(e.target.files?.[0] ?? null)}
          />
        </label>
      )}
      <div aria-live="polite" className="empty:hidden">
        {error && (
          <p id={`${id}-error`} className="flex items-start gap-2 text-small font-medium text-danger">
            <Icon name="alert" size={18} className="mt-px shrink-0" />
            <span>{error}</span>
          </p>
        )}
      </div>
    </div>
  );
}
