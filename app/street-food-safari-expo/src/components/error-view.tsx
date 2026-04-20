import { Pressable, View } from "react-native";

import { ApiError } from "@/api/client";
import { Body, Callout, Headline } from "@/design/text";
import { useTheme } from "@/design/theme";

type Props = {
  error: unknown;
  onRetry?: () => void;
};

function deriveCopy(error: unknown): { title: string; description?: string } {
  if (error instanceof ApiError) {
    if (error.isNetworkError) {
      return {
        title: "You're offline",
        description: "Check your connection and try again.",
      };
    }
    if (error.code === "VENDOR_NOT_FOUND") {
      return { title: "Vendor not found", description: "This vendor does not exist." };
    }
    if (error.isValidationError) {
      return {
        title: "Couldn't submit",
        description: "Some fields need changes. Review the form and try again.",
      };
    }
    if (error.code === "CONTRACT_ERROR") {
      return {
        title: "Unexpected response",
        description: "The server returned something we didn't expect.",
      };
    }
    return { title: "Something went wrong", description: `(${error.code})` };
  }
  return { title: "Something went wrong" };
}

export function ErrorView({ error, onRetry }: Props) {
  const theme = useTheme();
  const { title, description } = deriveCopy(error);

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
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Retry"
          style={({ pressed }) => ({
            paddingHorizontal: theme.spacing.base,
            paddingVertical: theme.spacing.md,
            marginTop: theme.spacing.sm,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Callout color="accent">Retry</Callout>
        </Pressable>
      ) : null}
    </View>
  );
}
