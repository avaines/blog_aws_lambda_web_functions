import { Suspense } from "react";
import { headers } from "next/headers";
import { menu } from "@/lib/menu";
import Shop from "@/components/shop";
export const dynamic = "force-dynamic";
async function DeliveryStatus() {
  await new Promise((resolve) => setTimeout(resolve, 1600));
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date());
  return (
    <div className="delivery-status">
      <span className="live-dot" />
      <strong>Your reef is ready.</strong> Kitchen taking orders · 15–25 min{" "}
      <small>Checked at {time} London time · simulated availability</small>
    </div>
  );
}
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ dish?: string }>;
}) {
  const { dish } = await searchParams;
  const requestHeaders = await headers();
  const region =
    requestHeaders.get("cloudfront-viewer-country") === "US"
      ? "Sunset Reef"
      : "Coral Crescent";
  return (
    <Shop
      initialSearch={menu.find((item) => item.id === dish)?.name || ""}
      region={region}
      delivery={
        <Suspense
          fallback={
            <div className="delivery-status loading">
              <span className="live-dot" />
              Checking the kitchen and finding your fastest fin…
            </div>
          }
        >
          <DeliveryStatus />
        </Suspense>
      }
    />
  );
}
