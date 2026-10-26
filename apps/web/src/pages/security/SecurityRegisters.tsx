import { Link } from "react-router-dom";
import { Role, entityDef, type EntityDef } from "@bsc/shared";
import { useAuthStore } from "../../store/auth";
import { ResourceRegister } from "../platform/ResourceRegister";
import { IncidentsPanel } from "./IncidentsPanel";

const REGISTERS = ["camera", "securityAlert", "lockdownEvent"];

/** Incidents plus the camera, alert and lockdown registers behind the security dashboard. */
export function SecurityRegisters() {
  const role = useAuthStore((s) => s.user?.role);
  const readOnly = role === Role.CHAIRMAN;
  const canWrite = (entity: EntityDef) => !readOnly && (role === Role.SUPER_ADMIN || (!!role && entity.writeRoles.includes(role as Role)));
  const entities = REGISTERS.map(entityDef).filter((e): e is EntityDef => !!e);

  return (
    <div className="space-y-6">
      <header className="feature-hero">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">Security records</p>
        <h2 className="mt-1 font-display text-4xl font-semibold">Incidents &amp; registers</h2>
        <p className="mt-2 max-w-2xl text-sm text-text-dim">Log and work incidents, and keep the camera list, alert history and lockdown log up to date.</p>
        <Link to="/security" className="mt-4 inline-flex min-h-9 items-center rounded-full border border-[var(--border-strong)] px-4 text-sm text-text-dim hover:border-gold/60 hover:text-text">← Back to dashboard</Link>
      </header>
      <IncidentsPanel readOnly={readOnly} />
      {entities.map((entity) => (
        <ResourceRegister key={entity.key} entity={entity} path={entity.path} fields={entity.fields} canWrite={canWrite(entity)} title={`${entity.label}s`} />
      ))}
    </div>
  );
}
