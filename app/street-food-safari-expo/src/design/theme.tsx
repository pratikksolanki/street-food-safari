import { useSystemColorScheme } from "@/lib/use-system-color-scheme";

import { darkPalette, lightPalette, type Palette } from "./palette";
import { duration, radius, shadow, spacing, typography } from "./tokens";

export type Theme = {
  scheme: "light" | "dark";
  colors: Palette;
  spacing: typeof spacing;
  radius: typeof radius;
  shadow: typeof shadow;
  duration: typeof duration;
  typography: typeof typography;
};

const lightTheme: Theme = {
  scheme: "light",
  colors: lightPalette,
  spacing,
  radius,
  shadow,
  duration,
  typography,
};

const darkTheme: Theme = {
  scheme: "dark",
  colors: darkPalette,
  spacing,
  radius,
  shadow,
  duration,
  typography,
};

// Primary hook — every component reads tokens from here. Re-renders when the
// system color scheme flips. We use our own `useSystemColorScheme` wrapper
// because RN's built-in `useColorScheme` is unreliable on Android (see the
// comment in that file).
export function useTheme(): Theme {
  const scheme = useSystemColorScheme();
  return scheme === "dark" ? darkTheme : lightTheme;
}
