import { test } from "node:test";
import assert from "node:assert/strict";
import { quantile, summarize } from "./stats.mjs";
test("percentiles interpolate and exclude absent measurements", () => {
  assert.equal(quantile([4, 1, 3, 2, null, NaN], 0.5), 2.5);
  assert.equal(quantile([], 0.95), null);
  assert.equal(quantile([10], 0.95), 10);
});
test("small samples do not claim confidence intervals", () => {
  assert.equal(summarize([1, 2]).medianCI95, null);
  assert.deepEqual(summarize([5, 5, 5, 5, 5]).medianCI95, [5, 5]);
});
