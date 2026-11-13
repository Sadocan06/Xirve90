
const API_URL = "https://soccer.highlightly.net";
const CACHE_SECONDS = 900;
const STANDINGS_CACHE_SECONDS = 21600;
const LEAGUES_CACHE_SECONDS = 86400;
const PAGE_SIZE = 100;
const MAX_PAGES = 8;

const priorityCountries = [
  "TR", "DE", "GB", "ES", "IT", "FR", "NL", "PT",
  "BE", "AT", "CH", "GR", "SA", "US", "BR", "AR"
];

const excludedTerms = [
  "women", "woman", "female", "feminine",
  "femenino", "feminina", "femminile", "frauen",
  "kadin", "kadın", "u17", "u18", "u19", "u20",
  "u21", "u23", "under 17", "under 19",
  "under 20", "under 21", "youth", "reserve",
  "reserves", "primavera", "academy"
];

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      ...extra
    }
  });
}

function isExcluded(match) {
  const text = [
    match.league?.name,
    match.homeTeam?.name,
    match.awayTeam?.name
  ].filter(Boolean).join(" ").toLocaleLowerCase("tr");

  return excludedTerms.some(term => {
    if (/^u\d+$/.test(term)) {
      return new RegExp("\\b" + term + "\\b", "i")
        .test(text);
    }
    return text.includes(term);
  });
}

function priority(match) {
  const country = String(
    match.country?.code || ""
  ).toUpperCase();

  const league = String(
    match.league?.name || ""
  ).toLowerCase();

  if (country === "TR") {
    if (/süper lig|super lig/i.test(league)) return 0;
    if (/1\. lig|first league/i.test(league)) return 1;
    return 10;
  }

  if (country === "DE") {
    if (league === "bundesliga") return 2;
    if (/2\. bundesliga/i.test(league)) return 12;
    return 20;
  }

  const position = priorityCountries.indexOf(country);
  return position === -1 ? 100 : position + 20;
}

function sortMatches(matches) {
  return matches.sort((a, b) => {
    const difference = priority(a) - priority(b);
    if (difference !== 0) return difference;

    const countryA = a.country?.name || "";
    const countryB = b.country?.name || "";

    const countryCompare = countryA.localeCompare(countryB);
    if (countryCompare !== 0) return countryCompare;

    const leagueA = a.league?.name || "";
    const leagueB = b.league?.name || "";

    const leagueCompare = leagueA.localeCompare(leagueB);
    if (leagueCompare !== 0) return leagueCompare;

    return new Date(a.date).getTime() -
      new Date(b.date).getTime();
  });
}

async function apiGet(path, params, key) {
  const url = new URL(API_URL + path);

  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(name, String(value));
  }

  const response = await fetch(url.toString(), {
    headers: {
      "x-rapidapi-key": key
    }
  });

  if (!response.ok) {
    throw new Error("Highlightly HTTP " + response.status);
  }

  return response.json();
}

async function fetchPage(date, offset, key) {
  return apiGet("/matches", {
    date,
    limit: PAGE_SIZE,
    offset
  }, key);
}

async function getMatches(date, key) {
  const first = await fetchPage(date, 0, key);
  const all = Array.isArray(first.data)
    ? [...first.data]
    : [];

  const total = Number(
    first.pagination?.totalCount || all.length
  );

  const pageCount = Math.min(
    MAX_PAGES,
    Math.ceil(total / PAGE_SIZE)
  );

  if (pageCount > 1) {
    const offsets = Array.from(
      { length: pageCount - 1 },
      (_, index) => (index + 1) * PAGE_SIZE
    );

    for (let i = 0; i < offsets.length; i += 3) {
      const batch = offsets.slice(i, i + 3);

      const results = await Promise.all(
        batch.map(offset => fetchPage(date, offset, key))
      );

      for (const result of results) {
        if (Array.isArray(result.data)) {
          all.push(...result.data);
        }
      }
    }
  }

  const unique = new Map();

  for (const match of all) {
    if (match && match.id != null) {
      unique.set(String(match.id), match);
    }
  }

  const filtered = sortMatches(
    [...unique.values()].filter(
      match => !isExcluded(match)
    )
  );

  return {
    data: filtered,
    pagination: {
      totalCount: filtered.length,
      offset: 0,
      limit: filtered.length
    },
    plan: first.plan || null,
    meta: {
      originalTotal: total,
      received: unique.size,
      shown: filtered.length,
      pagesFetched: pageCount,
      cacheSeconds: CACHE_SECONDS
    }
  };
}

function validId(value) {
  return /^\d+$/.test(String(value || "")) &&
    Number(value) > 0;
}

async function cachedApi(cacheName, seconds, ctx, loader) {
  const cache = caches.default;

  const cacheKey = new Request(
    "https://zirve90-cache.internal/" + cacheName
  );

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const data = await loader();

  const response = json(data, 200, {
    "Cache-Control": "public, max-age=" + seconds
  });

  ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return json({});
    }

    if (request.method !== "GET") {
      return json({ error: "Metot desteklenmiyor" }, 405);
    }

    if (url.pathname === "/") {
      return json({
        app: "Zirve90",
        status: "API calisiyor",
        endpoints: [
          "/matches",
          "/leagues",
          "/standings"
        ],
        keyConfigured: Boolean(env.HIGHLIGHTLY_API_KEY)
      });
    }

    if (![
      "/matches", "/leagues", "/standings"
    ].includes(url.pathname)) {
      return json({ error: "Sayfa bulunamadi" }, 404);
    }

    if (!env.HIGHLIGHTLY_API_KEY) {
      return json({ error: "API anahtari eksik" }, 500);
    }

    try {
      // MACLAR
      if (url.pathname === "/matches") {
        const date = url.searchParams.get("date") ||
          new Date().toISOString().slice(0, 10);

        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          return json({
            error: "Tarih YYYY-MM-DD olmali"
          }, 400);
        }

        return await cachedApi(
          "matches?date=" + date,
          CACHE_SECONDS,
          ctx,
          () => getMatches(
            date,
            env.HIGHLIGHTLY_API_KEY
          )
        );
      }

      // LIGLER VE SEZONLAR
      if (url.pathname === "/leagues") {
        const leagueName =
          url.searchParams.get("leagueName") || "";

        const countryCode =
          url.searchParams.get("countryCode") || "";

        const season =
          url.searchParams.get("season") || "";

        if (!leagueName && !countryCode) {
          return json({
            error: "Lig adi veya ulke kodu gerekli"
          }, 400);
        }

        if (season && !validId(season)) {
          return json({
            error: "Gecersiz sezon"
          }, 400);
        }

        const params = { limit: 100, offset: 0 };

        if (leagueName) params.leagueName = leagueName;
        if (countryCode) params.countryCode = countryCode;
        if (season) params.season = season;

        const cacheName = "leagues?" +
          new URLSearchParams(params).toString();

        return await cachedApi(
          cacheName,
          LEAGUES_CACHE_SECONDS,
          ctx,
          () => apiGet(
            "/leagues",
            params,
            env.HIGHLIGHTLY_API_KEY
          )
        );
      }

      // PUAN DURUMU
      if (url.pathname === "/standings") {
        const leagueId =
          url.searchParams.get("leagueId");

        const season =
          url.searchParams.get("season");

        if (!validId(leagueId) || !validId(season)) {
          return json({
            error: "leagueId ve season gerekli"
          }, 400);
        }

        return await cachedApi(
          "standings?leagueId=" + leagueId +
          "&season=" + season,
          STANDINGS_CACHE_SECONDS,
          ctx,
          () => apiGet(
            "/standings",
            { leagueId, season },
            env.HIGHLIGHTLY_API_KEY
          )
        );
      }
    } catch (error) {
      return json({
        error: "API verileri alinamadi",
        detail: error.message
      }, 502);
    }
  }
};
