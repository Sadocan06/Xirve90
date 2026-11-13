
'use strict';

// ZIRVE90 - Cloudflare Worker
// Highlightly Football API
// API anahtari Cloudflare Secret:
// HIGHLIGHTLY_API_KEY

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
  'TR', 'DE', 'GB', 'ES', 'IT', 'FR',
  'NL', 'PT', 'BE', 'AT', 'CH', 'GR',
  'SA', 'US', 'BR', 'AR'
];

const excludedTerms = [
  'women', 'woman', 'female', 'feminine',
  'femenino', 'feminina', 'femminile',
  'frauen', 'kadin', 'kadın',
  'u17', 'u18', 'u19', 'u20', 'u21', 'u23',
  'under 17', 'under 19', 'under 20',
  'under 21', 'youth', 'reserve',
  'reserves', 'primavera', 'academy'
];

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'X-Content-Type-Options': 'nosniff',
      ...extra
    }
  });
}

function validId(value) {
  return /^\d+$/.test(String(value ?? '')) &&
    Number(value) > 0 &&
    Number.isSafeInteger(Number(value));
}

function validSeason(value) {
  return /^\d{4}$/.test(String(value ?? '')) &&
    Number(value) >= 2000 &&
    Number(value) <= new Date().getUTCFullYear() + 1;
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ''))) {
    return false;
  }

  const date = new Date(value + 'T00:00:00Z');

  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value;
}

function isExcluded(match) {
  const text = [
    match.league?.name,
    match.homeTeam?.name,
    match.awayTeam?.name
  ].filter(Boolean).join(' ').toLocaleLowerCase('tr');

  return excludedTerms.some(term => {
    if (/^u\d+$/.test(term)) {
      return new RegExp(
        '\\b' + term + '\\b', 'i'
      ).test(text);
    }

    return text.includes(term);
  });
}

function priority(match) {
  const country = String(
    match.country?.code || ''
  ).toUpperCase();

  const league = String(
    match.league?.name || ''
  ).toLowerCase();

  if (country === 'TR') {
    if (/süper lig|super lig/i.test(league)) {
      return 0;
    }

    if (/1\. lig|first league/i.test(league)) {
      return 1;
    }

    return 10;
  }

  if (country === 'DE') {
    if (league === 'bundesliga') {
      return 2;
    }

    if (/2\. bundesliga/i.test(league)) {
      return 12;
    }

    return 20;
  }

  const position = priorityCountries.indexOf(country);

  return position === -1
    ? 100
    : position + 20;
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

    new Date(a.date).getTime() -
    new Date(b.date).getTime()
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

  const pageCount = Math.max(
    1,
    Math.min(
      MAX_PAGES,
      Math.ceil(total / PAGE_SIZE)
    )
  );

  for (let start = 1; start < pageCount; start += 3) {
    const count = Math.min(
      3,
      pageCount - start
    );

    const pages = await Promise.all(
      Array.from(
        { length: count },
        (_, i) => apiGet('/matches', {
          date,
          limit: PAGE_SIZE,
          offset: (start + i) * PAGE_SIZE
        }, key)
      )
    );

    for (const page of pages) {
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
      m => !isExcluded(m)
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
      cacheSeconds: TTL.matches
    }
  };
}

async function cachedApi(
  cacheName,
  seconds,
  ctx,
  loader
) {
  const cache = caches.default;

  const cacheKey = new Request(
    'https://zirve90-cache.internal/v2/' +
    cacheName
  );

  const cached = await cache.match(cacheKey);

  if (cached) {
    return cached;
  }

  const data = await loader();

  const response = json(data, 200, {
    'Cache-Control':
      'public, max-age=' + seconds
  });

  ctx.waitUntil(
    cache.put(cacheKey, response.clone())
  );

  return response;
}

function idFrom(url, paramName, fallback = 'id') {
  return url.searchParams.get(paramName) ||
    url.searchParams.get(fallback) ||
    '';
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    const path = url.pathname.replace(
      /\/$/, ''
    ) || '/';

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
        error: 'Sayfa bulunamadi'
      }, 404);
    }

    if (!env.HIGHLIGHTLY_API_KEY) {
      return json({
        error: 'API anahtari eksik'
      }, 500);
    }

    const key = env.HIGHLIGHTLY_API_KEY;

    try {
      // MAC LISTESI

      if (path === '/matches') {
        const date =
          url.searchParams.get('date') ||
          new Date().toISOString().slice(0, 10);

        if (!validDate(date)) {
          return json({
            error: 'Gecersiz tarih. YYYY-MM-DD olmali'
          }, 400);
        }

        return cachedApi(
          'matches?date=' + date,
          TTL.matches,
          ctx,
          () => getMatches(date, key)
        );
      }

      // MAC DETAYI, KADRO, ISTATISTIK, OLAYLAR

      if ([
        '/match',
        '/lineups',
        '/statistics',
        '/events'
      ].includes(path)) {
        const id = idFrom(url, 'matchId');

        if (!validId(id)) {
          return json({
            error: 'Gecerli matchId gerekli'
          }, 400);
        }

        const spec = {
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
        }[path];

        return cachedApi(
          path.slice(1) + '?id=' + id,
          spec[1],
          ctx,
          () => apiGet(spec[0], {}, key)
        );
      }

      // LIGLER

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
            error: 'Lig adi veya ulke kodu gerekli'
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
            error: 'Gecersiz lig veya ulke'
          }, 400);
        }

        if (season && !validSeason(season)) {
          return json({
            error: 'Gecersiz sezon'
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

        const qs = new URLSearchParams(
          params
        ).toString();

        return cachedApi(
          'leagues?' + qs,
          TTL.leagues,
          ctx,
          () => apiGet(
            '/leagues',
            params,
            key
          )
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
            error:
              'Gecerli leagueId ve season gerekli'
          }, 400);
        }

        return cachedApi(
          'standings?leagueId=' +
            leagueId +
            '&season=' +
            season,
          TTL.standings,
          ctx,
          () => apiGet(
            '/standings',
            { leagueId, season },
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
            error: 'Gecerli leagueId gerekli'
          }, 400);
        }

        if (
          season &&
          !validSeason(season)
        ) {
          return json({
            error: 'Gecersiz sezon'
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

        return cachedApi(
          'teams?' +
            new URLSearchParams(params),
          TTL.teams,
          ctx,
          () => apiGet(
            '/teams',
            params,
            key
          )
        );
      }

      // OYUNCU PROFILI VE ISTATISTIKLERI

      if (
        path === '/player' ||
        path === '/player-statistics'
      ) {
        const playerId = idFrom(
          url,
          'playerId'
        );

        if (!validId(playerId)) {
          return json({
            error: 'Gecerli playerId gerekli'
          }, 400);
        }

        const isStats =
          path === '/player-statistics';

        const apiPath =
          '/players/' +
          playerId +
          (isStats ? '/statistics' : '');

        const ttl = isStats
          ? TTL.playerStats
          : TTL.player;

        return cachedApi(
          path.slice(1) +
            '?id=' +
            playerId,
          ttl,
          ctx,
          () => apiGet(
            apiPath,
            {},
            key
          )
        );
      }

      return json({
        error: 'Sayfa bulunamadi'
      }, 404);

    } catch (error) {
      const status =
        error instanceof UpstreamError
          ? error.status
          : 0;

      return json({
        error: status === 429
          ? 'API gunluk istek limiti dolmus olabilir'
          : 'API verileri alinamadi',

        detail: status
          ? 'Highlightly HTTP ' + status
          : 'Baglanti hatasi'
      }, status === 429 ? 429 : 502);
    }
  }
};
