import { chromium } from "playwright";
import { mkdir, writeFile, appendFile, readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { execFileSync } from "node:child_process";
import os from "node:os";
import { installObservers } from "./observe.mjs";
import { report } from "./report.mjs";
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i < 0 ? fallback : args[i + 1];
};
const iterations = Number(option("iterations", "10"));
if (!Number.isInteger(iterations) || iterations < 1 || iterations > 1000)
  throw Error("iterations must be 1–1000");
const modes = option("modes", "fresh,repeat").split(",");
if (modes.some((x) => !["fresh", "repeat"].includes(x)))
  throw Error("modes must be fresh and/or repeat");
const scenarios = option("scenarios", "home,dish,navigate,checkout").split(",");
if (
  scenarios.some((x) => !["home", "dish", "navigate", "checkout"].includes(x))
)
  throw Error("unknown scenario");
const config = JSON.parse(
  await readFile(option("config", "targets.json"), "utf8"),
);
const selected = option("targets", Object.keys(config).join(",")).split(",");
if (selected.some((t) => !config[t])) throw Error("unknown target");
const trace = args.includes("--trace");
const out = resolve(
  option("out", `results/${new Date().toISOString().replace(/[:.]/g, "-")}`),
);
await mkdir(out, { recursive: true });
const sampleFile = join(out, "samples.jsonl");
// Refuse to overwrite/mix separate runs.
await writeFile(sampleFile, "", { flag: "wx" });
const browser = await chromium.launch({ headless: !args.includes("--headed") });
let commit = "unknown";
try {
  commit = execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
} catch {}
const meta = {
  startedAt: new Date().toISOString(),
  iterations,
  modes,
  scenarios,
  targets: Object.fromEntries(selected.map((t) => [t, config[t]])),
  runner: {
    platform: os.platform(),
    arch: os.arch(),
    node: process.version,
    browser: browser.version(),
    location: option("location", "unspecified"),
    localCommit: commit,
    deployedCommit: option("deployed-commit", "unverified"),
  },
  viewport: { width: 1440, height: 1000 },
  trace,
  observationMs: 1500,
  notes: [
    "Serial alternating target order; no retries.",
    "Fresh context does not guarantee cold server, DNS or TLS.",
    "Repeat mode has one full unmeasured priming journey in that context.",
    "LCP is observed only until the fixed observation cutoff; not field Web Vitals.",
    "Client navigation and checkout timings include Playwright dispatch/actionability overhead.",
  ],
};
await writeFile(join(out, "run.json"), JSON.stringify(meta, null, 2));
let failures = 0,
  serial = 0;
const save = async (row) => {
  await appendFile(sampleFile, JSON.stringify(row) + "\n");
  if (row.phase === "measured")
    console.log(
      `${row.target} ${row.mode} ${row.scenario}: ${row.ok ? "PASS" : "FAIL " + row.error}`,
    );
};
async function journey(target, mode, scenario, iteration) {
  const context = await browser.newContext({
    viewport: meta.viewport,
    locale: "en-GB",
    timezoneId: "Europe/London",
    serviceWorkers: "block",
  });
  await context.addInitScript(installObservers);
  if (trace)
    await context.tracing.start({
      screenshots: true,
      snapshots: true,
      sources: false,
    });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  page.setDefaultNavigationTimeout(30000);
  let diagnostics = { errors: [], requestFailures: [], httpErrors: [] };
  page.on("pageerror", (e) => diagnostics.errors.push(e.message));
  page.on("requestfailed", (r) =>
    diagnostics.requestFailures.push({
      url: r.url(),
      error: r.failure()?.errorText,
    }),
  );
  page.on("response", (r) => {
    if (r.status() >= 400)
      diagnostics.httpErrors.push({ url: r.url(), status: r.status() });
  });
  const base = config[target].url.replace(/\/$/, "");
  async function snapshot() {
    return page.evaluate(() => {
      const n = performance.getEntriesByType("navigation")[0];
      const b = window.__bench;
      return {
        marks: b.marks,
        ttfb: n?.responseStart,
        fcp: b.fcp,
        observedLcp: b.lcp,
        layoutShiftSum: b.cls,
        dns: n ? n.domainLookupEnd - n.domainLookupStart : null,
        connection: n ? n.connectEnd - n.connectStart : null,
        responseEnd: n?.responseEnd,
        transferBytes: n?.transferSize,
        observationEnd: performance.now(),
      };
    });
  }
  async function direct(path) {
    const r = await page.goto(base + path, { waitUntil: "commit" });
    if (!r || r.status() !== 200)
      throw Error(`Navigation returned ${r?.status()}`);
    return {
      status: r.status(),
      headers: Object.fromEntries(
        Object.entries(await r.allHeaders()).filter(([k]) =>
          [
            "cache-control",
            "age",
            "x-cache",
            "server",
            "x-amz-cf-pop",
            "lambda-web-logstream",
            "lambda-web-error-type",
          ].includes(k),
        ),
      ),
    };
  }
  async function perform(phase) {
    diagnostics = { errors: [], requestFailures: [], httpErrors: [] };
    const row = {
      id: ++serial,
      target,
      mode,
      scenario,
      iteration,
      phase,
      startedAt: new Date().toISOString(),
      ok: false,
      metrics: {},
    };
    try {
      if (scenario === "home" || scenario === "dish") {
        row.response = await direct(scenario === "home" ? "/" : "/menu/flakes");
        await page
          .locator(scenario === "home" ? ".delivery-status" : ".route-page h1")
          .filter({
            hasText:
              scenario === "home" ? "Your reef is ready." : "The Golden Flake",
          })
          .waitFor();
        await page.waitForTimeout(meta.observationMs);
        const s = await snapshot();
        row.metrics = {
          ...s,
          shellVisibleMs: s.marks.homeShell ?? s.marks.dish,
          streamVisibleMs: s.marks.homeReady ?? null,
          streamGapMs:
            s.marks.homeReady !== undefined
              ? s.marks.homeReady - s.marks.homeShell
              : null,
        };
      } else if (scenario === "navigate") {
        await direct("/");
        await page.getByText("Your reef is ready.", { exact: false }).waitFor();
        const link = page.getByRole("link", {
          name: "The Golden Flake ↗",
          exact: true,
        });
        await link.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000); // Natural prefetch allowed, standard dwell.
        await page.evaluate(() => {
          window.__bench.marks = {};
          window.__bench.actionStart = performance.now();
        });
        await link.click();
        await page.waitForURL("**/menu/flakes");
        await page
          .getByRole("heading", { name: "The Golden Flake", exact: true })
          .waitFor();
        row.metrics = {
          navigationVisibleMs: await page.evaluate(
            () => window.__bench.marks.dish - window.__bench.actionStart,
          ),
        };
      } else {
        await direct("/");
        await page.getByText("Your reef is ready.", { exact: false }).waitFor();
        await page
          .getByRole("button", {
            name: "Add The Golden Flake to your bowl",
            exact: true,
          })
          .click();
        await page
          .getByRole("button", { name: "Go to checkout", exact: true })
          .click();
        await page
          .getByRole("textbox", { name: "Your fish’s name", exact: true })
          .fill("Benchmark Bubbles");
        await page
          .getByRole("textbox", { name: "Bowl address", exact: true })
          .fill("12 Pretend Reef");
        const submit = page.getByRole("button", {
          name: "Place pretend order · £5.49",
          exact: true,
        });
        await submit.scrollIntoViewIfNeeded();
        await page.evaluate(() => {
          window.__bench.marks = {};
          window.__bench.actionStart = performance.now();
        });
        const responsePromise = page.waitForResponse(
          (r) =>
            r.url() === base + "/api/orders" && r.request().method() === "POST",
        );
        const [response] = await Promise.all([responsePromise, submit.click()]);
        if (response.status() !== 200)
          throw Error("Checkout API failed: " + response.status());
        const receipt = await response.json();
        if (receipt.total !== 549) throw Error("Unexpected server order total");
        await page.waitForURL("**/orders/*");
        await page
          .getByRole("heading", {
            name: "Fin-tastic, Benchmark Bubbles!",
            exact: true,
          })
          .waitFor();
        await page
          .getByRole("link", { name: "Refresh order status →", exact: true })
          .waitFor();
        row.metrics = await page.evaluate(() => ({
          confirmationVisibleMs:
            window.__bench.marks.orderSummary - window.__bench.actionStart,
          progressVisibleMs:
            window.__bench.marks.orderReady - window.__bench.actionStart,
          streamGapMs:
            window.__bench.marks.orderReady - window.__bench.marks.orderSummary,
        }));
        row.api = {
          status: response.status(),
          timing: response.request().timing(),
        };
        const url = page.url();
        await direct(new URL(url).pathname);
        await page
          .getByRole("link", { name: "Refresh order status →", exact: true })
          .waitFor();
        await page.waitForTimeout(meta.observationMs);
        const refresh = await snapshot();
        row.refresh = {
          ...refresh,
          summaryVisibleMs: refresh.marks.orderSummary,
          progressVisibleMs: refresh.marks.orderReady,
          streamGapMs: refresh.marks.orderReady - refresh.marks.orderSummary,
        };
        // Flatten only named refresh measurements for reporting.
        row.metrics.refreshTtfb = refresh.ttfb;
        row.metrics.refreshSummaryVisibleMs = row.refresh.summaryVisibleMs;
        row.metrics.refreshStreamGapMs = row.refresh.streamGapMs;
        const html = await (await context.request.get(url)).text();
        if (!html.includes("Benchmark Bubbles") || !html.includes("£5.49"))
          throw Error("Personalised SSR receipt missing");
      }
      const required =
        scenario === "home"
          ? ["ttfb", "shellVisibleMs", "streamGapMs"]
          : scenario === "dish"
            ? ["ttfb", "shellVisibleMs"]
            : scenario === "navigate"
              ? ["navigationVisibleMs"]
              : [
                  "confirmationVisibleMs",
                  "progressVisibleMs",
                  "refreshTtfb",
                  "refreshSummaryVisibleMs",
                  "refreshStreamGapMs",
                ];
      if (
        required.some(
          (key) => !Number.isFinite(row.metrics[key]) || row.metrics[key] < 0,
        )
      )
        throw Error("Missing or invalid timing marker");
      if (diagnostics.errors.length)
        throw Error("Page JavaScript error: " + diagnostics.errors[0]);
      row.ok = true;
    } catch (e) {
      row.error = e.message;
      const file = `failure-${row.id}.png`;
      await page
        .screenshot({ path: join(out, file), fullPage: true })
        .then(() => (row.screenshot = file))
        .catch(() => {});
      if (phase === "measured") failures++;
    }
    row.finishedAt = new Date().toISOString();
    row.diagnostics = diagnostics;
    await save(row);
    return row.ok;
  }
  try {
    if (mode === "repeat") {
      const warm = await perform("priming");
      if (!warm) {
        failures++;
        await save({
          id: ++serial,
          target,
          mode,
          scenario,
          iteration,
          phase: "measured",
          startedAt: new Date().toISOString(),
          finishedAt: new Date().toISOString(),
          ok: false,
          error: "Priming journey failed; repeat measurement unavailable",
          metrics: {},
        });
        return;
      }
      await page.goto("about:blank");
    }
    await perform("measured");
  } finally {
    if (trace)
      await context.tracing.stop({
        path: join(out, `trace-${target}-${mode}-${scenario}-${iteration}.zip`),
      });
    await context.close();
  }
}
try {
  for (let i = 0; i < iterations; i++)
    for (const mode of modes)
      for (const scenario of scenarios) {
        const order =
          (i + scenarios.indexOf(scenario)) % 2
            ? [...selected].reverse()
            : selected;
        for (const target of order) await journey(target, mode, scenario, i);
      }
} catch (e) {
  meta.fatalError = e.message;
  failures++;
  console.error(e);
} finally {
  await browser.close();
  meta.finishedAt = new Date().toISOString();
  meta.failures = failures;
  await writeFile(join(out, "run.json"), JSON.stringify(meta, null, 2));
  await report(out);
  console.log(`Results: ${out}`);
}
process.exitCode = failures ? 1 : 0;
