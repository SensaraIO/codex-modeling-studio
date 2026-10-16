import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const captureDirectory = fileURLToPath(new URL("./designs/dgx-spark-h2s/output/previews/", import.meta.url));

export default defineConfig({
  plugins: [react(), {
    name: "save-local-rack-preview",
    configureServer(server) {
      server.middlewares.use("/__rack_preview_image", async (req, res, next) => {
        if (req.method !== "POST") return next();
        if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) {
          res.statusCode = 403; res.end(); return;
        }
        try {
          const chunks: Buffer[] = [];
          let size = 0;
          for await (const chunk of req) {
            size += chunk.length;
            if (size > 8_000_000) throw new Error("Capture is too large");
            chunks.push(Buffer.from(chunk));
          }
          const payload = JSON.parse(Buffer.concat(chunks).toString());
          if (!/^(cable-bay|cradle|wiring|assembly|bare-rack|exploded|side-frame|shelf-tray|locking-key|key-plate|fit-coupon)-(isometric|front|right|rear|top|screen)$/.test(payload.name)) throw new Error("Invalid capture name");
          const bytes = Buffer.from(payload.png, "base64");
          if (bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") throw new Error("Expected PNG");
          await mkdir(captureDirectory, { recursive: true });
          const path = `${captureDirectory}${payload.name}.png`;
          await writeFile(path, bytes);
          res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify({ path }));
        } catch (error) {
          res.statusCode = 400; res.end(error instanceof Error ? error.message : "Could not save image");
        }
      });
    },
  }],
  build: {
    rollupOptions: { input: { studio: "index.html", rack: "rack.html", rack2x2: "rack-2x2.html", fanRack: "fan-rack.html" } },
  },
  server: {
    host: "127.0.0.1",
    port: 4173,
    watch: { ignored: ["**/designs/dgx-spark-h2s/output/**"] },
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
  },
});
