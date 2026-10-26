import { Role } from "../roles";
import { choice, computed, date, money, num, optText, ref, text } from "./fields";
import type { EntityDef, FeatureDef, ReportDef } from "./types";

export const ITEM_KINDS = ["CONSUMABLE", "EQUIPMENT", "SPARE_PART"] as const;
export const ITEM_UNITS = ["pcs", "box", "kg", "litre", "set", "pair", "roll"] as const;
export const MOVEMENT_KINDS = ["RECEIPT", "ISSUE", "TRANSFER", "ADJUST"] as const;

const entity = (def: Omit<EntityDef, "module" | "writeRoles">): EntityDef => ({ ...def, module: "inventory", writeRoles: [Role.FINANCE_CONTROLLER] });

export const INVENTORY_ENTITIES: EntityDef[] = [
  entity({
    key: "warehouse",
    model: "warehouse",
    label: "Warehouse",
    path: "inventory/warehouses",
    prefix: "WH",
    workflow: "active",
    titleKey: "name",
    partyKey: "location",
    fields: [text("name", "Warehouse"), text("location", "Location"), text("manager", "Manager"), num("capacity", "Capacity (bays)", { required: false })],
  }),
  entity({
    key: "store",
    model: "store",
    label: "Store",
    path: "inventory/stores",
    prefix: "STO",
    workflow: "active",
    titleKey: "name",
    partyKey: "kind",
    fields: [text("name", "Store"), ref("warehouseId", "Warehouse", "warehouse"), choice("kind", "Kind", ["Retail", "Kit room", "Medical", "F&B", "Maintenance"]), text("keeper", "Keeper")],
  }),
  entity({
    key: "itemCategory",
    model: "itemCategory",
    label: "Category",
    path: "inventory/categories",
    prefix: "CAT",
    workflow: "active",
    titleKey: "name",
    partyKey: "description",
    fields: [text("name", "Category"), optText("description", "Description")],
  }),
  entity({
    key: "item",
    model: "item",
    label: "Item",
    path: "inventory/items",
    prefix: "ITM",
    workflow: "active",
    titleKey: "name",
    partyKey: "sku",
    amountKey: "unitCostBdt",
    fields: [
      text("sku", "SKU"),
      text("name", "Item"),
      ref("categoryId", "Category", "itemCategory"),
      choice("kind", "Kind", ITEM_KINDS),
      choice("unit", "Unit", ITEM_UNITS),
      money("unitCostBdt", "Unit cost (BDT)"),
      num("reorderLevel", "Reorder level"),
      computed("onHand", "On hand", "number"),
    ],
  }),
  entity({
    key: "itemTag",
    model: "itemTag",
    label: "Tag",
    path: "inventory/tags",
    prefix: "TAG",
    workflow: "active",
    titleKey: "code",
    partyKey: "kind",
    fields: [ref("itemId", "Item", "item"), choice("kind", "Kind", ["BARCODE", "RFID"]), text("code", "Code"), optText("location", "Location")],
  }),
  entity({
    key: "stockLot",
    model: "stockLot",
    label: "Batch",
    path: "inventory/lots",
    prefix: "LOT",
    workflow: "lot",
    titleKey: "batchNo",
    partyKey: "itemId",
    fields: [
      ref("itemId", "Item", "item"),
      text("batchNo", "Batch no."),
      ref("warehouseId", "Warehouse", "warehouse"),
      num("quantity", "Quantity"),
      date("receivedOn", "Received"),
      date("expiresOn", "Expires", { required: false }),
    ],
  }),
  entity({
    key: "stockMovement",
    model: "stockMovement",
    label: "Stock movement",
    path: "inventory/movements",
    prefix: "MOV",
    workflow: "posting",
    titleKey: "reference",
    partyKey: "kind",
    fields: [
      choice("kind", "Kind", MOVEMENT_KINDS),
      ref("itemId", "Item", "item"),
      ref("warehouseId", "Warehouse", "warehouse"),
      ref("toWarehouseId", "To warehouse", "warehouse", { required: false }),
      num("quantity", "Quantity"),
      optText("reason", "Reason"),
    ],
  }),
];

const movement = (key: string, kind: (typeof MOVEMENT_KINDS)[number], path: string, blurb: string): FeatureDef => ({
  key,
  blurb,
  entity: "stockMovement",
  path: `inventory/${path}`,
  fixed: { kind },
  fields: kind === "TRANSFER" ? ["itemId", "warehouseId", "toWarehouseId", "quantity", "reason"] : ["itemId", "warehouseId", "quantity", "reason"],
});

const itemsOf = (key: string, kind: (typeof ITEM_KINDS)[number], path: string, blurb: string): FeatureDef => ({ key, blurb, entity: "item", path: `inventory/${path}`, fixed: { kind } });

export const INVENTORY_FEATURES: FeatureDef[] = [
  { key: "warehouse-setup", entity: "warehouse", blurb: "Warehouses that hold stock." },
  { key: "store-management", entity: "store", blurb: "Stores and kit rooms served by each warehouse." },
  { key: "item-master", entity: "item", blurb: "Every stocked item. On hand is the total across warehouses." },
  { key: "inventory-category", entity: "itemCategory", blurb: "Item categories." },
  movement("stock-receipt", "RECEIPT", "receipts", "Goods in. Posting adds the quantity to the warehouse."),
  movement("stock-issue", "ISSUE", "issues", "Goods out to a department or event. Posting checks there is enough stock."),
  movement("stock-transfer", "TRANSFER", "transfers", "Move stock between warehouses."),
  movement("stock-adjustment", "ADJUST", "adjustments", "Correct counts after a stock take. Use a negative quantity to write stock off."),
  { key: "barcode-management", entity: "itemTag", path: "inventory/barcodes", fixed: { kind: "BARCODE" }, blurb: "Barcodes printed on items and shelves." },
  { key: "rfid-inventory", entity: "itemTag", path: "inventory/rfid-tags", fixed: { kind: "RFID" }, blurb: "RFID tags on high-value equipment." },
  { key: "batch-tracking", entity: "stockLot", blurb: "Batches received, by warehouse." },
  { key: "expiry-tracking", entity: "stockLot", report: "inventory.expiry", blurb: "Batches that have expired or expire within 60 days." },
  itemsOf("consumable-management", "CONSUMABLE", "consumables", "Consumables such as kit, balls, medical and cleaning supplies."),
  itemsOf("equipment-stock", "EQUIPMENT", "equipment-stock", "Equipment held in stock."),
  itemsOf("spare-parts-inventory", "SPARE_PART", "spare-parts", "Spare parts for venue systems."),
  { key: "minimum-stock-level", entity: "item", report: "inventory.reorder", blurb: "Items at or below their reorder level." },
  { key: "stock-forecasting", report: "inventory.forecast", blurb: "Days of cover from the last 90 days of issues." },
  { key: "inventory-reports", report: "inventory.summary", blurb: "Stock value and quantity by warehouse." },
];

export const INVENTORY_REPORTS: ReportDef[] = [
  { key: "inventory.reorder", label: "Reorder list", module: "inventory", path: "inventory/reports/reorder" },
  { key: "inventory.forecast", label: "Stock forecast", module: "inventory", path: "inventory/reports/forecast" },
  { key: "inventory.summary", label: "Inventory summary", module: "inventory", path: "inventory/reports/summary" },
  { key: "inventory.expiry", label: "Expiry", module: "inventory", path: "inventory/reports/expiry" },
];
