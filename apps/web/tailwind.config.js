/** Token colour that still honours opacity modifiers such as `border-gold/20`. */
const token = (name) => `color-mix(in srgb, var(${name}) calc(<alpha-value> * 100%), transparent)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: token("--navbar-bg"),
        navbar: token("--navbar-bg"),
        surface: token("--navbar-bg"),
        "surface-2": token("--search-bg"),
        search: token("--search-bg"),
        border: token("--border-gold"),
        "border-soft": token("--divider"),
        divider: token("--divider"),
        gold: token("--primary-gold"),
        "gold-soft": "#F6C56A",
        teal: token("--status-success"),
        red: token("--status-danger"),
        blue: token("--status-info"),
        text: token("--primary-text"),
        "text-dim": token("--secondary-text"),
        "text-dimmer": token("--secondary-text"),
        hover: token("--hover-bg"),
      },
      borderColor: {
        DEFAULT: "var(--border-subtle)",
      },
      fontFamily: {
        display: ["Rajdhani", "Noto Sans Bengali", "sans-serif"],
        body: ["Inter", "Noto Sans Bengali", "sans-serif"],
        promo: ["Barlow Condensed", "Noto Sans Bengali", "sans-serif"],
      },
      boxShadow: {
        gold: "0 0 0 1px color-mix(in srgb, var(--primary-gold) 28%, transparent), 0 12px 40px rgba(0,0,0,0.55)",
        "gold-sm": "0 0 0 1px color-mix(in srgb, var(--primary-gold) 22%, transparent), 0 8px 24px rgba(0,0,0,0.45)",
      },
    },
  },
  plugins: [],
};
