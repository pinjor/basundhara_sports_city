import { world } from "./generated/world";

type Pin = { x: number; y: number };

export type Region = {
  id: keyof typeof world.pins;
  name: string;
  /** Label placement relative to the anchor. */
  align: "start" | "end";
};

/** Target regions: markets WAMAK welcomes inquiries from. Not proven markets. */
export const regions: Region[] = [
  { id: "northAmerica", name: "North America", align: "start" },
  { id: "europe", name: "Europe", align: "end" },
  { id: "middleEast", name: "Middle East", align: "end" },
  { id: "africa", name: "Africa", align: "end" },
  { id: "asia", name: "Asia", align: "start" },
];

export const origin: Pin = world.pins.bangladesh;
export const pinFor = (id: Region["id"]): Pin => world.pins[id];
