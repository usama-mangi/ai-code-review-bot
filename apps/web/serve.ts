import { join } from "path";

const DIST_DIR = join(import.meta.dir, "dist");

const server = Bun.serve({
  port: 80,
  async fetch(req) {
    const url = new URL(req.url);
    let path = url.pathname === "/" ? "/index.html" : url.pathname;

    const filePath = join(DIST_DIR, path);
    const f = Bun.file(filePath);
    if (await f.exists()) {
      return new Response(f);
    }

    // SPA fallback: serve index.html for any unmatched route
    return new Response(Bun.file(join(DIST_DIR, "index.html")));
  },
});

console.log(`Web server running on port ${server.port}`);