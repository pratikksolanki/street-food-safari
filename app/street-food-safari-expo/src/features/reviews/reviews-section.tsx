import { router } from "expo-router";
import { useMemo } from "react";
import { Alert, Pressable, View } from "react-native";
import { toast } from "sonner-native";

import { ApiError } from "@/api/client";
import type { Review } from "@/api/schemas";
import { EmptyState } from "@/components/empty-state";
import { ErrorView } from "@/components/error-view";
import { Skeleton } from "@/components/skeleton";
import { Callout } from "@/design/text";
import { useTheme } from "@/design/theme";

import { ReviewCard } from "./review-card";
import { ReviewPrompt } from "./review-prompt";
import { useDeleteReview } from "./use-delete-review";
import { useMyReview } from "./use-my-review";
import { useReviews } from "./use-reviews";

type Props = {
  vendorId: string;
};

// The Reviews tab's body. Orchestrates:
//  - Top banner: ReviewPrompt (no own review) or emphasized ReviewCard with
//    Edit button (has own review).
//  - A divider, then the other reviews (own review filtered out) paginated.
//  - Skeleton / error / empty fallbacks.
export function ReviewsSection({ vendorId }: Props) {
  const theme = useTheme();
  const reviewsQ = useReviews(vendorId);
  const myReview = useMyReview(vendorId);
  const deleteReview = useDeleteReview(vendorId);

  const allReviews: Review[] = useMemo(
    () => reviewsQ.data?.pages.flatMap((p) => p.data) ?? [],
    [reviewsQ.data],
  );
  const others = useMemo(
    () => allReviews.filter((r) => r.id !== myReview?.id),
    [allReviews, myReview],
  );

  const goReview = (args: {
    mode: "write" | "edit";
    rating?: number;
    comment?: string;
  }) => {
    // Typed-path form: expo-router substitutes `[id]` with the `id` param
    // and treats the rest as query string. `mode` drives the sheet's title
    // copy ("Write a review" vs. "Edit your review").
    router.push({
      pathname: "/i/[id]/review" as never,
      params: {
        id: vendorId,
        mode: args.mode,
        ...(args.rating ? { rating: String(args.rating) } : {}),
        ...(args.comment ? { comment: args.comment } : {}),
      },
    });
  };

  if (reviewsQ.isLoading) {
    return (
      <View
        style={{
          paddingHorizontal: theme.spacing.base,
          gap: theme.spacing.md,
        }}
      >
        <Skeleton style={{ height: 120, borderRadius: theme.radius.sm }} />
        <Skeleton style={{ height: 80 }} />
        <Skeleton style={{ height: 80 }} />
      </View>
    );
  }

  if (reviewsQ.isError) {
    return <ErrorView error={reviewsQ.error} onRetry={() => reviewsQ.refetch()} />;
  }

  return (
    <View
      style={{
        paddingHorizontal: theme.spacing.base,
        gap: theme.spacing.lg,
      }}
    >
      {myReview ? (
        <ReviewCard
          review={myReview}
          emphasized
          onEdit={() =>
            goReview({
              mode: "edit",
              rating: myReview.rating,
              comment: myReview.comment,
            })
          }
          onDelete={() => {
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
          }}
        />
      ) : (
        <ReviewPrompt onRate={(n) => goReview({ mode: "write", rating: n })} />
      )}

      {others.length > 0 ? (
        <View style={{ gap: theme.spacing.lg }}>
          {others.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
          {reviewsQ.hasNextPage ? (
            <Pressable
              onPress={() => reviewsQ.fetchNextPage()}
              disabled={reviewsQ.isFetchingNextPage}
              style={({ pressed }) => ({
                alignSelf: "center",
                paddingVertical: theme.spacing.sm + 2,
                opacity: pressed ? 0.55 : 1,
              })}
              accessibilityRole="button"
            >
              <Callout color="accent">
                {reviewsQ.isFetchingNextPage ? "Loading…" : "Load more reviews"}
              </Callout>
            </Pressable>
          ) : null}
        </View>
      ) : !myReview ? (
        <EmptyState title="No reviews yet" description="Be the first to rate this vendor." />
      ) : null}
    </View>
  );
}
