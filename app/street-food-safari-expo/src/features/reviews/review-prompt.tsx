import { Star } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { Headline, Subhead } from "@/design/text";
import { useTheme } from "@/design/theme";

type Props = {
  onRate: (rating: number) => void;
};

// Inline prompt shown when the user hasn't reviewed this vendor yet. Tapping
// any star submits to the handler, which opens the form sheet pre-filled
// with that rating — no intermediate "Write a review" button.
export function ReviewPrompt({ onRate }: Props) {
  const theme = useTheme();
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.sm,
        borderCurve: "continuous",
        backgroundColor: theme.colors.surface,
        paddingVertical: theme.spacing.base,
        paddingHorizontal: theme.spacing.base,
        gap: theme.spacing.sm,
        alignItems: "center",
      }}
    >
      <Headline>Rate this vendor</Headline>
      <Subhead color="secondary">Tap a star to leave a review</Subhead>
      <View style={{ flexDirection: "row", gap: theme.spacing.xs + 2, marginTop: 2 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            onPress={() => onRate(n)}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={`Rate ${n} star${n === 1 ? "" : "s"}`}
            android_ripple={{ borderless: true, radius: 22 }}
            style={({ pressed }) => ({
              padding: 4,
              opacity: pressed ? 0.55 : 1,
            })}
          >
            <Star
              size={28}
              color={theme.colors.textTertiary}
              fill="transparent"
              strokeWidth={1.5}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
