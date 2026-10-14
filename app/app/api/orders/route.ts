import { receiptCookie, sealReceipt, type Receipt } from "@/lib/orders";
import { NextResponse } from "next/server";
import { menu, deliveryFee } from "@/lib/menu";
export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Please send a valid order." },
      { status: 400 },
    );
  }
  if (
    !body ||
    typeof body.name !== "string" ||
    !body.name.trim() ||
    body.name.length > 80 ||
    typeof body.address !== "string" ||
    !body.address.trim() ||
    body.address.length > 160 ||
    !Array.isArray(body.items) ||
    !body.items.length ||
    body.items.length > menu.length
  )
    return NextResponse.json(
      { error: "Please add your name, bowl address, and some food." },
      { status: 400 },
    );
  let subtotal = 0;
  const seen = new Set();
  for (const item of body.items) {
    const dish = menu.find((d) => d.id === item?.id);
    if (
      !dish ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 20 ||
      seen.has(item.id)
    )
      return NextResponse.json(
        {
          error: "Something in your basket is not available. Please update it.",
        },
        { status: 400 },
      );
    seen.add(item.id);
    subtotal += dish.price * item.quantity;
  }
  const receipt: Receipt = {
    id: `FIN-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    name: body.name.trim(),
    total: subtotal + deliveryFee,
    createdAt: Date.now(),
    items: body.items.map((item: { id: string; quantity: number }) => ({
      id: item.id,
      quantity: item.quantity,
    })),
  };
  const response = NextResponse.json(
    { ...receipt, eta: "15–25 minutes" },
    { headers: { "Cache-Control": "no-store" } },
  );
  response.cookies.set(receiptCookie, sealReceipt(receipt), {
    httpOnly: true,
    sameSite: "lax",
    secure: new URL(request.url).protocol === "https:",
    path: "/",
    maxAge: 3600,
  });
  return response;
}
