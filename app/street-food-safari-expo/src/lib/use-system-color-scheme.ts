import { useEffect, useState } from "react";
import { Appearance, AppState } from "react-native";

function current(): "light" | "dark" {
  return Appearance.getColorScheme() === "dark" ? "dark" : "light";
}

export function useSystemColorScheme(): "light" | "dark" {
  const [scheme, setScheme] = useState<"light" | "dark">(current);

  useEffect(() => {
    setScheme((prev) => {
      const now = current();
      return prev === now ? prev : now;
    });

    const appearanceSub = Appearance.addChangeListener(({ colorScheme }) => {
      setScheme(colorScheme === "dark" ? "dark" : "light");
    });

    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      setScheme((prev) => {
        const now = current();
        return prev === now ? prev : now;
      });
    });

    return () => {
      appearanceSub.remove();
      appStateSub.remove();
    };
  }, []);

  return scheme;
}
