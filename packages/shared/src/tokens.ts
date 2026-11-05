/**
 * Design tokens — ABG Sports City Digital Management Platform.
 * Title-bar palette: black chrome + #F0AE43 gold.
 */
/** Semantic palette. CSS custom properties in apps/web/src/styles/tokens.css are authoritative at runtime. */
export const colors = {
  bg: "#080B0C",
  surface: "#111A1B",
  surface2: "#182324",
  border: "#70551F",
  borderSoft: "#293532",
  gold: "#D5A32B",
  goldSoft: "#F4C45B",
  goldMuted: "#A97C21",
  teal: "#43C77B",
  red: "#F06464",
  blue: "#4E9AC8",
  dataTeal: "#27AFA9",
  text: "#F7F5EE",
  textDim: "#A9B3B0",
  textDimmer: "#A9B3B0",
  textOnGold: "#080B0C",
} as const;

export const fonts = {
  display: "'Rajdhani', 'Noto Sans Bengali', sans-serif",
  body: "'Inter', 'Noto Sans Bengali', sans-serif",
  promo: "'Barlow Condensed', 'Noto Sans Bengali', sans-serif",
} as const;

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

export const statusToneColor: Record<StatusTone, string> = {
  success: colors.teal,
  warning: colors.gold,
  danger: colors.red,
  info: colors.blue,
  neutral: colors.textDim,
};
