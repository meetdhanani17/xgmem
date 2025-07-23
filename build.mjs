// build.mjs (for ESM projects)

import { build } from "esbuild";

build({
  entryPoints: ["src/**/*.ts"], // Replace with your entry file(s)
  outdir: "dist",
  bundle: true, // Don't bundle — preserve import structure
  format: "esm", // Output as native ES modules
  platform: "node", // Targeting Node.js
  target: ["esnext"],
  sourcemap: true,
  splitting: false,
  outExtension: { ".js": ".js" }, // Force .js output extension
  loader: {
    ".ts": "ts",
  },
  logLevel: "info",
}).catch(() => process.exit(1));
