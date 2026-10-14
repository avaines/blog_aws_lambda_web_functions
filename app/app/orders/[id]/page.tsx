import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { readReceipt } from "@/lib/orders";
import { menu, money, deliveryFee } from "@/lib/menu";
import PageShell from "@/components/page-shell";
export const metadata = {
  title: "Your feast | Fin & Feast",
  robots: { index: false, follow: false },
};
async function KitchenProgress({ createdAt }: { createdAt: number }) {
  await new Promise((resolve) => setTimeout(resolve, 1200));
  const elapsed = Math.max(0, Math.floor((Date.now() - createdAt) / 1000));
  const stage = elapsed < 30 ? 0 : elapsed < 60 ? 1 : 2;
  return (
    <section className="order-progress">
      <span className="eyebrow">FROM OUR REEF TO YOUR BOWL</span>
      <h2>
        {
          [
            "Your feast is with the kitchen",
            "Your rider is making a splash",
            "Your pretend feast has arrived",
          ][stage]
        }
      </h2>
      <ol>
        {["Order accepted", "Swimming your way", "At your bowl"].map(
          (label, i) => (
            <li key={label} className={i <= stage ? "complete" : ""}>
              {i <= stage ? "✓" : "○"} {label}
            </li>
          ),
        )}
      </ol>
      <p>
        This demo moves to delivery at 30 seconds and arrival at 60 seconds.
        Refresh to check its progress.
      </p>
      <a href="">Refresh order status →</a>
    </section>
  );
}
export default async function Order({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const receipt = await readReceipt();
  if (!receipt || receipt.id !== id) notFound();
  return (
    <PageShell>
      <section className="order-intro">
        <span className="eyebrow">YOUR LITTLE FEAST</span>
        <h1>Fin-tastic, {receipt.name}!</h1>
        <p>Your order is in. Let the fish dance begin.</p>
        <span className="route-note">
          {receipt.id} · Simulated order · No payment taken
        </span>
      </section>
      <div className="order-layout">
        <section className="order-summary">
          <h2>In your bowl</h2>
          {receipt.items.map((item) => {
            const dish = menu.find((d) => d.id === item.id)!;
            return (
              <div className="order-line" key={item.id}>
                <Link href={`/menu/${dish.id}`}>
                  {dish.emoji} {item.quantity} × {dish.name}
                </Link>
                <strong>{money(dish.price * item.quantity)}</strong>
              </div>
            );
          })}
          <div className="order-line">
            <span>Reef delivery</span>
            <span>{money(deliveryFee)}</span>
          </div>
          <div className="order-line">
            <strong>Total</strong>
            <strong>{money(receipt.total)}</strong>
          </div>
          <p className="route-note">
            This receipt is available in this browser for one hour, until your
            next order. No real food will be delivered.
          </p>
          <Link href="/#menu">Back for another bite →</Link>
        </section>
        <Suspense
          fallback={
            <section className="order-progress">
              <h2>Checking on your feast…</h2>
              <p>The kitchen is getting your latest update.</p>
            </section>
          }
        >
          <KitchenProgress createdAt={receipt.createdAt} />
        </Suspense>
      </div>
    </PageShell>
  );
}
