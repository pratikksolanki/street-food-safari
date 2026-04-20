import { useMutation, useQueryClient } from "@tanstack/react-query";

import { submitReview } from "@/api/endpoints";
import type { ReviewInput } from "@/api/schemas";
import { haptics } from "@/lib/haptics";
import { logError } from "@/lib/log-error";

export function useSubmitReview(vendorId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ReviewInput) => submitReview(vendorId, input),

    onSuccess: () => {
      haptics.success();
      // Prefix-invalidate the vendor detail (and its nested reviews) AND the
      // cross-vendor "My Reviews" aggregate so the About > My Reviews list
      // reflects the new / edited row immediately.
      queryClient.invalidateQueries({ queryKey: ["vendors", "detail", vendorId] });
      queryClient.invalidateQueries({ queryKey: ["me", "reviews"] });
    },

    onError: (error) => {
      logError(error, { at: "submitReview", vendorId });
      haptics.error();
    },
  });
}
