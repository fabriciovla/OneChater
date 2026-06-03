import {
  lemonSqueezySetup,
  createCheckout,
  getSubscription,
  type NewCheckout,
} from "@lemonsqueezy/lemonsqueezy.js";

export function setupLS() {
  lemonSqueezySetup({ apiKey: process.env.LEMONSQUEEZY_API_KEY! });
}

export async function createProCheckout(userEmail: string, userId: string) {
  setupLS();
  const storeId = process.env.LEMONSQUEEZY_STORE_ID!;
  const variantId = process.env.LEMONSQUEEZY_PRO_VARIANT_ID!;

  const checkout: NewCheckout = {
    productOptions: {
      redirectUrl: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/dashboard`,
      receiptButtonText: "Ir al dashboard",
      receiptThankYouNote: "Gracias por suscribirte a OneChater Pro.",
    },
    checkoutOptions: { embed: false },
    checkoutData: {
      email: userEmail,
      custom: { user_id: userId },
    },
    testMode: true,
  };

  const result = await createCheckout(storeId, variantId, checkout);
  if (result.error) throw new Error(result.error.message);
  return result.data!.data.attributes.url;
}

export { getSubscription };
