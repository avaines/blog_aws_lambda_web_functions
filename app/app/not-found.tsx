import Link from "next/link";
import PageShell from "@/components/page-shell";
export default function NotFound() {
  return (
    <PageShell>
      <section className="order-intro">
        <span className="eyebrow">LOST AT SEA</span>
        <h1>This one swam away.</h1>
        <p>
          That dish or order isn’t available. Order links only work in the
          browser that placed the latest order, for one hour.
        </p>
        <Link className="primary" href="/">
          Back to the reef →
        </Link>
      </section>
    </PageShell>
  );
}
