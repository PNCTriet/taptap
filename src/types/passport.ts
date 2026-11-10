/** Collected stamp shown on the player passport. */
export type PassportStampSource = "b2c" | "b2b";

export type PassportStamp = {
  id: string;
  name: string;
  imageUrl: string | null;
  collectedAt: string;
  source: PassportStampSource;
  venueName?: string;
  tenantName?: string;
  roomName?: string;
};

/** `GET /api/passport` */
export type PassportResponse = {
  stamps: PassportStamp[];
};

/** `POST /api/participant/merge` */
export type GuestMergeResult = {
  merged: number;
  alreadyOwned: number;
};
