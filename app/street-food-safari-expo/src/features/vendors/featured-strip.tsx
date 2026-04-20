import { FlashList } from "@shopify/flash-list";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useCallback, useMemo } from "react";
import { useWindowDimensions, View } from "react-native";

import { getVendor } from "@/api/endpoints";
import type { Vendor } from "@/api/schemas";
import { Headline } from "@/design/text";
import { useTheme } from "@/design/theme";

import { FeaturedCard } from "./featured-card";
import { vendorDetailQueryKey } from "./use-vendor";

// Carousel reads `isFeatured` off the vendors already parsed for the main list.
// No extra request, no separate query — the strip is a product surface on top
// of data we already have. Capped so a run of featured picks doesn't dominate
// the screen above the main list.
const MAX_FEATURED = 6;

type Props = {
  vendors: Vendor[];
};

export function FeaturedStrip({ vendors }: Props) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();

  const featured = useMemo(
    () => vendors.filter((v) => v.isFeatured).slice(0, MAX_FEATURED),
    [vendors],
  );

  // ~75% viewport width with a small right-edge peek so the carousel
  // telegraphs "scroll for more" without needing a UI hint.
  const cardWidth = Math.round(width * 0.75);

  const renderItem = useCallback(
    ({ item }: { item: Vendor }) => {
      const prefetch = () => {
        queryClient.prefetchQuery({
          queryKey: vendorDetailQueryKey(item.id),
          queryFn: ({ signal }) => getVendor(item.id, { signal }),
        });
      };
      return (
        <View style={{ width: cardWidth, marginRight: theme.spacing.md }}>
          <Link href={`/i/${item.id}`} asChild onPress={prefetch}>
            <FeaturedCard vendor={item} />
          </Link>
        </View>
      );
    },
    [cardWidth, queryClient, theme.spacing.md],
  );

  if (featured.length === 0) return null;

  return (
    <View
      accessibilityRole="list"
      style={{ paddingBottom: theme.spacing.md }}
    >
      <Headline
        style={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.md,
          paddingBottom: theme.spacing.sm,
        }}
      >
        Featured
      </Headline>
      <FlashList
        horizontal
        data={featured}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + theme.spacing.md}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: theme.spacing.lg }}
      />
    </View>
  );
}
