"use client";

import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/Button";
import { track } from "@/lib/analytics";
import { rfq, useRfqList, type RfqItem } from "@/lib/rfq-store";
import { ui } from "@/lib/ui-store";

type Props = {
  item: RfqItem;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

/** Toggles a product on the RFQ list. Not a cart: no price, no checkout language. */
export function AddToRfqButton({ item, variant = "secondary", size = "sm", className }: Props) {
  const items = useRfqList();
  const added = rfq.has(items, item);

  return (
    <Button
      variant={variant}
      size={size}
      icon={added ? "check" : "addToList"}
      aria-pressed={added}
      aria-label={added ? `${item.name} is on your RFQ list. Remove it` : `Add ${item.name} to your RFQ list`}
      className={className}
      onClick={() => {
        if (added) {
          rfq.remove(item);
        } else {
          rfq.add(item);
          ui.toast(`${item.name} added to your RFQ list.`);
          track("add_to_rfq", { product: item.slug, category: item.category });
        }
      }}
    >
      {added ? "Added to RFQ" : "Add to RFQ"}
    </Button>
  );
}
