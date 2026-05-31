import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev server on 8080 (matches the Lovable preview port). The Flask backend
// runs on 5000 with CORS open to all origins, so cross-port calls work.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,
    host: true,
  },
});
