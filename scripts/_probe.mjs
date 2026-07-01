import { spawn, spawnSync } from "child_process";
import path from "path";
import fs from "fs/promises";
const ROOT = process.cwd();
const NEXT = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");
const srv = spawn(process.execPath, [NEXT, "start", "-p", "3991"], { cwd: ROOT, stdio: ["ignore", "ignore", "ignore"] });
async function ready() {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch("http://127.0.0.1:3991/"); if (r.status) return true; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}
try {
  if (!(await ready())) { console.log("NOT READY"); process.exit(1); }
  const r = await fetch("http://127.0.0.1:3991/share/does-not-exist", { headers: { cookie: `webdeck_locale=zh-CN` } });
  const body = await r.text();
  await fs.writeFile("scripts/_probe_out.html", body);
  console.log("status", r.status, "len", body.length);
  const h1 = body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  console.log("H1:", h1 ? h1[1] : "none");
} finally {
  srv.kill("SIGTERM");
  spawnSync("taskkill", ["/pid", String(srv.pid), "/T", "/F"]);
}
