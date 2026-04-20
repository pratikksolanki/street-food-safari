import { View } from "react-native";

import { MenuBadge } from "@/components/menu-badge";
import { Body, Callout } from "@/design/text";
import { useTheme } from "@/design/theme";

type Props = {
  name: string;
  price: number;
  spicy: boolean;
  vegan: boolean;
};

export function MenuRow({ name, price, spicy, vegan }: Props) {
  const theme = useTheme();
  return (
    <View style={{ paddingVertical: theme.spacing.sm, gap: theme.spacing.sm }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
        }}
      >
        <Body style={{ flex: 1 }}>{name}</Body>
        <Callout numeric>${price.toFixed(2)}</Callout>
      </View>
      {spicy || vegan ? (
        <View style={{ flexDirection: "row", gap: theme.spacing.xs + 2 }}>
          {spicy ? <MenuBadge kind="spicy" /> : null}
          {vegan ? <MenuBadge kind="vegan" /> : null}
        </View>
      ) : null}
    </View>
  );
}
