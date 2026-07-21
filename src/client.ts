/** Error raised by the Attribloom management API. */
export class AttribloomApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AttribloomApiError";
  }
}

export type Whoami = {
  tenantId: string;
  tenantName: string;
  scopes: string[];
};

export type Campaign = {
  id: string;
  name: string;
  defaultDestinationUrl: string;
  allowedDestinationDomains: string[];
  commissionRuleId: string | null;
  webPurchase: boolean;
  redeemerOfferCode: string | null;
  commissionRule: { kind: string; config: unknown; currency: string } | null;
};

export type Conversion = {
  id: string;
  externalId: string;
  eventType: string;
  status: string;
  grossMinor: string;
  netMinor: string;
  commissionMinor: string | null;
  currency: string;
  affiliateId: string | null;
  occurredAt: string;
  maturedAt: string | null;
};

export type CommissionSummary = {
  currency: string;
  maturedMinor: string;
};

export type Payout = {
  id: string;
  affiliateId: string;
  amountMinor: string;
  currency: string;
  status: string;
  providerOrderId: string | null;
  createdAt: string;
};

export type PayoutEligibility = {
  currency: string;
  thresholdMinor: string;
  affiliates: Array<{
    affiliateId: string;
    availableMinor: string;
    eligible: boolean;
  }>;
};

export class AttribloomApiClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string,
  ) {}

  private async get<T>(path: string): Promise<T> {
    const url = `${this.baseUrl.replace(/\/$/, "")}${path}`;
    const res = await fetch(url, {
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        accept: "application/json",
      },
    });

    if (!res.ok) {
      const body: unknown = await res.json().catch(() => ({ error: res.statusText }));
      const message = typeof body === "object" && body !== null && "error" in body ? String(body.error) : res.statusText;
      throw new AttribloomApiError(message, res.status);
    }

    return (await res.json()) as T;
  }

  async whoami(): Promise<Whoami> {
    return this.get<Whoami>("/v1/mgmt/whoami");
  }

  async listCampaigns(): Promise<Campaign[]> {
    return this.get<Campaign[]>("/v1/mgmt/campaigns");
  }

  async listConversions(): Promise<Conversion[]> {
    return this.get<Conversion[]>("/v1/mgmt/conversions");
  }

  async commissionSummary(): Promise<CommissionSummary[]> {
    return this.get<CommissionSummary[]>("/v1/mgmt/commissions/summary");
  }

  async listPayouts(): Promise<Payout[]> {
    return this.get<Payout[]>("/v1/mgmt/payouts");
  }

  async payoutEligibility(): Promise<PayoutEligibility> {
    return this.get<PayoutEligibility>("/v1/mgmt/payouts/eligibility");
  }
}
