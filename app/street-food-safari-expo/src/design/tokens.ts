import type { TextStyle, ViewStyle } from "react-native";

// 4pt spacing grid. Components compose padding/gap from these names only
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
} as const;

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const shadow = {
  none: {} as ViewStyle,
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  } as ViewStyle,
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  } as ViewStyle,
} as const;

export const duration = {
  fast: 150,
  base: 250,
  slow: 400,
} as const;

export type TypographyVariant =
  | "display"
  | "title1"
  | "title2"
  | "title3"
  | "headline"
  | "body"
  | "callout"
  | "subhead"
  | "footnote"
  | "caption"
  | "overline";

export const typography: Record<TypographyVariant, TextStyle> = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: "700", letterSpacing: -0.5 },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: "700", letterSpacing: -0.3 },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: "600", letterSpacing: -0.2 },
  title3: { fontSize: 18, lineHeight: 24, fontWeight: "600" },
  headline: { fontSize: 16, lineHeight: 22, fontWeight: "600" },
  body: { fontSize: 15, lineHeight: 22, fontWeight: "400" },
  callout: { fontSize: 14, lineHeight: 20, fontWeight: "500" },
  subhead: { fontSize: 13, lineHeight: 18, fontWeight: "400" },
  footnote: { fontSize: 12, lineHeight: 16, fontWeight: "500" },
  caption: { fontSize: 11, lineHeight: 14, fontWeight: "500", letterSpacing: 0.2 },
  overline: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
};
