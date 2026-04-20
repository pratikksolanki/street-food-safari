import * as Haptics from "expo-haptics";

const isIOS = process.env.EXPO_OS === "ios";

function run(fn: () => Promise<unknown>): void {
  fn().catch(() => {
    // Emulators and some devices don't have a taptic engine; swallow silently.
  });
}

export const haptics = {
  light(): void {
    if (isIOS) run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    else run(() => Haptics.selectionAsync());
  },
  success(): void {
    if (isIOS) run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
    else run(() => Haptics.selectionAsync());
  },
  error(): void {
    if (isIOS) run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
    else run(() => Haptics.selectionAsync());
  },
};
