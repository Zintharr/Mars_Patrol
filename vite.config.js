import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: true,        // listen on all network interfaces (includes 127.0.0.1)
    port: 5173,
    strictPort: true
  }
});
