import { Stack } from "expo-router/stack";

export default function FavoritesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: "Favorites", headerLargeTitle: true }}
      />
      <Stack.Screen name="i/[id]" options={{ title: "" }} />
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
