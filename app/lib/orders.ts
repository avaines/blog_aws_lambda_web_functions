import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
export const receiptCookie = "fin-receipt";
// Public fallback is for fictional demo receipts only, never real orders/authentication.
const secret =
  process.env.ORDER_COOKIE_SECRET || "fin-and-feast-public-demo-key";
export type Receipt = {
  id: string;
  name: string;
  total: number;
  createdAt: number;
  items: { id: string; quantity: number }[];
};
export function sealReceipt(receipt: Receipt) {
  const payload = Buffer.from(JSON.stringify(receipt)).toString("base64url");
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`;
}
export async function readReceipt(): Promise<Receipt | null> {
  const value = (await cookies()).get(receiptCookie)?.value;
  if (!value) return null;
  try {
    const [payload, signature] = value.split(".");
    const expected = createHmac("sha256", secret).update(payload).digest();
    const supplied = Buffer.from(signature, "base64url");
    if (
      expected.length !== supplied.length ||
      !timingSafeEqual(expected, supplied)
    )
      return null;
    const receipt = JSON.parse(
      Buffer.from(payload, "base64url").toString(),
    ) as Receipt;
    if (!receipt.createdAt || Date.now() - receipt.createdAt > 3600000)
      return null;
    return receipt;
  } catch {
    return null;
  }
}
