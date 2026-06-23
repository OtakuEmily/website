// @ts-check
import { defineConfig, fontProviders } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

import svelte from "@astrojs/svelte";

import react from "@astrojs/react";

import playformCompress from "@playform/compress";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://emily.kemonomimi.moe",

  fonts: [
    {
      name: "Noto Sans",
      cssVariable: "--font-noto-sans",
      provider: fontProviders.local(),
      options: {
        variants: [
          {
            src: ["./src/assets/notosans.ttf"],
            weight: 400,
            style: "normal",
          },
        ],
      },
      weights: [400],
      styles: ["normal"],
      formats: ["ttf"],
      fallbacks: ["sans-serif"],
    },
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  image: {
    domains: ["forge.kemonomimi.moe", "stoat.chat"],
  },

  integrations: [svelte(), react(), playformCompress(), sitemap()],
});