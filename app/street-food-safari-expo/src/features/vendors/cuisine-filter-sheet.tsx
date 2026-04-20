import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { X } from "lucide-react-native";
import { forwardRef, useCallback, useState } from "react";
import { Pressable, View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Callout, Headline, Title3 } from "@/design/text";
import { useTheme, type Theme } from "@/design/theme";
import { haptics } from "@/lib/haptics";

import type { CuisineOption } from "./cuisine-picker";

type Props = {
  options: CuisineOption[];
  selected: string[];
  onApply: (next: string[]) => void;
};

// Bottom sheet powered by @gorhom/bottom-sheet. The parent opens via
// `ref.current?.present()` and closes via `ref.current?.dismiss()`.
// Selection is held in a local draft until "View results" — dismissing via
// drag or backdrop discards the draft.
export const CuisineFilterSheet = forwardRef<BottomSheetModal, Props>(
  function CuisineFilterSheet({ options, selected, onApply }, ref) {
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    const [draft, setDraft] = useState<string[]>(selected);

    // In-render sync: when the parent commits a new `selected` (e.g. via the
    // outer trigger-X clear), bring `draft` in line immediately — before the
    // next open renders chips against a stale draft. React-docs pattern for
    // deriving state from a prop; avoids the flash we'd get if we waited
    // for handleChange(index >= 0) to fire after the open animation.
    const selectedKey = selected.join(",");
    const [selectedSnapshot, setSelectedSnapshot] = useState(selectedKey);
    if (selectedKey !== selectedSnapshot) {
      setSelectedSnapshot(selectedKey);
      setDraft(selected);
    }

    // On dismiss, discard any un-applied draft edits so the next open starts
    // from the committed state. Applying via the View-results button already
    // triggers a parent commit (picked up by the sync above), so that path
    // is covered too.
    const handleChange = useCallback(
      (index: number) => {
        if (index < 0) setDraft(selected);
      },
      [selected],
    );

    const toggle = (value: string) => {
      haptics.light();
      setDraft((current) =>
        current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value],
      );
    };

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
          opacity={0.45}
        />
      ),
      [],
    );

    const hasDraft = draft.length > 0;

    return (
      <BottomSheetModal
        ref={ref}
        enableDynamicSizing={false}
        snapPoints={["55%"]}
        onChange={handleChange}
        backgroundStyle={{
          backgroundColor: theme.colors.surfaceElevated,
          borderTopLeftRadius: theme.radius.xl,
          borderTopRightRadius: theme.radius.xl,
        }}
        handleIndicatorStyle={{ backgroundColor: theme.colors.textTertiary }}
        backdropComponent={renderBackdrop}
      >
        <BottomSheetView
          style={{
            flex: 1,
            paddingBottom: insets.bottom + theme.spacing.base,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: theme.spacing.lg,
              paddingBottom: theme.spacing.md,
            }}
          >
            <Title3>Filter by cuisine</Title3>
            <Pressable
              onPress={() =>
                (ref as React.RefObject<BottomSheetModal>)?.current?.dismiss()
              }
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close filters without applying"
              style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}
            >
              <X size={18} color={theme.colors.textSecondary} strokeWidth={2} />
            </Pressable>
          </View>

          <BottomSheetScrollView
            contentContainerStyle={{
              paddingHorizontal: theme.spacing.lg,
              paddingBottom: theme.spacing.sm,
              gap: theme.spacing.sm,
            }}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: theme.spacing.sm,
              }}
            >
              {options.map((option) => (
                <Animated.View
                  key={option.value}
                  // Only layout transition — mount-based fade-in/out would
                  // re-fire every time the sheet opens (gorhom unmounts
                  // children on dismiss) and read as a visible flash.
                  layout={LinearTransition.duration(theme.duration.base)}
                >
                  <Chip
                    label={option.label}
                    count={option.count}
                    active={draft.includes(option.value)}
                    onPress={() => toggle(option.value)}
                    theme={theme}
                  />
                </Animated.View>
              ))}
            </View>
          </BottomSheetScrollView>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing.md,
              paddingHorizontal: theme.spacing.lg,
              paddingTop: theme.spacing.md,
            }}
          >
            {hasDraft ? (
              <Pressable
                onPress={() => {
                  haptics.light();
                  setDraft([]);
                }}
                accessibilityRole="button"
                accessibilityLabel="Clear all cuisine filters"
                android_ripple={{ color: theme.colors.divider }}
                style={({ pressed }) => ({
                  borderWidth: 1,
                  borderColor: theme.colors.destructive,
                  borderRadius: theme.radius.md,
                  borderCurve: "continuous",
                  paddingVertical: theme.spacing.base,
                  paddingHorizontal: theme.spacing.lg,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Headline color="destructive" style={{ fontWeight: "600" }}>
                  Clear all
                </Headline>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => {
                haptics.light();
                onApply(draft);
              }}
              accessibilityRole="button"
              accessibilityLabel="View results"
              android_ripple={{ color: theme.colors.divider }}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: theme.colors.accent,
                borderRadius: theme.radius.md,
                paddingVertical: theme.spacing.base,
                alignItems: "center",
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Headline color="onAccent" style={{ fontWeight: "600" }}>
                {hasDraft
                  ? `View results · ${draft.length} filter${draft.length === 1 ? "" : "s"}`
                  : "View results"}
              </Headline>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

function Chip({
  label,
  count,
  active,
  onPress,
  theme,
}: {
  label: string;
  count?: number;
  active: boolean;
  onPress: () => void;
  theme: Theme;
}) {
  return (
    <View
      style={{
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: active ? theme.colors.accent : theme.colors.border,
        backgroundColor: active ? theme.colors.accent : theme.colors.surface,
        overflow: "hidden",
      }}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${active ? "Remove" : "Add"} ${label} filter${
          typeof count === "number" ? `, ${count} result${count === 1 ? "" : "s"}` : ""
        }`}
        android_ripple={{ color: theme.colors.divider }}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Callout
          color={active ? "onAccent" : "text"}
          style={{ fontWeight: active ? "600" : "400" }}
        >
          {label}
        </Callout>
        {typeof count === "number" ? (
          <Callout
            color={active ? "onAccent" : "tertiary"}
            numeric
            style={{ opacity: active ? 0.75 : 1 }}
          >
            {count}
          </Callout>
        ) : null}
      </Pressable>
    </View>
  );
}
