import { NextRequest } from "next/server";
import { whop } from "@/lib/whop-sdk";

/**
 * Whop Webhook Handler
 *
 * This endpoint receives webhook events from Whop.
 * Configure your webhook URL in the Whop Developer Dashboard → Webhooks tab.
 *
 * Common events:
 * - payment.succeeded / payment.failed / payment.pending
 * - membership.activated / membership.deactivated
 * - setup_intent.succeeded / setup_intent.canceled
 *
 * @see https://docs.whop.com/developer/guides/webhooks
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.text();
    const headerEntries = Object.fromEntries(request.headers);

    // Verify and parse the webhook — throws if signature is invalid
    const event = whop.webhooks.unwrap(body, { headers: headerEntries });

    // Route based on event type
    switch (event.type) {
      case "payment.succeeded":
        console.log("[Webhook] Payment succeeded:", event.data.id);
        // TODO: Handle successful payment
        break;

      case "payment.failed":
        console.log("[Webhook] Payment failed:", event.data.id);
        // TODO: Handle failed payment
        break;

      case "membership.activated":
        console.log("[Webhook] Membership activated:", event.data.id);
        // TODO: Handle new/renewed membership
        break;

      case "membership.deactivated":
        console.log("[Webhook] Membership deactivated:", event.data.id);
        // TODO: Handle cancelled/expired membership
        break;

      default:
        console.log("[Webhook] Unhandled event type:", event.type);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error);
    return new Response("Webhook verification failed", { status: 400 });
  }
}

