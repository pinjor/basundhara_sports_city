import { SessionBookingFlow } from "../../components/booking/SessionBookingFlow";
import { useI18n } from "../../lib/i18n";
import { PublicShell } from "./PublicShell";

export function BookSessionPage() {
  const { t } = useI18n();
  return (
    <PublicShell>
      <h1 className="font-display text-3xl uppercase text-[var(--brand-gold)]">{t("session.venue")}</h1>
      <p className="mt-2 max-w-2xl text-sm text-text-dim">{t("session.holdNote")}</p>
      <div className="mt-6 max-w-2xl">
        <SessionBookingFlow mode="public" />
      </div>
    </PublicShell>
  );
}
