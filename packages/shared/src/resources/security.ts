import { Role } from "../roles";
import { choice, decimal, flag, notes, optText, ref, stamp, text } from "./fields";
import type { EntityDef } from "./types";

export const SECURITY_ZONES = ["Stadium Zone", "Sports Zone", "Retail Zone", "F&B Zone", "Parking Zone", "Perimeter", "Entrances & Exits"] as const;
export const ALERT_KINDS = ["Unauthorized Access", "Suspicious Activity", "Crowd Density High", "Vehicle Without Pass", "Perimeter Breach", "Camera Offline", "Other"] as const;
export const SEVERITIES = ["Low", "Medium", "High", "Critical"] as const;
export const LOCKDOWN_SCOPES = ["All gates", ...SECURITY_ZONES] as const;

const entity = (def: Omit<EntityDef, "module" | "writeRoles">): EntityDef => ({ ...def, module: "security", writeRoles: [Role.SECURITY_MANAGER] });

export const SECURITY_ENTITIES: EntityDef[] = [
  entity({
    key: "camera",
    model: "camera",
    label: "Camera",
    path: "security/cameras",
    prefix: "CAM",
    workflow: "camera",
    titleKey: "name",
    partyKey: "zone",
    fields: [
      text("name", "Camera"),
      choice("zone", "Zone", SECURITY_ZONES),
      text("location", "Location"),
      optText("imageUrl", "Still image"),
      decimal("mapX", "Map position X (%)", { required: false, list: false }),
      decimal("mapY", "Map position Y (%)", { required: false, list: false }),
    ],
  }),
  entity({
    key: "securityAlert",
    model: "securityAlert",
    label: "Security alert",
    path: "security/alerts",
    prefix: "ALR",
    workflow: "alert",
    titleKey: "kind",
    partyKey: "location",
    fields: [
      choice("kind", "Alert", ALERT_KINDS),
      choice("severity", "Severity", SEVERITIES),
      ref("cameraId", "Camera", "camera", { required: false }),
      text("location", "Location"),
      optText("subject", "Person / vehicle"),
      stamp("acknowledgedAt", "Acknowledged"),
      stamp("resolvedAt", "Resolved"),
      notes(),
    ],
  }),
  entity({
    key: "lockdownEvent",
    model: "lockdownEvent",
    label: "Lockdown",
    path: "security/lockdowns",
    prefix: "LCK",
    workflow: "lockdown",
    titleKey: "reason",
    partyKey: "scope",
    fields: [text("reason", "Reason"), choice("scope", "Scope", LOCKDOWN_SCOPES), flag("drill", "Drill only"), stamp("endedAt", "Ended")],
  }),
];
