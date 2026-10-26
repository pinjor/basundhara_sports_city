import { useState, type FormEvent } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import { ROLE_LABELS, Role, roleHomePath, type LoginResponseDto } from "@bsc/shared";
import { api } from "../lib/api";
import { EASE } from "../lib/motion";
import { useAuthStore } from "../store/auth";
import { BrandLogo } from "../components/BrandLogo";

const RISE: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

const JOURNEY = ["Play", "Move", "Shop", "Relax", "Connect"] as const;

const DEMO_PASSWORD = "Password123!";

const DEMO_ACCOUNTS = [
  { email: "chairman@bsc.com.bd", role: Role.CHAIRMAN },
  { email: "admin@bsc.com.bd", role: Role.SUPER_ADMIN },
  { email: "bookings@bsc.com.bd", role: Role.BOOKINGS_OFFICER },
  { email: "hrm@bsc.com.bd", role: Role.HR_MANAGER },
  { email: "finance@bsc.com.bd", role: Role.FINANCE_CONTROLLER },
  { email: "security@bsc.com.bd", role: Role.SECURITY_MANAGER },
] as const;

function signInError(error: unknown): string {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  if (status === 401) return "Invalid email or password.";
  if (status === 400) return "Enter a valid email and a password of at least 6 characters.";
  if (status === 429) return "Too many sign-in attempts. Wait a minute and try again.";
  return "Can't reach the server right now. Try again in a moment.";
}

export function Login() {
  const [email, setEmail] = useState("admin@bsc.com.bd");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  async function signIn(nextEmail: string, nextPassword: string) {
    setEmail(nextEmail);
    setPassword(nextPassword);
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<LoginResponseDto>("/auth/login", {
        email: nextEmail,
        password: nextPassword,
      });
      setSession(data, data.user);
      navigate(roleHomePath(data.user.role), { replace: true });
    } catch (err) {
      setError(signInError(err));
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void signIn(email, password);
  }

  return (
    <div className="relative min-h-screen overflow-x-clip bg-bg text-text">
      <img
        src="/login-hero.jpg"
        alt=""
        className="login-hero absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/35" />

      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
        <section className="flex flex-1 flex-col justify-center px-6 py-8 sm:px-10 lg:px-14 lg:py-12 xl:px-20">
          <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } } }}>
            <motion.div variants={RISE}><BrandLogo size="lg" align="start" className="mb-8 drop-shadow-lg lg:mb-10" /></motion.div>
            <motion.p variants={RISE} className="gold-foil mb-3 text-[11px] font-semibold uppercase tracking-[0.32em]">Command Centre</motion.p>
            <motion.h1 variants={RISE} className="font-display text-[2.75rem] font-extrabold leading-[0.9] tracking-wide drop-shadow-[0_8px_28px_rgba(0,0,0,0.55)] sm:text-6xl lg:text-7xl xl:text-[5.25rem]">
              <span className="gold-foil">BASHUNDHARA</span>
              <span className="gold-foil mt-1 block">SPORTS CITY</span>
            </motion.h1>
            <motion.p variants={RISE} className="gold-foil mt-5 max-w-xl font-display text-lg font-semibold tracking-wide sm:text-2xl">
              One App. One City. Endless Possibilities.
            </motion.p>
            <motion.div variants={RISE} className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold tracking-wide">
              {JOURNEY.map((item, i) => (
                <span key={item} className="flex items-center gap-4">
                  <span className="gold-foil">{item}</span>
                  {i < JOURNEY.length - 1 && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-gold-soft" />}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </section>

        <aside className="flex items-end justify-center px-4 pb-8 sm:px-8 lg:w-[440px] lg:items-center lg:border-l lg:border-gold/20 lg:bg-navbar/90 lg:px-10 lg:pb-0 lg:backdrop-blur-2xl xl:w-[480px]">
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0, transition: { duration: 0.7, ease: EASE, delay: 0.25 } }}
            className="w-full max-w-md rounded-2xl border border-gold/25 bg-navbar/90 p-7 shadow-gold lg:max-w-none lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-0">
            <div className="mb-7">
              <div className="gold-line mb-4 h-px w-14" />
              <h2 className="font-display text-3xl font-bold tracking-wide text-text">Staff access</h2>
              <p className="mt-2 text-sm leading-relaxed text-text-dim">
                Sign in to operate the live complex — or click a demo role below.
              </p>
              <Link to="/tickets" className="mt-3 inline-block text-sm text-[var(--brand-gold)]">Buy match tickets</Link>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <label className="block">
                <span className="gold-foil mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em]">
                  Email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                  className="w-full rounded-lg border border-gold/25 bg-search px-4 py-3 text-sm text-text outline-none transition-colors placeholder:text-text-dimmer focus-visible:border-gold-soft"
                />
              </label>
              <label className="block">
                <span className="gold-foil mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em]">
                  Password
                </span>
                <span className="relative block">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full rounded-lg border border-gold/25 bg-search py-3 pl-4 pr-12 text-sm text-text outline-none transition-colors placeholder:text-text-dimmer focus-visible:border-gold-soft"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((shown) => !shown)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    title={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-1 my-auto flex h-10 w-10 items-center justify-center rounded-md text-text-dim transition-colors hover:text-gold-soft focus-visible:text-gold-soft focus-visible:outline focus-visible:outline-1 focus-visible:outline-gold-soft"
                  >
                    <EyeIcon off={showPassword} />
                  </button>
                </span>
              </label>
              {error && <p role="alert" className="text-sm text-red">{error}</p>}
              <button type="submit" disabled={loading} className="gold-btn w-full rounded-lg py-3.5 font-display text-lg font-bold tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? "SIGNING IN…" : "ENTER COMMAND CENTRE"}
              </button>
            </form>

            <div className="mt-5">
              <div className="mb-2 flex items-end justify-between gap-3">
                <p className="gold-foil text-[11px] font-semibold uppercase tracking-[0.18em]">Demo login</p>
                <p className="text-[11px] text-text-dim">
                  Password <span className="text-gold-soft">{DEMO_PASSWORD}</span>
                </p>
              </div>
              <motion.div className="grid grid-cols-2 gap-1.5" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.035, delayChildren: 0.6 } } }}>
                {DEMO_ACCOUNTS.map((account) => {
                  const active = email === account.email;
                  const label = ROLE_LABELS[account.role];
                  return (
                    <motion.button
                      key={account.email}
                      variants={RISE}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      type="button"
                      disabled={loading}
                      title={`${label} · ${account.email}`}
                      aria-label={`${label}, ${account.email}`}
                      onClick={() => void signIn(account.email, DEMO_PASSWORD)}
                      className={`demo-chip flex min-h-9 items-center rounded-md px-2.5 text-left text-xs font-semibold leading-tight disabled:cursor-not-allowed disabled:opacity-50 ${active ? "demo-chip-active" : ""}`}
                    >
                      <span className="truncate">{label}</span>
                    </motion.button>
                  );
                })}
              </motion.div>
            </div>
          </motion.div>
        </aside>
      </div>
    </div>
  );
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M4 4l16 16" />}
    </svg>
  );
}
