import {
  Host as ComposeHost,
  Text as ComposeText,
  TextButton,
} from "@expo/ui/jetpack-compose";
import { Button, Host as SwiftHost } from "@expo/ui/swift-ui";
import { font, tint } from "@expo/ui/swift-ui/modifiers";
import { Platform, type ColorValue } from "react-native";

import { useTheme } from "@/design/theme";
import { haptics } from "@/lib/haptics";

type Props = {
  label: string;
  onPress: () => void;
  color?: ColorValue;
};

// Platform-native text button — SwiftUI `Button` on iOS, Material 3
// `TextButton` on Android. Each platform renders its own press feedback,
// font metrics, and tap target. Use for bare text affordances (Cancel,
// Done) where Pressable can't match the platform polish.
export function NativeTextButton({ label, onPress, color }: Props) {
  const theme = useTheme();
  const resolved = color ?? theme.colors.accent;

  const handlePress = () => {
    haptics.light();
    onPress();
  };

  if (Platform.OS === "ios") {
    // Explicit style instead of `matchContents` — the hosted SwiftUI Button
    // was collapsing to 0×0 inside flex rows, making the label invisible.
    return (
      <SwiftHost style={{ minWidth: 60, height: 32 }}>
        <Button
          onPress={handlePress}
          label={label}
          modifiers={[
            tint(String(resolved)),
            font({ size: 15, weight: "semibold" }),
          ]}
        />
      </SwiftHost>
    );
  }

  // Same gotcha as iOS: `ComposeHost matchContents` can collapse to 0×0
  // inside a flex row, which leaves the label visible but the tap area
  // empty (the onClick never fires). Explicit layout restores the hit target.
  return (
    <ComposeHost style={{ minWidth: 80, height: 40 }}>
      <TextButton onClick={handlePress}>
        <ComposeText
          color={String(resolved)}
          style={{ typography: "labelLarge", fontWeight: "600" }}
        >
          {label}
        </ComposeText>
      </TextButton>
    </ComposeHost>
  );
}
