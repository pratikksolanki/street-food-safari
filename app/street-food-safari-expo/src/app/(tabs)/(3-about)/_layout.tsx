import { Stack } from "expo-router/stack";

export default function AboutLayout() {
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="my-reviews" options={{ title: "My Reviews" }} />
      <Stack.Screen
        name="i/[id]/review"
        options={{
          presentation: "formSheet",
          sheetGrabberVisible: true,
          title: "",
        }}
      />
    </Stack>
  );
}
