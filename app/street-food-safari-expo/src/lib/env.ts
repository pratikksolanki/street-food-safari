import { Platform } from "react-native";
import { z } from "zod";

// Android emulator can't reach the host's localhost — 10.0.2.2 maps to it.
// iOS simulator uses localhost directly. Physical devices need the env var.
const defaultApiUrl = Platform.select({
  android: "http://10.0.2.2:3333",
  default: "http://localhost:3333",
});

const envSchema = z.object({
  EXPO_PUBLIC_API_URL: z.string().url(),
});

const parsed = envSchema.safeParse({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL ?? defaultApiUrl,
});

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n  ");
  throw new Error(
    `Invalid environment.\n  ${issues}\n\nSet EXPO_PUBLIC_API_URL in app/street-food-safari-expo/.env.development (e.g. http://localhost:3333).`,
  );
}

export const env = parsed.data;
