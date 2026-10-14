# Hosting benchmarks

Playwright journeys against the two Fin & Feast deployments, with an optional AWS CloudWatch collector. This is a browser experience benchmark, not a load test or a pure compute comparison.

## Run

From `benchmarks/`, use Node 22+:

```sh
npm ci
npx playwright install chromium
npm run check
# Quick check: 8 measured journeys, including two fictional checkouts
npm run bench -- --iterations 1 --modes fresh --location london-laptop
# Repeated comparison: 100 samples per scenario, mode and target
npm run bench -- --iterations 100 --location london-laptop --deployed-commit SAME_SHA_ON_BOTH
```

The default is 10 iterations, four scenarios, two targets and two cache modes. Repeat mode executes an additional priming journey before each measurement. A 100-iteration full run therefore executes 2,400 journeys and creates 600 fictional orders. It can take hours; start small. Stop with Ctrl+C if needed. The runner sends requests serially, with no concurrent browsers or retries. Don't run two benchmark processes at once on the same machine.

`targets.json` holds the deployed URLs and AWS metric identifiers. Override it with `--config path.json`. AWS identifiers are editable defaults; verify them against your deployed Terraform outputs. Use `--targets amplify` or `--targets web-functions` to select one. Use `--scenarios home,dish,navigate,checkout`, `--modes fresh,repeat`, `--iterations N`, and `--out results/my-run` to narrow a run. Output folders must be new. Results and diagnostics are gitignored.

The runner records the local Git SHA as provenance only: it **does not verify deployed commits**. Only supply `--deployed-commit` after verifying both deployments. Record runner location honestly; it is not inferred. Keep machine, viewport, network/VPN and browser version constant and avoid background CPU work. The lockfile pins Playwright and its corresponding Chromium version.

## Journeys and measurement definitions

| Scenario | Actions | Measurements |
| --- | --- | --- |
| `home` | Direct homepage load, wait for kitchen result | Browser TTFB/FCP, observed LCP, DOM-visible shell and delayed panel |
| `dish` | Direct `/menu/flakes` load | Browser TTFB/FCP, observed LCP, dish visibility |
| `navigate` | Load menu, scroll dish link into view, dwell 1 second, click | Action-start to dish visibility; normal Next.js prefetch is allowed |
| `checkout` | Load menu, add one Golden Flake, fill fictional details, submit; then request order page again | Click-to-summary, click-to-progress, summary-to-progress gap, API timing; direct personalised SSR TTFB and visibility |

Direct navigation waits for the document response to commit, not `load` or `networkidle`, so streamed shell arrival is not hidden behind completion. A DOM observer installed before application JS records when the target content first has layout boxes; this is a DOM visibility approximation, not an exact paint timestamp. Browser PerformanceObserver provides paint measurements separately.

Direct pages have a fixed observation cutoff 1.5 seconds after their target content appears. `observedLcp` is the last LCP candidate observed by that cutoff, **not final field LCP**; later font/layout changes may be missed. `layoutShiftSum` in raw results is a diagnostic cumulative sum, not the session-window CLS score. We do not label synthetic click timings as INP. All report timings are milliseconds.

Fresh mode creates a new browser context for each journey. Repeat mode primes the entire journey once in the same context, then measures it again. The checkout refresh retains the receipt cookie. These describe browser-cache conditions only: fresh contexts do not reset server instances, CDN caches, process-wide DNS or connection state. No requests are labelled cold starts. Cache response headers and Web Function log-stream hints are retained when present.

The existing artificial delays (1.6 seconds on the homepage and 1.2 seconds on order progress) remain in place. They expose buffering and streaming differences; do not present those delay-inclusive completion times as compute overhead. A small summary-to-panel gap can mean the host buffered the response. Inspect both absolute arrival times and gaps.

## Results

Each run creates:

- `run.json`: target configuration, time window, browser and runner provenance.
- `samples.jsonl`: every measured and priming attempt, timings, diagnostics, headers and failures. Written after each journey to preserve progress.
- `samples.csv`: flattened timings for spreadsheets.
- `summary.json` and `report.html`: successful-sample distributions, median, p75, p95, coverage and failure counts, plus bootstrap intervals for medians when there are at least five samples.
- Failure screenshots. Trace files only when explicitly requested.

With fewer than 100 samples the report marks p95 as unstable. Confidence intervals assume independent samples, which serial runs against shared caches do not fully satisfy. Failures are excluded from latency percentiles but displayed alongside them; don't compare latency without the failure rate. No automatic winner is declared. Missing values remain missing. Priming timings are excluded from the report, retained in raw data, and included in the AWS collection window.

Rebuild a report, including after an interrupted run:

```sh
npm run report -- results/RUN
```

For an explicit diagnostic rerun:

```sh
npm run bench -- --iterations 1 --targets amplify --scenarios checkout --modes fresh --trace
npx playwright show-trace results/RUN/trace-amplify-fresh-checkout-0.zip
```

Tracing changes overhead. These runs are flagged and should not be merged with measured runs. The script does not silently retry failures. Screenshots are captured only after a failure, outside the recorded timing endpoints.

## AWS context

After a completed run, wait a few minutes for CloudWatch publication, then:

```sh
AWS_PROFILE=your-profile npm run collect:aws -- results/RUN
# Optional Web Functions initialization events, when log permissions are available:
AWS_PROFILE=your-profile npm run collect:aws -- results/RUN --logs
```

The AWS SDK uses its normal credential chain. Do not put keys in the config. The collector uses `cloudwatch:ListMetrics`, `cloudwatch:GetMetricData`, and optionally `logs:FilterLogEvents`. No cloud resources are changed. Missing credentials produce a recorded error in `cloudwatch.json` and a nonzero exit code; browser results remain usable.

The collector discovers actual metric dimensions and requests minute-aligned data for the run window. This may include unrelated traffic. Amplify app-level data can include other branches; Web Functions environment data covers all endpoints of the function. Sparse datapoints stay absent rather than becoming zero. Re-running collection overwrites `cloudwatch.json`, allowing late metrics to arrive. CloudWatch/API charges may apply.

Amplify provides viewer request/error counts and latency (seconds, excluding the viewer's network journey). Web Functions provides executed requests/errors, CPU/memory/concurrency and throttling metrics with different counting boundaries. These are diagnostic context, not interchangeable click-level latency measurements. Optional initialization events are returned as structured metadata only; automatic attribution of cold starts to individual browser samples is not implemented.

## Comparison limits

The current Amplify deployment has managed CDN delivery. Web Functions uses a direct HomeRegion endpoint. The configured runtimes differ. Start by comparing these real deployments; use an additional controlled setup if you later want to isolate origin compute performance. No CPU/network emulation is applied, external fonts load normally, and the runner itself is part of the measurement environment.

Sources: [Playwright browser contexts](https://playwright.dev/docs/api/class-browser), [Amplify metrics](https://docs.aws.amazon.com/amplify/latest/userguide/monitoring-with-cloudwatch.html), [Web Functions metrics](https://docs.aws.amazon.com/lambda/latest/dg/web-functions-monitoring-metrics.html).
