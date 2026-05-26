import { demoData } from "../demo-data";
import { MarketplaceData } from "../types";
import { createClient } from "@supabase/supabase-js";

const globalStore = globalThis as typeof globalThis & {
  __aigcMarketplaceData?: MarketplaceData;
};

function cloneData(data: MarketplaceData): MarketplaceData {
  return JSON.parse(JSON.stringify(data)) as MarketplaceData;
}

function normalizeData(data: MarketplaceData): MarketplaceData {
  return {
    users: data.users ?? [],
    buyerProfiles: data.buyerProfiles ?? [],
    creators: data.creators ?? [],
    projects: data.projects ?? [],
    matches: data.matches ?? [],
    orders: data.orders ?? [],
    messages: data.messages ?? [],
    reviews: data.reviews ?? [],
    activityEvents: data.activityEvents ?? []
  };
}

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

async function readSupabaseState() {
  const supabase = getServerSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("marketplace_state")
    .select("payload")
    .eq("id", "default")
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase read failed: ${error.message}`);
  }

  if (!data?.payload) {
    const initial = normalizeData(cloneData(demoData));
    await writeSupabaseState(initial);
    return initial;
  }

  return normalizeData(data.payload as MarketplaceData);
}

async function writeSupabaseState(data: MarketplaceData) {
  const supabase = getServerSupabase();
  if (!supabase) return null;

  const { error } = await supabase.from("marketplace_state").upsert({
    id: "default",
    payload: normalizeData(cloneData(data)),
    updated_at: new Date().toISOString()
  });

  if (error) {
    throw new Error(`Supabase write failed: ${error.message}`);
  }

  return data;
}

export async function getMarketplaceData(): Promise<MarketplaceData> {
  const remote = await readSupabaseState();
  if (remote) {
    return normalizeData(cloneData(remote));
  }

  if (!globalStore.__aigcMarketplaceData) {
    globalStore.__aigcMarketplaceData = normalizeData(cloneData(demoData));
  }

  return normalizeData(cloneData(globalStore.__aigcMarketplaceData));
}

export async function saveMarketplaceData(data: MarketplaceData): Promise<MarketplaceData> {
  const remote = await writeSupabaseState(data);
  if (remote) {
    return normalizeData(cloneData(remote));
  }

  globalStore.__aigcMarketplaceData = normalizeData(cloneData(data));
  return getMarketplaceData();
}

export async function updateMarketplaceData<T>(
  updater: (data: MarketplaceData) => T | Promise<T>
): Promise<T> {
  const data = await getMarketplaceData();
  const result = await updater(data);
  await saveMarketplaceData(data);
  return result;
}

export async function resetMarketplaceData() {
  return saveMarketplaceData(cloneData(demoData));
}
