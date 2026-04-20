import { Send, Star } from "lucide-react-native";
import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";

import { reviewInputSchema, type ReviewInput } from "@/api/schemas";
import { CancelButton } from "@/components/cancel-button";
import { Body, Footnote, Headline, Overline, Title2 } from "@/design/text";
import { useTheme } from "@/design/theme";

type Props = {
  title: string;
  /** Small meta line below the title — e.g. vendor name · city. */
  subtitle?: string;
  initialRating?: number;
  initialComment?: string;
  submitting?: boolean;
  /** Field errors returned from the server (e.g. after a 400). */
  fieldErrors?: Record<string, string>;
  onSubmit: (input: ReviewInput) => void;
  /** When provided, renders a "Cancel" text button right-aligned with the title. */
  onCancel?: () => void;
};

export function ReviewForm({
  title,
  subtitle,
  initialRating = 0,
  initialComment = "",
  submitting = false,
  fieldErrors,
  onSubmit,
  onCancel,
}: Props) {
  const theme = useTheme();
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [commentFocused, setCommentFocused] = useState(false);

  const ratingError = localErrors.rating ?? fieldErrors?.rating;
  const commentError = localErrors.comment ?? fieldErrors?.comment;
  const canSubmit = rating > 0 && comment.trim().length > 0 && !submitting;

  const handleSubmit = () => {
    // Parse client-side first so the form gets instant feedback; server
    // re-validates against the same schema.
    const parsed = reviewInputSchema.safeParse({ rating, comment });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const [k, msgs] of Object.entries(parsed.error.flatten().fieldErrors)) {
        if (msgs?.[0]) errs[k] = msgs[0];
      }
      setLocalErrors(errs);
      return;
    }
    setLocalErrors({});
    onSubmit(parsed.data);
  };

  const borderColor = commentError
    ? theme.colors.destructive
    : commentFocused
      ? theme.colors.accent
      : theme.colors.border;

  return (
    <View style={{ gap: theme.spacing.xl }}>
      <View style={{ gap: theme.spacing.xs }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.sm,
          }}
        >
          <Title2 style={{ flex: 1 }}>{title}</Title2>
          {onCancel ? <CancelButton onPress={onCancel} /> : null}
        </View>
        {subtitle ? (
          <Body color="secondary" numberOfLines={1}>
            {subtitle}
          </Body>
        ) : null}
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <Overline color="secondary">Rating</Overline>
        <View style={{ flexDirection: "row", gap: theme.spacing.xs }}>
          {[1, 2, 3, 4, 5].map((i) => {
            const active = rating >= i;
            return (
              <Pressable
                key={i}
                onPress={() => setRating(i)}
                hitSlop={4}
                accessibilityRole="button"
                accessibilityLabel={`${i} star${i === 1 ? "" : "s"}`}
                accessibilityState={{ selected: active }}
                android_ripple={{ borderless: true, radius: 22 }}
                style={({ pressed }) => ({
                  padding: theme.spacing.xs,
                  opacity: pressed ? 0.55 : 1,
                })}
              >
                <Star
                  size={32}
                  color={active ? theme.colors.rating : theme.colors.border}
                  fill={active ? theme.colors.rating : "transparent"}
                  strokeWidth={1.5}
                />
              </Pressable>
            );
          })}
        </View>
        {ratingError ? <Footnote color="destructive">{ratingError}</Footnote> : null}
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <Overline color="secondary">Comment</Overline>
        <TextInput
          value={comment}
          onChangeText={setComment}
          onFocus={() => setCommentFocused(true)}
          onBlur={() => setCommentFocused(false)}
          placeholder="How was your experience? Tell us about it."
          placeholderTextColor={theme.colors.textTertiary}
          multiline
          maxLength={500}
          // Return key dismisses the keyboard instead of inserting a newline.
          // Paired with `returnKeyType="done"` on iOS, the key label reads
          // "done" — the affordance matches the behavior.
          blurOnSubmit
          returnKeyType="done"
          onSubmitEditing={() => {
            /* `blurOnSubmit` handles the dismiss; this is here so iOS fires
               the event on multiline inputs at all. */
          }}
          style={{
            borderWidth: 1,
            borderColor,
            borderRadius: theme.radius.md,
            padding: theme.spacing.md,
            fontSize: 15,
            lineHeight: 22,
            color: theme.colors.text,
            minHeight: 110,
            textAlignVertical: "top",
            backgroundColor: theme.colors.surface,
          }}
        />
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {commentError ? <Footnote color="destructive">{commentError}</Footnote> : <View />}
          <Footnote numeric color="tertiary">
            {comment.length}/500
          </Footnote>
        </View>
      </View>

      <Pressable
        onPress={handleSubmit}
        disabled={!canSubmit}
        android_ripple={canSubmit ? { color: "#ffffff33" } : undefined}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: theme.spacing.sm,
          backgroundColor: theme.colors.accent,
          paddingVertical: theme.spacing.md + 2,
          borderRadius: theme.radius.md,
          borderCurve: "continuous",
          overflow: "hidden",
          opacity: !canSubmit ? 0.4 : pressed ? 0.85 : 1,
        })}
      >
        <Send size={16} color={theme.colors.onAccent} strokeWidth={2} />
        <Headline color="onAccent">{submitting ? "Sending…" : "Submit"}</Headline>
      </Pressable>
    </View>
  );
}
