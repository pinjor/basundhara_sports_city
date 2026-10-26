/**
 * Models referenced by registry fields but managed outside the registry:
 * label column, optional detail column, and the sort for pick lists (newest first unless `sort` is set).
 */
export const EXTERNAL_REFS: Record<string, { title: string; detail?: string; sort?: string }> = {
  user: { title: "name" },
  facility: { title: "name" },
  matchEvent: { title: "title", detail: "startsAt" },
  booking: { title: "customerName", detail: "date" },
  gate: { title: "name" },
  equipment: { title: "name" },
  eventPack: { title: "title" },
  surface: { title: "surfaceType" },
  ticketOrder: { title: "reference" },
  ticketCategory: { title: "name", sort: "name" },
};
