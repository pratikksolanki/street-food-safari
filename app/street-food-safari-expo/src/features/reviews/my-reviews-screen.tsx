import { FlashList } from "@shopify/flash-list";
import { Stack, router } from "expo-router";
import { MapPin } from "lucide-react-native";
import { useCallback } from "react";
import { Alert, Pressable, RefreshControl, View } from "react-native";
import { toast } from "sonner-native";

import { ApiError } from "@/api/client";
import type { MyReview } from "@/api/schemas";
import { EmptyState } from "@/components/empty-state";
import { ErrorView } from "@/components/error-view";
import { RatingStars } from "@/components/rating-stars";
import { Skeleton } from "@/components/skeleton";
import { Body, Callout, Footnote, Subhead, Title3 } from "@/design/text";
import { useTheme } from "@/design/theme";
import { formatRelativeTime } from "@/lib/relative-time";

import { useDeleteReview } from "./use-delete-review";
import { useMyReviews } from "./use-my-reviews";

// A screen listing every review the current client has written, grouped by
// the vendor it belongs to. Edit + Delete actions live on each card. Nested
// under the About tab.
export function MyReviewsScreen() {
  const theme = useTheme();
  const query = useMyReviews();

  const items: MyReview[] = query.data?.pages.flatMap((p) => p.data) ?? [];

  const renderItem = useCallback(
    ({ item }: { item: MyReview }) => (
      <MyReviewCard key={item.id} review={item} />
    ),
    [],
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: "My Reviews",
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      <FlashList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => query.refetch()}
            tintColor={theme.colors.textSecondary}
          />
        }
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingTop: theme.spacing.base,
          paddingBottom: theme.spacing.xxxl,
        }}
        style={{ backgroundColor: theme.colors.bg, flex: 1 }}
        ListEmptyComponent={
          query.isLoading ? (
            <View style={{ paddingHorizontal: theme.spacing.lg, gap: theme.spacing.md }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} style={{ height: 120, borderRadius: theme.radius.sm }} />
              ))}
            </View>
          ) : query.isError ? (
            <ErrorView error={query.error} onRetry={() => query.refetch()} />
          ) : (
            <EmptyState
              title="No reviews yet"
              description="Reviews you write will appear here."
            />
          )
        }
      />
    </>
  );
}

function MyReviewCard({ review }: { review: MyReview }) {
  const theme = useTheme();
  const deleteReview = useDeleteReview(review.vendor.id);

  const goEdit = () => {
    router.push({
      pathname: "/i/[id]/review" as never,
      params: {
        id: review.vendor.id,
        mode: "edit",
        rating: String(review.rating),
        comment: review.comment,
      },
    });
  };

  const goDelete = () => {
    Alert.alert(
      "Delete your review?",
      "This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            deleteReview.mutate(undefined, {
              onSuccess: () => toast.success("Review deleted"),
              onError: (error) =>
                toast.error(
                  error instanceof ApiError && error.isNetworkError
                    ? "You're offline — couldn't delete"
                    : "Couldn't delete review",
                ),
            }),
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <View
      style={{
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.sm,
        borderCurve: "continuous",
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.base,
        gap: theme.spacing.sm,
      }}
    >
      <View style={{ gap: 2 }}>
        <Title3 numberOfLines={1}>{review.vendor.name}</Title3>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.xs,
          }}
        >
          <MapPin size={13} color={theme.colors.textSecondary} strokeWidth={2} />
          <Subhead color="secondary" numberOfLines={1}>
            {review.vendor.city} · {review.vendor.cuisine} · {review.vendor.priceLevel}
          </Subhead>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.sm,
        }}
      >
        <RatingStars rating={review.rating} size={12} />
        <Footnote color="secondary">{formatRelativeTime(review.createdAt)}</Footnote>
      </View>

      <Body selectable>{review.comment}</Body>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          gap: theme.spacing.base,
          marginTop: theme.spacing.xs,
        }}
      >
        <Pressable
          onPress={goDelete}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Delete review"
          style={({ pressed }) => ({
            paddingVertical: theme.spacing.xs,
            opacity: pressed ? 0.55 : 1,
          })}
        >
          <Callout color="destructive" style={{ fontWeight: "600" }}>
            Delete
          </Callout>
        </Pressable>
        <Pressable
          onPress={goEdit}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Edit review"
          style={({ pressed }) => ({
            paddingVertical: theme.spacing.xs,
            opacity: pressed ? 0.55 : 1,
          })}
        >
          <Callout color="accent" style={{ fontWeight: "600" }}>
            Edit
          </Callout>
        </Pressable>
      </View>
    </View>
  );
}
