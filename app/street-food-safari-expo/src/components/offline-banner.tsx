import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Footnote } from "@/design/text";
import { useTheme } from "@/design/theme";

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  useEffect(() => {
    return NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? true);
    });
  }, []);

  if (isOnline) return null;

  return (
    <Animated.View
      entering={FadeInUp.duration(200)}
      exiting={FadeOutUp.duration(200)}
      pointerEvents="none"
      style={{
        position: "absolute",
        top: insets.top,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.destructive,
        paddingVertical: theme.spacing.xs + 2,
        paddingHorizontal: theme.spacing.base,
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <Footnote accessibilityRole="alert" style={{ color: "#FFFFFF" }}>
        You&apos;re offline
      </Footnote>
    </Animated.View>
  );
}
