import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getPublicEnv, isSupabasePublicEnvConfigured } from "@/lib/env";
import type { PilotCollection, PilotStation, PilotVenue } from "@/types/domain";
import {
  mapCollection,
  mapStation,
  mapVenue,
  type DbCollection,
  type DbStamp,
  type DbStation,
  type DbTag,
  type DbVenue,
} from "./mappers";

export interface B2cCatalog {
  venues: PilotVenue[];
  collections: PilotCollection[];
  stations: PilotStation[];
}

/**
 * Public B2C catalog (anon key + RLS). Tenant rows are excluded twice:
 * by the restrictive RLS policies and by the explicit `tenant_id is null` filter.
 */
export async function loadB2cCatalog(): Promise<B2cCatalog | null> {
  if (!isSupabasePublicEnvConfigured()) return null;
  const env = getPublicEnv();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [venuesRes, collectionsRes, stationsRes, stampsRes, tagsRes] = await Promise.all([
    supabase.from("venues").select("id,slug,name,description,cover_image_url,status").is("tenant_id", null).eq("status", "active"),
    supabase.from("collections").select("id,venue_id,slug,name,description,cover_image_url,status,completion_criteria").is("tenant_id", null).eq("status", "active"),
    supabase.from("stations").select("id,venue_id,slug,name,description,location_hint,image_url,latitude,longitude,status").is("tenant_id", null),
    supabase.from("stamps").select("id,collection_id,station_id,name,description,image_url,sort_order,status").is("tenant_id", null).eq("status", "active"),
    supabase.from("nfc_tags").select("id,station_id,public_code,label,status,created_at").is("tenant_id", null).eq("status", "active").order("created_at"),
  ]);
  if (venuesRes.error || collectionsRes.error || stationsRes.error || stampsRes.error || tagsRes.error) {
    return null;
  }

  const venues = (venuesRes.data as DbVenue[]).map(mapVenue);
  const venueIds = new Set(venues.map((v) => v.id));
  const collectionsDb = (collectionsRes.data as (DbCollection & { venue_id: string })[]).filter((c) => venueIds.has(c.venue_id));
  const collectionIds = new Set(collectionsDb.map((c) => c.id));
  const stamps = (stampsRes.data as (DbStamp & { station_id: string; collection_id: string })[]).filter((s) => collectionIds.has(s.collection_id));
  const tags = tagsRes.data as (DbTag & { station_id: string })[];

  const stations: PilotStation[] = [];
  for (const st of stationsRes.data as (DbStation & { venue_id: string })[]) {
    const stamp = stamps.filter((s) => s.station_id === st.id).sort((a, b) => a.sort_order - b.sort_order)[0];
    if (!stamp || !venueIds.has(st.venue_id)) continue;
    const tag = tags.find((t) => t.station_id === st.id) ?? null;
    stations.push(mapStation(st, stamp, tag, st.venue_id, stamp.collection_id));
  }
  stations.sort((a, b) => a.stamp.sortOrder - b.stamp.sortOrder);

  const collections = collectionsDb
    .map((c) => mapCollection(c, c.venue_id, stamps.filter((s) => s.collection_id === c.id).length))
    // Keep the pilot collection first so existing player screens stay stable.
    .sort((a, b) => (a.id.startsWith("22222222") ? -1 : b.id.startsWith("22222222") ? 1 : 0));

  return { venues, collections, stations };
}
