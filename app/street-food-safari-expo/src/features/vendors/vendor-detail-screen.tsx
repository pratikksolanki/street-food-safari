import { useQueryClient } from "@tanstack/react-query";
import { Image as ExpoImage } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import { Award, MapPin } from "lucide-react-native";
import { useRef, useState } from "react";
import {
  LayoutChangeEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";

import { ErrorView } from "@/components/error-view";
import { FavoriteToggle } from "@/components/favorite-toggle";
import { RatingStars } from "@/components/rating-stars";
import { Skeleton } from "@/components/skeleton";
import { Body, Headline, Title1 } from "@/design/text";
import { useTheme } from "@/design/theme";
import { useFavoriteIds } from "@/features/favorites/use-favorites";
import { useToggleFavorite } from "@/features/favorites/use-toggle-favorite";
import { ReviewsSection } from "@/features/reviews/reviews-section";
import { formatReviewCount } from "@/lib/format";
import { haptics } from "@/lib/haptics";

import { MenuRow } from "./menu-row";
import { useVendor } from "./use-vendor";

type Tab = "menu" | "reviews";

export function VendorDetailScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const vendorQuery = useVendor(id);
  const favoriteIds = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();

  const [activeTab, setActiveTab] = useState<Tab>("menu");
  const [refreshing, setRefreshing] = useState(false);

  const [tabsNaturalY, setTabsNaturalY] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const onTabChange = (t: Tab) => {
    if (t === activeTab) return;
    haptics.light();
    setActiveTab(t);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: tabsNaturalY, animated: true });
    });
  };

  // Pull-to-refresh: prefix-invalidate so the vendor payload (menu, rating,
  // count) AND the nested reviews cache both refetch from the network.
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({
        queryKey: ["vendors", "detail", id],
      });
    } finally {
      setRefreshing(false);
    }
  };

  const vendor = vendorQuery.data;

  if (vendorQuery.isLoading) return <DetailSkeleton />;
  if (vendorQuery.isError || !vendor) {
    return <ErrorView error={vendorQuery.error} onRetry={() => vendorQuery.refetch()} />;
  }

  const isFavorited = favoriteIds.data?.has(vendor.id) ?? false;

  return (
    <>
      <Stack.Screen
        options={{
          title: vendor.name,
          headerBackButtonDisplayMode: "minimal",
          headerRight: () => (
            <FavoriteToggle
              filled={isFavorited}
              onPress={() =>
                toggleFavorite.mutate({
                  vendorId: vendor.id,
                  willBeFavorited: !isFavorited,
                  vendor,
                })
              }
            />
          ),
        }}
      />
      <ScrollView
        ref={scrollRef}
        contentInsetAdjustmentBehavior="automatic"
        stickyHeaderIndices={[2]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.textSecondary}
          />
        }
        style={{ backgroundColor: theme.colors.bg }}
        contentContainerStyle={{ paddingBottom: theme.spacing.xxxl + theme.spacing.base }}
      >
        <ExpoImage
          source={{ uri: vendor.thumbnail }}
          style={{
            width: "100%",
            aspectRatio: 4 / 3,
            backgroundColor: theme.colors.surface,
          }}
          contentFit="cover"
          recyclingKey={`hero-${vendor.id}`}
          transition={200}
        />

        <View
          style={{
            paddingHorizontal: theme.spacing.base,
            paddingTop: theme.spacing.lg,
            gap: theme.spacing.md,
          }}
        >
          <View style={{ gap: theme.spacing.sm }}>
            <Title1 selectable>{vendor.name}</Title1>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: theme.spacing.xs,
                flexWrap: "wrap",
              }}
            >
              <Headline color="secondary">{vendor.city}</Headline>
              <MapPin
                size={16}
                color={theme.colors.textSecondary}
                strokeWidth={2}
              />
              {vendor.isFeatured ? (
                <>
                  <Headline color="secondary">·</Headline>
                  <Headline color="secondary">Featured</Headline>
                  <Award
                    size={16}
                    color={theme.colors.textSecondary}
                    strokeWidth={2}
                  />
                </>
              ) : null}
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing.sm,
              flexWrap: "wrap",
            }}
          >
            {vendor.rating != null ? (
              <Headline numeric>{vendor.rating.toFixed(1)}</Headline>
            ) : (
              <Headline color="secondary">No reviews</Headline>
            )}
            <RatingStars rating={vendor.rating} reviewCount={vendor.reviewCount} size={16} />
            <Headline color="secondary">
              · {vendor.cuisine} · {vendor.priceLevel}
            </Headline>
          </View>

          <Body selectable>{vendor.description}</Body>
        </View>

        <View
          onLayout={(e: LayoutChangeEvent) =>
            setTabsNaturalY(e.nativeEvent.layout.y)
          }
        >
          <DetailTabs
            active={activeTab}
            reviewCount={vendor.reviewCount}
            onChange={onTabChange}
          />
        </View>

        {activeTab === "menu" ? (
          <View style={{ paddingHorizontal: theme.spacing.base }}>
            {vendor.menu.map((item, i) => (
              <View
                key={item.id}
                style={{
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: theme.colors.divider,
                }}
              >
                <MenuRow
                  name={item.name}
                  price={item.price}
                  spicy={item.spicy}
                  vegan={item.vegan}
                />
              </View>
            ))}
          </View>
        ) : (
          <ReviewsSection vendorId={id} />
        )}
      </ScrollView>
    </>
  );
}

function DetailTabs({
  active,
  reviewCount,
  onChange,
}: {
  active: Tab;
  reviewCount: number;
  onChange: (t: Tab) => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "flex-start",
        gap: theme.spacing.lg,
        paddingHorizontal: theme.spacing.base,
        paddingTop: theme.spacing.lg,
        paddingBottom: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.divider,
        marginBottom: theme.spacing.sm,
        // Opaque so content doesn't bleed through when the row is pinned
        // (sticky header) under the nav bar during scroll.
        backgroundColor: theme.colors.bg,
      }}
    >
      <TabButton label="Menu" isActive={active === "menu"} onPress={() => onChange("menu")} />
      <TabButton
        label={`Reviews (${formatReviewCount(reviewCount)})`}
        isActive={active === "reviews"}
        onPress={() => onChange("reviews")}
      />
    </View>
  );
}

function TabButton({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => ({
        opacity: pressed ? 0.55 : 1,
        paddingBottom: theme.spacing.xs,
      })}
    >
      <Headline
        color={isActive ? "text" : "secondary"}
        style={{ fontWeight: isActive ? "600" : "500" }}
      >
        {label}
      </Headline>
      
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: -theme.spacing.sm - 1,
          height: 2,
          backgroundColor: isActive ? theme.colors.text : "transparent",
        }}
      />
    </Pressable>
  );
}

function DetailSkeleton() {
  const theme = useTheme();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: theme.colors.bg }}
    >
      <Skeleton style={{ width: "100%", aspectRatio: 4 / 3, borderRadius: 0 }} />
      <View style={{ padding: theme.spacing.base, gap: theme.spacing.md }}>
        <Skeleton style={{ height: 30, width: "70%" }} />
        <Skeleton style={{ height: 18, width: "50%" }} />
        <Skeleton style={{ height: 18, width: "40%" }} />
        <Skeleton style={{ height: 60 }} />
      </View>
    </ScrollView>
  );
}
