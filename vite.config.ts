import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const iconSizes = [16, 32, 48, 64, 96, 128] as const;

function manifestPlugin(): Plugin {
  return {
    name: "copy-extension-manifest",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "manifest.json",
        source: readFileSync(resolve(projectRoot, "src/manifest.json"), "utf8"),
      });
      for (const size of iconSizes) {
        const fileName = `image-description-${size}.png`;
        this.emitFile({
          type: "asset",
          fileName: `icons/${fileName}`,
          source: readFileSync(resolve(projectRoot, "src/icons", fileName)),
        });
      }
    },
  };
}

export default defineConfig({
  root: "src",
  plugins: [manifestPlugin()],
  build: {
    outDir: "../build",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidebar: resolve(projectRoot, "src/sidebar/sidebar.html"),
        options: resolve(projectRoot, "src/options/options.html"),
        background: resolve(projectRoot, "src/background.ts"),
      },
      output: {
        entryFileNames: "[name].js",
      },
    },
  },
});
