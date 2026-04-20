import {
  Host as ComposeHost,
  Text as ComposeText,
  TextButton,
} from "@expo/ui/jetpack-compose";
import {
  Button as SwiftButton,
  Host as SwiftHost,
} from "@expo/ui/swift-ui";
import { Platform } from "react-native";

import { useTheme } from "@/design/theme";

type Props = {
  onPress: () => void;
};

// Platform-native "Cancel" text button. iOS uses SwiftUI `Button role="cancel"`
// (gets the system cancel styling); Android uses Compose `TextButton`
// (Material flat text button). Both hosted via a contents-matching Host so
// they sit inline with surrounding RN text.
export function CancelButton({ onPress }: Props) {
  const theme = useTheme();

  if (Platform.OS === "ios") {
    return (
      <SwiftHost matchContents>
        <SwiftButton role="cancel" label="Cancel" onPress={onPress} />
      </SwiftHost>
    );
  }

  return (
    <ComposeHost matchContents>
      <TextButton onClick={onPress}>
        <ComposeText
          color={theme.colors.accent}
          style={{ typography: "labelLarge", fontWeight: "600" }}
        >
          Cancel
        </ComposeText>
      </TextButton>
    </ComposeHost>
  );
}
