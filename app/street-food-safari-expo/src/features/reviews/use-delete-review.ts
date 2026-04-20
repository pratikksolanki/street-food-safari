import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteMyReview } from "@/api/endpoints";
import { haptics } from "@/lib/haptics";
import { logError } from "@/lib/log-error";

export function useDeleteReview(vendorId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteMyReview(vendorId),

    onSuccess: () => {
      haptics.success();
      // Refresh the vendor's rating + count + nested reviews, AND the
      // cross-vendor "My Reviews" aggregate.
      queryClient.invalidateQueries({ queryKey: ["vendors", "detail", vendorId] });
      queryClient.invalidateQueries({ queryKey: ["me", "reviews"] });
    },

    onError: (error) => {
      logError(error, { at: "deleteMyReview", vendorId });
      haptics.error();
    },
  });
}
