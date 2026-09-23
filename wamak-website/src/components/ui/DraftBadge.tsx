/** Visible marker for copy that still needs the client's approval. */
export function DraftBadge({ children = "[DRAFT — REQUIRES APPROVAL BY CHAIRMAN/MD]" }: { children?: string }) {
  return (
    <p className="inline-flex rounded-control border border-jute-700 bg-white px-3 py-1.5 text-small font-semibold text-jute-700">
      {children}
    </p>
  );
}
