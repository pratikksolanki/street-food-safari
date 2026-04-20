import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const STORAGE_KEY = "street-food-safari.client-id";

let cached: string | null = null;
let pending: Promise<string> | null = null;

// Bootstrap the client UUID exactly once per app lifetime
export async function bootstrapClientId(): Promise<string> {
  if (cached) return cached;
  if (pending) return pending;

  pending = (async () => {
    const existing = await SecureStore.getItemAsync(STORAGE_KEY);
    const id = existing ?? Crypto.randomUUID();
    if (!existing) {
      await SecureStore.setItemAsync(STORAGE_KEY, id);
    }
    cached = id;
    return id;
  })();

  return pending;
}

export function getClientIdSync(): string {
  if (!cached) {
    throw new Error(
      "Client ID not bootstrapped yet. Await bootstrapClientId() in the root layout before mounting consumers.",
    );
  }
  return cached;
}
