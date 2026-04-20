import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { X } from "lucide-react-native";
import { forwardRef, useCallback, useMemo, useRef } from "react";
import { Pressable, View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Callout, Headline, Title3 } from "@/design/text";
import { useTheme, type Theme } from "@/design/theme";
import { haptics } from "@/lib/haptics";

import type { CityOption } from "./city-picker";

type Props = {
  options: CityOption[];
  /** Always 0 or 1 item — city is single-select. */
  selected: string[];
  onChange: (next: string[]) => void;
};

// Single-select city sheet. Tapping a chip commits immediately and closes
// (no draft, no Apply). A Clear button at the bottom appears when a city
// is selected.
export const CityFilterSheet = forwardRef<BottomSheetModal, Props>(
  function CityFilterSheet({ options, selected, onChange }, ref) {
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    const selectedValue = selected[0];
    const hasSelection = selected.length > 0;

    // Defer the parent commit until after the sheet finishes animating out.
    // Committing synchronously on tap causes the parent to refetch vendors,
    // which mutates `options` via facets, which re-renders the sheet while
    // it's still visible — producing a visible flash. Stashing the intended
    // change here and firing onChange in onDismiss keeps the close animation
    // clean.
    const pendingRef = useRef<string[] | null>(null);

    const dismiss = () =>
      (ref as React.RefObject<BottomSheetModal>)?.current?.dismiss();

    const pick = (value: string) => {
      haptics.light();
      // Tapping the already-selected city clears it; tapping another replaces.
      pendingRef.current = value === selectedValue ? [] : [value];
      dismiss();
    };

    const clear = () => {
      haptics.light();
      pendingRef.current = [];
      dismiss();
    };

    const handleDismiss = useCallback(() => {
      if (pendingRef.current !== null) {
        onChange(pendingRef.current);
        pendingRef.current = null;
      }
    }, [onChange]);

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

    // Stable identity — prevents gorhom from reconfiguring the modal on
    // every parent re-render.
    const snapPoints = useMemo(() => ["55%"], []);
    const backgroundStyle = useMemo(
      () => ({
        backgroundColor: theme.colors.surfaceElevated,
        borderTopLeftRadius: theme.radius.xl,
        borderTopRightRadius: theme.radius.xl,
      }),
      [theme.colors.surfaceElevated, theme.radius.xl],
    );
    const handleIndicatorStyle = useMemo(
      () => ({ backgroundColor: theme.colors.textTertiary }),
      [theme.colors.textTertiary],
    );

    return (
      <BottomSheetModal
        ref={ref}
        enableDynamicSizing={false}
        snapPoints={snapPoints}
        onDismiss={handleDismiss}
        backgroundStyle={backgroundStyle}
        handleIndicatorStyle={handleIndicatorStyle}
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
            <Title3>Filter by city</Title3>
            <Pressable
              onPress={dismiss}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close filters"
              style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}
            >
              <X size={18} color={theme.colors.textSecondary} strokeWidth={2} />
            </Pressable>
          </View>

          <BottomSheetScrollView
            contentContainerStyle={{
              paddingHorizontal: theme.spacing.lg,
              paddingBottom: theme.spacing.sm,
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
                    active={option.value === selectedValue}
                    onPress={() => pick(option.value)}
                    theme={theme}
                  />
                </Animated.View>
              ))}
            </View>
          </BottomSheetScrollView>

          {hasSelection ? (
            <View
              style={{
                paddingHorizontal: theme.spacing.lg,
                paddingTop: theme.spacing.md,
              }}
            >
              <Pressable
                onPress={clear}
                accessibilityRole="button"
                accessibilityLabel="Clear city filter"
                android_ripple={{ color: theme.colors.divider }}
                style={({ pressed }) => ({
                  borderWidth: 1,
                  borderColor: theme.colors.destructive,
                  borderRadius: theme.radius.md,
                  borderCurve: "continuous",
                  paddingVertical: theme.spacing.base,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Headline color="destructive" style={{ fontWeight: "600" }}>
                  Clear
                </Headline>
              </Pressable>
            </View>
          ) : null}
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
        accessibilityLabel={`${active ? "Clear" : "Select"} ${label}${
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
