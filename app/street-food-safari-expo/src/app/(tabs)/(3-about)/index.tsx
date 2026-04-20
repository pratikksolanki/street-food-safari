import { Link, Stack } from "expo-router";
import { ChevronRight, MessageSquareQuote } from "lucide-react-native";
import { Pressable, ScrollView, View } from "react-native";
import { Body, Caption, Footnote, Headline, Subhead, Title1, Title3 } from "@/design/text";
import { useTheme } from "@/design/theme";
import { getClientIdSync } from "@/lib/client-id";

export default function AboutScreen() {
  const theme = useTheme();
  // Bootstrapped synchronously in the root layout before this screen can render
  const clientId = getClientIdSync();

  return (
    <>
      <Stack.Screen options={{ title: "About", headerLargeTitle: true }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: theme.colors.bg }}
        contentContainerStyle={{
          padding: theme.spacing.base,
          gap: theme.spacing.lg,
        }}
      >
        <View style={{ gap: theme.spacing.xs }}>
          <Title1>Street Food Safari</Title1>
          <Body color="secondary">
            Discover street food vendors across the world, share your experiences, and find your next meal.
          </Body>
        </View>

        {/* Styling lives on the inner View — `Link asChild` can overwrite the
            `Pressable`'s style function and flatten the row layout otherwise. */}
        <Link href="/my-reviews" asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="My Reviews"
            android_ripple={{ color: theme.colors.border }}
            style={({ pressed }) => ({
              opacity: pressed ? 0.85 : 1,
              borderRadius: theme.radius.sm,
              overflow: "hidden",
            })}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: theme.spacing.md,
                paddingVertical: theme.spacing.base,
                paddingHorizontal: theme.spacing.base,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.sm,
                borderCurve: "continuous",
                backgroundColor: theme.colors.surface,
              }}
            >
              <MessageSquareQuote
                size={22}
                color={theme.colors.textSecondary}
                strokeWidth={2}
              />
              <View style={{ flex: 1, gap: 2 }}>
                <Headline>My Reviews</Headline>
                <Subhead color="secondary">All your reviews in one place.</Subhead>
              </View>
              <ChevronRight
                size={18}
                color={theme.colors.textTertiary}
                strokeWidth={2}
              />
            </View>
          </Pressable>
        </Link>


        <Section title="Client ID">
          <Footnote color="tertiary" selectable numberOfLines={1}>
            {clientId}
          </Footnote>
          <Caption color="tertiary">
            App-generated uuid per user. This is how the server identifies a user&apos;s
            favorites &amp; reviews.
          </Caption>
        </Section>

      </ScrollView>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.xs }}>
      <Title3>{title}</Title3>
      {children}
      <View
        style={{
          height: 1,
          backgroundColor: theme.colors.divider,
          marginTop: theme.spacing.sm,
        }}
      />
    </View>
  );
}
