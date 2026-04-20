import {
  Box,
  Column,
  Host as ComposeHost,
  ModalBottomSheet,
  RNHostView as ComposeRNHostView,
  Row,
  Text as ComposeText,
  TextButton,
} from "@expo/ui/jetpack-compose";
import { Check } from "lucide-react-native";
import {
  background as composeBackground,
  clickable,
  clip,
  fillMaxWidth,
  padding as composePadding,
  Shapes,
  size,
  weight,
} from "@expo/ui/jetpack-compose/modifiers";
import {
  BottomSheet,
  Divider as SwiftDivider,
  Group as SwiftGroup,
  HStack,
  Host as SwiftHost,
  Image as SwiftImage,
  ScrollView as SwiftScrollView,
  Spacer,
  Text as SwiftText,
  VStack,
} from "@expo/ui/swift-ui";
import {
  background,
  contentShape,
  font,
  foregroundColor,
  ignoreSafeArea,
  onTapGesture,
  padding as swiftPadding,
  presentationDetents,
  presentationDragIndicator,
  shapes,
} from "@expo/ui/swift-ui/modifiers";
import { Platform } from "react-native";

import { useTheme } from "@/design/theme";
import { haptics } from "@/lib/haptics";

export type PickerOption = {
  value: string;
  label: string;
  /** Optional tail text — e.g. per-option count. */
  meta?: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: PickerOption[];
  selected: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
  clearLabel?: string;
  /** Single-select pickers (e.g. City) should auto-dismiss after a tap.
   *  Multi-select stays open until Done. */
  autoClose?: boolean;
};

// Native-per-platform bottom sheet. SwiftUI `BottomSheet` on iOS with medium /
// large detents + drag indicator; Jetpack Compose `ModalBottomSheet` on
// Android. Both render without any React Native in the sheet tree — the whole
// surface is the platform's native chrome.
export function PickerSheet(props: Props) {
  if (Platform.OS === "ios") return <IOSPickerSheet {...props} />;
  return <AndroidPickerSheet {...props} />;
}

function alphaHex(alpha: number): string {
  return Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");
}

// SwiftUI (`@expo/ui/swift-ui`) parses `#RRGGBBAA` (alpha trailing).
function withAlphaRgba(hex: string, alpha: number): string {
  if (!hex.startsWith("#") || hex.length !== 7) return hex;
  return `${hex}${alphaHex(alpha)}`;
}

// Jetpack Compose's `Color.parseColor` requires `#AARRGGBB` (alpha leading).
// Using SwiftUI's trailing-alpha format here gets read as ARGB and produces
// wildly wrong hues (e.g. #FAFAFA14 → rgb(250,250,20), i.e. yellow).
function withAlphaArgb(hex: string, alpha: number): string {
  if (!hex.startsWith("#") || hex.length !== 7) return hex;
  return `#${alphaHex(alpha)}${hex.slice(1)}`;
}

function IOSPickerSheet({
  visible,
  onClose,
  title,
  options,
  selected,
  onToggle,
  onClear,
  clearLabel = "Clear all",
  autoClose = false,
}: Props) {
  const theme = useTheme();

  return (
    <SwiftHost style={{ position: "absolute", width: 0, height: 0 }}>
      <BottomSheet
        isPresented={visible}
        onIsPresentedChange={(presented: boolean) => {
          if (!presented) onClose();
        }}
      >
        <SwiftGroup
          modifiers={[
            background(theme.colors.surfaceElevated),
            ignoreSafeArea({ edges: "all" }),
            presentationDetents(["medium", "large"], { selection: "medium" }),
            presentationDragIndicator("visible"),
          ]}
        >
          <VStack alignment="leading" spacing={0} modifiers={[swiftPadding({ top: 24 })]}>
            <HStack
              alignment="firstTextBaseline"
              modifiers={[swiftPadding({ horizontal: 20, bottom: 16 })]}
            >
              <SwiftText
                modifiers={[
                  font({ size: 22, weight: "bold" }),
                  foregroundColor(theme.colors.text),
                ]}
              >
                {title}
              </SwiftText>
              <Spacer />
              <SwiftText
                modifiers={[
                  font({ size: 17, weight: "semibold" }),
                  foregroundColor(theme.colors.accent),
                  swiftPadding({ vertical: 4, horizontal: 4 }),
                  contentShape(shapes.rectangle()),
                  onTapGesture(onClose),
                ]}
              >
                Done
              </SwiftText>
            </HStack>

            <SwiftDivider />

            <SwiftScrollView>
              <VStack
                alignment="leading"
                spacing={4}
                modifiers={[swiftPadding({ vertical: 8, horizontal: 12 })]}
              >
                {options.map((option) => {
                  const active = selected.includes(option.value);
                  const rowMods = [
                    swiftPadding({ vertical: 12, horizontal: 12 }),
                    contentShape(shapes.rectangle()),
                    onTapGesture(() => {
                      haptics.light();
                      onToggle(option.value);
                      if (autoClose) onClose();
                    }),
                  ];
                  if (active) {
                    rowMods.splice(
                      1,
                      0,
                      background(
                        withAlphaRgba(theme.colors.text, 0.08),
                        shapes.roundedRectangle({ cornerRadius: 10 }),
                      ),
                    );
                  }
                  return (
                    <HStack
                      key={option.value}
                      spacing={14}
                      alignment="center"
                      modifiers={rowMods}
                    >
                      <SwiftText
                        modifiers={[
                          font({ size: 17, weight: active ? "semibold" : "regular" }),
                          foregroundColor(theme.colors.text),
                        ]}
                      >
                        {option.label}
                      </SwiftText>
                      <Spacer />
                      {option.meta ? (
                        <SwiftText
                          modifiers={[
                            font({ size: 15, weight: "regular" }),
                            foregroundColor(theme.colors.textTertiary),
                          ]}
                        >
                          {option.meta}
                        </SwiftText>
                      ) : null}
                      {active ? (
                        <SwiftImage
                          systemName="checkmark"
                          size={15}
                          color={theme.colors.accent}
                        />
                      ) : null}
                    </HStack>
                  );
                })}
              </VStack>
            </SwiftScrollView>

            {selected.length > 0 ? (
              <>
                <SwiftDivider />
                <HStack
                  alignment="center"
                  modifiers={[swiftPadding({ vertical: 12, horizontal: 20 })]}
                >
                  <Spacer />
                  <SwiftText
                    modifiers={[
                      font({ size: 15, weight: "semibold" }),
                      foregroundColor(theme.colors.destructive),
                      swiftPadding({ vertical: 6, horizontal: 12 }),
                      contentShape(shapes.rectangle()),
                      onTapGesture(() => {
                        haptics.light();
                        onClear();
                      }),
                    ]}
                  >
                    {clearLabel}
                  </SwiftText>
                  <Spacer />
                </HStack>
              </>
            ) : null}
          </VStack>
        </SwiftGroup>
      </BottomSheet>
    </SwiftHost>
  );
}

function AndroidPickerSheet({
  visible,
  onClose,
  title,
  options,
  selected,
  onToggle,
  onClear,
  clearLabel = "Clear all",
  autoClose = false,
}: Props) {
  const theme = useTheme();
  if (!visible) return null;

  return (
    <ComposeHost style={{ position: "absolute", width: 0, height: 0 }}>
      <ModalBottomSheet
        onDismissRequest={onClose}
        containerColor={theme.colors.surfaceElevated}
      >
        <ModalBottomSheet.DragHandle>
          <Box
            contentAlignment="center"
            modifiers={[fillMaxWidth(), composePadding(0, 10, 0, 6)]}
          >
            <Box
              modifiers={[
                size(32, 4),
                clip(Shapes.RoundedCorner(2)),
                composeBackground(theme.colors.textTertiary),
              ]}
            />
          </Box>
        </ModalBottomSheet.DragHandle>
        <Column
          verticalArrangement={{ spacedBy: 12 }}
          modifiers={[fillMaxWidth(), composePadding(12, 8, 12, 24)]}
        >
          <Row
            verticalAlignment="center"
            horizontalArrangement="spaceBetween"
            modifiers={[fillMaxWidth(), composePadding(4, 0, 4, 0)]}
          >
            <ComposeText
              color={theme.colors.text}
              style={{ typography: "titleMedium", fontWeight: "600" }}
            >
              {title}
            </ComposeText>
            <TextButton onClick={onClose}>
              <ComposeText
                color={theme.colors.accent}
                style={{ typography: "labelLarge", fontWeight: "600" }}
              >
                Done
              </ComposeText>
            </TextButton>
          </Row>

          <Column verticalArrangement={{ spacedBy: 4 }} modifiers={[fillMaxWidth()]}>
            {options.map((option) => {
              const active = selected.includes(option.value);
              const rowMods = [
                fillMaxWidth(),
                clip(Shapes.RoundedCorner(10)),
                clickable(() => {
                  haptics.light();
                  onToggle(option.value);
                  if (autoClose) onClose();
                }),
                composePadding(12, 12, 12, 12),
              ];
              if (active) {
                rowMods.splice(2, 0, composeBackground(withAlphaArgb(theme.colors.text, 0.08)));
              }
              return (
                <Row
                  key={option.value}
                  verticalAlignment="center"
                  horizontalArrangement={{ spacedBy: 12 }}
                  modifiers={rowMods}
                >
                  <ComposeText
                    color={theme.colors.text}
                    style={{
                      typography: "bodyLarge",
                      fontWeight: active ? "600" : "400",
                    }}
                    modifiers={[weight(1)]}
                  >
                    {option.label}
                  </ComposeText>
                  {option.meta ? (
                    <ComposeText
                      color={theme.colors.textTertiary}
                      style={{ typography: "bodyMedium", fontWeight: "400" }}
                    >
                      {option.meta}
                    </ComposeText>
                  ) : null}
                  {active ? (
                    <ComposeRNHostView matchContents>
                      <Check size={15} color={theme.colors.accent} strokeWidth={2.5} />
                    </ComposeRNHostView>
                  ) : null}
                </Row>
              );
            })}
          </Column>

          {selected.length > 0 ? (
            <Row horizontalArrangement="center" modifiers={[fillMaxWidth()]}>
              <TextButton
                onClick={() => {
                  haptics.light();
                  onClear();
                }}
              >
                <ComposeText
                  color={theme.colors.destructive}
                  style={{ typography: "labelLarge", fontWeight: "600" }}
                >
                  {clearLabel}
                </ComposeText>
              </TextButton>
            </Row>
          ) : null}
        </Column>
      </ModalBottomSheet>
    </ComposeHost>
  );
}
