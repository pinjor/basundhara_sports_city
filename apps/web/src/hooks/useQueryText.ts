import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

/** Local filter state seeded from a URL param (`?q=` by default) so links land pre-filtered. */
export function useQueryText(name = "q") {
  const [params] = useSearchParams();
  const seeded = params.get(name) ?? "";
  const [text, setText] = useState(seeded);
  useEffect(() => setText(seeded), [seeded]);
  return [text, setText] as const;
}
