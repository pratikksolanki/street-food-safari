import { FlashList, type FlashListRef } from "@shopify/flash-list";
import {
  useScrollToTop,
  useTheme as useNavigationTheme,
} from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { Link, Stack } from "expo-router";
import { Search } from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import { Pressable, RefreshControl, View } from "react-native";

import { getVendor } from "@/api/endpoints";
import type { Vendor } from "@/api/schemas";
import { EmptyState } from "@/components/empty-state";
import { ErrorView } from "@/components/error-view";
import { IndeterminateBar } from "@/components/indeterminate-bar";
import { Skeleton } from "@/components/skeleton";
import { Headline } from "@/design/text";
import { useTheme } from "@/design/theme";
import { haptics } from "@/lib/haptics";

import { CityPicker, type CityOption } from "./city-picker";
import { CuisinePicker, type CuisineOption } from "./cuisine-picker";
import { FeaturedStrip } from "./featured-strip";
import { vendorDetailQueryKey } from "./use-vendor";
import { useVendors } from "./use-vendors";
import { VendorCard } from "./vendor-card";

export function VendorListScreen() {
  const theme = useTheme();
  const navigationTheme = useNavigationTheme();
  const queryClient = useQueryClient();

  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const listRef = useRef<FlashListRef<Vendor>>(null);
  useScrollToTop(listRef);

  const hasFilter = selectedCuisines.length > 0 || selectedCities.length > 0;
  const filterKey = `${selectedCuisines.join(",")}|${selectedCities.join(",")}`;

  const vendorsQuery = useVendors({
    cuisine: selectedCuisines.length > 0 ? selectedCuisines : undefined,
    city: selectedCities.length > 0 ? selectedCities : undefined,
  });

  const firstPage = vendorsQuery.data?.pages[0];

  const cuisineOptions: CuisineOption[] = useMemo(() => {
    const byCuisine = firstPage?.byCuisine ?? {};
    return Object.entries(byCuisine)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ value: name, label: name, count }));
  }, [firstPage?.byCuisine]);

  const cityOptions: CityOption[] = useMemo(() => {
    const byCity = firstPage?.byCity ?? {};
    return Object.entries(byCity)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ value: name, label: name, count }));
  }, [firstPage?.byCity]);

  const items: Vendor[] = useMemo(
    () => vendorsQuery.data?.pages.flatMap((p) => p.data) ?? [],
    [vendorsQuery.data],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await vendorsQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  }, [vendorsQuery]);

  const handleEndReached = useCallback(() => {
    if (vendorsQuery.hasNextPage && !vendorsQuery.isFetchingNextPage) {
      vendorsQuery.fetchNextPage();
    }
  }, [vendorsQuery]);


  const renderItem = useCallback(
    ({ item }: { item: Vendor }) => {
      const prefetch = () => {
        queryClient.prefetchQuery({
          queryKey: vendorDetailQueryKey(item.id),
          queryFn: ({ signal }) => getVendor(item.id, { signal }),
        });
      };
      return (
        <View
          style={{
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.md,
          }}
        >
          <Link href={`/i/${item.id}`} asChild onPress={prefetch}>
            <VendorCard vendor={item} />
          </Link>
        </View>
      );
    },
    [queryClient, theme.spacing.lg, theme.spacing.md],
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerTitleAlign: "left",
          headerLargeTitle: false,
          headerTitle: () => (
            <CityPicker
              options={cityOptions}
              selected={selectedCities}
              onChange={setSelectedCities}
            />
          ),
          headerRight: () => (
            <Link href="/search" asChild>
              <Pressable
                onPress={() => haptics.light()}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Search vendors"
                style={({ pressed }) => ({
                  opacity: pressed ? 0.55 : 1,
                  padding: 4,
                })}
              >
                <Search size={22} color={theme.colors.accent} strokeWidth={2} />
              </Pressable>
            </Link>
          ),
        }}
      />

      {cuisineOptions.length > 0 ? (
        <View
          style={{
            paddingVertical: theme.spacing.sm,
            backgroundColor: navigationTheme.colors.card,
          }}
        >
          <CuisinePicker
            options={cuisineOptions}
            selected={selectedCuisines}
            onChange={setSelectedCuisines}
          />
        </View>
      ) : null}


      <IndeterminateBar
        active={vendorsQuery.isFetching && !vendorsQuery.isLoading}
      />

      <FlashList
        key={filterKey}
        ref={listRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          // Featured vendors on home screen only
          !hasFilter && items.length > 0 ? (
            <>
              <FeaturedStrip vendors={items} />
              <Headline
                style={{
                  paddingHorizontal: theme.spacing.lg,
                  paddingTop: theme.spacing.md,
                  paddingBottom: theme.spacing.sm,
                }}
              >
                All vendors
              </Headline>
            </>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.textSecondary}
          />
        }
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: theme.colors.bg }}
        contentContainerStyle={{ paddingBottom: theme.spacing.xxxl }}
        ListEmptyComponent={
          vendorsQuery.isLoading ? (
            <View style={{ gap: theme.spacing.lg }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <View
                  key={i}
                  style={{
                    paddingHorizontal: theme.spacing.lg,
                    paddingBottom: theme.spacing.md,
                  }}
                >
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      borderRadius: theme.radius.sm,
                      borderCurve: "continuous",
                      overflow: "hidden",
                    }}
                  >
                    <Skeleton style={{ width: "100%", aspectRatio: 2, borderRadius: 0 }} />
                    <View style={{ padding: theme.spacing.base, gap: theme.spacing.sm }}>
                      <Skeleton style={{ height: 20, width: "70%" }} />
                      <Skeleton style={{ height: 14, width: "50%" }} />
                      <Skeleton style={{ height: 14, width: "35%" }} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : vendorsQuery.error ? (
            <ErrorView error={vendorsQuery.error} onRetry={handleRefresh} />
          ) : (
            <EmptyState
              title={hasFilter ? "No vendors match those filters" : "No vendors yet"}
              description={hasFilter ? "Clear a filter above to see more." : undefined}
            />
          )
        }
        ListFooterComponent={
          vendorsQuery.isFetchingNextPage ? (
            <View
              style={{
                paddingHorizontal: theme.spacing.lg,
                paddingBottom: theme.spacing.md,
              }}
            >
              <View
                style={{
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.sm,
                  borderCurve: "continuous",
                  overflow: "hidden",
                }}
              >
                <Skeleton style={{ width: "100%", aspectRatio: 2, borderRadius: 0 }} />
                <View style={{ padding: theme.spacing.base, gap: theme.spacing.sm }}>
                  <Skeleton style={{ height: 18, width: "70%" }} />
                </View>
              </View>
            </View>
          ) : null
        }
      />
    </>
  );
}
