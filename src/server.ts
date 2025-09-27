import { serve } from "bun";

const publicDirUrl = new URL("../public/", import.meta.url);

async function file(pathname: string): Promise<Response> {
  // Normalize to prevent escaping outside public
  const url = new URL(pathname, publicDirUrl);
  const f = Bun.file(url);
  if (!(await f.exists())) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(f);
}

serve({
  port: Number(Bun.env?.PORT ?? 3000),
  fetch(req: Request) {
    const url = new URL(req.url);

    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "content-type": "application/json" },
      });
    }

    if (url.pathname === "/favicon.ico") {
      return new Response(null, { status: 204 });
    }

    if (url.pathname === "/" || url.pathname === "/index.html") {
      return file("index.html");
    }

    return file(url.pathname.slice(1));
  },
});

console.log(`Servidor iniciado em http://localhost:3000`);
