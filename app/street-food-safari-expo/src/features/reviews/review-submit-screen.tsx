import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { toast } from "sonner-native";

import { ApiError } from "@/api/client";
import { useTheme } from "@/design/theme";
import { useVendor } from "@/features/vendors/use-vendor";

import { ReviewForm } from "./review-form";
import { useSubmitReview } from "./use-submit-review";

export function ReviewSubmitScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{
    id: string;
    mode?: "write" | "edit";
    rating?: string;
    comment?: string;
  }>();
  const vendorId = params.id;
  const submit = useSubmitReview(vendorId);
  // Vendor is already cached from the detail screen we came from — a cheap
  // cache read in practice. Used to show the vendor's name + city under the
  // form title so the sheet never feels floating-without-context.
  const vendorQuery = useVendor(vendorId);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | undefined>();

  // Query-string state, parsed loosely — rating/comment may be missing
  // (first-time review from a star tap) or both present (editing).
  const initialRating = params.rating ? Number(params.rating) : 0;
  const initialComment = typeof params.comment === "string" ? params.comment : "";
  const isEdit = params.mode === "edit";
  const title = isEdit ? "Edit your review" : "Write a review";

  const vendor = vendorQuery.data;
  const subtitle =
    vendor != null ? `${vendor.name} · ${vendor.city}` : undefined;

  const dismiss = () => {
    if (router.canDismiss()) router.dismiss();
    else router.back();
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.base }}
      style={{ backgroundColor: theme.colors.bg, flex: 1 }}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ minHeight: 420 }}>
        <ReviewForm
          title={title}
          subtitle={subtitle}
          initialRating={Number.isFinite(initialRating) ? initialRating : 0}
          initialComment={initialComment}
          submitting={submit.isPending}
          fieldErrors={fieldErrors}
          onCancel={dismiss}
          onSubmit={(input) => {
            setFieldErrors(undefined);
            submit.mutate(input, {
              onSuccess: () => {
                toast.success(isEdit ? "Review updated" : "Review posted");
                dismiss();
              },
              onError: (error) => {
                if (error instanceof ApiError && error.isValidationError) {
                  setFieldErrors(error.fieldErrors);
                  return;
                }
                toast.error(
                  error instanceof ApiError && error.isNetworkError
                    ? "You're offline — couldn't submit"
                    : "Couldn't submit review",
                );
              },
            });
          }}
        />
      </View>
    </ScrollView>
  );
}
