import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { ChevronDown, X } from "lucide-react-native";
import { useRef } from "react";
import { Pressable, View } from "react-native";

import { Title3 } from "@/design/text";
import { useTheme } from "@/design/theme";
import { haptics } from "@/lib/haptics";

import { CityFilterSheet } from "./city-filter-sheet";

export type CityOption = {
  value: string;
  label: string;
  /** Optional per-city vendor count. */
  count?: number;
};

type Props = {
  options: CityOption[];
  selected: string[];
  /** Replace the applied city list. Always receives [] or [one]. */
  onChange: (next: string[]) => void;
};

// Single-select city dropdown in the Stack header's title slot. Tapping opens
// a chip sheet mirroring the cuisine filter; picking a city commits + closes.
// Inline X appears next to the trigger when a city is selected for a one-tap
// clear without reopening the sheet.
export function CityPicker({ options, selected, onChange }: Props) {
  const theme = useTheme();
  const sheetRef = useRef<BottomSheetModal>(null);
  const hasSelection = selected.length > 0;
  const buttonLabel = hasSelection ? selected[0] : "All cities";

  return (
    <>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          alignSelf: "flex-start",
        }}
      >
        <Pressable
          onPress={() => {
            haptics.light();
            sheetRef.current?.present();
          }}
          accessibilityRole="button"
          accessibilityLabel={`Filter by city. ${buttonLabel} selected.`}
          android_ripple={{ color: theme.colors.divider, borderless: true }}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingVertical: 6,
            opacity: pressed ? 0.55 : 1,
          })}
        >
          <Title3 numberOfLines={1}>{buttonLabel}</Title3>
          <ChevronDown
            size={22}
            color={theme.colors.textSecondary}
            strokeWidth={2}
            style={{ marginTop: 2 }}
          />
        </Pressable>
        {hasSelection ? (
          <>
            <View
              style={{
                width: 1,
                height: 18,
                backgroundColor: theme.colors.border,
                marginHorizontal: theme.spacing.sm,
              }}
            />
            <Pressable
              onPress={() => {
                haptics.light();
                onChange([]);
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Clear city filter"
              android_ripple={{ color: theme.colors.divider, borderless: true }}
              style={({ pressed }) => ({
                padding: 4,
                opacity: pressed ? 0.55 : 1,
              })}
            >
              <X size={22} color={theme.colors.textSecondary} strokeWidth={2} />
            </Pressable>
          </>
        ) : null}
      </View>

      <CityFilterSheet
        ref={sheetRef}
        options={options}
        selected={selected}
        onChange={onChange}
      />
    </>
  );
}
