import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // servekaro-backend in dev. Same-origin proxy keeps the refresh cookie first-party.
  const backend = env.DEV_BACKEND_URL || "http://localhost:5000";

  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        "/api": { target: backend, changeOrigin: true },
        "/realtime": { target: backend, ws: true, changeOrigin: true },
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
