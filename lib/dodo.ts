import DodoPayments from "dodopayments";

// Lazily build the client at request time. The SDK throws if the API key is
// missing at construction, so instantiating at module load breaks `next build`
// (which imports route modules with no env). Cache after first use.
let _dodo: DodoPayments | null = null;
export function getDodo(): DodoPayments {
  if (_dodo) return _dodo;
  _dodo = new DodoPayments({
    bearerToken: process.env.DODO_API_KEY!,
    webhookKey: process.env.DODO_WEBHOOK_SECRET,
    environment: process.env.DODO_MODE === "live" ? "live_mode" : "test_mode",
  });
  return _dodo;
}

const PRODUCT_ID = () => process.env.DODO_PRODUCT_ID!;
const RETURN_BASE = () => process.env.NEXTAUTH_URL ?? "http://localhost:3000";

// Drop-in replacement for the LemonSqueezy createProCheckout: returns a hosted
// checkout URL. user_id rides along in metadata so the webhook can map the
// resulting subscription back to the right account.
export async function createProCheckout(userEmail: string, userId: string): Promise<string> {
  const res = await getDodo().checkoutSessions.create({
    product_cart: [{ product_id: PRODUCT_ID(), quantity: 1 }],
    customer: { email: userEmail },
    return_url: `${RETURN_BASE()}/dashboard`,
    metadata: { user_id: userId },
  });

  // SDK returns the hosted checkout URL; tolerate field naming across versions.
  const url = (res as { checkout_url?: string; url?: string }).checkout_url ?? (res as { url?: string }).url;
  if (!url) throw new Error("Dodo checkout: no checkout_url in response");
  return url;
}
