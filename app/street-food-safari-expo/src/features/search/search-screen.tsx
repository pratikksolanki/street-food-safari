import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { FlashList } from "@shopify/flash-list";
import { useQueryClient } from "@tanstack/react-query";
import { Link, Stack, router } from "expo-router";
import { Search, SlidersHorizontal, X, XCircle } from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getVendor } from "@/api/endpoints";
import type { Vendor } from "@/api/schemas";
import { EmptyState } from "@/components/empty-state";
import { ErrorView } from "@/components/error-view";
import { NativeTextButton } from "@/components/native-text-button";
import { Skeleton } from "@/components/skeleton";
import { Body, Callout, Footnote } from "@/design/text";
import { useTheme } from "@/design/theme";
import { vendorDetailQueryKey } from "@/features/vendors/use-vendor";
import { haptics } from "@/lib/haptics";

import { SearchFilterSheet } from "./search-filter-sheet";
import { SearchResultRow } from "./search-result-row";
import { useRecentSearches } from "./use-recent-searches";
import { useSearch } from "./use-search";

// Dedicated search stack screen. Owns its own query + filter state (nothing
// leaks to the Vendors list). Empty state surfaces recent queries; once the
// user has a query active, a Filters button appears top-right and opens a
// combined city+cuisine sheet scoped to this search.
export function SearchScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState("");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const filterSheetRef = useRef<BottomSheetModal>(null);

  const filters = useMemo(
    () => ({
      city: selectedCities.length > 0 ? selectedCities : undefined,
      cuisine: selectedCuisines.length > 0 ? selectedCuisines : undefined,
    }),
    [selectedCities, selectedCuisines],
  );

  const {
    data,
    error,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    deferredQuery,
    isTypingAhead,
  } = useSearch(query, filters);

  const { recents, add: addRecent, remove: removeRecent, clear: clearRecents } =
    useRecentSearches();

  const hasQuery = deferredQuery.length >= 2;
  const filterCount = selectedCities.length + selectedCuisines.length;

  const items: Vendor[] = useMemo(
    () => data?.pages.flatMap((p) => p.data) ?? [],
    [data],
  );

  const commitRecent = useCallback(() => {
    const trimmed = query.trim();
    if (trimmed.length >= 2) addRecent(trimmed);
  }, [query, addRecent]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const applyFilters = (cities: string[], cuisines: string[]) => {
    setSelectedCities(cities);
    setSelectedCuisines(cuisines);
    filterSheetRef.current?.dismiss();
  };

  const renderItem = useCallback(
    ({ item }: { item: Vendor }) => {
      const prefetch = () => {
        queryClient.prefetchQuery({
          queryKey: vendorDetailQueryKey(item.id),
          queryFn: ({ signal }) => getVendor(item.id, { signal }),
        });
      };
      return (
        <Link href={`/i/${item.id}`} asChild onPress={prefetch}>
          <SearchResultRow vendor={item} />
        </Link>
      );
    },
    [queryClient],
  );

  return (
    // Native header is hidden (see stack layout), so the screen owns the top
    // safe area itself — SafeAreaView pushes the search input below the
    // notch/status bar on iOS and the status bar on Android.
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
    >
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.sm,
          paddingHorizontal: theme.spacing.base,
          paddingTop: theme.spacing.sm,
          paddingBottom: theme.spacing.sm,
          backgroundColor: theme.colors.bg,
        }}
      >
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.xs,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: 10,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.surface,
          }}
        >
          <Search size={16} color={theme.colors.textSecondary} strokeWidth={2} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Search vendors"
            placeholderTextColor={theme.colors.textSecondary}
            autoFocus
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            onSubmitEditing={commitRecent}
            style={{
              flex: 1,
              fontSize: 15,
              color: theme.colors.text,
              paddingVertical: 0,
            }}
          />
          {query.length > 0 ? (
            <Pressable
              onPress={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <XCircle
                size={16}
                color={theme.colors.textSecondary}
                fill={theme.colors.textTertiary}
                strokeWidth={1.5}
              />
            </Pressable>
          ) : null}
        </View>

        {hasQuery ? (
          <Pressable
            onPress={() => {
              haptics.light();
              filterSheetRef.current?.present();
            }}
            accessibilityRole="button"
            accessibilityLabel="Open filters"
            hitSlop={8}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              opacity: pressed ? 0.55 : 1,
              paddingHorizontal: theme.spacing.xs,
            })}
          >
            <SlidersHorizontal
              size={18}
              color={filterCount > 0 ? theme.colors.accent : theme.colors.textSecondary}
              strokeWidth={2}
            />
            {filterCount > 0 ? (
              <View
                style={{
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  paddingHorizontal: 5,
                  backgroundColor: theme.colors.accent,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Footnote color="onAccent" style={{ fontWeight: "700" }}>
                  {filterCount}
                </Footnote>
              </View>
            ) : null}
          </Pressable>
        ) : null}

        <NativeTextButton label="Cancel" onPress={() => router.back()} />
      </View>

      {!hasQuery ? (
        <RecentList
          recents={recents}
          isTypingAhead={isTypingAhead && query.trim().length > 0}
          onPickQuery={(q) => {
            setQuery(q);
            addRecent(q);
          }}
          onRemoveQuery={removeRecent}
          onClearAll={clearRecents}
        />
      ) : (
        <FlashList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          contentContainerStyle={{ paddingBottom: theme.spacing.xxxl }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListEmptyComponent={
            isLoading ? (
              <ResultSkeletons />
            ) : error ? (
              <ErrorView error={error} onRetry={() => fetchNextPage()} />
            ) : (
              <EmptyState
                title={`No results for "${deferredQuery}"`}
                description={
                  filterCount > 0
                    ? "Try removing a filter or a different search."
                    : "Try a different search."
                }
              />
            )
          }
          ListFooterComponent={
            isFetchingNextPage ? <ResultSkeletons rows={1} /> : null
          }
        />
      )}

      <SearchFilterSheet
        ref={filterSheetRef}
        query={deferredQuery}
        selectedCities={selectedCities}
        selectedCuisines={selectedCuisines}
        onApply={applyFilters}
      />
    </SafeAreaView>
  );
}

function RecentList({
  recents,
  isTypingAhead,
  onPickQuery,
  onRemoveQuery,
  onClearAll,
}: {
  recents: string[];
  isTypingAhead: boolean;
  onPickQuery: (q: string) => void;
  onRemoveQuery: (q: string) => void;
  onClearAll: () => void;
}) {
  const theme = useTheme();

  if (isTypingAhead) {
    return (
      <View
        style={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.md,
        }}
      >
        <Callout color="secondary">Keep typing…</Callout>
      </View>
    );
  }

  if (recents.length === 0) {
    return (
      <EmptyState
        title="Find a vendor"
        description="Search by name, cuisine, or city. Your recent searches will appear here."
      />
    );
  }

  return (
    <View style={{ paddingTop: theme.spacing.sm }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.sm,
        }}
      >
        <Footnote
          color="secondary"
          style={{ textTransform: "uppercase", letterSpacing: 0.5 }}
        >
          Recent
        </Footnote>
        <Pressable
          onPress={onClearAll}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Clear all recent searches"
          style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}
        >
          <Footnote color="secondary">Clear all</Footnote>
        </Pressable>
      </View>

      {recents.map((q) => (
        <View
          key={q}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: theme.spacing.lg,
          }}
        >
          <Pressable
            onPress={() => onPickQuery(q)}
            accessibilityRole="button"
            accessibilityLabel={`Search "${q}"`}
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing.sm,
              paddingVertical: theme.spacing.md,
              opacity: pressed ? 0.55 : 1,
            })}
          >
            <Search
              size={16}
              color={theme.colors.textSecondary}
              strokeWidth={2}
            />
            <Body numberOfLines={1} style={{ flex: 1 }}>
              {q}
            </Body>
          </Pressable>
          <Pressable
            onPress={() => onRemoveQuery(q)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={`Remove "${q}" from recents`}
            style={({ pressed }) => ({
              padding: theme.spacing.xs,
              opacity: pressed ? 0.55 : 1,
            })}
          >
            <X size={14} color={theme.colors.textTertiary} strokeWidth={2} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

function ResultSkeletons({ rows = 8 }: { rows?: number }) {
  const theme = useTheme();
  return (
    <View>
      {Array.from({ length: rows }).map((_, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.md,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
          }}
        >
          <Skeleton style={{ width: 44, height: 44, borderRadius: 22 }} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton style={{ height: 16, width: "55%" }} />
            <Skeleton style={{ height: 12, width: "40%" }} />
            <Skeleton style={{ height: 12, width: "30%" }} />
          </View>
        </View>
      ))}
    </View>
  );
}
