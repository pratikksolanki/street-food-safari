export type Palette = {
  bg: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  divider: string;
  accent: string;
  onAccent: string;
  favorite: string;
  rating: string;
  destructive: string;
  overlay: string;
};

export const lightPalette: Palette = {
  bg: "#FFFFFF",
  surface: "#F7F7F7",
  surfaceElevated: "#FFFFFF",
  text: "#0A0A0A",
  textSecondary: "#737373",
  textTertiary: "#A3A3A3",
  border: "#E5E5E5",
  divider: "#F0F0F0",
  accent: "#0A0A0A",
  onAccent: "#FFFFFF",
  favorite: "#E11D48",
  rating: "#EAB308",
  destructive: "#DC2626",
  overlay: "rgba(0,0,0,0.45)",
};

export const darkPalette: Palette = {
  bg: "#0A0A0A",
  surface: "#171717",
  surfaceElevated: "#262626",
  text: "#FAFAFA",
  textSecondary: "#A3A3A3",
  textTertiary: "#737373",
  border: "#262626",
  divider: "#1F1F1F",
  accent: "#FAFAFA",
  onAccent: "#0A0A0A",
  favorite: "#F43F5E",
  rating: "#FCD34D",
  destructive: "#F87171",
  overlay: "rgba(0,0,0,0.6)",
};
