import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react-native";
import { useMemo, useRef } from "react";
import { Pressable, ScrollView, View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";

import { Callout } from "@/design/text";
import { useTheme } from "@/design/theme";
import { haptics } from "@/lib/haptics";

import { CuisineFilterSheet } from "./cuisine-filter-sheet";

export type CuisineOption = {
  value: string;
  label: string;
  count?: number;
};

type Props = {
  options: CuisineOption[];
  selected: string[];
  /** Replace the entire applied cuisine list. Called for inline chip X
   *  removal, the trigger's clear-all X, and the sheet's "View results". */
  onChange: (next: string[]) => void;
};

// Horizontal scrollable chip row. First cell is the filter trigger (opens
// the sheet); selected cuisines appear as removable chips after it.
// Everything is strictly monochrome — the inverted fill on selected chips is
// the only value shift.
export function CuisinePicker({ options, selected, onChange }: Props) {
  const theme = useTheme();
  const sheetRef = useRef<BottomSheetModal>(null);

  const selectedOptions = useMemo(() => {
    const byValue = new Map(options.map((o) => [o.value, o] as const));
    return selected.map((v) => byValue.get(v)).filter((o): o is CuisineOption => !!o);
  }, [options, selected]);

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        // Opt out of iOS's tap-active-tab/status-bar scroll-to-top so the
        // tab-bar tap falls through to the vendor FlashList below us.
        scrollsToTop={false}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.base,
          gap: theme.spacing.sm,
          alignItems: "center",
        }}
      >
        <Trigger
          hasSelection={selected.length > 0}
          onOpen={() => {
            haptics.light();
            sheetRef.current?.present();
          }}
          onClearAll={() => {
            haptics.light();
            onChange([]);
          }}
        />
        {selectedOptions.map((option) => (
          <Animated.View
            key={option.value}
            layout={LinearTransition.duration(theme.duration.base)}
          >
            <SelectedChip
              label={option.label}
              onRemove={() => {
                haptics.light();
                onChange(selected.filter((v) => v !== option.value));
              }}
            />
          </Animated.View>
        ))}
      </ScrollView>

      <CuisineFilterSheet
        ref={sheetRef}
        options={options}
        selected={selected}
        onApply={(next) => {
          onChange(next);
          sheetRef.current?.dismiss();
        }}
      />
    </>
  );
}

function Trigger({
  hasSelection,
  onOpen,
  onClearAll,
}: {
  hasSelection: boolean;
  onOpen: () => void;
  onClearAll: () => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "stretch",
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        overflow: "hidden",
      }}
    >
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel="Filter by cuisine"
        android_ripple={{ color: theme.colors.divider }}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          opacity: pressed ? 0.55 : 1,
        })}
      >
        <SlidersHorizontal size={13} color={theme.colors.textSecondary} strokeWidth={2} />
        <Callout>Cuisine</Callout>
        <ChevronDown size={12} color={theme.colors.textSecondary} strokeWidth={2} />
      </Pressable>
      {hasSelection ? (
        <>
          <View style={{ width: 1, backgroundColor: theme.colors.border }} />
          <Pressable
            onPress={onClearAll}
            accessibilityRole="button"
            accessibilityLabel="Clear all cuisine filters"
            android_ripple={{ color: theme.colors.divider }}
            style={({ pressed }) => ({
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: theme.spacing.md,
              opacity: pressed ? 0.55 : 1,
            })}
          >
            <X size={14} color={theme.colors.textSecondary} strokeWidth={2} />
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

// Selected chip mirrors the Trigger: visuals (bg + border + radius) on an
// outer View, behavior (ripple + padding) on an inner Pressable. Keeping those
// two layers separate prevents Android's RippleDrawable from replacing the
// backgroundColor on the Pressable, which was making chips render pure white
// in dark mode.
function SelectedChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  const theme = useTheme();
  return (
    <View
      style={{
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        overflow: "hidden",
      }}
    >
      <Pressable
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${label} filter`}
        android_ripple={{ color: theme.colors.divider }}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          opacity: pressed ? 0.75 : 1,
        })}
      >
        <Callout color="text" style={{ fontWeight: "600" }}>
          {label}
        </Callout>
        <X size={12} color={theme.colors.textSecondary} strokeWidth={2} />
      </Pressable>
    </View>
  );
}
