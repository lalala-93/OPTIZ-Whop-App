import Whop from "@whop/sdk";

/**
 * Singleton Whop SDK client for server-side usage.
 *
 * Uses:
 * - `whop.verifyUserToken(headers)` to authenticate iframe requests
 * - `whop.users.checkAccess(resourceId, { id: userId })` to verify access
 * - `whop.webhooks.unwrap(body, { headers })` to verify webhook signatures
 * - `whop.experiences.retrieve(id)` to fetch experience details
 * - Full REST API access: payments, memberships, plans, etc.
 */
export const whop = new Whop({
  apiKey: process.env.WHOP_API_KEY,
  appID: process.env.NEXT_PUBLIC_WHOP_APP_ID,
});

