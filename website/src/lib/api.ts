import type { RarityClass } from './bot';

export type BotStats = {
  userCount: number;
  guildCount: number;
  catalogTotal: number;
  totalCaught: number;
};

export type CollectibleEntry = {
  id: string;
  name: string;
  class: RarityClass;
  globalCaught: number;
  weight: number;
};

export type UserEntry = {
  discordId: string;
  username: string;
  total: number;
  unique: number;
  totalValue: number;
  inventoryPrivacy: string;
  acceptGifts: boolean;
  caughtAt?: string;
};

type BotConfigData = {
  name?: string;
  version?: string;
  description?: string;
  rarityClasses?: string[];
};

const memoryCache = new Map<string, { data: unknown; timestamp: number }>();

export function getCache<T>(key: string): T | null {
  if (memoryCache.has(key)) {
    return memoryCache.get(key)!.data as T;
  }
  if (typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem(`panel_cache_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        memoryCache.set(key, { data: parsed, timestamp: Date.now() });
        return parsed as T;
      }
    } catch {}
  }
  return null;
}

export function setCache<T>(key: string, data: T): void {
  if (data === null || data === undefined) return;
  memoryCache.set(key, { data, timestamp: Date.now() });
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(`panel_cache_${key}`, JSON.stringify(data));
    } catch {}
  }
}

async function apiFetch<T>(endpoint: string, options?: RequestInit, retries = 3, timeoutMs = 8000): Promise<T | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(endpoint, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        ...options,
      });
      clearTimeout(timer);
      if (!res.ok) {
        if (attempt < retries && (res.status >= 500 || res.status === 429)) {
          await new Promise((r) => setTimeout(r, 400 * Math.pow(2, attempt)));
          continue;
        }
        return null;
      }
      return (await res.json()) as T;
    } catch {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 400 * Math.pow(2, attempt)));
        continue;
      }
      return null;
    }
  }
  return null;
}



function unwrapData(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const obj = raw as Record<string, unknown>;
  if ('data' in obj && obj.data !== null && typeof obj.data === 'object' && !('collectiblesData' in obj)) {
    return unwrapData(obj.data);
  }
  if ('result' in obj && obj.result !== null && typeof obj.result === 'object' && !('collectiblesData' in obj)) {
    return unwrapData(obj.result);
  }
  if ('value' in obj && obj.value !== null && typeof obj.value === 'object' && !('collectiblesData' in obj)) {
    return unwrapData(obj.value);
  }
  return obj;
}

function parseUserEntry(defaultId: string, item: Record<string, unknown>): UserEntry {
  const userId = String(
    item.discordId ?? item.discord_id ?? item.id ?? item.user_id ?? defaultId
  );

  const collectiblesData = (item.collectiblesData ?? item.collectibles_data ?? item.collectibles ?? {}) as Record<string, unknown>;
  const settings = (item.settings ?? {}) as Record<string, unknown>;

  const rawUsername = String(
    item.username ??
    item.global_name ??
    item.globalName ??
    item.user_name ??
    item.name ??
    item.tag ??
    item.user ??
    ''
  );

  const total = Number(
    collectiblesData.total ??
    item.total ??
    item.total_nation ??
    item.total_nations ??
    item.nations_count ??
    item.collectibles_count ??
    (Array.isArray(collectiblesData.collectibleIds) ? collectiblesData.collectibleIds.length : 0)
  );

  let unique = 0;
  if (Array.isArray(collectiblesData.unique)) {
    unique = collectiblesData.unique.length;
  } else if (Array.isArray(item.unique)) {
    unique = item.unique.length;
  } else if (typeof collectiblesData.unique === 'number') {
    unique = collectiblesData.unique;
  } else if (typeof item.unique === 'number') {
    unique = item.unique;
  } else {
    const parsedUnique = Number(
      item.unique_nation ??
      item.unique_nations ??
      item.unique_count ??
      0
    );
    unique = isNaN(parsedUnique) ? 0 : parsedUnique;
  }

  const totalValue = Number(
    collectiblesData.total_value ??
    collectiblesData.totalValue ??
    item.totalValue ??
    item.total_value ??
    item.value ??
    0
  );

  const inventoryPrivacy = String(
    settings.inventory_privacy ??
    settings.inventoryPrivacy ??
    item.inventoryPrivacy ??
    item.inventory_privacy ??
    item.privacy ??
    'public'
  );

  const rawGifts =
    settings.accept_gifts ??
    settings.acceptGifts ??
    item.acceptGifts ??
    item.accept_gifts ??
    item.gifts ??
    true;

  const acceptGifts = rawGifts === 'true' || rawGifts === true || rawGifts === '1' || rawGifts === 1;

  return {
    discordId: userId,
    username: rawUsername,
    total,
    unique,
    totalValue,
    inventoryPrivacy,
    acceptGifts,
    caughtAt: item.caughtAt || item.caught_at ? String(item.caughtAt || item.caught_at) : undefined,
  };
}

export async function fetchStats(): Promise<BotStats | null> {
  const cacheKey = 'stats';
  const cached = getCache<BotStats>(cacheKey);
  const raw = await apiFetch<unknown>('/api/bot/stats');
  if (!raw) return cached;
  const obj = (unwrapData(raw) ?? {}) as Record<string, unknown>;

  const userCount = Number(
    obj.userCount ??
    obj.user_count ??
    obj.registered_users_count ??
    obj.registers_users_count ??
    obj.registeredUsersCount ??
    obj.registered_users ??
    obj.users_count ??
    obj.users ??
    cached?.userCount ??
    0
  );

  const guildCount = Number(
    obj.guildCount ??
    obj.guild_count ??
    obj.registered_guilds_count ??
    obj.registeredGuildsCount ??
    obj.registered_guilds ??
    obj.guilds_count ??
    obj.guilds ??
    obj.servers ??
    cached?.guildCount ??
    0
  );

  const catalogTotal = Number(
    obj.catalogTotal ??
    obj.catalog_total ??
    obj.total_collectibles_count ??
    obj.totalCollectiblesCount ??
    obj.collectibles_count ??
    obj.total_collectibles ??
    obj.collectibles ??
    cached?.catalogTotal ??
    0
  );

  const totalCaught = Number(
    obj.collectibles_caught_global ??
    obj.collectiblesCaughtGlobal ??
    obj.totalCaught ??
    obj.total_caught ??
    obj.total_collectibles_caught_globally ??
    obj.totalCollectiblesCaughtGlobally ??
    obj.total_collectibles_caught ??
    obj.global_caught ??
    obj.caught ??
    cached?.totalCaught ??
    0
  );

  const result = { userCount, guildCount, catalogTotal, totalCaught };
  setCache(cacheKey, result);
  return result;
}

export async function fetchCollectibles(id?: string): Promise<CollectibleEntry[] | null> {
  const cacheKey = id ? `collectibles_${id}` : 'collectibles_all';
  const cached = getCache<CollectibleEntry[]>(cacheKey);
  const query = id ? `?id=${encodeURIComponent(id)}` : '';
  const raw = await apiFetch<unknown>(`/api/bot/collectibles${query}`);

  if (!raw) return cached;

  const rawData = unwrapData(raw);
  if (!rawData) return cached;
  const data = (rawData && typeof rawData === 'object' && 'collectiblesData' in rawData)
    ? (rawData as Record<string, unknown>).collectiblesData
    : rawData;

  let itemsArray: Array<Record<string, unknown>> = [];

  if (Array.isArray(data)) {
    itemsArray = data.map((item) => {
      if (typeof item === 'object' && item !== null) {
        return item as Record<string, unknown>;
      }
      return { id: String(item), name: String(item) };
    });
  } else if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    const targetMap = (
      obj.collectibles && typeof obj.collectibles === 'object' && !Array.isArray(obj.collectibles)
        ? obj.collectibles
        : obj.nations && typeof obj.nations === 'object' && !Array.isArray(obj.nations)
        ? obj.nations
        : null
    ) as Record<string, unknown> | null;

    if (targetMap) {
      itemsArray = Object.entries(targetMap).map(([key, val]) => {
        if (typeof val === 'object' && val !== null) {
          return { id: key, ...(val as Record<string, unknown>) };
        }
        return { id: key, name: String(val) };
      });
    } else if (Array.isArray(obj.collectibles)) {
      itemsArray = obj.collectibles as Array<Record<string, unknown>>;
    } else if (Array.isArray(obj.nations)) {
      itemsArray = obj.nations as Array<Record<string, unknown>>;
    } else if ('name' in obj || 'class' in obj || 'global_caught' in obj || 'collectibles_caught_global' in obj) {
      itemsArray = [id ? { id, ...obj } : obj];
    } else {
      itemsArray = Object.entries(obj).map(([key, val]) => {
        if (typeof val === 'object' && val !== null) {
          return { id: key, ...(val as Record<string, unknown>) };
        }
        return { id: key, name: String(val) };
      });
    }
  }

  const result: CollectibleEntry[] = itemsArray.map((item, index) => {
    const itemId = String(item.id ?? item.code ?? item.collectible_id ?? `entry_${index}`);
    const rawClass = String(
      item.class ?? item.rarity ?? item.rarity_class ?? item.tier ?? 'common'
    ).toLowerCase();

    const rarityClass: RarityClass = (
      ['common', 'uncommon', 'rare', 'mythic', 'legendary'].includes(rawClass)
        ? rawClass
        : getRarityFromId(itemId)
    ) as RarityClass;

    const rawCaught = Number(
      item.collectibles_caught_global ??
      item.collectiblesCaughtGlobal ??
      item.collectible_caught_global ??
      item.collectibles_caught ??
      item.globalCaught ??
      item.global_caught ??
      item.total_caught ??
      item.caught ??
      item.count ??
      0
    );

    const globalCaught = rawCaught;

    return {
      id: itemId,
      name: String(item.name ?? item.title ?? item.label ?? item.id ?? 'Unknown'),
      class: rarityClass,
      globalCaught,
      weight: Number(item.weight ?? item.rarity_weight ?? item.spawn_weight ?? 10),
    };
  });

  if (result.length > 0) {
    setCache(cacheKey, result);
    if (!id) {
      setCache('collectibles_catalog', result);
    }
    return result;
  }
  return cached ?? result;
}

export async function fetchConfig(): Promise<BotConfigData | null> {
  const cacheKey = 'config';
  const cached = getCache<BotConfigData>(cacheKey);
  const raw = await apiFetch<unknown>('/api/bot/config');
  if (!raw) return cached;
  const obj = (unwrapData(raw) ?? {}) as Record<string, unknown>;
  const rawClasses = obj.rarityClasses ?? obj.rarity_classes;
  const result = {
    name: obj.name ? String(obj.name) : cached?.name,
    version: obj.version ? String(obj.version) : cached?.version,
    description: obj.description ? String(obj.description) : cached?.description,
    rarityClasses: Array.isArray(rawClasses) ? rawClasses.map(String) : cached?.rarityClasses,
  };
  setCache(cacheKey, result);
  return result;
}

export async function fetchFullConfig(): Promise<Record<string, unknown> | null> {
  const cacheKey = 'config_raw';
  const cached = getCache<Record<string, unknown>>(cacheKey);
  const raw = await apiFetch<unknown>('/api/bot/config');
  if (!raw) return cached;
  const obj = (unwrapData(raw) ?? {}) as Record<string, unknown>;
  setCache(cacheKey, obj);
  return obj;
}

export async function fetchUserData(id?: string): Promise<UserEntry[] | null> {
  const cacheKey = id ? `user_${id}` : 'users_all';
  const cached = getCache<UserEntry[]>(cacheKey);
  const validCached = Array.isArray(cached)
    ? cached.filter((u) => u && typeof u.discordId === 'string' && /^\d{15,22}$/.test(u.discordId))
    : null;

  if (id) {
    const raw = await apiFetch<unknown>(`/api/bot/user?id=${encodeURIComponent(id)}`);
    if (!raw) return validCached;
    const userObj = unwrapData(raw);
    if (!userObj || typeof userObj !== 'object') return validCached;
    const parsed = [parseUserEntry(id, userObj as Record<string, unknown>)];
    setCache(cacheKey, parsed);
    return parsed;
  }

  // The panel server answers with one slim row per player (totals, privacy, gifts), already joined with settings.
  const list = await apiFetch<UserEntry[]>('/api/panel/data/users');
  if (Array.isArray(list) && list.length > 0) {
    const valid = list.filter((u) => u && typeof u.discordId === 'string' && /^\d{15,22}$/.test(u.discordId));
    if (valid.length > 0) {
      setCache(cacheKey, valid);
      return valid;
    }
  }

  return validCached;
}

async function searchDb(variable: string, id?: string): Promise<unknown> {
  const query = id ? `?id=${encodeURIComponent(id)}` : '';
  return apiFetch<unknown>(`/api/bot/search_db/${encodeURIComponent(variable)}${query}`);
}

const prefixToRarityMap: Record<string, RarityClass> = {
  CC: 'common',
  UC: 'uncommon',
  RR: 'rare',
  MM: 'mythic',
  LL: 'legendary',
};

function getRarityFromId(id: string): RarityClass {
  const prefix = id.trim().slice(0, 2).toUpperCase();
  return prefixToRarityMap[prefix] ?? 'common';
}

export type NationInstanceEntry = {
  identifier: string;
  name: string;
  id: string;
  type: string;
  description: string;
  player: string;
  timeToCatch: string;
  class: RarityClass;
  rawParsed: Record<string, unknown>;
};

export type GuildConfigEntry = {
  identifier: string;
  name: string;
  id: string;
  guildId: string;
  spawnChannel: string;
  enabled: boolean;
  status: string;
  rawParsed: Record<string, unknown>;
};

function mapInstances(itemsArray: Array<Record<string, unknown>>, collectibles: CollectibleEntry[] | null): NationInstanceEntry[] {
  const collectibleMap = new Map<string, { name: string; class: RarityClass }>();
  if (Array.isArray(collectibles)) {
    for (const c of collectibles) {
      if (c && c.id) {
        collectibleMap.set(String(c.id).trim().toLowerCase(), { name: c.name, class: c.class });
      }
      if (c && c.name) {
        collectibleMap.set(String(c.name).trim().toLowerCase(), { name: c.name, class: c.class });
      }
    }
  }

  return itemsArray.map((item, idx) => {
    const id = String(item.id ?? `instance_${idx}`);
    let parsed: Record<string, unknown> = {};
    if (typeof item.value === 'string') {
      try {
        parsed = JSON.parse(item.value) as Record<string, unknown>;
      } catch {
        parsed = {};
      }
    } else if (typeof item.value === 'object' && item.value !== null) {
      parsed = item.value as Record<string, unknown>;
    }

    const nationKey = String(
      parsed.nation ?? parsed.nation_id ?? parsed.nationId ?? parsed.collectible ?? parsed.id ?? ''
    ).trim().toLowerCase();

    const matched = collectibleMap.get(nationKey);

    let rarityClass: RarityClass = 'common';
    if (matched) {
      rarityClass = matched.class;
    } else {
      const rawClass = String(parsed.class ?? parsed.rarity ?? parsed.tier ?? '').toLowerCase();
      if (['common', 'uncommon', 'rare', 'mythic', 'legendary'].includes(rawClass)) {
        rarityClass = rawClass as RarityClass;
      } else if (nationKey) {
        rarityClass = getRarityFromId(nationKey);
      }
    }

    const atk = parsed.attack !== undefined ? String(parsed.attack) : '';
    const hp = parsed.health !== undefined ? String(parsed.health) : '';
    const player = String(parsed.author ?? parsed.caught_by ?? 'Unknown');
    const timeToCatch = String(parsed.caught_in ?? parsed.timestamp ?? 'N/A');

    const nationDisplayName = matched?.name || (parsed.nation ? String(parsed.nation) : '');

    let desc = `#${id}`;
    if (nationDisplayName) desc += ` ${nationDisplayName}`;
    else if (nationKey) desc += ` ${nationKey}`;
    if (atk) desc += ` ATK:${atk}`;
    if (hp) desc += ` HP:${hp}`;

    return {
      identifier: String(item.identifier ?? `old_collectible_${id}`),
      name: String(item.name ?? 'collectible'),
      id,
      type: String(item.type ?? 'old'),
      description: desc,
      player,
      timeToCatch,
      class: rarityClass,
      rawParsed: parsed,
    };
  });
}

export type InstancesPage = { total: number; items: NationInstanceEntry[] };

// One page of catches, filtered and sorted by the panel server (newest first), instead of every catch in the database.
export async function fetchInstancesPage(opts: { query: string; rarity: string; page: number; pageSize: number }): Promise<InstancesPage | null> {
  const params = new URLSearchParams({
    q: opts.query,
    class: opts.rarity,
    limit: String(opts.pageSize),
    offset: String((opts.page - 1) * opts.pageSize),
  });
  const [raw, collectibles] = await Promise.all([
    apiFetch<{ total: number; results: Array<Record<string, unknown>> }>(`/api/panel/data/instances?${params}`),
    fetchCollectibles(),
  ]);
  if (!raw || !Array.isArray(raw.results)) return null;
  return { total: Number(raw.total) || 0, items: mapInstances(raw.results, collectibles) };
}

// Catch counts for three consecutive buckets [t0,t1) [t1,t2) [t2,t3), counted by the server.
export async function fetchGrowth(bounds: [number, number, number, number]): Promise<[number, number, number] | null> {
  const raw = await apiFetch<{ counts: number[] }>(`/api/panel/data/growth?${new URLSearchParams({ t0: String(bounds[0]), t1: String(bounds[1]), t2: String(bounds[2]), t3: String(bounds[3]) })}`);
  return raw && Array.isArray(raw.counts) && raw.counts.length === 3 ? [raw.counts[0], raw.counts[1], raw.counts[2]] : null;
}

export async function fetchGuildConfigs(): Promise<GuildConfigEntry[] | null> {
  const cacheKey = 'guilds_all';
  const cached = getCache<GuildConfigEntry[]>(cacheKey);
  const raw = await searchDb('spawnConfig');
  if (!raw) return cached;
  const data = unwrapData(raw);
  if (!data) return cached;

  let itemsArray: Array<Record<string, unknown>> = [];
  if (Array.isArray(data)) {
    itemsArray = data.map((item) => (typeof item === 'object' && item !== null ? (item as Record<string, unknown>) : {}));
  } else if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.results)) {
      itemsArray = obj.results as Array<Record<string, unknown>>;
    } else {
      itemsArray = [obj];
    }
  }

  const result = itemsArray.map((item, idx) => {
    const guildId = String(item.id ?? `guild_${idx}`);
    let parsed: Record<string, unknown> = {};
    if (typeof item.value === 'string') {
      try {
        parsed = JSON.parse(item.value) as Record<string, unknown>;
      } catch {
        parsed = {};
      }
    } else if (typeof item.value === 'object' && item.value !== null) {
      parsed = item.value as Record<string, unknown>;
    }

    const spawnChannel = String(parsed.channel ?? parsed.config_channel ?? 'Not configured');
    const status = String(parsed.status ?? 'enabled').toLowerCase();
    const enabled = status === 'enabled' || status === 'true' || status === 'active';

    return {
      identifier: String(item.identifier ?? `guild_spawnConfig_${guildId}`),
      name: String(item.name ?? 'spawnConfig'),
      id: guildId,
      guildId,
      spawnChannel,
      enabled,
      status,
      type: String(item.type ?? 'guild'),
      rawParsed: parsed,
    };
  });

  if (result.length > 0) {
    setCache(cacheKey, result);
    return result;
  }
  return cached;
}

type ApiResponse<T = unknown> = {
  ok: boolean;
  status?: number;
  statusText?: string;
  value?: T;
  error?: string;
};

type CreateNationPayload = {
  name: string;
  class: string;
  emoji_id: string;
  attack: number;
  health: number;
  rarity?: number;
  weight?: number;
  short_name?: string;
  regime?: string;
  economy?: string;
  capacity_name?: string;
  capacity_description?: string;
  credits?: string;
  translations?: string | string[];
  catch_names?: string | string[];
  catching_names?: string | string[];
  global_caught?: number;
  price?: number;
  sell_price?: number;
  wild_card?: string;
  collection_card?: string;
};

type UpdateNationPayload = {
  name?: string;
  short_name?: string | null;
  class?: string;
  emoji_id?: string;
  credits?: string;
  attack?: number;
  health?: number;
  rarity?: number;
  weight?: number;
  regime?: string;
  economy?: string;
  price?: number;
  sell_price?: number;
  global_caught?: number;
  capacity_name?: string;
  capacity_description?: string;
  catch_names?: string | string[];
  catching_names?: string | string[];
  translations?: string | string[];
  wild_card?: string;
  collection_card?: string;
  [key: string]: unknown;
};

export type NationDetailData = {
  id: string;
  name: string;
  short_name?: string;
  class: string;
  emoji_id?: string;
  credits?: string;
  attack: number;
  health: number;
  rarity?: number;
  weight: number;
  regime?: string;
  economy?: string;
  price?: number;
  sell_price?: number;
  global_caught: number;
  capacity_name?: string;
  capacity_description?: string;
  catch_names?: string[];
  catching_names?: string[];
  translations?: string[];
  wild_card?: string;
  collection_card?: string;
  [key: string]: unknown;
};

export async function fetchNationDetail(id: string): Promise<NationDetailData | null> {
  const cacheKey = `nation_detail_${id}`;
  const raw = await apiFetch<unknown>(`/api/bot/collectibles?id=${encodeURIComponent(id)}`);
  if (!raw) return getCache<NationDetailData>(cacheKey);
  const data = unwrapData(raw);
  if (!data || typeof data !== 'object') return getCache<NationDetailData>(cacheKey);
  const obj = data as Record<string, unknown>;
  const nationObj = (obj.data ?? obj.value ?? obj.collectible ?? (Array.isArray(obj) ? (obj as any[]).find((x) => String(x?.id).toLowerCase() === id.toLowerCase()) || obj[0] : obj)) as Record<string, unknown>;
  if (!nationObj) return getCache<NationDetailData>(cacheKey);

  const rawCatch = nationObj.catch_names ?? nationObj.catching_names;
  const catch_names = Array.isArray(rawCatch)
    ? (rawCatch as string[]).map(String)
    : typeof rawCatch === 'string' && rawCatch
    ? rawCatch.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
    : [String(nationObj.name ?? id).toLowerCase()];

  const rawTrans = nationObj.translations;
  const translations = Array.isArray(rawTrans)
    ? (rawTrans as string[]).map(String)
    : typeof rawTrans === 'string' && rawTrans
    ? rawTrans.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const detail: NationDetailData = {
    id: String(nationObj.id ?? id),
    name: String(nationObj.name ?? id),
    short_name: nationObj.short_name ? String(nationObj.short_name) : undefined,
    class: String(nationObj.class ?? nationObj.rarity_class ?? 'common').toLowerCase(),
    emoji_id: nationObj.emoji_id ? String(nationObj.emoji_id) : undefined,
    credits: nationObj.credits ? String(nationObj.credits) : undefined,
    attack: Number(nationObj.attack ?? 0),
    health: Number(nationObj.health ?? 0),
    rarity: nationObj.rarity !== undefined ? Number(nationObj.rarity) : undefined,
    weight: Number(nationObj.weight ?? nationObj.rarity ?? 10),
    regime: nationObj.regime ? String(nationObj.regime) : undefined,
    economy: nationObj.economy ? String(nationObj.economy) : undefined,
    price: nationObj.price !== undefined ? Number(nationObj.price) : undefined,
    sell_price: nationObj.sell_price !== undefined ? Number(nationObj.sell_price) : undefined,
    global_caught: Number(nationObj.global_caught ?? nationObj.collectibles_caught_global ?? 0),
    capacity_name: nationObj.capacity_name ? String(nationObj.capacity_name) : undefined,
    capacity_description: nationObj.capacity_description ? String(nationObj.capacity_description) : undefined,
    catch_names,
    catching_names: catch_names,
    translations,
    wild_card: nationObj.wild_card ? String(nationObj.wild_card) : undefined,
    collection_card: nationObj.collection_card ? String(nationObj.collection_card) : undefined,
  };
  setCache(cacheKey, detail);
  return detail;
}

export async function createNation(
  payload: CreateNationPayload
): Promise<ApiResponse<{ id: string }>> {
  const res = await apiFetch<ApiResponse<{ id: string }>>('/api/bot/nations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res || { ok: false, error: 'Network error' };
}

export async function updateNation(
  id: string,
  payload: UpdateNationPayload
): Promise<ApiResponse> {
  const { id: _ignored, ...body } = (payload || {}) as Record<string, unknown>;
  const res = await apiFetch<ApiResponse>(`/api/bot/nations/${encodeURIComponent(id)}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return res || { ok: false, error: 'Network error' };
}

export async function deleteNation(id: string, cascade = true): Promise<ApiResponse> {
  const res = await apiFetch<ApiResponse>(`/api/bot/nations/${encodeURIComponent(id)}/delete`, {
    method: 'POST',
    body: JSON.stringify({ cascade }),
  });
  return res || { ok: false, error: 'Network error' };
}

export async function uploadNationArt(
  id: string,
  kind: 'spawn' | 'window',
  data: string,
  name?: string
): Promise<ApiResponse<{ file: string }>> {
  const res = await apiFetch<ApiResponse<{ file: string }>>(`/api/bot/nations/${encodeURIComponent(id)}/art`, {
    method: 'POST',
    body: JSON.stringify({ kind, data, name }),
  });
  return res || { ok: false, error: 'Network error' };
}

export async function updateNationCard(
  id: string,
  payload: { regime?: string; economy?: string }
): Promise<ApiResponse> {
  const res = await apiFetch<ApiResponse>(`/api/bot/nations/${encodeURIComponent(id)}/card`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res || { ok: false, error: 'Network error' };
}

export async function replaceCardBackground(name: string, data: string): Promise<ApiResponse> {
  const res = await apiFetch<ApiResponse>(`/api/bot/cards/backgrounds/${encodeURIComponent(name)}/replace`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
  return res || { ok: false, error: 'Network error' };
}

export async function deleteCardBackground(name: string): Promise<ApiResponse> {
  const res = await apiFetch<ApiResponse>(`/api/bot/cards/backgrounds/${encodeURIComponent(name)}/delete`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  return res || { ok: false, error: 'Network error' };
}

export async function updateUserBalance(
  userId: string,
  mode: 'set' | 'add' | 'remove',
  amount: number
): Promise<ApiResponse> {
  const res = await apiFetch<ApiResponse>(`/api/bot/users/${encodeURIComponent(userId)}/balance`, {
    method: 'POST',
    body: JSON.stringify({ mode, amount }),
  });
  return res || { ok: false, error: 'Network error' };
}

export async function updateUserSettings(
  userId: string,
  key: 'inventory_privacy' | 'profile_privacy' | 'accept_gifts',
  value: string | boolean
): Promise<ApiResponse> {
  const res = await apiFetch<ApiResponse>(`/api/bot/users/${encodeURIComponent(userId)}/settings`, {
    method: 'POST',
    body: JSON.stringify({ key, value }),
  });
  return res || { ok: false, error: 'Network error' };
}

export async function resetUserSettings(userId: string): Promise<ApiResponse> {
  const res = await apiFetch<ApiResponse>(`/api/bot/users/${encodeURIComponent(userId)}/settings/reset`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  return res || { ok: false, error: 'Network error' };
}

type UserAuctionStats = {
  total: number;
  sold: number;
  earnings: number;
  onSale: string[];
};

async function fetchUserAuction(userId: string): Promise<UserAuctionStats | null> {
  let res = await apiFetch<unknown>(
    `/api/bot/users/${encodeURIComponent(userId)}/auction`
  );
  if (!res) {
    return null;
  }
  if (typeof res === 'string') {
    try {
      res = JSON.parse(res);
    } catch {
      const match = (res as string).match(/\{[\s\S]*?\}/);
      if (match) {
        try {
          res = JSON.parse(match[0]);
        } catch {}
      }
    }
  }
  if (!res || typeof res !== 'object') {
    return null;
  }
  const obj = res as Record<string, unknown>;
  if (obj.error || obj.private) {
    return null;
  }
  return {
    total: Number(obj.total ?? 0),
    sold: Number(obj.sold ?? 0),
    earnings: Number(obj.earnings ?? 0),
    onSale: Array.isArray(obj.onSale) ? (obj.onSale as unknown[]).map(String) : [],
  };
}

type UpdateUserAuctionPayload =
  | {
      total?: number;
      sold?: number;
      earnings?: number;
      onSale?: string[];
    }
  | {
      key: 'total' | 'sold' | 'earnings' | 'onSale';
      value: number | string[];
      mode?: 'set' | 'add' | 'remove';
    };

export async function updateUserAuction(
  userId: string,
  payload: UpdateUserAuctionPayload
): Promise<ApiResponse> {
  const res = await apiFetch<ApiResponse>(`/api/bot/users/${encodeURIComponent(userId)}/auction`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res || { ok: false, error: 'Network error' };
}

export async function giveUserNation(
  userId: string,
  nation: string,
  count = 1
): Promise<ApiResponse> {
  const res = await apiFetch<ApiResponse>(`/api/bot/users/${encodeURIComponent(userId)}/nations/give`, {
    method: 'POST',
    body: JSON.stringify({ nation, count }),
  });
  return res || { ok: false, error: 'Network error' };
}

export async function removeUserNation(
  userId: string,
  catchId: string
): Promise<ApiResponse> {
  const res = await apiFetch<ApiResponse>(`/api/bot/users/${encodeURIComponent(userId)}/nations/remove`, {
    method: 'POST',
    body: JSON.stringify({ catch: catchId }),
  });
  return res || { ok: false, error: 'Network error' };
}

export async function updateConfigItem(
  root: 'config' | 'keywords',
  path: string,
  value: unknown
): Promise<ApiResponse> {
  const res = await apiFetch<ApiResponse>('/api/bot/config', {
    method: 'POST',
    body: JSON.stringify({ root, path, value }),
  });
  return res || { ok: false, error: 'Network error' };
}

export async function addConfigItem(
  root: 'config' | 'keywords',
  key: string,
  value: unknown,
  parent?: string
): Promise<ApiResponse> {
  const res = await apiFetch<ApiResponse>('/api/bot/config/add', {
    method: 'POST',
    body: JSON.stringify({ root, parent: parent || '', key, value }),
  });
  return res || { ok: false, error: 'Network error' };
}

export async function deleteConfigItem(
  root: 'config' | 'keywords',
  path: string
): Promise<ApiResponse> {
  const res = await apiFetch<ApiResponse>('/api/bot/config/delete', {
    method: 'POST',
    body: JSON.stringify({ root, path }),
  });
  return res || { ok: false, error: 'Network error' };
}

export async function resetConfigItem(
  root: 'config' | 'keywords',
  path: string
): Promise<ApiResponse> {
  const res = await apiFetch<ApiResponse>('/api/bot/config/reset', {
    method: 'POST',
    body: JSON.stringify({ root, path }),
  });
  return res || { ok: false, error: 'Network error' };
}

export type UserCatchItem = {
  catch: string;
  id?: string;
  name?: string;
  class?: RarityClass;
  weight?: number;
  caughtAt?: string;
  attack?: number;
  health?: number;
  [key: string]: unknown;
};

type UserAuctionItem = {
  id: string;
  nationCatchId: string;
  catalogId: string;
  nationName?: string;
  nationClass?: string;
  startPrice: number;
  buyoutPrice: number;
  currentBid: number;
  bidder?: string;
  bidsCount: number;
  createdAt?: string;
  endsAt?: string;
  guildId?: string;
  channelId?: string;
  status: 'active' | 'ended';
};

type UserAuctionData = {
  total: number;
  sold: number;
  earnings: number;
  onSale: string[];
  activeAuctions: UserAuctionItem[];
};

export type UserDetailData = {
  discordId: string;
  username: string;
  global_name?: string;
  balance: number;
  totalValue: number;
  settings: {
    inventory_privacy: 'public' | 'private' | string;
    profile_privacy: 'public' | 'private' | string;
    accept_gifts: boolean;
  };
  stats?: {
    catches_total?: number;
    battles_won?: number;
    trades_completed?: number;
    gifts_sent?: number;
  };
  collectiblesData: UserCatchItem[];
  auctionData: UserAuctionData;
  private?: boolean;
};

async function fetchUserBalance(userId: string): Promise<number> {
  const raw = await apiFetch<unknown>(`/api/bot/search_db/balance?id=${encodeURIComponent(userId)}`, undefined, 1, 4000);
  if (!raw) return 0;
  let record: Record<string, unknown> | null = null;
  if (Array.isArray(raw) && raw.length > 0) {
    record = raw[0] as Record<string, unknown>;
  } else if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    record = Array.isArray(obj.results) ? (obj.results[0] as Record<string, unknown>) : obj;
  }
  if (!record || record.value === undefined || record.value === null) return 0;
  const num = Number(record.value);
  return isNaN(num) ? 0 : num;
}

async function fetchNationCatch(catchId: string): Promise<Record<string, unknown> | null> {
  const cacheKey = `catch_${catchId}`;
  const cached = getCache<Record<string, unknown>>(cacheKey);
  if (cached && (cached.attack !== undefined || cached.health !== undefined)) {
    return cached;
  }

  const raw = await apiFetch<unknown>(`/api/bot/search_db/collectible?id=${encodeURIComponent(catchId)}`, undefined, 1, 8000);
  if (!raw) return null;
  let record: Record<string, unknown> | null = null;
  if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'object') {
    record = raw[0] as Record<string, unknown>;
  } else if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.results) && obj.results.length > 0) {
      record = obj.results[0] as Record<string, unknown>;
    } else if (Array.isArray(obj.value) && obj.value.length > 0) {
      record = obj.value[0] as Record<string, unknown>;
    } else {
      record = obj;
    }
  }
  if (!record) return null;
  let parsed: Record<string, unknown> = record;
  if (typeof record.value === 'string') {
    try {
      parsed = JSON.parse(record.value) as Record<string, unknown>;
    } catch {
      parsed = record;
    }
  } else if (typeof record.value === 'object' && record.value !== null) {
    parsed = record.value as Record<string, unknown>;
  }
  if (parsed.attack !== undefined || parsed.health !== undefined || parsed.id) {
    setCache(cacheKey, parsed);
  }
  return parsed;
}

async function fetchAuctionHouse(): Promise<Record<string, Record<string, unknown>>> {
  const cacheKey = 'auction_house';
  const cached = getCache<Record<string, Record<string, unknown>>>(cacheKey);
  const raw = await apiFetch<unknown>('/api/bot/search_db/auctionHouse', undefined, 1, 6000);
  if (!raw) return cached ?? {};
  let record: Record<string, unknown> | null = null;
  if (Array.isArray(raw) && raw.length > 0) {
    record = raw[0] as Record<string, unknown>;
  } else if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    record = Array.isArray(obj.results) ? (obj.results[0] as Record<string, unknown>) : obj;
  }
  if (!record) return cached ?? {};
  let parsed: Record<string, unknown> = {};
  if (typeof record.value === 'string') {
    try {
      parsed = JSON.parse(record.value) as Record<string, unknown>;
    } catch {
      parsed = {};
    }
  } else if (typeof record.value === 'object' && record.value !== null) {
    parsed = record.value as Record<string, unknown>;
  }
  const result = (parsed.auctions ?? {}) as Record<string, Record<string, unknown>>;
  setCache(cacheKey, result);
  return result;
}

export async function fetchUserDetail(id: string): Promise<UserDetailData | null> {
  const raw = await apiFetch<unknown>(`/api/bot/user?id=${encodeURIComponent(id)}`, undefined, 1, 5000);
  if (!raw) return null;

  let data: Record<string, unknown> = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  if ('value' in data && data.value && typeof data.value === 'object') {
    data = data.value as Record<string, unknown>;
  } else if ('data' in data && data.data && typeof data.data === 'object') {
    data = data.data as Record<string, unknown>;
  } else if ('result' in data && data.result && typeof data.result === 'object') {
    data = data.result as Record<string, unknown>;
  }

  const settingsRaw = (data.settings ?? {}) as Record<string, unknown>;
  const statsRaw = (data.stats ?? data.userStats ?? {}) as Record<string, unknown>;
  const rawCollectibles = (data.collectiblesData ?? data.collectibles_data ?? {}) as Record<string, unknown>;

  const collectibleIds: string[] = Array.isArray(rawCollectibles.collectibleIDs)
    ? (rawCollectibles.collectibleIDs as string[])
    : Array.isArray(rawCollectibles.collectibleIds)
    ? (rawCollectibles.collectibleIds as string[])
    : Array.isArray(rawCollectibles.nations)
    ? (rawCollectibles.nations as string[])
    : [];

  const uniqueList: string[] = Array.isArray(rawCollectibles.unique)
    ? (rawCollectibles.unique as string[])
    : [];

  const catches: UserCatchItem[] = await Promise.all(
    collectibleIds.map(async (catchId, idx) => {
      try {
        const nationData = await fetchNationCatch(catchId);
        const nationId = String(nationData?.id ?? nationData?.nation ?? uniqueList[idx] ?? uniqueList[0] ?? '');
        return {
          catch: catchId,
          id: nationId,
          name: nationId ? `Nation #${nationId}` : `#${catchId}`,
          attack: nationData?.attack !== undefined && nationData.attack !== '' ? Number(nationData.attack) : undefined,
          health: nationData?.health !== undefined && nationData.health !== '' ? Number(nationData.health) : undefined,
          attackType: nationData?.attack_type ? String(nationData.attack_type) : undefined,
          healthType: nationData?.health_type ? String(nationData.health_type) : undefined,
          caughtAt: nationData?.timestamp
            ? !isNaN(Number(nationData.timestamp))
              ? new Date(Number(nationData.timestamp)).toLocaleDateString()
              : String(nationData.timestamp)
            : undefined,
        };
      } catch {
        return {
          catch: catchId,
          id: uniqueList[idx] ?? '',
          name: `#${catchId}`,
        };
      }
    })
  );

  const [directAuction, resolvedBalance] = await Promise.all([
    fetchUserAuction(id),
    typeof data.balance === 'number'
      ? Promise.resolve(data.balance)
      : typeof statsRaw.balance === 'number'
      ? Promise.resolve(statsRaw.balance)
      : fetchUserBalance(id),
  ]);

  const rawAuction = (data.auctionData ?? data.auction_data ?? {}) as Record<string, unknown>;
  const rawTotal = rawAuction.total !== undefined ? Number(rawAuction.total) : undefined;
  const rawSold = rawAuction.sold !== undefined ? Number(rawAuction.sold) : undefined;
  const rawEarnings = rawAuction.earnings !== undefined ? Number(rawAuction.earnings) : undefined;

  const auctionTotal = directAuction?.total !== undefined && directAuction.total > 0
    ? directAuction.total
    : rawTotal !== undefined
    ? rawTotal
    : directAuction?.total ?? 0;

  const auctionSold = directAuction?.sold !== undefined && directAuction.sold > 0
    ? directAuction.sold
    : rawSold !== undefined
    ? rawSold
    : directAuction?.sold ?? 0;

  const auctionEarnings = directAuction?.earnings !== undefined && directAuction.earnings > 0
    ? directAuction.earnings
    : rawEarnings !== undefined
    ? rawEarnings
    : directAuction?.earnings ?? 0;

  const onSaleIds: string[] = (directAuction?.onSale && directAuction.onSale.length > 0)
    ? directAuction.onSale
    : (Array.isArray(rawAuction.onSale)
    ? (rawAuction.onSale as string[]).map(String)
    : directAuction?.onSale ?? []);

  let activeAuctions: UserAuctionItem[] = [];
  if (onSaleIds.length > 0) {
    try {
      const house = await fetchAuctionHouse();
      activeAuctions = onSaleIds.map((aucId) => {
        const item = house[aucId] ?? {};
        const colId = String(item.colID ?? item.catalogId ?? item.nationId ?? '');
        const catchId = String(item.nation ?? item.catchId ?? item.catch ?? '');
        const endsMs = Number(item.ends ?? 0);
        const createdMs = Number(item.created ?? 0);
        const isEnded = endsMs > 0 && Date.now() > endsMs;

        return {
          id: String(aucId),
          nationCatchId: catchId,
          catalogId: colId,
          startPrice: Number(item.start ?? 0),
          buyoutPrice: Number(item.buyout ?? 0),
          currentBid: Number(item.bid ?? 0),
          bidder: item.bidder ? String(item.bidder) : undefined,
          bidsCount: Number(item.bids ?? 0),
          createdAt: createdMs ? new Date(createdMs).toLocaleDateString() : undefined,
          endsAt: endsMs ? new Date(endsMs).toLocaleString() : undefined,
          guildId: item.guild ? String(item.guild) : undefined,
          channelId: item.channel ? String(item.channel) : undefined,
          status: isEnded ? 'ended' : 'active',
        };
      });
    } catch {
      activeAuctions = onSaleIds.map((aucId) => ({
        id: String(aucId),
        nationCatchId: '',
        catalogId: '',
        startPrice: 0,
        buyoutPrice: 0,
        currentBid: 0,
        bidsCount: 0,
        status: 'active',
      }));
    }
  }

  const discordId = String(data.discordId ?? data.id ?? id);
  const globalName = String(data.global_name ?? data.globalName ?? '');
  const username = String(data.username ?? globalName ?? discordId);
  const totalValue = Number(rawCollectibles.total_value ?? rawCollectibles.totalValue ?? data.totalValue ?? 0);

  return {
    discordId,
    username,
    global_name: globalName,
    balance: resolvedBalance,
    totalValue,
    settings: {
      inventory_privacy: String(settingsRaw.inventory_privacy ?? 'public'),
      profile_privacy: String(settingsRaw.profile_privacy ?? 'public'),
      accept_gifts: settingsRaw.accept_gifts !== false && settingsRaw.accept_gifts !== 'false',
    },
    stats: {
      catches_total: Number(statsRaw.catches_total ?? rawCollectibles.total ?? collectibleIds.length),
      battles_won: Number(statsRaw.battles_won ?? 0),
      trades_completed: Number(statsRaw.trades_completed ?? 0),
      gifts_sent: Number(statsRaw.gifts_sent ?? 0),
    },
    collectiblesData: catches,
    auctionData: {
      total: auctionTotal,
      sold: auctionSold,
      earnings: auctionEarnings,
      onSale: onSaleIds,
      activeAuctions,
    },
    private: Boolean(data.private),
  };
}

export function getCardImageUrl(idOrUrlOrFile: string): string {
  if (!idOrUrlOrFile) return '/api/bot/cards/democracy/image';
  if (idOrUrlOrFile.startsWith('data:') || idOrUrlOrFile.startsWith('http://') || idOrUrlOrFile.startsWith('https://')) {
    return idOrUrlOrFile;
  }
  if (idOrUrlOrFile.startsWith('/v1/')) {
    return idOrUrlOrFile.replace('/v1/', '/api/bot/');
  }
  if (idOrUrlOrFile.startsWith('/api/bot/')) {
    return idOrUrlOrFile;
  }
  const clean = idOrUrlOrFile.replace(/\.(png|jpg|webp|svg)$/i, '');
  return `/api/bot/cards/${encodeURIComponent(clean)}/image`;
}

export type RegimeCardItem = {
  id: string;
  name: string;
  file: string;
  url?: string;
  nationsCount: number;
};

export type SpecialCardItem = {
  id: string;
  name: string;
  card: string;
  url?: string;
  description: string;
};

export async function fetchCardBackgrounds(): Promise<RegimeCardItem[]> {
  const res = await apiFetch<RegimeCardItem[] | { ok?: boolean; results?: RegimeCardItem[] }>('/api/bot/cards');
  if (Array.isArray(res)) return res;
  if (res && typeof res === 'object' && Array.isArray((res as { results?: RegimeCardItem[] }).results)) {
    return (res as { results: RegimeCardItem[] }).results;
  }
  const fallbackRes = await apiFetch<RegimeCardItem[]>('/api/bot/cards/backgrounds');
  if (Array.isArray(fallbackRes)) return fallbackRes;
  return [];
}

export async function fetchSpecialsCards(): Promise<SpecialCardItem[]> {
  const res = await apiFetch<SpecialCardItem[] | { ok?: boolean; results?: SpecialCardItem[] }>('/api/bot/search_db/specials');
  if (Array.isArray(res)) return res;
  if (res && typeof res === 'object' && Array.isArray((res as { results?: SpecialCardItem[] }).results)) {
    return (res as { results: SpecialCardItem[] }).results;
  }
  return [];
}