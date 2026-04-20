import { View } from "react-native";

import { Callout } from "@/design/text";
import { useTheme } from "@/design/theme";

type Props = {
  /** Accepts "$", "$$", "$$$" — any unexpected value renders as text. */
  level: string;
};

export function PriceLevel({ level }: Props) {
  const theme = useTheme();
  const filled = Math.min(Math.max(level.length, 0), 3);
  if (filled === 0) {
    return <Callout color="tertiary">{level}</Callout>;
  }
  return (
    <View style={{ flexDirection: "row" }} accessibilityLabel={`Price level ${filled} of 3`}>
      {[0, 1, 2].map((i) => (
        <Callout
          key={i}
          color={i < filled ? "text" : "tertiary"}
          style={{ letterSpacing: 0.5 }}
        >
          $
        </Callout>
      ))}
      <View style={{ width: theme.spacing.xs }} />
    </View>
  );
}
