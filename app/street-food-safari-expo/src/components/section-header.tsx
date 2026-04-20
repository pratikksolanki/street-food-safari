import type { ReactNode } from "react";
import { View } from "react-native";

import { Overline } from "@/design/text";
import { useTheme } from "@/design/theme";

type Props = {
  title: string;
  right?: ReactNode;
};

export function SectionHeader({ title, right }: Props) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: theme.spacing.base,
        paddingTop: theme.spacing.lg,
        paddingBottom: theme.spacing.sm,
      }}
    >
      <Overline color="secondary">{title}</Overline>
      {right}
    </View>
  );
}
