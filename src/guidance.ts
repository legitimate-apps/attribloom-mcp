/**
 * Public onboarding guidance. Safe to return before a tenant API key exists.
 * Release-true: no marketplace/auto-posting claims.
 */
export const GET_STARTED_GUIDANCE = `Welcome to Attribloom — AI creators + affiliates that drive conversions.

1. Connect a surface where your sales happen:
   • Shopify store (Admin API) — product catalog + checkout webhooks.
   • iOS app (StoreKit 2 / App Store Server Notifications v2) — for app installs/subscriptions.
2. Create a campaign with a default destination URL and allowed domains.
3. Invite or approve affiliates. Each gets a tracking link and/or referral code.
4. Attribloom attributes every conversion to the right affiliate and accrues commission in the ledger.
5. Review matured commissions and approve payouts from the dashboard. Money mutations stay human.

Next: create a read-only tenant API key at Dashboard → Settings → API keys to query this data programmatically.`;

/**
 * Static guidance for connecting Shopify or an iOS app. No mutation.
 */
export const CONNECT_STORE_GUIDANCE = `Connecting a store or app to Attribloom:

Shopify:
• In Dashboard → Integrations → Shopify, install the Attribloom app.
• Grant read products + read orders scope. Webhooks deliver checkouts/orders for attribution.
• Import products, then create a campaign pointing at your store.

iOS (StoreKit 2):
• Register your app bundle ID in Dashboard → Integrations → iOS.
• Add the App Store Server Notification v2 endpoint to App Store Connect.
• Use an appAccountToken at purchase time; Attribloom binds it to the affiliate.

No code changes to your payout or pricing are required — the integration is read-only until you explicitly approve actions in the dashboard.`;
