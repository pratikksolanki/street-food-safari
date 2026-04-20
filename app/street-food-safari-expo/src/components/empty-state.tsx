import type { ReactNode } from "react";
import { View } from "react-native";

import { Body, Headline } from "@/design/text";
import { useTheme } from "@/design/theme";

type Props = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: Props) {
  const theme = useTheme();
  return (
    <View
      style={{
        paddingVertical: theme.spacing.xxxl,
        paddingHorizontal: theme.spacing.xl,
        alignItems: "center",
        justifyContent: "center",
        gap: theme.spacing.sm,
      }}
    >
      <Headline selectable style={{ textAlign: "center" }}>
        {title}
      </Headline>
      {description ? (
        <Body selectable color="secondary" style={{ textAlign: "center" }}>
          {description}
        </Body>
      ) : null}
      {action ? <View style={{ marginTop: theme.spacing.md }}>{action}</View> : null}
    </View>
  );
}
