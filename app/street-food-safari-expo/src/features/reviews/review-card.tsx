import { Pressable, View } from "react-native";

import type { Review } from "@/api/schemas";
import { RatingStars } from "@/components/rating-stars";
import { Body, Callout, Caption, Footnote } from "@/design/text";
import { useTheme } from "@/design/theme";
import { formatRelativeTime } from "@/lib/relative-time";

type Props = {
  review: Review;
  emphasized?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
};

// `emphasized` wraps the card in a surface-tinted hairline card so the user's
// own review visually leads the list. Edit + Delete render as right-aligned
// text buttons under the comment — destructive tint on delete, accent on edit.
export function ReviewCard({ review, emphasized, onEdit, onDelete }: Props) {
  const theme = useTheme();

  const header = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
      }}
    >
      <RatingStars rating={review.rating} size={12} />
      <Footnote color="secondary">{formatRelativeTime(review.createdAt)}</Footnote>
      {emphasized ? (
        <>
          <View style={{ flex: 1 }} />
          <Caption color="tertiary">Your review</Caption>
        </>
      ) : null}
    </View>
  );

  const body = <Body selectable>{review.comment}</Body>;

  if (emphasized) {
    return (
      <View
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.sm,
          borderCurve: "continuous",
          backgroundColor: theme.colors.surface,
          padding: theme.spacing.base,
          gap: theme.spacing.sm,
        }}
      >
        {header}
        {body}
        {onEdit || onDelete ? (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              gap: theme.spacing.base,
              marginTop: theme.spacing.xs,
            }}
          >
            {onDelete ? (
              <Pressable
                onPress={onDelete}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Delete your review"
                style={({ pressed }) => ({
                  paddingVertical: theme.spacing.xs,
                  opacity: pressed ? 0.55 : 1,
                })}
              >
                <Callout color="destructive" style={{ fontWeight: "600" }}>
                  Delete
                </Callout>
              </Pressable>
            ) : null}
            {onEdit ? (
              <Pressable
                onPress={onEdit}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Writeyour review"
                style={({ pressed }) => ({
                  paddingVertical: theme.spacing.xs,
                  opacity: pressed ? 0.55 : 1,
                })}
              >
                <Callout color="accent" style={{ fontWeight: "600" }}>
                  Edit
                </Callout>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={{ gap: theme.spacing.xs + 2 }}>
      {header}
      {body}
    </View>
  );
}
