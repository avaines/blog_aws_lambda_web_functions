import {
  CloudWatchClient,
  ListMetricsCommand,
  GetMetricDataCommand,
} from "@aws-sdk/client-cloudwatch";
import {
  CloudWatchLogsClient,
  FilterLogEventsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { readFile, writeFile } from "node:fs/promises";
import { report } from "./report.mjs";
import { resolve, join } from "node:path";
const dir = process.argv[2];
if (!dir) throw Error("Usage: npm run collect:aws -- results/RUN [--logs]");
const meta = JSON.parse(await readFile(join(dir, "run.json"), "utf8"));
if (!meta.finishedAt) throw Error("Benchmark run has not finished");
const start = new Date(Math.floor(Date.parse(meta.startedAt) / 60000) * 60000),
  end = new Date(Math.ceil(Date.parse(meta.finishedAt) / 60000) * 60000);
const catalog = {
  "AWS/AmplifyHosting": {
    Requests: "Sum",
    "4xxErrors": "Sum",
    "5xxErrors": "Sum",
    BytesDownloaded: "Sum",
    BytesUploaded: "Sum",
    Latency: "p95",
  },
  "AWS/Lambda/Web": {
    ExecutedRequests: "Sum",
    HTTPResponseStatusClass4XX: "Sum",
    HTTPResponseStatusClass5XX: "Sum",
    EnvironmentActiveTime: "Sum",
    EnvironmentCPUTime: "Sum",
    EnvironmentMaxMemoryUsage: "Maximum",
    EnvironmentConcurrentRequests: "Maximum",
    ResponseBytes: "Sum",
  },
  "AWS/Lambda/Web/Usage": {
    ExecutedRequests: "Sum",
    EndpointActiveEnvironments: "Maximum",
    AccountRequestThrottles: "Sum",
    EndpointRequestThrottles: "Sum",
    AccountActiveVCPUArm64Throttles: "Sum",
    EndpointActiveEnvironmentThrottles: "Sum",
  },
};
const result = {
  collectedAt: new Date().toISOString(),
  window: { start, end },
  notes: [
    "Minute-aligned window includes priming, static assets and potentially unrelated traffic.",
    "Missing datapoints are not converted to zero. Recollect after publication delay.",
    "Amplify Latency is seconds and excludes client network time; no equivalent Web Functions latency metric is assumed.",
  ],
  targets: {},
};
for (const [name, target] of Object.entries(meta.targets)) {
  const aws = target.aws;
  const output = (result.targets[name] = { series: [], errors: [] });
  if (!aws) {
    output.errors.push("No AWS identifiers configured");
    continue;
  }
  const client = new CloudWatchClient({ region: aws.region });
  try {
    const found = [];
    for (const namespace of aws.appId
      ? ["AWS/AmplifyHosting"]
      : ["AWS/Lambda/Web", "AWS/Lambda/Web/Usage"]) {
      let token;
      do {
        const r = await client.send(
          new ListMetricsCommand({ Namespace: namespace, NextToken: token }),
        );
        token = r.NextToken;
        for (const metric of r.Metrics || []) {
          if (!catalog[namespace][metric.MetricName]) continue;
          const d = Object.fromEntries(
            (metric.Dimensions || []).map((x) => [x.Name, x.Value]),
          );
          const match = aws.appId
            ? Object.values(d).includes(aws.appId)
            : d.FunctionName === aws.functionName &&
              (!d.EndpointName || d.EndpointName === aws.endpointName) &&
              (!d.ExecutionRegion || d.ExecutionRegion === aws.region);
          if (match) found.push(metric);
        }
      } while (token);
    }
    if (!found.length)
      output.errors.push(
        "No matching metrics discovered. Check identifiers, region and publication delay.",
      );
    const queries = found.map((Metric, i) => ({
      Id: `m${i}`,
      MetricStat: {
        Metric,
        Period: 60,
        Stat: catalog[Metric.Namespace][Metric.MetricName],
      },
      ReturnData: true,
    }));
    for (let i = 0; i < queries.length; i += 100) {
      const batch = queries.slice(i, i + 100);
      let token;
      do {
        const r = await client.send(
          new GetMetricDataCommand({
            StartTime: start,
            EndTime: end,
            MetricDataQueries: batch,
            NextToken: token,
            ScanBy: "TimestampAscending",
          }),
        );
        token = r.NextToken;
        for (const series of r.MetricDataResults || []) {
          const query = queries.find((q) => q.Id === series.Id);
          output.series.push({
            metric: query.MetricStat.Metric,
            statistic: query.MetricStat.Stat,
            status: series.StatusCode,
            messages: series.Messages,
            points: (series.Timestamps || []).map((time, j) => ({
              time,
              value: series.Values[j],
            })),
          });
        }
      } while (token);
    }
    if (process.argv.includes("--logs") && aws.logGroup) {
      const logs = new CloudWatchLogsClient({ region: aws.region });
      output.initializations = [];
      try {
        let token;
        let pages = 0;
        do {
          const r = await logs.send(
            new FilterLogEventsCommand({
              logGroupName: aws.logGroup,
              startTime: start.getTime(),
              endTime: end.getTime(),
              filterPattern: '"platform.init"',
              nextToken: token,
            }),
          );
          const previous = token;
          token = r.nextToken;
          for (const e of r.events || []) {
            try {
              const item = JSON.parse(e.message);
              output.initializations.push({
                timestamp: e.timestamp,
                logStream: e.logStreamName,
                type: item.type,
                metrics: item.record?.metrics,
                revisionId: item.record?.revisionId,
              });
            } catch {}
          }
          if (token === previous) break;
          if (++pages >= 100) {
            output.errors.push("Log collection truncated at 100 pages");
            break;
          }
        } while (token);
      } catch (e) {
        output.errors.push("Logs: " + e.message);
      } finally {
        logs.destroy();
      }
    }
  } catch (e) {
    output.errors.push(e.message);
  } finally {
    client.destroy();
  }
}
await writeFile(
  join(resolve(dir), "cloudwatch.json"),
  JSON.stringify(result, null, 2),
);
console.log(
  JSON.stringify(
    Object.fromEntries(
      Object.entries(result.targets).map(([k, v]) => [
        k,
        { series: v.series.length, errors: v.errors },
      ]),
    ),
    null,
    2,
  ),
);
if (Object.values(result.targets).some((x) => x.errors.length))
  process.exitCode = 1;

await report(resolve(dir));
