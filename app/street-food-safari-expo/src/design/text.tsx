import { forwardRef } from "react";
import { Text as RNText, type TextProps as RNTextProps } from "react-native";

import { useTheme } from "./theme";
import type { TypographyVariant } from "./tokens";

export type TextColor =
  | "text"
  | "secondary"
  | "tertiary"
  | "accent"
  | "favorite"
  | "rating"
  | "destructive"
  | "onAccent";

export type TextProps = RNTextProps & {
  variant?: TypographyVariant;
  color?: TextColor;
  numeric?: boolean;
};

// Single Text primitive. Variant controls font scale; color pulls from theme
// palette. `numeric` adds tabular-nums for stable digit widths on prices and
// rating numbers.
export const Text = forwardRef<RNText, TextProps>(function Text(
  { variant = "body", color = "text", numeric, style, ...rest },
  ref,
) {
  const theme = useTheme();
  const colorValue = resolveColor(theme.colors, color);
  return (
    <RNText
      ref={ref}
      {...rest}
      style={[
        theme.typography[variant],
        { color: colorValue },
        numeric ? { fontVariant: ["tabular-nums"] } : null,
        style,
      ]}
    />
  );
});

// Named convenience wrappers — call sites read as `<Title2>Name</Title2>`
// instead of `<Text variant="title2">Name</Text>`.
const make = (variant: TypographyVariant) => {
  const Component = forwardRef<RNText, Omit<TextProps, "variant">>(function V(props, ref) {
    return <Text ref={ref} variant={variant} {...props} />;
  });
  Component.displayName = variant;
  return Component;
};

export const Display = make("display");
export const Title1 = make("title1");
export const Title2 = make("title2");
export const Title3 = make("title3");
export const Headline = make("headline");
export const Body = make("body");
export const Callout = make("callout");
export const Subhead = make("subhead");
export const Footnote = make("footnote");
export const Caption = make("caption");
export const Overline = make("overline");

function resolveColor(palette: ReturnType<typeof useTheme>["colors"], color: TextColor) {
  switch (color) {
    case "text":
      return palette.text;
    case "secondary":
      return palette.textSecondary;
    case "tertiary":
      return palette.textTertiary;
    case "accent":
      return palette.accent;
    case "favorite":
      return palette.favorite;
    case "rating":
      return palette.rating;
    case "destructive":
      return palette.destructive;
    case "onAccent":
      return palette.onAccent;
  }
}
