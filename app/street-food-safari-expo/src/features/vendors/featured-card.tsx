import { Image as ExpoImage } from "expo-image";
import { Award, Star } from "lucide-react-native";
import { forwardRef } from "react";
import { Pressable, type PressableProps, StyleSheet, View } from "react-native";

import type { Vendor } from "@/api/schemas";
import { Subhead, Title3 } from "@/design/text";
import { useTheme } from "@/design/theme";
import { formatReviewCount } from "@/lib/format";

// Editorial card used inside the featured carousel: full-bleed image with a
// solid scrim pinned to the bottom for legible text, and an award badge in
// the top-left flagging "this is a curated pick" instead of "tap to
// favourite". Scrim and text pull from the theme palette so the card adapts
// to light/dark mode, but the palette is intentionally kept to neutral tones
// (bg, text, textSecondary, border) — no warm/cool tints — so the surface
// reads as elevated and editorial rather than chromatic.
const CARD_ASPECT = 4 / 3;
const BADGE_SIZE = 36;

type Props = Omit<PressableProps, "style"> & {
  vendor: Vendor;
};

export const FeaturedCard = forwardRef<View, Props>(function FeaturedCard(
  { vendor, android_ripple, ...rest },
  ref,
) {
  const theme = useTheme();
  const scrimBackground = theme.colors.bg;
  const primaryText = theme.colors.text;
  const mutedText = theme.colors.textSecondary;
  const badgeBorder = theme.colors.border;

  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityLabel={`Featured: ${vendor.name}`}
      android_ripple={android_ripple ?? { color: theme.colors.surface }}
      {...rest}
      style={({ pressed }) => ({
        aspectRatio: CARD_ASPECT,
        borderRadius: theme.radius.md,
        borderCurve: "continuous",
        overflow: "hidden",
        backgroundColor: theme.colors.surface,
        opacity: pressed ? 0.88 : 1,
      })}
    >
      <ExpoImage
        source={{ uri: vendor.thumbnail }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        recyclingKey={vendor.id}
        transition={150}
      />

      <View
        style={{
          position: "absolute",
          top: theme.spacing.md,
          left: theme.spacing.md,
          width: BADGE_SIZE,
          height: BADGE_SIZE,
          borderRadius: BADGE_SIZE / 2,
          backgroundColor: scrimBackground,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: badgeBorder,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Award size={18} color={primaryText} strokeWidth={2} />
      </View>

      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: scrimBackground,
          paddingHorizontal: theme.spacing.base,
          paddingTop: theme.spacing.md,
          paddingBottom: theme.spacing.md,
        }}
      >
        <Title3 numberOfLines={2} style={{ color: primaryText }}>
          {vendor.name}
        </Title3>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.xs,
            marginTop: theme.spacing.xs,
          }}
        >
          {vendor.rating != null ? (
            <>
              <Subhead numeric style={{ color: primaryText }}>
                {vendor.rating.toFixed(1)}
              </Subhead>
              <Star
                size={12}
                color={primaryText}
                fill={primaryText}
                strokeWidth={1.5}
              />
              {vendor.reviewCount > 0 ? (
                <Subhead numeric style={{ color: mutedText }}>
                  ({formatReviewCount(vendor.reviewCount)})
                </Subhead>
              ) : null}
              <Subhead style={{ color: mutedText }}>·</Subhead>
            </>
          ) : null}
          <Subhead numberOfLines={1} style={{ color: mutedText, flex: 1 }}>
            {vendor.city} · {vendor.cuisine} · {vendor.priceLevel}
          </Subhead>
        </View>
      </View>
    </Pressable>
  );
});
