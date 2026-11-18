import crypto from "crypto";

/**
 * Payment gateway abstraction.
 *
 * - When RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are configured, real Razorpay
 *   orders are created via the REST API and checkout runs through Checkout.js.
 * - Otherwise the app runs a built-in MOCK gateway with an identical
 *   order → authorize → signature-verify lifecycle, so the full payment
 *   pipeline (idempotent verification, transactional slot booking, receipts)
 *   is exercised end-to-end in development.
 */

export type PaymentMode = "razorpay" | "mock";

export function paymentMode(): PaymentMode {
  return process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET ? "razorpay" : "mock";
}

export function publicRazorpayKeyId(): string | null {
  return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || null;
}

function mockSecret(): string {
  return `kmr-mock::${process.env.AUTH_SECRET || "dev-secret"}`;
}

function hmacSha256(data: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

export type GatewayOrder = {
  orderId: string;
  gateway: PaymentMode;
  amount: number;
  currency: string;
};

export async function createGatewayOrder(opts: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<GatewayOrder> {
  const mode = paymentMode();

  if (mode === "mock") {
    return {
      orderId: `order_mock_${crypto.randomBytes(10).toString("hex")}`,
      gateway: "mock",
      amount: opts.amountPaise,
      currency: "INR",
    };
  }

  const auth = Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
  ).toString("base64");

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: opts.amountPaise,
      currency: "INR",
      receipt: opts.receipt,
      notes: opts.notes ?? {},
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Razorpay order creation failed (${res.status}): ${body}`);
  }

  const order = (await res.json()) as { id: string; amount: number; currency: string };
  return { orderId: order.id, gateway: "razorpay", amount: order.amount, currency: order.currency };
}

/** Simulates the gateway authorising a payment and returning a signed payload. */
export function mockAuthorize(orderId: string): { paymentId: string; signature: string } {
  const paymentId = `pay_mock_${crypto.randomBytes(10).toString("hex")}`;
  const signature = hmacSha256(`${orderId}|${paymentId}`, mockSecret());
  return { paymentId, signature };
}

export function verifyGatewaySignature(opts: {
  gateway: string;
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = opts.gateway === "razorpay" ? process.env.RAZORPAY_KEY_SECRET ?? "" : mockSecret();
  if (!secret) return false;
  const expected = hmacSha256(`${opts.orderId}|${opts.paymentId}`, secret);
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(opts.signature, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = hmacSha256(rawBody, secret);
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
