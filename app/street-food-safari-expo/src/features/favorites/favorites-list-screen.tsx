import { FlashList } from "@shopify/flash-list";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useCallback } from "react";
import { RefreshControl, View } from "react-native";

import { getVendor } from "@/api/endpoints";
import type { Vendor } from "@/api/schemas";
import { EmptyState } from "@/components/empty-state";
import { ErrorView } from "@/components/error-view";
import { Skeleton } from "@/components/skeleton";
import { useTheme } from "@/design/theme";
import { vendorDetailQueryKey } from "@/features/vendors/use-vendor";
import { VendorCard } from "@/features/vendors/vendor-card";

import { useFavorites } from "./use-favorites";

export function FavoritesListScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const favoritesQuery = useFavorites();

  const items: Vendor[] = favoritesQuery.data?.data ?? [];

  const renderItem = useCallback(
    ({ item }: { item: Vendor }) => {
      const prefetch = () => {
        queryClient.prefetchQuery({
          queryKey: vendorDetailQueryKey(item.id),
          queryFn: ({ signal }) => getVendor(item.id, { signal }),
        });
      };
      // Detail route is nested under the favorites stack (mirror of vendors),
      // so back nav returns to the favorites list instead of bouncing tabs.
      return (
        <View
          style={{
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.md,
          }}
        >
          <Link href={`./i/${item.id}`} asChild onPress={prefetch}>
            <VendorCard vendor={item} />
          </Link>
        </View>
      );
    },
    [queryClient, theme.spacing.lg, theme.spacing.md],
  );

  return (
    <FlashList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl
          refreshing={favoritesQuery.isRefetching}
          onRefresh={() => favoritesQuery.refetch()}
          tintColor={theme.colors.textSecondary}
        />
      }
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: theme.colors.bg }}
      contentContainerStyle={{
        paddingTop: theme.spacing.base,
        paddingBottom: theme.spacing.xxxl,
      }}
      ListEmptyComponent={
        favoritesQuery.isLoading ? (
          <View style={{ gap: theme.spacing.md }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <View
                key={i}
                style={{
                  paddingHorizontal: theme.spacing.lg,
                  paddingBottom: theme.spacing.md,
                }}
              >
                <Skeleton style={{ width: "100%", aspectRatio: 1.5 }} />
              </View>
            ))}
          </View>
        ) : favoritesQuery.isError ? (
          <ErrorView
            error={favoritesQuery.error}
            onRetry={() => favoritesQuery.refetch()}
          />
        ) : (
          <EmptyState
            title="No favorites yet"
            description="Tap the heart on any vendor to save it here."
          />
        )
      }
    />
  );
}
