import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

declare const process: {
  env: {
    VITE_BASE_PATH?: string;
  };
};

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? "/",
  plugins: [react()],
  build: {
    rolldownOptions: {
      input: {
        app: "index.html"
      },
      output: {
        codeSplitting: {
          minSize: 20_000,
          groups: [
            {
              name: "react-vendor",
              test: /node_modules[\\/](react|react-dom)[\\/]/,
              priority: 30
            },
            {
              name: "mui-vendor",
              test: /node_modules[\\/](@mui|@emotion)[\\/]/,
              priority: 20
            },
            {
              name: "vendor",
              test: /node_modules[\\/]/,
              priority: 10
            }
          ]
        }
      }
    }
  },
  test: {
    exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**"],
    environment: "jsdom",
    globals: true
  }
});
