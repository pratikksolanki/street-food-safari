import { Star } from "lucide-react-native";
import { View } from "react-native";

import { useTheme } from "@/design/theme";

type Props = {
  rating: number | null;
  reviewCount?: number;
  size?: number;
};

// Renders 5 stars. Each star's fill is a continuous 0–1 percentage of the
// rating: the bottom layer is an outline `<Star>`, the top layer is a filled
// `<Star>` clipped to the percentage via an `overflow: hidden` wrapper. This
// lets us render partial values (4.2 → 4 full + 1 at 20% fill) accurately,
// and guarantees the outline and fill shapes match exactly (same Lucide
// glyph, no `StarHalf` shape drift).
export function RatingStars({ rating, reviewCount, size = 14 }: Props) {
  const theme = useTheme();
  const label =
    rating == null
      ? "Not yet rated"
      : `Rated ${rating.toFixed(1)} out of 5${
          typeof reviewCount === "number" ? ` based on ${reviewCount} reviews` : ""
        }`;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      style={{ flexDirection: "row", gap: 2 }}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        // Full star only if the rating fully covers this position; any
        // partial overflow renders at 50% (no rounding by distance). So 4.1
        // and 4.9 both render as 4 full + 1 half.
        const fillPct = computeFill(rating, i);
        return (
          <View key={i} style={{ width: size, height: size }}>
            <Star
              size={size}
              color={theme.colors.rating}
              fill="transparent"
              strokeWidth={1.5}
            />
            {fillPct > 0 ? (
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: size * fillPct,
                  height: size,
                  overflow: "hidden",
                }}
              >
                <Star
                  size={size}
                  color={theme.colors.rating}
                  fill={theme.colors.rating}
                  strokeWidth={1.5}
                />
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function computeFill(rating: number | null, i: number): 0 | 0.5 | 1 {
  if (rating == null) return 0;
  const remainder = rating - i;
  if (remainder >= 1) return 1;
  if (remainder > 0) return 0.5;
  return 0;
}
