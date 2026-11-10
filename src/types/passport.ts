/** One collected stamp in the visitor passport (B2C venues and B2B tenant stations). */
export interface PassportStamp {
  id: string;
  name: string;
  imageUrl: string | null;
  collectedAt: string;
  source: "b2c" | "b2b";
  venueName?: string;
  tenantName?: string;
  roomName?: string;
}

export interface PassportResponse {
  stamps: PassportStamp[];
}

export interface MergeResponse {
  /** Stamps moved from the guest passport into the account. */
  merged: number;
  /** Guest stamps the account already had (deduped, not duplicated). */
  alreadyOwned: number;
}
