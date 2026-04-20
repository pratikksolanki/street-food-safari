import { useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/design/theme";

// Thin accent segment that slides across a 2px track. Used as a quiet
// "something is fetching in the background" indicator — the list keeps
// its current content (placeholderData), and this bar signals churn
// without the full-screen skeleton flash a fresh query would cause.
export function IndeterminateBar({ active }: { active: boolean }) {
  const theme = useTheme();
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (active) {
      opacity.value = withTiming(1, { duration: 150 });
      progress.value = 0;
      progress.value = withRepeat(
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.cubic) }),
        -1,
        false,
      );
    } else {
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [active, opacity, progress]);

  const containerStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const segmentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: `${progress.value * 130 - 30}%` }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ height: 2, width: "100%", overflow: "hidden" }, containerStyle]}
    >
      <Animated.View
        style={[
          { height: "100%", width: "30%", backgroundColor: theme.colors.accent },
          segmentStyle,
        ]}
      />
    </Animated.View>
  );
}
