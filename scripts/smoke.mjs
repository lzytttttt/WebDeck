// v0.3 smoke test (spec 10 + 13.11).
//
// Boots a production Next server, seeds demo data, and drives the main
// delivery flow end-to-end with bare `node` fetch (no e2e framework):
//   seed -> list -> get -> patch -> duplicate -> export-check -> export-html
//   -> publish -> share page -> delete.
// Then verifies the bilingual UI (zh-CN default + English via locale cookie)
// renders natively with no cross-language mixing on the home, editor,
// import-quality, share-error, and present surfaces.
//
// Assumes `next build` already ran. Exit code is non-zero on any failure.

import { spawn, spawnSync } from "child_process";
import fs from "fs/promises";
import path from "path";

const PORT = Number(process.env.SMOKE_PORT ?? 3971);
const BASE = `http://127.0.0.1:${PORT}`;
const ROOT = process.cwd();
const NEXT_BIN = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");

let passed = 0;
let failed = 0;
const failures = [];

function ok(name) {
  passed++;
  console.log(`  \u2713 ${name}`);
}
function bad(name, detail) {
  failed++;
  failures.push(name);
  console.log(`  \u2717 ${name}${detail ? ` \u2014 ${detail}` : ""}`);
}
function check(name, cond, detail) {
  if (cond) ok(name);
  else bad(name, detail);
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function run(cmd, args) {
  const res = spawnSync(cmd, args, { cwd: ROOT, encoding: "utf8" });
  if (res.status !== 0) {
    throw new Error(
      `${cmd} ${args.join(" ")} failed (${res.status}): ${res.stderr || res.stdout}`,
    );
  }
  return res.stdout;
}

async function waitForReady(timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/`, { headers: { cookie: "webdeck_locale=en" } });
      if (res.ok) return;
    } catch {
      // server not up yet
    }
    await sleep(500);
  }
  throw new Error(`server did not become ready on ${BASE} within ${timeoutMs}ms`);
}

async function getText(pathname, locale) {
  const headers = locale ? { cookie: `webdeck_locale=${locale}` } : {};
  const res = await fetch(`${BASE}${pathname}`, { headers });
  return { status: res.status, body: await res.text() };
}

async function getJson(pathname) {
  const res = await fetch(`${BASE}${pathname}`);
  let body = null;
  try {
    body = await res.json();
  } catch {
    // non-JSON
  }
  return { status: res.status, body };
}

// Asserts the expected-locale marker is present and the opposite-locale marker
// is absent (spec 13.6: no zh/en mixing on a single page).
function checkBilingual(label, html, present, absent) {
  check(
    `${label}: shows localized text`,
    html.includes(present),
    `missing ${JSON.stringify(present)}`,
  );
  check(
    `${label}: no mixed-language leak`,
    !html.includes(absent),
    `unexpected ${JSON.stringify(absent)}`,
  );
}

async function main() {
  console.log("Seeding demo projects...");
  run(process.execPath, [path.join(ROOT, "scripts", "seed-demo.mjs")]);

  console.log(`Starting Next server on :${PORT}...`);
  const server = spawn(process.execPath, [NEXT_BIN, "start", "-p", String(PORT)], {
    cwd: ROOT,
    stdio: ["ignore", "ignore", "inherit"],
    env: { ...process.env },
  });

  let uploadedId = null;
  let dupId = null;

  try {
    await waitForReady();
    console.log("Server ready.\n");

    // --- Core delivery flow -------------------------------------------------
    console.log("Core flow:");

    const list = await getJson("/api/projects?demo=1");
    check("list demos returns 200", list.status === 200, `status ${list.status}`);
    const demos = list.body?.projects ?? [];
    check("list contains 5 demos", demos.length === 5, `got ${demos.length}`);
    const company = demos.find((p) => p.id === "proj_demo_company");
    check("company demo present", Boolean(company));

    const got = await getJson("/api/projects/proj_demo_company");
    check("get project returns 200", got.status === 200, `status ${got.status}`);
    check("get project has webDeck", Boolean(got.body?.webDeck));

    const patchRes = await fetch(`${BASE}/api/projects/proj_demo_company`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Company Profile (smoke)" }),
    });
    const patched = await patchRes.json().catch(() => null);
    check("patch project returns 200", patchRes.status === 200, `status ${patchRes.status}`);
    check("patch updated name", patched?.name === "Company Profile (smoke)", patched?.name);

    const dupRes = await fetch(`${BASE}/api/projects/proj_demo_company/duplicate`, {
      method: "POST",
    });
    const dup = await dupRes.json().catch(() => null);
    check("duplicate returns 201", dupRes.status === 201, `status ${dupRes.status}`);
    dupId = dup?.id ?? null;
    check("duplicate has new id", Boolean(dupId) && dupId !== "proj_demo_company", dupId);
    check("duplicate status is generated", dup?.project?.status === "generated", dup?.project?.status);

    const xc = await getJson(`/api/projects/${dupId}/export-check`);
    check("export-check returns 200", xc.status === 200, `status ${xc.status}`);
    check("export-check canExport true", xc.body?.canExport === true);
    check(
      "export-check has size estimate",
      typeof xc.body?.estimatedSizeKb === "number" && xc.body.estimatedSizeKb > 0,
      String(xc.body?.estimatedSizeKb),
    );

    const xh = await getText(`/api/projects/${dupId}/export-html`);
    check("export-html returns 200", xh.status === 200, `status ${xh.status}`);
    check("export-html is a document", xh.body.includes("<!doctype html>"), "no doctype");
    check(
      "export-html embeds deck JSON",
      xh.body.includes('id="web-deck-data"'),
      "no embedded deck",
    );
    check(
      "export-html has source-project meta",
      xh.body.includes('name="web-deck:source-project"'),
      "no source-project meta",
    );

    const pubRes = await fetch(`${BASE}/api/projects/${dupId}/publish`, { method: "POST" });
    const pub = await pubRes.json().catch(() => null);
    check("publish returns 200", pubRes.status === 200, `status ${pubRes.status}`);
    const shareId = pub?.shareId ?? null;
    check("publish returns shareId", Boolean(shareId), shareId);

    const share = await getText(`/share/${shareId}`, "en");
    check("share page returns 200", share.status === 200, `status ${share.status}`);
    check(
      "share page renders deck title",
      share.body.includes("Company Profile Web Deck"),
      "deck title missing",
    );

    const delRes = await fetch(`${BASE}/api/projects/${dupId}`, { method: "DELETE" });
    const del = await delRes.json().catch(() => null);
    check("delete duplicate returns 200", delRes.status === 200, `status ${delRes.status}`);
    check("delete reports ok", del?.ok === true);
    const gone = await getJson(`/api/projects/${dupId}`);
    check("deleted project is 404", gone.status === 404, `status ${gone.status}`);
    dupId = null;

    // --- Bilingual UI (spec 13.11) -----------------------------------------
    console.log("\nBilingual UI:");

    const homeDefault = await getText("/");
    check(
      "home default locale is zh-CN",
      homeDefault.body.includes("把你的 PPT 升级成可交互网页"),
      "zh title missing",
    );

    const homeEn = await getText("/", "en");
    checkBilingual(
      "home (en)",
      homeEn.body,
      "Upgrade your PPT into an interactive web deck",
      "把你的 PPT 升级成可交互网页",
    );

    const homeZh = await getText("/", "zh-CN");
    checkBilingual(
      "home (zh-CN)",
      homeZh.body,
      "把你的 PPT 升级成可交互网页",
      "Upgrade your PPT into an interactive web deck",
    );

    // Editor toolbar bilingual + no mixing.
    const editEn = await getText("/projects/proj_demo_company/edit", "en");
    checkBilingual("editor (en)", editEn.body, "Conservative", "保守模式");
    const editZh = await getText("/projects/proj_demo_company/edit", "zh-CN");
    checkBilingual("editor (zh-CN)", editZh.body, "保守模式", "Conservative");

    // Present page bilingual.
    const presentEn = await getText("/projects/proj_demo_company/present", "en");
    checkBilingual("present (en)", presentEn.body, "Exit", "退出");
    const presentZh = await getText("/projects/proj_demo_company/present", "zh-CN");
    checkBilingual("present (zh-CN)", presentZh.body, "退出", "Exit");

    // Share error state bilingual (invalid shareId -> not-found).
    const shareErrEn = await getText("/share/does-not-exist", "en");
    check("invalid share is 404", shareErrEn.status === 404, `status ${shareErrEn.status}`);
    checkBilingual("share-error (en)", shareErrEn.body, "Page not found", "页面不存在");
    const shareErrZh = await getText("/share/does-not-exist", "zh-CN");
    checkBilingual("share-error (zh-CN)", shareErrZh.body, "页面不存在", "Page not found");

    // Import Quality Report bilingual (needs a real upload with a report).
    console.log("\nImport quality (upload flow):");
    run(process.execPath, [path.join(ROOT, "scripts", "make-sample-pptx.js")]);
    const pptxBuf = await fs.readFile(path.join(ROOT, "sample.pptx"));
    const fd = new FormData();
    fd.append("file", new Blob([pptxBuf]), "sample.pptx");
    const upRes = await fetch(`${BASE}/api/projects/upload`, { method: "POST", body: fd });
    const up = await upRes.json().catch(() => null);
    check("upload returns 201", upRes.status === 201, `status ${upRes.status}`);
    uploadedId = up?.id ?? null;
    check("upload returns project id", Boolean(uploadedId), uploadedId);

    if (uploadedId) {
      const iqEn = await getText(`/projects/${uploadedId}/edit`, "en");
      checkBilingual("import-quality (en)", iqEn.body, "Import quality", "转换质量");
      const iqZh = await getText(`/projects/${uploadedId}/edit`, "zh-CN");
      checkBilingual("import-quality (zh-CN)", iqZh.body, "转换质量", "Import quality");
    }
  } finally {
    // Cleanup: remove the uploaded project + sample file, then kill the server.
    try {
      if (uploadedId) await fetch(`${BASE}/api/projects/${uploadedId}`, { method: "DELETE" });
      if (dupId) await fetch(`${BASE}/api/projects/${dupId}`, { method: "DELETE" });
      await fs.rm(path.join(ROOT, "sample.pptx"), { force: true });
    } catch {
      // best-effort
    }
    server.kill("SIGTERM");
    if (process.platform === "win32" && server.pid) {
      spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"]);
    }
  }

  console.log(`\n${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    console.log(`Failures: ${failures.join(", ")}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("smoke run crashed:", err);
  process.exit(1);
});
