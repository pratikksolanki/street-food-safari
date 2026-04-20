import { Stack } from "expo-router/stack";

export default function VendorsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="search"
        options={{
          headerShown: false,
          animation: "fade",
          animationDuration: 150,
        }}
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
