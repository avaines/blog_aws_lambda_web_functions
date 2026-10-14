import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { summarize } from "./stats.mjs";
const esc = (x) =>
  String(x ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const fmt = (x) => (Number.isFinite(x) ? x.toFixed(1) : "—");
export async function report(dir) {
  const meta = JSON.parse(await readFile(join(dir, "run.json"), "utf8"));
  const all = (await readFile(join(dir, "samples.jsonl"), "utf8"))
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((x) => JSON.parse(x));
  const rows = all.filter((r) => r.phase === "measured");
  const groups = new Map();
  for (const r of rows) {
    const key = [r.scenario, r.mode, r.target].join(" / ");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }
  const metrics = [
    "ttfb",
    "fcp",
    "observedLcp",
    "shellVisibleMs",
    "streamVisibleMs",
    "streamGapMs",
    "navigationVisibleMs",
    "confirmationVisibleMs",
    "progressVisibleMs",
    "refreshTtfb",
    "refreshSummaryVisibleMs",
    "refreshStreamGapMs",
  ];
  const summaries = [];
  for (const [group, samples] of groups) {
    for (const metric of metrics) {
      const values = samples
        .filter((r) => r.ok)
        .map((r) => r.metrics?.[metric])
        .filter(Number.isFinite);
      if (!values.length) continue;
      summaries.push({
        group,
        metric,
        attempts: samples.length,
        failures: samples.filter((r) => !r.ok).length,
        ...summarize(values),
        values,
      });
    }
  }
  await writeFile(
    join(dir, "summary.json"),
    JSON.stringify({ meta, summaries }, null, 2),
  );
  const csvCell = (x) => '"' + String(x ?? "").replaceAll('"', '""') + '"';
  const csv = [
    [
      "id",
      "target",
      "mode",
      "scenario",
      "iteration",
      "phase",
      "ok",
      "startedAt",
      "finishedAt",
      "error",
      ...metrics,
    ]
      .map(csvCell)
      .join(","),
  ];
  for (const r of all)
    csv.push(
      [
        r.id,
        r.target,
        r.mode,
        r.scenario,
        r.iteration,
        r.phase,
        r.ok,
        r.startedAt,
        r.finishedAt,
        r.error,
        ...metrics.map((m) => r.metrics?.[m]),
      ]
        .map(csvCell)
        .join(","),
    );
  await writeFile(join(dir, "samples.csv"), csv.join("\n") + "\n");
  // Put each metric's platform rows next to one another for comparison.
  summaries.sort((a, b) => {
    const [as, am, at] = a.group.split(" / ");
    const [bs, bm, bt] = b.group.split(" / ");
    return (
      as.localeCompare(bs) ||
      am.localeCompare(bm) ||
      metrics.indexOf(a.metric) - metrics.indexOf(b.metric) ||
      at.localeCompare(bt)
    );
  });
  let awsSection =
    "<p>CloudWatch data has not been collected for this run.</p>";
  try {
    const aws = JSON.parse(
      await readFile(join(dir, "cloudwatch.json"), "utf8"),
    );
    awsSection =
      '<p><a href="cloudwatch.json">CloudWatch raw metrics</a> · Collected ' +
      esc(aws.collectedAt) +
      "</p><ul>" +
      Object.entries(aws.targets)
        .map(
          ([name, data]) =>
            "<li>" +
            esc(name) +
            ": " +
            data.series.length +
            " metric pages; " +
            esc(data.errors.join("; ") || "no collection errors") +
            "</li>",
        )
        .join("") +
      "</ul><p>Aggregate context only, including priming and other traffic. Missing points remain missing.</p>";
  } catch {}
  const scale = Math.max(1, ...summaries.flatMap((s) => s.values));
  const table = summaries
    .map(
      (s) =>
        `<tr><td>${esc(s.group)}</td><td>${esc(s.metric)}</td><td>${s.n}/${s.attempts}</td><td>${s.failures}</td><td>${fmt(s.median)}</td><td>${fmt(s.p75)}</td><td>${fmt(s.p95)}${s.n < 100 ? " *" : ""}</td><td>${s.medianCI95?.map(fmt).join("–") ?? "Insufficient samples"}</td><td><svg width="180" height="22" aria-label="Sample distribution on a shared scale">${s.values.map((v) => `<circle cx="${2 + (176 * v) / scale}" cy="11" r="2" fill="#067a73" opacity=".4"/>`).join("")}</svg></td></tr>`,
    )
    .join("");
  const status = [...groups]
    .map(
      ([g, s]) =>
        `<li>${esc(g)}: ${s.filter((r) => r.ok).length}/${s.length} passed</li>`,
    )
    .join("");
  const failed = rows
    .filter((r) => !r.ok)
    .map(
      (r) =>
        `<li>${esc(r.target + " / " + r.mode + " / " + r.scenario)}: ${esc(r.error)} ${r.screenshot ? `<a href="${esc(r.screenshot)}">Screenshot</a>` : ""}</li>`,
    )
    .join("");
  await writeFile(
    join(dir, "report.html"),
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Fin & Feast hosting benchmark</title><style>body{font:15px system-ui;margin:40px;color:#243e35;background:#fffcf5}h1{font-size:36px}p{max-width:1000px;line-height:1.6}table{border-collapse:collapse;background:white;width:100%;font-size:12px}td,th{padding:12px;border-bottom:1px solid #ddd;text-align:left}th{background:#dcece7}code{background:#eee;padding:3px}a{color:#067a73}.scroll{overflow:auto}</style><h1>Fin & Feast · hosting comparison</h1>${meta.fatalError ? `<p>Run interrupted: ${esc(meta.fatalError)}</p>` : ""}<p>${esc(meta.startedAt)} → ${esc(meta.finishedAt)}<br>Runner: ${esc(meta.runner.location)} · ${esc(meta.runner.platform)} ${esc(meta.runner.arch)} · Chromium ${esc(meta.runner.browser)}<br>Deployed commit: ${esc(meta.runner.deployedCommit)} · Tracing: ${meta.trace ? "ON — diagnostic run, exclude from performance comparisons" : "off"}</p><p>These results compare the supplied deployments, including their different CDN/runtime configurations. No automatic winner is declared. Timings are milliseconds. Failed journeys remain in the counts; their incomplete timings are excluded from percentiles. Priming journeys are retained in raw data but excluded here.</p><p>* p95 with fewer than 100 samples is unstable. Median intervals are deterministic percentile-bootstrap 95% intervals (1,000 resamples, minimum 5 samples), assuming independent samples; serial tests and shared caches weaken that assumption. Dots show individual successful measurements on a common 0–${fmt(scale)}ms scale.</p><ul>${meta.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul><h2>Journey outcomes</h2><ul>${status}</ul><h2>Measurements</h2><div class="scroll"><table><thead><tr><th>Scenario / cache mode / target</th><th>Metric</th><th>Measured / attempts</th><th>Failures</th><th>Median</th><th>p75</th><th>p95</th><th>Median 95% interval</th><th>Distribution</th></tr></thead><tbody>${table}</tbody></table></div><h2>AWS context</h2>${awsSection}<h2>Failures</h2><ul>${failed || "<li>None</li>"}</ul><p><a href="samples.csv">CSV</a> · <a href="samples.jsonl">Raw JSONL</a> · <a href="summary.json">Summary JSON</a> · <a href="run.json">Run metadata</a></p></html>`,
  );
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  if (!process.argv[2]) throw Error("Usage: npm run report -- results/RUN");
  await report(resolve(process.argv[2]));
}
