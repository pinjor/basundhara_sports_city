import { Injectable, type OnModuleInit } from "@nestjs/common";
import { Role } from "@bsc/shared";
import { NotificationService } from "../common/notification.service";
import { assertEditable, fail } from "../common/resource/guards";
import { ResourceHookRegistry } from "../common/resource/resource-hooks";

const MAP_RANGE = { min: 0, max: 100 };

function assertMapPosition(value: unknown) {
  if (value === undefined || value === null) return;
  const n = Number(value);
  if (n < MAP_RANGE.min || n > MAP_RANGE.max) fail("Map positions are percentages between 0 and 100");
}

/** Camera, alert and lockdown rules. Critical alerts and lockdowns notify the security team. */
@Injectable()
export class SecurityHooks implements OnModuleInit {
  constructor(
    private readonly hooks: ResourceHookRegistry,
    private readonly notifications: NotificationService,
  ) {}

  onModuleInit() {
    this.hooks.register("camera", {
      prepare: (data) => {
        assertMapPosition(data.mapX);
        assertMapPosition(data.mapY);
        return data;
      },
    });

    this.hooks.register("securityAlert", {
      prepare: (data, _ctx, existing) => {
        assertEditable(existing, ["OPEN", "ACKNOWLEDGED"]);
        return data;
      },
      afterCreate: async (row, { tx }) => {
        if (row.severity !== "Critical" && row.severity !== "High") return;
        await this.notifications.notify(
          { title: `${row.severity} alert: ${row.kind}`, body: `${row.reference} at ${row.location}.`, href: "/security#incidents", role: Role.SECURITY_MANAGER },
          tx,
        );
      },
      beforeTransition: (_row, to, { user }) => {
        const now = new Date();
        if (to === "ACKNOWLEDGED") return { acknowledgedAt: now, acknowledgedById: user.id };
        if (to === "RESOLVED") return { resolvedAt: now };
      },
    });

    this.hooks.register("lockdownEvent", {
      prepare: async (data, { tx }, existing) => {
        if (existing) fail("A lockdown cannot be edited. End it and start a new one");
        const active = await tx.lockdownEvent.findFirst({ where: { status: "ACTIVE" } });
        if (active) fail(`Lockdown ${active.reference} is already active`);
        return data;
      },
      afterCreate: async (row, { tx }) => {
        await this.notifications.notify(
          {
            title: row.drill ? "Lockdown drill started" : "Lockdown started",
            body: `${row.reference} · ${row.scope}: ${row.reason}`,
            href: "/security",
            role: Role.SECURITY_MANAGER,
          },
          tx,
        );
      },
      beforeTransition: (_row, to) => (to === "ENDED" ? { endedAt: new Date() } : undefined),
    });
  }
}
