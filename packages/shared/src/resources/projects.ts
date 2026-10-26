import { Role } from "../roles";
import { date, money, notes, num, text } from "./fields";
import type { EntityDef } from "./types";

export const PROJECT_ENTITIES: EntityDef[] = [
  {
    key: "project",
    model: "project",
    label: "Project",
    module: "projects",
    path: "projects",
    prefix: "PRJ",
    workflow: "project",
    titleKey: "name",
    partyKey: "owner",
    amountKey: "budgetBdt",
    fields: [text("name", "Project"), text("owner", "Owner"), money("budgetBdt", "Budget (BDT)"), num("progress", "Progress %"), date("dueOn", "Expected completion"), notes()],
    writeRoles: [Role.SUPER_ADMIN],
  },
];
