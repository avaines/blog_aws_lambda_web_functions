// Runs before application JavaScript. Markers describe visible DOM, not completed paint.
export function installObservers() {
  window.__bench = { marks: {}, lcp: null, fcp: null, cls: 0 };
  const data = window.__bench;
  const observe = (type, fn) => {
    try {
      new PerformanceObserver((list) => list.getEntries().forEach(fn)).observe({
        type,
        buffered: true,
      });
    } catch {}
  };
  observe("largest-contentful-paint", (e) => (data.lcp = e.startTime));
  observe("paint", (e) => {
    if (e.name === "first-contentful-paint") data.fcp = e.startTime;
  });
  // CLS below is diagnostic cumulative shift, not the Core Web Vitals session-window score.
  observe("layout-shift", (e) => {
    if (!e.hadRecentInput) data.cls += e.value;
  });
  const visible = (el) =>
    el &&
    el.getClientRects().length &&
    getComputedStyle(el).visibility !== "hidden";
  function mark(name, selector, text) {
    if (data.marks[name] !== undefined) return;
    if (
      [...document.querySelectorAll(selector)].some(
        (el) => visible(el) && (!text || el.textContent.includes(text)),
      )
    )
      data.marks[name] = performance.now();
  }
  function scan() {
    mark("homeShell", ".hero h1", "Big flavours.");
    mark("homeReady", ".delivery-status", "Your reef is ready.");
    mark("homeFallback", ".delivery-status", "Checking the kitchen");
    mark("dish", "h1", "The Golden Flake");
    mark("orderSummary", ".order-summary", "In your bowl");
    mark("orderReady", ".order-progress a", "Refresh order status");
    mark("orderFallback", ".order-progress", "Checking on your feast");
  }
  new MutationObserver(scan).observe(document, {
    childList: true,
    subtree: true,
    characterData: true,
  });
  document.addEventListener("DOMContentLoaded", scan);
}
