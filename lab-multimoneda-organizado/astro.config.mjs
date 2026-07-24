import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import node from "@astrojs/node";

export default defineConfig({
  site: "https://labcorepep.com",
  output: "server",

  adapter: node({
    mode: "standalone",
  }),

  integrations: [react()],

  server: {
    host: true,
    port: 3000,
  },

  vite: {
    resolve: {
      dedupe: ["react", "react-dom"],
    },

    optimizeDeps: {
      include: [
        "react",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "react-dom",
        "react-dom/client",
      ],
    },
  },
});
