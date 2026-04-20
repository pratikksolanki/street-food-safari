import { Heart } from "lucide-react-native";
import { Pressable } from "react-native";

import { useTheme } from "@/design/theme";

type Props = {
  filled: boolean;
  onPress: () => void;
  size?: number;
};

// Pressable heart used in vendor cards + the detail header.
// Fill toggles between the `favorite` accent and transparent; stroke stays
// on-palette in both states. Same SVG on both platforms, identical metrics.
export function FavoriteToggle({ filled, onPress, size = 22 }: Props) {
  const theme = useTheme();
  const color = filled ? theme.colors.favorite : theme.colors.textSecondary;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={filled ? "Remove from favorites" : "Add to favorites"}
      accessibilityState={{ selected: filled }}
      android_ripple={{ borderless: true, radius: size + 6 }}
      style={({ pressed }) => ({
        padding: 6,
        opacity: pressed ? 0.55 : 1,
      })}
    >
      <Heart
        size={size}
        color={color}
        fill={filled ? color : "transparent"}
        strokeWidth={2}
      />
    </Pressable>
  );
}
