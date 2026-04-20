import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { X } from "lucide-react-native";
import { forwardRef, useCallback, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Callout, Headline, Title3 } from "@/design/text";
import { useTheme, type Theme } from "@/design/theme";
import { haptics } from "@/lib/haptics";

import { useSearchFacets } from "./use-search";

type FilterOption = {
  value: string;
  label: string;
};

type Props = {
  /** The current search text — drill-down facets are scoped to it. */
  query: string;
  selectedCities: string[];
  selectedCuisines: string[];
  onApply: (cities: string[], cuisines: string[]) => void;
};

// Two-section (city, cuisine) chip sheet powered by @gorhom/bottom-sheet.
// Parent opens via `ref.current?.present()`. Selection is held in a local
// draft until "View results" — dismissing via drag or backdrop discards it.
export const SearchFilterSheet = forwardRef<BottomSheetModal, Props>(
  function SearchFilterSheet(
    { query, selectedCities, selectedCuisines, onApply },
    ref,
  ) {
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    const [draftCities, setDraftCities] = useState<string[]>(selectedCities);
    const [draftCuisines, setDraftCuisines] = useState<string[]>(selectedCuisines);
    // Gates the per-chip entering/exiting animations. False during the
    // sheet's own open/close so chip fades don't double up with the sheet
    // animation. True while the sheet is settled, so mid-session facet
    // refetches (which add/remove chips) animate gracefully.
    const [chipsAnimated, setChipsAnimated] = useState(false);

    // One query-aware facets fetch keyed on the DRAFT. Gives byCity (with
    // city filter dropped) and byCuisine (with cuisine dropped) in a single
    // round trip, cached per draft combination.
    const facetsQuery = useSearchFacets(query, {
      city: draftCities.length > 0 ? draftCities : undefined,
      cuisine: draftCuisines.length > 0 ? draftCuisines : undefined,
    });

    const visibleCityOptions: FilterOption[] = useMemo(() => {
      const byCity = facetsQuery.data?.byCity;
      if (!byCity) return [];
      return Object.entries(byCity)
        .filter(([name, count]) => count > 0 || draftCities.includes(name))
        .sort((a, b) => b[1] - a[1])
        .map(([name]) => ({ value: name, label: name }));
    }, [facetsQuery.data, draftCities]);

    const visibleCuisineOptions: FilterOption[] = useMemo(() => {
      const byCuisine = facetsQuery.data?.byCuisine;
      if (!byCuisine) return [];
      return Object.entries(byCuisine)
        .filter(([name, count]) => count > 0 || draftCuisines.includes(name))
        .sort((a, b) => b[1] - a[1])
        .map(([name]) => ({ value: name, label: name }));
    }, [facetsQuery.data, draftCuisines]);

    // Reseed draft each time the sheet opens so it mirrors the committed
    // state. Also flips chipsAnimated true once the open animation has
    // landed on a snap point, so chip add/remove fades only fire when the
    // sheet is fully settled.
    const handleChange = useCallback(
      (index: number) => {
        if (index >= 0) {
          setDraftCities(selectedCities);
          setDraftCuisines(selectedCuisines);
          setChipsAnimated(true);
        }
      },
      [selectedCities, selectedCuisines],
    );

    // Fires at the START of any sheet animation. When closing, pre-emptively
    // disable chip animations so the sheet's own close animation owns the
    // exit — individual chip fades would double up.
    const handleAnimate = useCallback((_fromIndex: number, toIndex: number) => {
      if (toIndex < 0) setChipsAnimated(false);
    }, []);

    const toggleDraft = (
      setter: (v: string[]) => void,
      current: string[],
      value: string,
    ) => {
      haptics.light();
      setter(
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

    const dismiss = () =>
      (ref as React.RefObject<BottomSheetModal>)?.current?.dismiss();

    const hasAnyDraft = draftCities.length > 0 || draftCuisines.length > 0;
    const draftCount = draftCities.length + draftCuisines.length;

    // Stable identities — prevents gorhom from reconfiguring the modal
    // on every parent re-render.
    const snapPoints = useMemo(() => ["65%"], []);
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
        onChange={handleChange}
        onAnimate={handleAnimate}
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
            <Title3>Filters</Title3>
            <Pressable
              onPress={dismiss}
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
              gap: theme.spacing.lg,
            }}
            showsVerticalScrollIndicator={false}
          >
            <Section
              title="City"
              options={visibleCityOptions}
              selected={draftCities}
              onToggle={(v) => toggleDraft(setDraftCities, draftCities, v)}
              onClear={() => {
                haptics.light();
                setDraftCities([]);
              }}
              animated={chipsAnimated}
              theme={theme}
            />
            <Section
              title="Cuisine"
              options={visibleCuisineOptions}
              selected={draftCuisines}
              onToggle={(v) => toggleDraft(setDraftCuisines, draftCuisines, v)}
              onClear={() => {
                haptics.light();
                setDraftCuisines([]);
              }}
              animated={chipsAnimated}
              theme={theme}
            />
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
            {hasAnyDraft ? (
              <Pressable
                onPress={() => {
                  haptics.light();
                  setDraftCities([]);
                  setDraftCuisines([]);
                }}
                accessibilityRole="button"
                accessibilityLabel="Clear all filters"
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
                onApply(draftCities, draftCuisines);
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
                {hasAnyDraft
                  ? `View results · ${draftCount} filter${draftCount === 1 ? "" : "s"}`
                  : "View results"}
              </Headline>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

function Section({
  title,
  options,
  selected,
  onToggle,
  onClear,
  animated,
  theme,
}: {
  title: string;
  options: FilterOption[];
  selected: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
  animated: boolean;
  theme: Theme;
}) {
  if (options.length === 0) return null;
  const hasSelection = selected.length > 0;
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 32,
        }}
      >
        <Headline>{title}</Headline>
        {hasSelection ? (
          <Pressable
            onPress={() => {
              haptics.light();
              onClear();
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Clear ${title} filter`}
            style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}
          >
            <Callout style={{ textDecorationLine: "underline" }}>Clear</Callout>
          </Pressable>
        ) : null}
      </View>
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
            // entering/exiting are only active while the sheet is settled
            // (see chipsAnimated gate). On the initial open and the close
            // transition they're disabled so chip fades don't double up
            // with gorhom's own sheet animation. Facet-driven chip
            // adds/removes mid-session still fade gracefully.
            entering={animated ? FadeIn.duration(theme.duration.fast) : undefined}
            exiting={animated ? FadeOut.duration(theme.duration.fast) : undefined}
            layout={LinearTransition.duration(theme.duration.base)}
          >
            <Chip
              label={option.label}
              active={selected.includes(option.value)}
              onPress={() => onToggle(option.value)}
              theme={theme}
            />
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
  theme,
}: {
  label: string;
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
        accessibilityLabel={`${active ? "Remove" : "Add"} ${label} filter`}
        android_ripple={{ color: theme.colors.divider }}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
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
      </Pressable>
    </View>
  );
}
