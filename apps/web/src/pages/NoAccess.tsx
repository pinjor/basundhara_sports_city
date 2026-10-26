import { ROLE_LABELS, type Role } from "@bsc/shared";
import { useAuthStore } from "../store/auth";
import { signOut } from "../lib/api";

/** Shown to signed-in roles that have no module of their own, instead of redirecting forever. */
export function NoAccess() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ? (ROLE_LABELS[user.role as Role] ?? user.role) : "This account";
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <div className="w-full max-w-md panel p-6 text-center">
        <h1 className="mb-2 font-display text-xl font-semibold text-text">No workspace assigned</h1>
        <p className="mb-5 text-sm text-text-dim">
          {role} does not have access to any module yet. Ask the system administrator to assign one, or sign in with a different account.
        </p>
        <button type="button" onClick={signOut} className="min-h-[40px] rounded-md bg-gold px-4 text-sm font-semibold text-black">
          Sign out
        </button>
      </div>
    </div>
  );
}
