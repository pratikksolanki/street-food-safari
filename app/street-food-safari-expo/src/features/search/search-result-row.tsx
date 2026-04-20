import { Image as ExpoImage } from "expo-image";
import { Star } from "lucide-react-native";
import { forwardRef } from "react";
import { Pressable, type PressableProps, View } from "react-native";

import type { Vendor } from "@/api/schemas";
import { Callout, Headline, Subhead } from "@/design/text";
import { useTheme } from "@/design/theme";
import { formatReviewCount } from "@/lib/format";

type Props = Omit<PressableProps, "style"> & {
  vendor: Vendor;
};

const AVATAR = 44;

// Compact directory-style row — circular avatar + three short text lines.
// Dense enough to show ~6-8 results per screen on a phone screen
export const SearchResultRow = forwardRef<View, Props>(function SearchResultRow(
  { vendor, android_ripple, ...rest },
  ref,
) {
  const theme = useTheme();
  const ratingLabel =
    vendor.rating !== null
      ? vendor.rating.toFixed(1)
      : null;

  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityLabel={`View ${vendor.name}`}
      android_ripple={android_ripple ?? { color: theme.colors.divider }}
      {...rest}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.bg,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <ExpoImage
        source={{ uri: vendor.thumbnail }}
        style={{
          width: AVATAR,
          height: AVATAR,
          borderRadius: AVATAR / 2,
          backgroundColor: theme.colors.surface,
        }}
        contentFit="cover"
        transition={120}
      />

      <View style={{ flex: 1, gap: 2 }}>
        <Headline numberOfLines={1}>{vendor.name}</Headline>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
          }}
        >
          {ratingLabel ? (
            <>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <Star
                  size={12}
                  color={theme.colors.rating}
                  fill={theme.colors.rating}
                  strokeWidth={0}
                />
                <Subhead numeric color="secondary">
                  {ratingLabel}
                </Subhead>
                {vendor.reviewCount > 0 ? (
                  <Subhead color="tertiary">
                    ({formatReviewCount(vendor.reviewCount)})
                  </Subhead>
                ) : null}
              </View>
              <Dot theme={theme} />
            </>
          ) : null}
          <Subhead color="secondary" numberOfLines={1} style={{ flexShrink: 1 }}>
            {vendor.city}
          </Subhead>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Subhead color="secondary" numberOfLines={1} style={{ flexShrink: 1 }}>
            {vendor.cuisine}
          </Subhead>
          <Dot theme={theme} />
          <Callout color="tertiary">{vendor.priceLevel}</Callout>
        </View>
      </View>
    </Pressable>
  );
});

function Dot({ theme }: { theme: ReturnType<typeof useTheme> }) {
  return (
    <View
      style={{
        width: 2,
        height: 2,
        borderRadius: 1,
        backgroundColor: theme.colors.textTertiary,
      }}
    />
  );
}
