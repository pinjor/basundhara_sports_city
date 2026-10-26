import type { Seeder } from "./app";
import { daysFromToday } from "./util";

const iso = (offset: number) => daysFromToday(offset).toISOString().slice(0, 10);

const WAREHOUSES = [
  { name: "Central Warehouse", location: "Service Block B, Level -1", manager: "Kamal Uddin", capacity: 240 },
  { name: "Stadium Kit Store", location: "Central Stadium, West Wing", manager: "Rina Akter", capacity: 80 },
  { name: "Aquatics Plant Room", location: "Aquatic Centre, Basement", manager: "Habib Mia", capacity: 40 },
];

const CATEGORIES = [
  { name: "Sports Equipment", description: "Balls, nets, goals and training kit" },
  { name: "Cleaning & Hygiene", description: "Janitorial supplies" },
  { name: "Pool Chemicals", description: "Water treatment for the aquatic centre" },
  { name: "Electrical Spares", description: "Floodlight and power spares" },
  { name: "Medical", description: "First aid and physio consumables" },
];

/** [sku, name, category index, kind, unit, unit cost, reorder level, opening stock per warehouse index] */
const ITEMS: [string, string, number, string, string, number, number, Record<number, number>][] = [
  ["EQ-FB-05", "Match football (size 5)", 0, "EQUIPMENT", "pcs", 4_500, 40, { 0: 60, 1: 24 }],
  ["EQ-CR-BAT", "Cricket bat (English willow)", 0, "EQUIPMENT", "pcs", 18_000, 10, { 1: 8 }],
  ["EQ-NET-FB", "Goal net pair", 0, "EQUIPMENT", "pair", 12_500, 4, { 0: 6 }],
  ["CL-DET-20", "Floor detergent 20L", 1, "CONSUMABLE", "litre", 2_200, 30, { 0: 45 }],
  ["CL-TIS-48", "Tissue rolls (48)", 1, "CONSUMABLE", "box", 1_450, 25, { 0: 18 }],
  ["PC-CHL-25", "Chlorine granules 25kg", 2, "CONSUMABLE", "kg", 7_800, 12, { 2: 14 }],
  ["PC-PH-10", "pH reducer 10kg", 2, "CONSUMABLE", "kg", 3_900, 8, { 2: 5 }],
  ["EL-LED-1K", "LED floodlight module 1kW", 3, "SPARE_PART", "pcs", 65_000, 6, { 0: 9 }],
  ["EL-CTR-40", "Contactor 40A", 3, "SPARE_PART", "pcs", 5_600, 10, { 0: 7 }],
  ["MD-KIT-01", "First aid kit (standard)", 4, "CONSUMABLE", "set", 3_200, 20, { 0: 26, 1: 6 }],
];

const VENDORS = [
  { name: "Dhaka Sports Supplies", category: "Equipment", contactPerson: "Arif Hossain", phone: "+880 1711-200300", email: "sales@dhakasports.com.bd" },
  { name: "Green Turf Solutions", category: "Services", contactPerson: "Nadia Islam", phone: "+880 1819-445566", email: "ops@greenturf.com.bd" },
  { name: "PowerGrid Electricals", category: "Utilities", contactPerson: "Mahbub Alam", phone: "+880 1552-778899", email: "orders@powergrid.com.bd" },
  { name: "AquaChem Bangladesh", category: "Supplies", contactPerson: "Selina Parvin", phone: "+880 1677-123123", email: "info@aquachem.com.bd" },
  { name: "CleanPro BD", category: "Supplies", contactPerson: "Rubel Sarkar", phone: "+880 1913-909090", email: "hello@cleanpro.com.bd" },
];

export async function seedSupply(seeder: Seeder): Promise<void> {
  if (!(await seeder.empty("warehouse"))) return;
  const finance = await seeder.actor("finance@bsc.com.bd");
  const rec = (key: string, input: Record<string, unknown>, moves: string[] = []) => seeder.record(key, finance, input, moves);

  const warehouses: Awaited<ReturnType<typeof rec>>[] = [];
  for (const warehouse of WAREHOUSES) warehouses.push(await rec("warehouse", warehouse));
  await rec("store", { name: "Team Kit Room", warehouseId: warehouses[1]!.id, kind: "Kit room", keeper: "Rina Akter" });
  await rec("store", { name: "Medical Bay Store", warehouseId: warehouses[0]!.id, kind: "Medical", keeper: "Dr. Faria Haque" });
  await rec("store", { name: "Maintenance Workshop", warehouseId: warehouses[0]!.id, kind: "Maintenance", keeper: "Kamal Uddin" });

  const categories: Awaited<ReturnType<typeof rec>>[] = [];
  for (const category of CATEGORIES) categories.push(await rec("itemCategory", category));

  const items: Awaited<ReturnType<typeof rec>>[] = [];
  for (const [sku, name, category, kind, unit, cost, reorderLevel, opening] of ITEMS) {
    const item = await rec("item", { sku, name, categoryId: categories[category]!.id, kind, unit, unitCostBdt: cost, reorderLevel });
    items.push(item);
    for (const [index, quantity] of Object.entries(opening)) {
      await rec("stockMovement", { kind: "RECEIPT", itemId: item.id, warehouseId: warehouses[Number(index)]!.id, quantity, reason: "Opening balance" }, ["POSTED"]);
    }
  }
  const item = (sku: string) => items[ITEMS.findIndex(([code]) => code === sku)]!;

  await rec("itemTag", { itemId: item("EL-LED-1K").id, kind: "RFID", code: "RF-00A1-LED", location: "Central Warehouse · Rack E2" });
  await rec("itemTag", { itemId: item("EQ-FB-05").id, kind: "BARCODE", code: "8901234500051", location: "Stadium Kit Store · Bin 3" });
  await rec("stockLot", { itemId: item("PC-CHL-25").id, batchNo: "CHL-2609-A", warehouseId: warehouses[2]!.id, quantity: 14, receivedOn: iso(-50), expiresOn: iso(40) });
  await rec("stockLot", { itemId: item("MD-KIT-01").id, batchNo: "FAK-2604-B", warehouseId: warehouses[0]!.id, quantity: 26, receivedOn: iso(-160), expiresOn: iso(200) });
  await rec("stockMovement", { kind: "ISSUE", itemId: item("CL-DET-20").id, warehouseId: warehouses[0]!.id, quantity: 20, reason: "Monthly cleaning issue" }, ["POSTED"]);
  await rec("stockMovement", { kind: "ISSUE", itemId: item("EQ-FB-05").id, warehouseId: warehouses[1]!.id, quantity: 6, reason: "Academy training" }, ["POSTED"]);
  await rec("stockMovement", { kind: "TRANSFER", itemId: item("MD-KIT-01").id, warehouseId: warehouses[0]!.id, toWarehouseId: warehouses[1]!.id, quantity: 4, reason: "Match-day medical cover" }, ["POSTED"]);

  const vendors: Awaited<ReturnType<typeof rec>>[] = [];
  for (const vendor of VENDORS) vendors.push(await rec("vendor", vendor));
  const [sports, turf, power, aqua, clean] = vendors;

  await rec("procurementBudget", { name: "Facilities spares FY26", department: "Facilities", period: "FY2026", amountBdt: 2_500_000 }, ["APPROVED"]);
  await rec("procurementBudget", { name: "Operations supplies Q4", department: "Operations", period: "2026-Q4", amountBdt: 900_000 }, ["APPROVED"]);
  await rec("procurementBudget", { name: "Events equipment Q4", department: "Events", period: "2026-Q4", amountBdt: 1_200_000 });

  // Full cycle: request -> approval -> order -> delivery -> match -> vendor bill.
  const floodlights = await rec(
    "purchaseRequest",
    { title: "Replacement floodlight modules", department: "Facilities", requestedBy: "Kamal Uddin", itemId: item("EL-LED-1K").id, quantity: 4, estimatedBdt: 260_000, neededBy: iso(14) },
    ["SUBMITTED"],
  );
  const approval = await seeder.prisma.approvalRequest.findFirstOrThrow({ where: { sourceType: "purchaseRequest", sourceId: floodlights.id } });
  await moveApproval(seeder, approval.id, "APPROVED");
  const po = await rec(
    "purchaseOrder",
    { vendorId: power!.id, itemId: item("EL-LED-1K").id, quantity: 4, unitPriceBdt: 63_500, warehouseId: warehouses[0]!.id, expectedOn: iso(-3), purchaseRequestId: floodlights.id },
    ["ISSUED"],
  );
  await rec("delivery", { purchaseOrderId: po.id, carrier: "Sundarban Courier", trackingNo: "SC-884120", quantity: 4, expectedOn: iso(-3) }, ["IN_TRANSIT", "DELIVERED"]);
  await rec("invoiceMatch", { purchaseOrderId: po.id, vendorInvoiceNo: "PGE-2026-1182", invoicedQty: 4, invoicedBdt: 254_000 }, ["APPROVED"]);

  // In flight.
  const chlorine = await rec(
    "purchaseRequest",
    { title: "Pool chlorine restock", department: "Operations", requestedBy: "Habib Mia", itemId: item("PC-CHL-25").id, quantity: 20, estimatedBdt: 156_000, neededBy: iso(7), emergency: true },
    ["SUBMITTED"],
  );
  const chlorineApproval = await seeder.prisma.approvalRequest.findFirstOrThrow({ where: { sourceType: "purchaseRequest", sourceId: chlorine.id } });
  await moveApproval(seeder, chlorineApproval.id, "APPROVED");
  const poChlorine = await rec(
    "purchaseOrder",
    { vendorId: aqua!.id, itemId: item("PC-CHL-25").id, quantity: 20, unitPriceBdt: 7_650, warehouseId: warehouses[2]!.id, expectedOn: iso(4), purchaseRequestId: chlorine.id },
    ["ISSUED"],
  );
  await rec("delivery", { purchaseOrderId: poChlorine.id, carrier: "AquaChem fleet", quantity: 20, expectedOn: iso(4) }, ["IN_TRANSIT"]);
  await rec(
    "purchaseRequest",
    { title: "Tissue and hygiene restock", department: "Operations", requestedBy: "Rubel Sarkar", itemId: item("CL-TIS-48").id, quantity: 40, estimatedBdt: 58_000, neededBy: iso(10) },
    ["SUBMITTED"],
  );
  await rec("purchaseRequest", { title: "Academy footballs", department: "Events", requestedBy: "Rina Akter", itemId: item("EQ-FB-05").id, quantity: 50, estimatedBdt: 225_000, neededBy: iso(30) });

  // Sourcing.
  const rfq = await rec("rfq", { title: "Footballs for youth league", itemId: item("EQ-FB-05").id, quantity: 50, closesOn: iso(12) });
  await rec("quotation", { rfqId: rfq.id, vendorId: sports!.id, unitPriceBdt: 4_300, quantity: 50, deliveryDays: 7, validUntil: iso(30) }, ["SHORTLISTED"]);
  await rec("quotation", { rfqId: rfq.id, vendorId: clean!.id, unitPriceBdt: 4_750, quantity: 50, deliveryDays: 12, validUntil: iso(25) });
  const tender = await rec("tender", { title: "Pitch renovation, Training Ground 2", category: "Construction", estimatedBdt: 8_500_000, publishedOn: iso(-20), closesOn: iso(5) }, ["EVALUATION"]);
  await rec("tenderBid", { tenderId: tender.id, vendorId: turf!.id, bidBdt: 8_120_000, technicalScore: 86 }, ["SHORTLISTED"]);
  await rec("tenderBid", { tenderId: tender.id, vendorId: sports!.id, bidBdt: 7_640_000, technicalScore: 71 });
  await rec("supplierEvaluation", { vendorId: power!.id, quality: 5, price: 4, delivery: 4, notes: "Floodlight order on time" }, ["SELECTED"]);
  await rec("supplierEvaluation", { vendorId: aqua!.id, quality: 4, price: 4, delivery: 3 }, ["SELECTED"]);
  await rec("supplierEvaluation", { vendorId: sports!.id, rfqId: rfq.id, quality: 4, price: 5, delivery: 4 });
  await rec("contract", { title: "Turf maintenance retainer", vendorId: turf!.id, startsOn: iso(-120), endsOn: iso(245), valueBdt: 4_800_000 }, ["ACTIVE"]);
  await rec("contract", { title: "Cleaning supplies framework", vendorId: clean!.id, startsOn: iso(10), endsOn: iso(375), valueBdt: 1_100_000 });
}

/** Decides a purchase approval through the service so the request moves with it. */
async function moveApproval(seeder: Seeder, id: string, status: string) {
  const finance = await seeder.actor("finance@bsc.com.bd");
  await seeder.move("approvalRequest", id, status, finance);
}
