import { Flame, Leaf, type LucideIcon } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/design/theme";

type Kind = "spicy" | "vegan";

const CONFIG: Record<Kind, { label: string; Icon: LucideIcon; bg: string }> = {
  spicy: { label: "Spicy", Icon: Flame, bg: "#C2410C" },
  vegan: { label: "Vegan", Icon: Leaf, bg: "#15803D" },
};

const FG = "#FFFFFF";

// Bare-minimum chip. Plain `Text` (not the design Caption primitive) with the
// font size inlined, wrapped in a View sized strictly to content. Nothing
// else — previous iterations layered alignSelf / flexShrink / the design
// Caption together and something in that stack was breaking Android's text
// measurement (wrapping "Vegan" char-by-char).
export function MenuBadge({ kind }: { kind: Kind }) {
  const theme = useTheme();
  const { label, Icon, bg } = CONFIG[kind];
  return (
    <View
      style={[
        styles.chip,
        {
          borderRadius: theme.radius.xs,
          backgroundColor: bg,
        },
      ]}
    >
      <Icon size={12} color={FG} strokeWidth={2} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  label: {
    color: FG,
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 14,
    includeFontPadding: false,
  },
});
