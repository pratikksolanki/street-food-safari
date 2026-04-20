import { useMutation, useQueryClient } from "@tanstack/react-query";

import { addFavorite, removeFavorite } from "@/api/endpoints";
import type { Paginated, Vendor } from "@/api/schemas";
import { haptics } from "@/lib/haptics";
import { logError } from "@/lib/log-error";

import { favoritesQueryKey } from "./use-favorites";

type Input = {
  vendorId: string;
  // Caller computes the target state from the current favorite set so we never
  // have to read it again inside the mutation.
  willBeFavorited: boolean;
  // Full vendor required for an optimistic insert when favoriting; ignored on
  // unfavorite since we only need the id to filter.
  vendor: Vendor;
};

type MutationContext = {
  previous?: Paginated<Vendor>;
};

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, Input, MutationContext>({
    mutationFn: ({ vendorId, willBeFavorited }) =>
      willBeFavorited ? addFavorite(vendorId) : removeFavorite(vendorId),

    onMutate: async ({ vendorId, willBeFavorited, vendor }) => {
      haptics.light();
      await queryClient.cancelQueries({ queryKey: favoritesQueryKey });
      const previous = queryClient.getQueryData<Paginated<Vendor>>(favoritesQueryKey);

      queryClient.setQueryData<Paginated<Vendor>>(favoritesQueryKey, (old) => {
        if (!old) return old;
        if (willBeFavorited) {
          if (old.data.some((v) => v.id === vendorId)) return old;
          return { ...old, data: [vendor, ...old.data], total: old.total + 1 };
        }
        const data = old.data.filter((v) => v.id !== vendorId);
        return { ...old, data, total: Math.max(0, old.total - 1) };
      });

      return { previous };
    },

    onError: (error, _input, context) => {
      logError(error, { at: "toggleFavorite" });
      haptics.error();
      if (context?.previous) {
        queryClient.setQueryData(favoritesQueryKey, context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: favoritesQueryKey });
    },
  });
}
