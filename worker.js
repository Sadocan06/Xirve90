
'use strict';

// ZIRVE90 Cloudflare Worker
// Highlightly API
// Gizli anahtar: HIGHLIGHTLY_API_KEY

const API_URL = 'https://soccer.highlightly.net';
const PAGE_SIZE = 100;
const MAX_PAGES = 8;

const TTL = {
  matches: 900,
  match: 90,
  lineups: 600,
  statistics: 300,
  events: 60,
  leagues: 86400,
  standings: 21600,
  teams: 86400,
  player: 86400,
  playerStats: 86400
};

const priorityCountries = [
  'TR','DE','GB','ES','IT','FR',
  'NL','PT','BE','AT','CH','GR',
  'SA','US','BR','AR'
];

const excludedTerms = [
  'women','woman','female','feminine',
  'femenino','feminina','femminile',
  'frauen','kadin','kadın',
  'u17','u18','u19','u20','u21','u23',
  'under 17','under 19','under 20',
  'under 21','youth','reserve',
  'reserves','primavera','academy'
];

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'X-Content-Type-Options': 'nosniff',
      ...headers
    }
  });
}

function validId(v) {
  return /^\d+$/.test(String(v ?? '')) &&
    Number(v) > 0 &&
    Number.isSafeInteger(Number(v));
}

function validSeason(v) {
  return /^\d{4}$/.test(String(v ?? '')) &&
    Number(v) >= 2000 &&
    Number(v) <= new Date().getUTCFullYear() + 1;
}

function validDate(v) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(v ?? ''))) {
    return false;
  }

  const d = new Date(v + 'T00:00:00Z');

  return !Number.isNaN(d.getTime()) &&
    d.toISOString().slice(0, 10) === v;
}

function excluded(m) {
  const text = [
    m.league?.name,
    m.homeTeam?.name,
    m.awayTeam?.name
  ].filter(Boolean).join(' ').toLocaleLowerCase('tr');

  return excludedTerms.some(term => {
    if (/^u\d+$/.test(term)) {
      return new RegExp('\\b' + term + '\\b', 'i')
        .test(text);
    }
    return text.includes(term);
  });
}

function priority(m) {
  const country = String(
    m.country?.code ||
    m.league?.country?.code ||
    ''
  ).toUpperCase();

  const name = String(m.league?.name || '')
    .toLowerCase();

  if (
    country === 'TR' &&
    /süper lig|super lig/i.test(name)
  ) return 0;

  if (
    country === 'TR' &&
    /1\. lig|first league/i.test(name)
  ) return 1;

  if (
    country === 'DE' &&
    name === 'bundesliga'
  ) return 2;

  const index = priorityCountries.indexOf(country);

  return index < 0 ? 100 : index + 20;
}

function sortMatches(matches) {
  return matches.sort((a, b) =>
    priority(a) - priority(b) ||

    String(a.country?.name || '').localeCompare(
      String(b.country?.name || '')
    ) ||

    String(a.league?.name || '').localeCompare(
      String(b.league?.name || '')
    ) ||

    new Date(a.date) - new Date(b.date)
  );
}

class UpstreamError extends Error {
  constructor(status) {
    super('Highlightly HTTP ' + status);
    this.status = status;
  }
}

async function apiGet(path, params, key) {
  const url = new URL(API_URL + path);

  for (const [name, value] of Object.entries(params || {})) {
    if (value !== '' && value != null) {
      url.searchParams.set(name, String(value));
    }
  }

  const response = await fetch(url.toString(), {
    headers: {
      'x-rapidapi-key': key,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new UpstreamError(response.status);
  }

  return response.json();
}

async function cached(name, seconds, ctx, loader) {
  const cache = caches.default;

  const key = new Request(
    'https://zirve90-cache.internal/v3/' + name
  );

  const hit = await cache.match(key);

  if (hit) return hit;

  const result = await loader();

  const response = json(result, 200, {
    'Cache-Control': 'public, max-age=' + seconds
  });

  ctx.waitUntil(
    cache.put(key, response.clone())
  );

  return response;
}

async function getMatches(date, key) {
  const first = await apiGet('/matches', {
    date,
    limit: PAGE_SIZE,
    offset: 0
  }, key);

  const all = Array.isArray(first.data)
    ? [...first.data]
    : [];

  const total = Number(
    first.pagination?.totalCount ?? all.length
  );

  const pages = Math.max(
    1,
    Math.min(
      MAX_PAGES,
      Math.ceil(total / PAGE_SIZE)
    )
  );

  for (let start = 1; start < pages; start += 3) {
    const count = Math.min(3, pages - start);

    const batch = await Promise.all(
      Array.from({length: count}, (_, i) =>
        apiGet('/matches', {
          date,
          limit: PAGE_SIZE,
          offset: (start + i) * PAGE_SIZE
        }, key)
      )
    );

    for (const page of batch) {
      if (Array.isArray(page.data)) {
        all.push(...page.data);
      }
    }
  }

  const unique = new Map();

  for (const match of all) {
    if (match?.id != null) {
      unique.set(String(match.id), match);
    }
  }

  const filtered = sortMatches(
    [...unique.values()].filter(
      match => !excluded(match)
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
      pagesFetched: pages,
      cacheSeconds: TTL.matches
    }
  };
}

function errorResponse(error) {
  const status = error instanceof UpstreamError
    ? error.status
    : 0;

  return json({
    error:
      status === 429
        ? 'API istek limiti doldu'
        : status === 404
          ? 'Bu veri API üzerinde bulunamadı'
          : status === 403
            ? 'API planı bu veriye erişemiyor'
            : 'API verileri alınamadı',

    detail: status
      ? 'Highlightly HTTP ' + status
      : 'Bağlantı hatası'
  }, status === 429
    ? 429
    : status === 404
      ? 404
      : status === 403
        ? 403
        : 502
  );
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    const path = url.pathname.replace(/\/$/, '') || '/';

    if (request.method === 'OPTIONS') {
      return json({});
    }

    if (request.method !== 'GET') {
      return json({
        error: 'Metot desteklenmiyor'
      }, 405);
    }

    const endpoints = [
      '/matches',
      '/match',
      '/lineups',
      '/statistics',
      '/events',
      '/leagues',
      '/standings',
      '/teams',
      '/player',
      '/player-statistics'
    ];

    if (path === '/') {
      return json({
        app: 'Zirve90',
        status: 'API calisiyor',
        endpoints,
        keyConfigured: Boolean(
          env.HIGHLIGHTLY_API_KEY
        )
      });
    }

    if (!endpoints.includes(path)) {
      return json({
        error: 'Sayfa bulunamadı'
      }, 404);
    }

    if (!env.HIGHLIGHTLY_API_KEY) {
      return json({
        error: 'API anahtarı eksik'
      }, 500);
    }

    const key = env.HIGHLIGHTLY_API_KEY;

    try {
      // MAÇ LİSTESİ

      if (path === '/matches') {
        const date =
          url.searchParams.get('date') ||
          new Date().toISOString().slice(0, 10);

        if (!validDate(date)) {
          return json({
            error: 'Geçersiz tarih'
          }, 400);
        }

        return cached(
          'matches?date=' + date,
          TTL.matches,
          ctx,
          () => getMatches(date, key)
        );
      }

      // MAÇ DETAYLARI

      if ([
        '/match',
        '/lineups',
        '/statistics',
        '/events'
      ].includes(path)) {
        const id =
          url.searchParams.get('matchId') ||
          url.searchParams.get('id') ||
          '';

        if (!validId(id)) {
          return json({
            error: 'Geçerli matchId gerekli'
          }, 400);
        }

        const specs = {
          '/match': [
            '/matches/' + id,
            TTL.match
          ],
          '/lineups': [
            '/lineups/' + id,
            TTL.lineups
          ],
          '/statistics': [
            '/statistics/' + id,
            TTL.statistics
          ],
          '/events': [
            '/events/' + id,
            TTL.events
          ]
        };

        const [apiPath, ttl] = specs[path];

        return cached(
          path.slice(1) + '?id=' + id,
          ttl,
          ctx,
          () => apiGet(apiPath, {}, key)
        );
      }

      // LİGLER

      if (path === '/leagues') {
        const leagueName = (
          url.searchParams.get('leagueName') || ''
        ).trim();

        const countryCode = (
          url.searchParams.get('countryCode') || ''
        ).trim().toUpperCase();

        const season =
          url.searchParams.get('season') || '';

        if (!leagueName && !countryCode) {
          return json({
            error: 'Lig adı veya ülke kodu gerekli'
          }, 400);
        }

        if (
          leagueName.length > 100 ||
          (
            countryCode &&
            !/^[A-Z]{2,3}$/.test(countryCode)
          )
        ) {
          return json({
            error: 'Geçersiz lig veya ülke'
          }, 400);
        }

        if (season && !validSeason(season)) {
          return json({
            error: 'Geçersiz sezon'
          }, 400);
        }

        const params = {
          limit: 100,
          offset: 0
        };

        if (leagueName) {
          params.leagueName = leagueName;
        }

        if (countryCode) {
          params.countryCode = countryCode;
        }

        if (season) {
          params.season = season;
        }

        const qs = new URLSearchParams(params).toString();

        return cached(
          'leagues?' + qs,
          TTL.leagues,
          ctx,
          () => apiGet('/leagues', params, key)
        );
      }

      // PUAN DURUMU

      if (path === '/standings') {
        const leagueId =
          url.searchParams.get('leagueId');

        const season =
          url.searchParams.get('season');

        if (
          !validId(leagueId) ||
          !validSeason(season)
        ) {
          return json({
            error: 'Geçerli leagueId ve season gerekli'
          }, 400);
        }

        return cached(
          'standings?leagueId=' +
            leagueId +
            '&season=' +
            season,
          TTL.standings,
          ctx,
          () => apiGet(
            '/standings',
            {leagueId, season},
            key
          )
        );
      }

      // TAKIMLAR

      if (path === '/teams') {
        const leagueId =
          url.searchParams.get('leagueId') ||
          url.searchParams.get('league');

        const season =
          url.searchParams.get('season') || '';

        if (!validId(leagueId)) {
          return json({
            error: 'Geçerli leagueId gerekli'
          }, 400);
        }

        if (season && !validSeason(season)) {
          return json({
            error: 'Geçersiz sezon'
          }, 400);
        }

        const params = {
          leagueId,
          limit: 100,
          offset: 0
        };

        if (season) {
          params.season = season;
        }

        return cached(
          'teams?' + new URLSearchParams(params),
          TTL.teams,
          ctx,
          () => apiGet('/teams', params, key)
        );
      }

      // OYUNCU PROFİLİ VE İSTATİSTİKLER

      if (
        path === '/player' ||
        path === '/player-statistics'
      ) {
        const playerId =
          url.searchParams.get('playerId') ||
          url.searchParams.get('id') ||
          '';

        if (!validId(playerId)) {
          return json({
            error: 'Geçerli playerId gerekli'
          }, 400);
        }

        const isStats =
          path === '/player-statistics';

        const apiPath =
          '/players/' +
          playerId +
          (isStats ? '/statistics' : '');

        return cached(
          path.slice(1) + '?id=' + playerId,
          isStats ? TTL.playerStats : TTL.player,
          ctx,
          () => apiGet(apiPath, {}, key)
        );
      }

      return json({
        error: 'Sayfa bulunamadı'
      }, 404);

    } catch (error) {
      return errorResponse(error);
    }
  }
};
