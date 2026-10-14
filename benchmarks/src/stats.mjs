export function quantile(values, p) {
  const a = values.filter(Number.isFinite).sort((x, y) => x - y);
  if (!a.length) return null;
  const i = (a.length - 1) * p,
    lo = Math.floor(i);
  return a[lo] + (a[Math.ceil(i)] - a[lo]) * (i - lo);
}
export function summarize(values) {
  const a = values.filter(Number.isFinite);
  if (!a.length)
    return { n: 0, median: null, p75: null, p95: null, medianCI95: null };
  let seed = 7391;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const boot =
    a.length < 5
      ? []
      : Array.from({ length: 1000 }, () =>
          quantile(
            Array.from(
              { length: a.length },
              () => a[Math.floor(random() * a.length)],
            ),
            0.5,
          ),
        );
  return {
    n: a.length,
    median: quantile(a, 0.5),
    p75: quantile(a, 0.75),
    p95: quantile(a, 0.95),
    medianCI95: boot.length
      ? [quantile(boot, 0.025), quantile(boot, 0.975)]
      : null,
  };
}
