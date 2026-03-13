import { COLORS } from "@/lib/colors";

type AdminPalette = {
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
  background: string;
  danger: string;
  black: string;
  grey: string;
  // Backward-compatible aliases used in existing dashboard code
  blue: string;
  green: string;
  lightGrey: string;
  mediumGrey: string;
  greyBlue: string;
  greyGreen: string;
  red: string;
};

const LIGHT_ADMIN_PALETTE: AdminPalette = {
  primary: COLORS.primary,
  secondary: COLORS.secondary,
  accent: COLORS.accent,
  neutral: COLORS.neutral,
  background: COLORS.background,
  danger: COLORS.danger,
  black: COLORS.black,
  grey: COLORS.grey,
  blue: COLORS.primary,
  green: COLORS.secondary,
  lightGrey: COLORS.neutral,
  mediumGrey: COLORS.grey,
  greyBlue: COLORS.grey,
  greyGreen: COLORS.neutral,
  red: COLORS.danger,
};

const DARK_SAFE_ADMIN_PALETTE: AdminPalette = {
  // Dark mode: keep palette calm and low-saturation.
  primary: COLORS.white,
  secondary: COLORS.neutral,
  accent: COLORS.grey,
  neutral: COLORS.grey,
  background: COLORS.black,
  danger: COLORS.danger,
  // In dark mode, readable foreground should flip to white.
  black: COLORS.white,
  grey: COLORS.grey,
  blue: COLORS.grey,
  green: COLORS.secondary,
  lightGrey: COLORS.grey,
  mediumGrey: COLORS.grey,
  greyBlue: COLORS.grey,
  greyGreen: COLORS.grey,
  red: COLORS.danger,
};

export const getAdminDashboardPalette = (isDarkMode: boolean): AdminPalette =>
  isDarkMode ? DARK_SAFE_ADMIN_PALETTE : LIGHT_ADMIN_PALETTE;

export const ADMIN_DASHBOARD_COLORS = LIGHT_ADMIN_PALETTE;
