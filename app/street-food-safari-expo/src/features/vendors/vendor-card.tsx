import { Image as ExpoImage } from "expo-image";
import { Award, Star } from "lucide-react-native";
import { forwardRef } from "react";
import { Pressable, type PressableProps, View } from "react-native";

import type { Vendor } from "@/api/schemas";
import { FavoriteToggle } from "@/components/favorite-toggle";
import { Subhead, Title3 } from "@/design/text";
import { useTheme } from "@/design/theme";
import { useFavoriteIds } from "@/features/favorites/use-favorites";
import { useToggleFavorite } from "@/features/favorites/use-toggle-favorite";
import { formatReviewCount } from "@/lib/format";

type Props = Omit<PressableProps, "style"> & {
  vendor: Vendor;
};

const IMAGE_ASPECT = 2;

export const VendorCard = forwardRef<View, Props>(function VendorCard(
  { vendor, android_ripple, ...rest },
  ref,
) {
  const theme = useTheme();
  const favoriteIds = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();
  const isFavorited = favoriteIds.data?.has(vendor.id) ?? false;
  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityLabel={`View ${vendor.name}`}
      android_ripple={android_ripple ?? { color: theme.colors.surface }}
      {...rest}
      style={({ pressed }) => ({
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.md,
        borderCurve: "continuous",
        overflow: "hidden",
        backgroundColor: theme.colors.bg,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <ExpoImage
        source={{ uri: vendor.thumbnail }}
        style={{
          width: "100%",
          aspectRatio: IMAGE_ASPECT,
          backgroundColor: theme.colors.surface,
        }}
        contentFit="cover"
        contentPosition="top"
        recyclingKey={vendor.id}
        transition={150}
      />
      <View
        style={{
          paddingTop: theme.spacing.base,
          paddingHorizontal: theme.spacing.base,
          paddingBottom: theme.spacing.md,
          gap: theme.spacing.xs,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap: theme.spacing.sm,
          }}
        >
          <Title3 numberOfLines={2} style={{ flex: 1 }}>
            {vendor.name}
          </Title3>
          {/* Negative margins trim the heart's internal padding so it sits
              flush to the card edge visually but still has a roomy tap
              target. Marker above the rating line, aligned with the title. */}
          <View style={{ marginTop: -6, marginRight: -6 }}>
            <FavoriteToggle
              filled={isFavorited}
              size={20}
              onPress={() =>
                toggleFavorite.mutate({
                  vendorId: vendor.id,
                  willBeFavorited: !isFavorited,
                  vendor,
                })
              }
            />
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.xs,
          }}
        >
          {vendor.rating != null ? (
            <>
              <Subhead numeric>{vendor.rating.toFixed(1)}</Subhead>
              <Star
                size={12}
                color={theme.colors.rating}
                fill={theme.colors.rating}
                strokeWidth={1.5}
              />
              {vendor.reviewCount > 0 ? (
                <Subhead color="secondary" numeric>
                  ({formatReviewCount(vendor.reviewCount)})
                </Subhead>
              ) : null}
              <Subhead color="secondary">·</Subhead>
            </>
          ) : null}
          <Subhead color="secondary">{vendor.city}</Subhead>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.xs,
          }}
        >
          <Subhead color="secondary">
            {vendor.cuisine} · {vendor.priceLevel}
          </Subhead>
          {vendor.isFeatured ? (
            <>
              <Subhead color="secondary">·</Subhead>
              <Subhead color="secondary">Featured</Subhead>
              <Award
                size={12}
                color={theme.colors.text}
                strokeWidth={2}
              />
            </>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
});
