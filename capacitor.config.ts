import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.vizier.whispers",
  appName: "Whispers of the Throne",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
};

export default config;
