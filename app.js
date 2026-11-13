
'use strict';

// ZIRVE90 - APP.JS
// BOLUM 1 / 6

const API_BASE =
  'https://zirve90-api.yrdk92.workers.dev';

const root = document.getElementById('app');

const COUNTRIES = [
  ['TR', 'Türkiye', '🇹🇷'],
  ['DE', 'Almanya', '🇩🇪'],
  ['GB', 'İngiltere', '🏴'],
  ['ES', 'İspanya', '🇪🇸'],
  ['IT', 'İtalya', '🇮🇹'],
  ['FR', 'Fransa', '🇫🇷'],
  ['NL', 'Hollanda', '🇳🇱'],
  ['PT', 'Portekiz', '🇵🇹'],
  ['BE', 'Belçika', '🇧🇪'],
  ['GR', 'Yunanistan', '🇬🇷'],
  ['AT', 'Avusturya', '🇦🇹'],
  ['CH', 'İsviçre', '🇨🇭'],
  ['SA', 'Suudi Arabistan', '🇸🇦'],
  ['US', 'ABD', '🇺🇸'],
  ['BR', 'Brezilya', '🇧🇷'],
  ['AR', 'Arjantin', '🇦🇷']
];

function read(key, fallback = '') {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function dataOf(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.response)) {
    return value.response;
  }
  return [];
}

function today(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1)
    .padStart(2, '0');
  const day = String(d.getDate())
    .padStart(2, '0');

  return `${y}-${m}-${day}`;
}

function dateLabel(value) {
  const d = new Date(value + 'T12:00:00');

  if (Number.isNaN(d.getTime())) {
    return value;
  }

  return d.toLocaleDateString('tr-TR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
}

function timeLabel(value) {
  if (!value) return '--:--';

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return String(value).slice(11, 16) || '--:--';
  }

  return d.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function countryInfo(code) {
  return COUNTRIES.find(x => x[0] === code) ||
    [code || '', code || 'Dünya', '🌍'];
}

function flag(code) {
  return countryInfo(code)[2];
}

function countryCode(m) {
  return String(
    m.country?.code ||
    m.league?.country?.code ||
    ''
  ).toUpperCase();
}

function leagueName(m) {
  return m.league?.name || 'Diğer Ligler';
}

function leagueId(m) {
  return String(
    m.league?.id ||
    m.leagueId ||
    ''
  );
}

function matchId(m) {
  return String(
    m.id ?? m.fixture?.id ?? ''
  );
}

function homeTeam(m) {
  return m.homeTeam || m.teams?.home || {};
}

function awayTeam(m) {
  return m.awayTeam || m.teams?.away || {};
}

function teamId(team) {
  return String(team?.id ?? '');
}

function teamName(team) {
  return team?.name || 'Takım';
}

function teamLogo(team) {
  return team?.logo ||
    team?.image ||
    team?.crest ||
    '';
}

function safeImage(url, className = 'team-logo') {
  if (!url || !/^https:\/\//i.test(String(url))) {
    return `<span class="${className} placeholder-logo">⚽</span>`;
  }

  return `<img
    class="${className}"
    src="${esc(url)}"
    alt=""
    loading="lazy"
    referrerpolicy="no-referrer"
    onerror="this.style.display='none'"
  >`;
}

function statusCode(m) {
  return String(
    m.status?.short ||
    m.status?.type ||
    m.status?.code ||
    m.status ||
    ''
  ).toUpperCase();
}

function isLive(m) {
  const s = statusCode(m);

  return [
    'LIVE', '1H', '2H', 'HT', 'ET',
    'P', 'IN_PLAY', 'IN PROGRESS'
  ].some(x => s === x || s.includes(x));
}

function isFinished(m) {
  const s = statusCode(m);

  return [
    'FT', 'AET', 'PEN',
    'FINISHED', 'COMPLETED'
  ].some(x => s === x || s.includes(x));
}

function scoreOf(m, side) {
  const score = m.score || m.goals || {};

  const team = side === 'home'
    ? homeTeam(m)
    : awayTeam(m);

  const value = side === 'home'
    ? score.home ??
      score.fullTime?.home ??
      team.score
    : score.away ??
      score.fullTime?.away ??
      team.score;

  if (value && typeof value === 'object') {
    return value.current ??
      value.total ??
      '-';
  }

  return value ?? '-';
}

function matchStatus(m) {
  if (isLive(m)) {
    const minute =
      m.elapsed ||
      m.status?.elapsed ||
      m.minute ||
      '';

    return minute
      ? `${minute}' CANLI`
      : 'CANLI';
  }

  if (isFinished(m)) return 'MS';

  const s = statusCode(m);

  if (s === 'HT') return 'DEVRE';
  if (s === 'PST') return 'ERT.';
  if (s === 'CANC') return 'İPTAL';

  return timeLabel(
    m.date || m.fixture?.date
  );
}

function currentSeason() {
  const d = new Date();

  return d.getMonth() >= 6
    ? d.getFullYear()
    : d.getFullYear() - 1;
}

function leaguePriority(m) {
  const country = countryCode(m);
  const name = leagueName(m).toLowerCase();

  if (
    country === 'TR' &&
    /süper lig|super lig/.test(name)
  ) return 0;

  if (
    country === 'TR' &&
    /1\. lig/.test(name)
  ) return 1;

  if (
    country === 'DE' &&
    name === 'bundesliga'
  ) return 2;

  if (
    country === 'GB' &&
    /premier league/.test(name)
  ) return 3;

  if (
    country === 'ES' &&
    /la liga|primera división/.test(name)
  ) return 4;

  if (
    country === 'IT' &&
    /serie a/.test(name)
  ) return 5;

  if (
    country === 'FR' &&
    /ligue 1/.test(name)
  ) return 6;

  const index = COUNTRIES.findIndex(
    c => c[0] === country
  );

  return index < 0
    ? 100
    : index + 20;
}

function isExcludedName(name) {
  return /women|female|frauen|femenin|feminin|femminil|u17|u18|u19|u20|u21|u23|youth|reserve|academy|primavera/i
    .test(String(name || ''));
}

function leagueScore(league) {
  const name = String(
    league.name || ''
  ).toLowerCase();

  if (/super cup|süper kupa|community shield/.test(name)) {
    return 50;
  }

  if (/cup|kupa|pokal|copa|coupe|coppa/.test(name)) {
    return 40;
  }

  if (/champions league|europa league/.test(name)) {
    return 15;
  }

  if (/süper lig|super lig|premier league|bundesliga|la liga|serie a|ligue 1|eredivisie|primeira liga|pro league|super league/.test(name)) {
    return 0;
  }

  if (/1\. lig|2\. bundesliga|championship|segunda|serie b|ligue 2/.test(name)) {
    return 5;
  }

  return 20;
}

/* =====================================
   ZIRVE90 - BOLUM 2 / 6
   API, ANA EKRAN, MAC LISTESI
===================================== */

async function api(path, params = {}) {
  const url = new URL(API_BASE + path);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined &&
        value !== null &&
        value !== '') {
      url.searchParams.set(key, value);
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    18000
  );

  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error ||
        result.detail ||
        'API bağlantı hatası'
      );
    }

    return result;
  } finally {
    clearTimeout(timer);
  }
}

let favorites;

try {
  favorites = JSON.parse(
    read('zirve90-favorites-clean', '[]')
  );

  if (!Array.isArray(favorites)) {
    favorites = [];
  }
} catch {
  favorites = [];
}

const state = {
  page: 'home',
  dateOffset: 0,
  matches: [],
  loading: false,
  error: '',
  country: read('zirve90-country', 'TR'),
  filter: 'all',
  search: '',
  selectedMatch: null,
  matchTab: 'Genel',
  detailData: {},
  detailLoading: false,
  detailError: '',
  standingsCountry: 'TR',
  standingsLeague: '',
  standingsSeason: currentSeason(),
  standingsLeagues: [],
  standingsGroups: [],
  standingsLoading: false,
  standingsError: '',
  selectedPlayer: null,
  playerData: null,
  playerLoading: false,
  menu: false
};

let matchToken = 0;
let standingsToken = 0;
let listToken = 0;
let playerToken = 0;

const detailCache = new Map();

function isFavorite(m) {
  return favorites.includes(matchId(m));
}

function toggleFavorite(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter(x => x !== id);
  } else {
    favorites.push(id);
  }

  save(
    'zirve90-favorites-clean',
    JSON.stringify(favorites)
  );

  render();
}

function loadingHtml(text = 'Yükleniyor...') {
  return `
    <div class="z-loading">
      <div class="z-spinner"></div>
      <span>${esc(text)}</span>
    </div>
  `;
}

function emptyHtml(text) {
  return `
    <div class="z-empty">
      <div class="z-empty-icon">⚽</div>
      <p>${esc(text)}</p>
    </div>
  `;
}

function header() {
  return `
    <header class="z-header">
      <button class="z-icon-btn"
        data-action="menu">☰</button>

      <button class="z-brand"
        data-page="home">
        <span class="z-brand-icon">Z</span>
        <span>ZİRVE<b>90</b></span>
      </button>

      <div class="z-header-right">
        <span class="z-live-dot"></span>
        <span>FUTBOL</span>
      </div>
    </header>

    ${state.menu ? `
      <div class="z-overlay"
        data-action="close-menu"></div>

      <aside class="z-menu">
        <div class="z-menu-title">ZİRVE90</div>

        <button data-page="home">
          ⚽ Canlı Skor
        </button>

        <button data-page="favorites">
          ⭐ Favoriler
        </button>

        <button data-page="standings">
          🏆 Puan Durumu
        </button>

        <button data-page="leagues">
          🌍 Ligler
        </button>

        <button data-page="news">
          📰 Haberler
        </button>

        <button data-page="videos">
          ▶ Videolar
        </button>

        <button data-action="close-menu">
          ✕ Kapat
        </button>
      </aside>
    ` : ''}
  `;
}

function navigation() {
  const tabs = [
    ['home', '⚽', 'Maçlar'],
    ['favorites', '☆', 'Favoriler'],
    ['standings', '🏆', 'Puan'],
    ['leagues', '🌍', 'Ligler']
  ];

  return `
    <nav class="z-bottom-nav">
      ${tabs.map(([id, icon, name]) => `
        <button
          class="${state.page === id ? 'active' : ''}"
          data-page="${id}">
          <span>${icon}</span>
          <small>${name}</small>
        </button>
      `).join('')}
    </nav>
  `;
}

function dateStrip() {
  const days = [];

  for (let i = -3; i <= 3; i++) {
    const offset = state.dateOffset + i;

    days.push(`
      <button
        class="z-day ${i === 0 ? 'active' : ''}"
        data-offset="${offset}">
        <small>
          ${offset === 0
            ? 'SEÇİLİ'
            : dateLabel(today(offset)).split(' ')[0]}
        </small>
        <strong>${today(offset).slice(8)}</strong>
      </button>
    `);
  }

  return `
    <div class="z-date-nav">
      <button data-action="prev-day">‹</button>

      <div class="z-days">
        ${days.join('')}
      </div>

      <button data-action="next-day">›</button>
    </div>

    <div class="z-date-caption">
      <strong>
        ${esc(dateLabel(today(state.dateOffset)))}
      </strong>

      <button data-action="today">
        Bugün
      </button>
    </div>
  `;
}

function matchCard(m) {
  const h = homeTeam(m);
  const a = awayTeam(m);
  const id = matchId(m);

  const live = isLive(m);
  const played = live || isFinished(m);

  return `
    <div class="z-match">
      <button
        class="z-match-main"
        data-match="${esc(id)}">

        <span class="z-match-time ${live ? 'live' : ''}">
          ${esc(matchStatus(m))}
        </span>

        <div class="z-match-teams">
          <div class="z-team-line">
            ${safeImage(teamLogo(h))}
            <span>${esc(teamName(h))}</span>
          </div>

          <div class="z-team-line">
            ${safeImage(teamLogo(a))}
            <span>${esc(teamName(a))}</span>
          </div>
        </div>

        <div class="z-match-scores ${live ? 'live' : ''}">
          <strong>
            ${played ? esc(scoreOf(m, 'home')) : '-'}
          </strong>
          <strong>
            ${played ? esc(scoreOf(m, 'away')) : '-'}
          </strong>
        </div>
      </button>

      <button
        class="z-fav ${isFavorite(m) ? 'selected' : ''}"
        data-favorite="${esc(id)}">
        ${isFavorite(m) ? '★' : '☆'}
      </button>
    </div>
  `;
}

function matchGroups(matches) {
  const groups = new Map();

  const sorted = [...matches].sort((a, b) =>
    leaguePriority(a) - leaguePriority(b) ||
    leagueName(a).localeCompare(leagueName(b)) ||
    String(a.date || '').localeCompare(
      String(b.date || '')
    )
  );

  for (const m of sorted) {
    const key =
      `${countryCode(m)}:${leagueId(m)}:${leagueName(m)}`;

    if (!groups.has(key)) {
      groups.set(key, {
        name: leagueName(m),
        country: countryCode(m),
        matches: []
      });
    }

    groups.get(key).matches.push(m);
  }

  return [...groups.values()].map(group => `
    <section class="z-league-group">
      <div class="z-league-head">
        <span class="z-league-flag">
          ${flag(group.country)}
        </span>

        <strong>${esc(group.name)}</strong>

        <span class="z-league-count">
          ${group.matches.length}
        </span>
      </div>

      ${group.matches.map(matchCard).join('')}
    </section>
  `).join('');
}

function filteredMatches() {
  let matches = state.matches;

  if (state.page === 'favorites') {
    matches = matches.filter(isFavorite);
  }

  if (state.filter === 'live') {
    matches = matches.filter(isLive);
  }

  if (state.filter === 'finished') {
    matches = matches.filter(isFinished);
  }

  if (state.search.trim()) {
    const q = state.search.toLocaleLowerCase('tr');

    matches = matches.filter(m => [
      teamName(homeTeam(m)),
      teamName(awayTeam(m)),
      leagueName(m),
      m.country?.name
    ].join(' ')
      .toLocaleLowerCase('tr')
      .includes(q)
    );
  }

  return matches;
}

function homePage() {
  const matches = filteredMatches();

  const liveCount = state.matches
    .filter(isLive).length;

  return `
    <section class="z-page">
      <div class="z-section-heading">
        <div>
          <h1>
            ${state.page === 'favorites'
              ? 'Favori Maçlar'
              : 'Canlı Skor'}
          </h1>
          <p>Dünyanın futbol maçları</p>
        </div>

        <span class="z-live-pill">
          ● ${liveCount} CANLI
        </span>
      </div>

      ${dateStrip()}

      <div class="z-filter-row">
        <button
          class="${state.filter === 'all' ? 'active' : ''}"
          data-filter="all">
          Tümü
        </button>

        <button
          class="${state.filter === 'live' ? 'active' : ''}"
          data-filter="live">
          🔴 Canlı
        </button>

        <button
          class="${state.filter === 'finished' ? 'active' : ''}"
          data-filter="finished">
          Biten
        </button>
      </div>

      <div class="z-search-wrap">
        <input
          id="z-search"
          placeholder="Takım veya lig ara..."
          value="${esc(state.search)}">
      </div>

      ${state.loading
        ? loadingHtml('Maçlar yükleniyor...')
        : state.error
          ? `
            <div class="z-error">
              ${esc(state.error)}
              <button data-action="reload">
                Tekrar dene
              </button>
            </div>
          `
          : matches.length
            ? matchGroups(matches)
            : emptyHtml(
                state.page === 'favorites'
                  ? 'Bu tarihte favori maç bulunamadı.'
                  : 'Seçilen tarihte maç bulunamadı.'
              )
      }
    </section>
  `;
}

async function loadMatches() {
  const token = ++listToken;

  state.loading = true;
  state.error = '';

  render();

  try {
    const result = await api('/matches', {
      date: today(state.dateOffset)
    });

    if (token !== listToken) return;

    state.matches = dataOf(result);
    state.loading = false;
  } catch (error) {
    if (token !== listToken) return;

    state.loading = false;
    state.error = error.message;
  }

  render();
}

/* =====================================
   ZIRVE90 - BOLUM 3 / 6
   MAC DETAYLARI VE CANLI ANLATIM
===================================== */

function backButton() {
  return `
    <button class="z-back" data-action="back">
      ‹ Geri
    </button>
  `;
}

function detailHeader(m) {
  const h = homeTeam(m);
  const a = awayTeam(m);
  const played = isLive(m) || isFinished(m);

  return `
    <div class="z-detail-top">
      <div class="z-detail-league">
        ${flag(countryCode(m))}
        ${esc(leagueName(m))}
      </div>

      <div class="z-scoreboard">
        <div class="z-score-team">
          ${safeImage(teamLogo(h), 'z-big-logo')}
          <strong>${esc(teamName(h))}</strong>
        </div>

        <div class="z-center-score">
          <div class="z-score-number">
            ${played ? esc(scoreOf(m, 'home')) : '-'}
            <span>:</span>
            ${played ? esc(scoreOf(m, 'away')) : '-'}
          </div>

          <span class="${isLive(m) ? 'z-live-label' : ''}">
            ${esc(matchStatus(m))}
          </span>
        </div>

        <div class="z-score-team">
          ${safeImage(teamLogo(a), 'z-big-logo')}
          <strong>${esc(teamName(a))}</strong>
        </div>
      </div>

      <div class="z-match-date">
        ${esc(
          dateLabel(
            String(
              m.date || m.fixture?.date || today()
            ).slice(0, 10)
          )
        )}
      </div>
    </div>
  `;
}

const MATCH_TABS = [
  'Genel',
  'Kadro',
  'İstatistik',
  'Anlatım',
  'Puan Durumu'
];

function matchTabs() {
  return `
    <div class="z-tabs">
      ${MATCH_TABS.map(tab => `
        <button
          class="${state.matchTab === tab ? 'active' : ''}"
          data-match-tab="${esc(tab)}">
          ${esc(tab)}
        </button>
      `).join('')}
    </div>
  `;
}

function unwrapDetail(result) {
  if (Array.isArray(result?.data)) {
    return result.data[0] || {};
  }

  return result?.data ||
    result?.response ||
    result ||
    {};
}

function getEvents() {
  return dataOf(state.detailData.events);
}

function eventType(e) {
  return String(
    e.type || e.detail || ''
  ).toLowerCase();
}

function eventIcon(e) {
  const type = eventType(e);

  if (/goal|penalty scored/.test(type)) {
    return '⚽';
  }

  if (/red/.test(type)) {
    return '🟥';
  }

  if (/yellow/.test(type)) {
    return '🟨';
  }

  if (/substitution/.test(type)) {
    return '🔄';
  }

  if (/var/.test(type)) {
    return '📺';
  }

  return '•';
}

function eventText(e) {
  const parts = [];

  if (e.player?.name) {
    parts.push(e.player.name);
  } else if (typeof e.player === 'string') {
    parts.push(e.player);
  }

  if (e.assist?.name) {
    parts.push('Asist: ' + e.assist.name);
  } else if (typeof e.assist === 'string') {
    parts.push('Asist: ' + e.assist);
  }

  if (e.substituted?.name) {
    parts.push('Çıkan: ' + e.substituted.name);
  } else if (typeof e.substituted === 'string') {
    parts.push('Çıkan: ' + e.substituted);
  }

  return parts.join(' · ') ||
    e.detail ||
    e.type ||
    'Maç olayı';
}

function eventList(events, limit = 100) {
  if (!events.length) {
    return emptyHtml(
      'Bu maç için henüz olay verisi yok.'
    );
  }

  return `
    <div class="z-events">
      ${events.slice(0, limit).map(e => `
        <div class="z-event">
          <span class="z-event-time">
            ${esc(e.time || e.minute || '')}'
          </span>

          <span class="z-event-icon">
            ${eventIcon(e)}
          </span>

          <div>
            <strong>
              ${esc(e.type || 'Olay')}
            </strong>

            <p>${esc(eventText(e))}</p>

            <small>
              ${esc(e.team?.name || '')}
            </small>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function generalTab(m) {
  const events = getEvents();

  const detail = unwrapDetail(
    state.detailData.match
  );

  const venue =
    detail.venue?.name ||
    detail.stadium?.name ||
    m.venue?.name ||
    m.stadium?.name ||
    '';

  const referee =
    detail.referee?.name ||
    detail.referee ||
    m.referee?.name ||
    '';

  return `
    <div class="z-content-card">
      <h3>Maç Özeti</h3>

      <div class="z-info-line">
        <span>Durum</span>
        <strong>${esc(matchStatus(m))}</strong>
      </div>

      ${venue ? `
        <div class="z-info-line">
          <span>Stadyum</span>
          <strong>${esc(venue)}</strong>
        </div>
      ` : ''}

      ${referee ? `
        <div class="z-info-line">
          <span>Hakem</span>
          <strong>${esc(referee)}</strong>
        </div>
      ` : ''}
    </div>

    <div class="z-content-card">
      <h3>Önemli Anlar</h3>
      ${eventList(events, 12)}
    </div>
  `;
}

function commentaryTab() {
  return `
    <div class="z-content-card">
      <h3>Maç Anlatımı</h3>
      ${eventList(getEvents())}
    </div>
  `;
}

function matchPage() {
  const m = state.selectedMatch;

  if (!m) {
    return emptyHtml('Maç bulunamadı.');
  }

  let content;

  if (state.detailLoading) {
    content = loadingHtml(
      'Maç bilgileri yükleniyor...'
    );
  } else {
    switch (state.matchTab) {
      case 'Kadro':
        content = lineupTab(m);
        break;

      case 'İstatistik':
        content = statsTab(m);
        break;

      case 'Anlatım':
        content = commentaryTab();
        break;

      case 'Puan Durumu':
        content = matchStandingsTab(m);
        break;

      default:
        content = generalTab(m);
    }
  }

  return `
    <section class="z-page">
      ${backButton()}
      ${detailHeader(m)}
      ${matchTabs()}

      ${state.detailError ? `
        <div class="z-notice">
          ${esc(state.detailError)}
        </div>
      ` : ''}

      <div class="z-tab-content">
        ${content}
      </div>
    </section>
  `;
}

async function loadMatchDetail(m) {
  const token = ++matchToken;

  state.detailLoading = true;
  state.detailError = '';
  state.detailData = {};

  render();

  const id = matchId(m);

  const endpoints = [
    ['match', '/match'],
    ['lineups', '/lineups'],
    ['statistics', '/statistics'],
    ['events', '/events']
  ];

  const results = await Promise.allSettled(
    endpoints.map(async ([name, path]) => {
      const key = `${name}:${id}`;

      if (detailCache.has(key)) {
        return [
          name,
          detailCache.get(key)
        ];
      }

      const result = await api(path, {
        matchId: id
      });

      detailCache.set(key, result);

      return [name, result];
    })
  );

  if (token !== matchToken) {
    return;
  }

  let errors = 0;

  for (const result of results) {
    if (result.status === 'fulfilled') {
      const [name, value] = result.value;

      state.detailData[name] = value;
    } else {
      errors++;
    }
  }

  state.detailLoading = false;

  if (errors) {
    state.detailError =
      'Bazı maç bilgileri API tarafından sağlanamadı.';
  }

  render();
}

/* =====================================
   ZIRVE90 - BOLUM 4 / 6
   KADROLAR, 3D SAHA, ISTATISTIKLER
===================================== */

function getLineupSides() {
  const raw = state.detailData.lineups;
  const d = raw?.data ?? raw?.response ?? raw;

  if (Array.isArray(d)) {
    return {
      home: d[0] || {},
      away: d[1] || {}
    };
  }

  return {
    home:
      d?.home ||
      d?.homeTeam ||
      d?.lineups?.home ||
      {},
    away:
      d?.away ||
      d?.awayTeam ||
      d?.lineups?.away ||
      {}
  };
}

function lineupPlayers(side) {
  const source =
    side.startingXI ||
    side.startXI ||
    side.startingLineup ||
    side.starting ||
    side.players ||
    [];

  return arr(source).map(item => {
    const p = item.player || item;

    return {
      id: p.id ?? item.playerId ?? '',
      name: p.name || item.name || '',
      number:
        p.number ??
        p.shirtNumber ??
        item.number ??
        '',
      photo:
        p.photo ||
        p.image ||
        item.photo ||
        '',
      position:
        p.position ||
        item.position ||
        '',
      grid:
        p.grid ||
        item.grid ||
        '',
      x: p.x ?? item.x,
      y: p.y ?? item.y
    };
  });
}

function playerButton(p) {
  return `
    <button
      class="z-pitch-player"
      ${p.id
        ? `data-player="${esc(p.id)}"`
        : 'disabled'}>

      ${safeImage(
        p.photo,
        'z-player-photo'
      )}

      <span class="z-player-number">
        ${esc(p.number)}
      </span>

      <small>
        ${esc(
          p.name.split(' ').slice(-1)[0] ||
          'Oyuncu'
        )}
      </small>
    </button>
  `;
}

function pitchPositions(players, reverse = false) {
  if (!players.length) return '';

  return players.map((p, index) => {
    let x;
    let y;

    if (
      p.grid &&
      /^\d+:\d+$/.test(String(p.grid))
    ) {
      const [row, col] = String(p.grid)
        .split(':')
        .map(Number);

      const sameRow = players.filter(
        item => String(item.grid || '')
          .startsWith(row + ':')
      );

      const maxCol = Math.max(
        1,
        ...sameRow.map(item =>
          Number(
            String(item.grid).split(':')[1]
          ) || 1
        )
      );

      x = (col / (maxCol + 1)) * 100;
      y = ((row - 1) / 4) * 100;

    } else if (
      p.x != null &&
      p.y != null &&
      Number.isFinite(Number(p.x)) &&
      Number.isFinite(Number(p.y))
    ) {
      x = Number(p.x);
      y = Number(p.y);

    } else {
      const row = index === 0
        ? 0
        : index <= 4
          ? 1
          : index <= 8
            ? 2
            : 3;

      const rowPlayers = players
        .map((item, i) => ({ item, i }))
        .filter(v => {
          const r = v.i === 0
            ? 0
            : v.i <= 4
              ? 1
              : v.i <= 8
                ? 2
                : 3;

          return r === row;
        });

      const position = rowPlayers.findIndex(
        v => v.i === index
      );

      x = (
        (position + 1) /
        (rowPlayers.length + 1)
      ) * 100;

      y = [9, 33, 63, 88][row];
    }

    x = Math.max(8, Math.min(92, x));
    y = Math.max(
      8,
      Math.min(
        92,
        reverse ? 100 - y : y
      )
    );

    return `
      <div
        class="z-player-position"
        style="left:${x}%;top:${y}%">
        ${playerButton(p)}
      </div>
    `;
  }).join('');
}

function pitchSide(side, team, reverse = false) {
  const players = lineupPlayers(side);
  const formation = side.formation || '';

  if (!players.length) {
    return `
      <div class="z-content-card">
        <h3>${esc(teamName(team))}</h3>

        ${emptyHtml(
          'Bu takımın ilk 11 bilgisi henüz mevcut değil.'
        )}
      </div>
    `;
  }

  return `
    <div class="z-pitch-section">
      <div class="z-pitch-title">
        ${safeImage(teamLogo(team))}

        <strong>
          ${esc(teamName(team))}
        </strong>

        <span>
          ${esc(formation)}
        </span>
      </div>

      <div class="z-stadium">
        <div class="z-floodlight left"></div>
        <div class="z-floodlight right"></div>

        <div class="z-pitch-perspective">
          <div class="z-pitch-field">
            <div class="z-pitch-half"></div>
            <div class="z-pitch-circle"></div>
            <div class="z-pitch-box top"></div>
            <div class="z-pitch-box bottom"></div>

            ${pitchPositions(
              players,
              reverse
            )}
          </div>
        </div>
      </div>
    </div>
  `;
}

function lineupTab(m) {
  const sides = getLineupSides();

  const homePlayers = lineupPlayers(
    sides.home
  );

  const awayPlayers = lineupPlayers(
    sides.away
  );

  if (
    !homePlayers.length &&
    !awayPlayers.length
  ) {
    return emptyHtml(
      'Bu maçın kadroları henüz API tarafından yayınlanmadı.'
    );
  }

  return `
    <div class="z-pitch-note">
      Oyuncuya dokunarak profilini açabilirsin.
    </div>

    ${pitchSide(
      sides.home,
      homeTeam(m)
    )}

    ${pitchSide(
      sides.away,
      awayTeam(m),
      true
    )}
  `;
}

function statisticEntries() {
  const raw = state.detailData.statistics;

  const d =
    raw?.data ??
    raw?.response ??
    raw;

  if (
    Array.isArray(d) &&
    d.length >= 2
  ) {
    const h =
      d[0]?.statistics ||
      d[0]?.stats;

    const a =
      d[1]?.statistics ||
      d[1]?.stats;

    if (
      Array.isArray(h) &&
      Array.isArray(a)
    ) {
      return h.map(item => {
        const other = a.find(
          x =>
            x.type === item.type ||
            x.name === item.name
        );

        return {
          name:
            item.type ||
            item.name,
          home:
            item.value ?? '-',
          away:
            other?.value ?? '-'
        };
      });
    }
  }

  if (Array.isArray(d)) {
    return d.filter(x =>
      x &&
      (
        x.home !== undefined ||
        x.away !== undefined
      )
    ).map(x => ({
      name:
        x.name ||
        x.type ||
        x.label,
      home: x.home,
      away: x.away
    }));
  }

  if (Array.isArray(d?.statistics)) {
    return d.statistics.map(x => ({
      name:
        x.name ||
        x.type ||
        x.label,
      home:
        x.home ??
        x.homeValue,
      away:
        x.away ??
        x.awayValue
    }));
  }

  return [];
}

function statsTab(m) {
  const stats = statisticEntries();

  if (!stats.length) {
    return emptyHtml(
      'Bu maç için istatistik verisi henüz bulunmuyor.'
    );
  }

  return `
    <div class="z-content-card">
      <div class="z-stats-head">
        <strong>
          ${esc(teamName(homeTeam(m)))}
        </strong>

        <strong>
          ${esc(teamName(awayTeam(m)))}
        </strong>
      </div>

      ${stats.map(item => {
        const h = parseFloat(item.home) || 0;
        const a = parseFloat(item.away) || 0;

        const total = h + a;

        const percentage = total
          ? h / total * 100
          : 50;

        return `
          <div class="z-stat">
            <div class="z-stat-label">
              <strong>
                ${esc(item.home ?? '-')}
              </strong>

              <span>
                ${esc(item.name)}
              </span>

              <strong>
                ${esc(item.away ?? '-')}
              </strong>
            </div>

            <div class="z-stat-track">
              <div
                style="width:${percentage}%">
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/* =====================================
   ZIRVE90 - BOLUM 5 / 6
   PUAN DURUMU, LIGLER, OYUNCULAR
===================================== */

function standingsTable(groups, highlightIds = []) {
  if (!groups.length) {
    return emptyHtml(
      'Bu lig için puan durumu bulunamadı.'
    );
  }

  return groups.map(group => {
    const rows = arr(group.standings);

    return `
      <div class="z-content-card z-table-card">
        ${group.name
          ? `<h3>${esc(group.name)}</h3>`
          : ''}

        <div class="z-table-scroll">
          <table class="z-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Takım</th>
                <th>O</th>
                <th>G</th>
                <th>B</th>
                <th>M</th>
                <th>AV</th>
                <th>P</th>
              </tr>
            </thead>

            <tbody>
              ${rows.map((row, index) => {
                const team = row.team || {};
                const total = row.total || {};

                const goalsFor =
                  Number(total.scoredGoals) || 0;

                const goalsAgainst =
                  Number(total.receivedGoals) || 0;

                const difference =
                  goalsFor - goalsAgainst;

                const highlighted =
                  highlightIds.includes(
                    String(team.id)
                  );

                return `
                  <tr class="${highlighted
                    ? 'z-highlight-row'
                    : ''}">

                    <td>
                      ${esc(row.position ?? index + 1)}
                    </td>

                    <td class="z-table-team">
                      ${safeImage(teamLogo(team))}
                      <span>
                        ${esc(teamName(team))}
                      </span>
                    </td>

                    <td>${esc(total.games ?? '-')}</td>
                    <td>${esc(total.wins ?? '-')}</td>
                    <td>${esc(total.draws ?? '-')}</td>
                    <td>${esc(total.loses ?? '-')}</td>

                    <td>
                      ${difference > 0 ? '+' : ''}
                      ${difference}
                    </td>

                    <td>
                      <b>${esc(row.points ?? '-')}</b>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }).join('');
}

function parseStandings(result) {
  const data =
    result?.data ??
    result?.response ??
    result;

  if (Array.isArray(data?.groups)) {
    return data.groups;
  }

  if (Array.isArray(data?.standings)) {
    return [{
      name: '',
      standings: data.standings
    }];
  }

  if (Array.isArray(data)) {
    if (data[0]?.standings) {
      return data;
    }

    if (data[0]?.team) {
      return [{
        name: '',
        standings: data
      }];
    }
  }

  return [];
}

async function loadMatchStandings(m) {
  const id = leagueId(m);

  if (!id) {
    state.detailData.matchStandings = [];
    render();
    return;
  }

  const season =
    m.league?.season ||
    m.season ||
    currentSeason();

  const key = `standings:${id}:${season}`;

  if (detailCache.has(key)) {
    state.detailData.matchStandings =
      detailCache.get(key);

    render();
    return;
  }

  try {
    const result = await api('/standings', {
      leagueId: id,
      season
    });

    const groups = parseStandings(result);

    detailCache.set(key, groups);

    if (
      state.selectedMatch &&
      matchId(state.selectedMatch) === matchId(m)
    ) {
      state.detailData.matchStandings = groups;
      render();
    }
  } catch {
    if (
      state.selectedMatch &&
      matchId(state.selectedMatch) === matchId(m)
    ) {
      state.detailData.matchStandings = [];
      render();
    }
  }
}

function matchStandingsTab(m) {
  const groups =
    state.detailData.matchStandings;

  if (groups === undefined) {
    return loadingHtml(
      'Puan durumu yükleniyor...'
    );
  }

  return standingsTable(groups, [
    teamId(homeTeam(m)),
    teamId(awayTeam(m))
  ]);
}

function leagueListOptions() {
  return state.standingsLeagues.map(league => `
    <option
      value="${esc(league.id)}"
      ${String(league.id) === state.standingsLeague
        ? 'selected'
        : ''}>
      ${esc(league.name)}
    </option>
  `).join('');
}

function standingsPage() {
  const year = currentSeason();

  const years = Array.from(
    { length: 5 },
    (_, index) => year - index
  );

  return `
    <section class="z-page">
      <div class="z-section-heading">
        <div>
          <h1>Puan Durumu</h1>
          <p>Ligler ve geçmiş sezonlar</p>
        </div>
      </div>

      <div class="z-select-panel">
        <label>Ülke</label>

        <select id="z-country">
          ${COUNTRIES.map(([code, name, emoji]) => `
            <option
              value="${code}"
              ${state.standingsCountry === code
                ? 'selected'
                : ''}>
              ${emoji} ${esc(name)}
            </option>
          `).join('')}
        </select>

        <label>Lig</label>

        <select
          id="z-league"
          ${!state.standingsLeagues.length
            ? 'disabled'
            : ''}>

          ${state.standingsLeagues.length
            ? leagueListOptions()
            : '<option>Lig bulunamadı</option>'}
        </select>

        <label>Sezon</label>

        <select id="z-season">
          ${years.map(y => `
            <option
              value="${y}"
              ${state.standingsSeason === y
                ? 'selected'
                : ''}>
              ${y} / ${y + 1}
            </option>
          `).join('')}
        </select>
      </div>

      ${state.standingsLoading
        ? loadingHtml('Puan durumu yükleniyor...')
        : state.standingsError
          ? `
            <div class="z-error">
              ${esc(state.standingsError)}

              <button data-action="reload-standings">
                Tekrar dene
              </button>
            </div>
          `
          : standingsTable(state.standingsGroups)
      }
    </section>
  `;
}

function extractLeagues(result) {
  return dataOf(result)
    .filter(league =>
      league &&
      league.id &&
      league.name
    )
    .filter(league =>
      !isExcludedName(league.name)
    )
    .sort((a, b) =>
      leagueScore(a) - leagueScore(b) ||
      String(a.name).localeCompare(
        String(b.name)
      )
    );
}

async function loadLeagues() {
  const token = ++standingsToken;

  state.standingsLoading = true;
  state.standingsError = '';
  state.standingsGroups = [];
  state.standingsLeagues = [];

  render();

  try {
    const result = await api('/leagues', {
      countryCode: state.standingsCountry
    });

    if (token !== standingsToken) {
      return;
    }

    state.standingsLeagues =
      extractLeagues(result);

    const leagueExists =
      state.standingsLeagues.some(
        league =>
          String(league.id) ===
          state.standingsLeague
      );

    if (!leagueExists) {
      state.standingsLeague = String(
        state.standingsLeagues[0]?.id || ''
      );
    }

    if (!state.standingsLeague) {
      state.standingsLoading = false;
      state.standingsError =
        'Bu ülke için lig bulunamadı.';

      render();
      return;
    }

    await loadStandings();

  } catch (error) {
    if (token !== standingsToken) {
      return;
    }

    state.standingsLoading = false;
    state.standingsError = error.message;

    render();
  }
}

async function loadStandings() {
  const token = ++standingsToken;

  state.standingsLoading = true;
  state.standingsError = '';
  state.standingsGroups = [];

  render();

  try {
    const result = await api('/standings', {
      leagueId: state.standingsLeague,
      season: state.standingsSeason
    });

    if (token !== standingsToken) {
      return;
    }

    state.standingsGroups =
      parseStandings(result);

    state.standingsLoading = false;

  } catch (error) {
    if (token !== standingsToken) {
      return;
    }

    state.standingsLoading = false;
    state.standingsError = error.message;
  }

  render();
}

function leaguesPage() {
  return `
    <section class="z-page">
      <h1>Futbol Ligleri</h1>

      <p class="z-muted">
        Ülke seçerek puan durumuna ulaş.
      </p>

      <div class="z-country-grid">
        ${COUNTRIES.map(([code, name, emoji]) => `
          <button
            data-standings-country="${code}">

            <span>${emoji}</span>

            <strong>${esc(name)}</strong>

            <small>Ligleri gör ›</small>
          </button>
        `).join('')}
      </div>
    </section>
  `;
}

function playerPage() {
  const player = state.selectedPlayer || {};

  const detail = unwrapDetail(
    state.playerData
  );

  return `
    <section class="z-page">
      <button
        class="z-back"
        data-action="back-match">
        ‹ Maça dön
      </button>

      <div class="z-player-profile">
        ${safeImage(
          detail.photo ||
          detail.image ||
          player.photo,
          'z-profile-photo'
        )}

        <h1>
          ${esc(
            detail.name ||
            player.name ||
            'Oyuncu'
          )}
        </h1>

        ${state.playerLoading
          ? loadingHtml('Oyuncu yükleniyor...')
          : `
            <div class="z-info-line">
              <span>Takım</span>
              <strong>
                ${esc(detail.team?.name || '-')}
              </strong>
            </div>

            <div class="z-info-line">
              <span>Mevki</span>
              <strong>
                ${esc(detail.position || '-')}
              </strong>
            </div>

            <div class="z-info-line">
              <span>Forma No.</span>
              <strong>
                ${esc(detail.number || '-')}
              </strong>
            </div>
          `}
      </div>
    </section>
  `;
}

async function loadPlayer(id) {
  const token = ++playerToken;

  state.playerLoading = true;
  state.playerData = null;

  render();

  try {
    const result = await api('/player', {
      playerId: id
    });

    if (token !== playerToken) {
      return;
    }

    state.playerData = result;

  } catch (error) {
    if (token !== playerToken) {
      return;
    }

    console.warn(
      'Oyuncu bilgisi alınamadı:',
      error.message
    );
  }

  state.playerLoading = false;
  render();
}

function placeholderPage(title) {
  return `
    <section class="z-page">
      <h1>${esc(title)}</h1>

      ${emptyHtml(
        'Bu bölüm sonraki geliştirme aşamasında eklenecek.'
      )}
    </section>
  `;
}

/* =====================================
   ZIRVE90 - BOLUM 6 / 6
   BUTONLAR, TASARIM, BASLATMA
===================================== */

function render() {
  if (!root) return;

  let content = '';

  switch (state.page) {
    case 'home':
    case 'favorites':
      content = homePage();
      break;

    case 'match':
      content = matchPage();
      break;

    case 'standings':
      content = standingsPage();
      break;

    case 'leagues':
      content = leaguesPage();
      break;

    case 'player':
      content = playerPage();
      break;

    case 'news':
      content = placeholderPage('Haberler');
      break;

    case 'videos':
      content = placeholderPage('Videolar');
      break;

    default:
      content = homePage();
  }

  root.innerHTML = `
    ${header()}
    <main class="z-main">
      ${content}
    </main>
    ${navigation()}
  `;
}

function go(page) {
  state.page = page;
  state.menu = false;
  state.search = '';
  state.filter = 'all';

  window.scrollTo(0, 0);

  render();

  if (
    page === 'standings' &&
    !state.standingsLeagues.length
  ) {
    loadLeagues();
  }
}

document.addEventListener('click', event => {
  const button = event.target.closest('button');

  if (!button) return;

  const page = button.dataset.page;
  const action = button.dataset.action;
  const match = button.dataset.match;
  const favorite = button.dataset.favorite;
  const filter = button.dataset.filter;
  const offset = button.dataset.offset;
  const tab = button.dataset.matchTab;
  const country = button.dataset.standingsCountry;
  const player = button.dataset.player;

  if (page) {
    go(page);
    return;
  }

  if (favorite) {
    toggleFavorite(favorite);
    return;
  }

  if (match) {
    const m = state.matches.find(
      item => matchId(item) === match
    );

    if (!m) return;

    state.selectedMatch = m;
    state.matchTab = 'Genel';
    state.page = 'match';

    window.scrollTo(0, 0);

    loadMatchDetail(m);
    return;
  }

  if (tab) {
    state.matchTab = tab;
    render();

    if (
      tab === 'Puan Durumu' &&
      state.detailData.matchStandings === undefined
    ) {
      loadMatchStandings(state.selectedMatch);
    }

    return;
  }

  if (filter) {
    state.filter = filter;
    render();
    return;
  }

  if (offset !== undefined) {
    state.dateOffset = Number(offset);
    loadMatches();
    return;
  }

  if (country) {
    state.standingsCountry = country;
    state.standingsLeague = '';

    go('standings');
    loadLeagues();
    return;
  }

  if (player) {
    state.selectedPlayer = {
      id: player
    };

    state.page = 'player';

    loadPlayer(player);
    return;
  }

  switch (action) {
    case 'menu':
      state.menu = !state.menu;
      render();
      break;

    case 'close-menu':
      state.menu = false;
      render();
      break;

    case 'prev-day':
      state.dateOffset--;
      loadMatches();
      break;

    case 'next-day':
      state.dateOffset++;
      loadMatches();
      break;

    case 'today':
      state.dateOffset = 0;
      loadMatches();
      break;

    case 'reload':
      loadMatches();
      break;

    case 'reload-standings':
      loadStandings();
      break;

    case 'back':
      go('home');
      break;

    case 'back-match':
      state.page = 'match';
      render();
      break;
  }
});

document.addEventListener('change', event => {
  const id = event.target.id;
  const value = event.target.value;

  if (id === 'z-country') {
    state.standingsCountry = value;
    state.standingsLeague = '';
    loadLeagues();
  }

  if (id === 'z-league') {
    state.standingsLeague = value;
    loadStandings();
  }

  if (id === 'z-season') {
    state.standingsSeason = Number(value);
    loadStandings();
  }
});

document.addEventListener('input', event => {
  if (event.target.id !== 'z-search') {
    return;
  }

  state.search = event.target.value;

  const input = event.target;
  const position = input.selectionStart;

  render();

  const next = document.getElementById('z-search');

  if (next) {
    next.focus();

    try {
      next.setSelectionRange(position, position);
    } catch {}
  }
});

const style = document.createElement('style');

style.textContent = `
:root {
  color-scheme: dark;
  --z-bg: #080c10;
  --z-card: #121a20;
  --z-border: #26333b;
  --z-green: #00e58b;
  --z-text: #f3f7f9;
  --z-muted: #91a2ad;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--z-bg);
  color: var(--z-text);
  font-family: -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
}

button, input, select {
  font: inherit;
}

button {
  cursor: pointer;
}

.z-header {
  height: 62px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: #10171c;
  border-bottom: 1px solid var(--z-border);
  position: sticky;
  top: 0;
  z-index: 50;
}

.z-icon-btn,
.z-brand {
  background: none;
  border: 0;
  color: white;
}

.z-icon-btn {
  font-size: 25px;
}

.z-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 21px;
  font-weight: 900;
}

.z-brand b {
  color: var(--z-green);
}

.z-brand-icon {
  background: var(--z-green);
  color: #06100c;
  border-radius: 9px;
  padding: 5px 10px;
}

.z-header-right {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.z-live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--z-green);
}

.z-main {
  max-width: 900px;
  margin: auto;
  padding-bottom: 90px;
}

.z-page {
  padding: 17px 13px;
}

.z-section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.z-section-heading h1,
.z-page h1 {
  margin: 0 0 5px;
  font-size: 25px;
}

.z-section-heading p,
.z-muted {
  margin: 0;
  color: var(--z-muted);
  font-size: 13px;
}

.z-live-pill {
  color: var(--z-green);
  font-size: 11px;
  font-weight: 900;
}

.z-date-nav {
  display: flex;
  align-items: center;
  gap: 5px;
}

.z-date-nav > button {
  background: var(--z-card);
  color: white;
  border: 1px solid var(--z-border);
  border-radius: 9px;
  padding: 12px 8px;
}

.z-days {
  display: flex;
  flex: 1;
  gap: 4px;
  overflow-x: auto;
}

.z-day {
  min-width: 49px;
  flex: 1;
  background: var(--z-card);
  color: white;
  border: 1px solid var(--z-border);
  border-radius: 9px;
  padding: 9px 4px;
}

.z-day.active {
  background: var(--z-green);
  color: #07120d;
}

.z-day small,
.z-day strong {
  display: block;
}

.z-day small {
  font-size: 9px;
}

.z-date-caption {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 13px 3px;
}

.z-date-caption button {
  background: none;
  color: var(--z-green);
  border: 0;
}

.z-filter-row {
  display: flex;
  gap: 8px;
  margin: 8px 0 14px;
}

.z-filter-row button {
  flex: 1;
  background: var(--z-card);
  color: var(--z-muted);
  border: 1px solid var(--z-border);
  padding: 10px;
  border-radius: 9px;
}

.z-filter-row button.active {
  color: var(--z-green);
  border-color: var(--z-green);
}

.z-search-wrap input {
  width: 100%;
  background: var(--z-card);
  color: white;
  border: 1px solid var(--z-border);
  border-radius: 11px;
  padding: 13px;
  margin-bottom: 15px;
  outline: none;
}

.z-league-group,
.z-content-card {
  background: var(--z-card);
  border: 1px solid var(--z-border);
  border-radius: 13px;
  overflow: hidden;
  margin-bottom: 13px;
}

.z-league-head {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 13px;
  background: #1b252c;
  font-size: 13px;
}

.z-league-count {
  margin-left: auto;
  color: var(--z-muted);
}

.z-match {
  display: flex;
  align-items: center;
  border-top: 1px solid var(--z-border);
}

.z-match-main {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  background: none;
  color: white;
  border: 0;
  padding: 13px 8px;
  text-align: left;
}

.z-match-time {
  width: 58px;
  flex-shrink: 0;
  color: var(--z-muted);
  font-size: 11px;
}

.z-match-time.live,
.z-match-scores.live {
  color: var(--z-green);
}

.z-match-teams {
  flex: 1;
  min-width: 0;
}

.z-team-line {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 29px;
  font-size: 13px;
}

.z-team-line span {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.team-logo {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.placeholder-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.z-match-scores {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 17px;
  padding: 0 8px;
}

.z-fav {
  background: none;
  color: #73828d;
  border: 0;
  padding: 13px;
  font-size: 24px;
}

.z-fav.selected {
  color: #ffcc33;
}

.z-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: #10171c;
  border-top: 1px solid var(--z-border);
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 60;
}

.z-bottom-nav button {
  flex: 1;
  background: none;
  border: 0;
  color: var(--z-muted);
  padding: 10px 2px;
}

.z-bottom-nav button.active {
  color: var(--z-green);
}

.z-bottom-nav span,
.z-bottom-nav small {
  display: block;
}

.z-bottom-nav span {
  font-size: 22px;
}

.z-bottom-nav small {
  font-size: 10px;
}

.z-overlay {
  position: fixed;
  inset: 0;
  background: #000a;
  z-index: 70;
}

.z-menu {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  width: min(310px, 85vw);
  background: #111b21;
  z-index: 80;
  padding: 25px 15px;
}

.z-menu-title {
  color: var(--z-green);
  font-size: 25px;
  font-weight: 900;
  margin-bottom: 25px;
}

.z-menu button {
  display: block;
  width: 100%;
  background: none;
  color: white;
  text-align: left;
  border: 0;
  border-bottom: 1px solid var(--z-border);
  padding: 16px 10px;
}

.z-loading,
.z-empty {
  text-align: center;
  padding: 45px 15px;
  color: var(--z-muted);
}

.z-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #34434a;
  border-top-color: var(--z-green);
  border-radius: 50%;
  margin: 0 auto 15px;
  animation: z-spin 0.8s linear infinite;
}

@keyframes z-spin {
  to { transform: rotate(360deg); }
}

.z-empty-icon {
  font-size: 36px;
}

.z-error,
.z-notice {
  background: #39201f;
  color: #ffb6a9;
  padding: 15px;
  border-radius: 10px;
}

.z-error button {
  display: block;
  margin-top: 12px;
  padding: 9px 15px;
}

.z-back {
  background: none;
  color: var(--z-green);
  border: 0;
  padding: 10px 0 20px;
}

.z-detail-top {
  background: linear-gradient(
    145deg,
    #17372e,
    #101a20
  );
  border-radius: 16px;
  padding: 20px 12px;
  text-align: center;
}

.z-detail-league {
  color: var(--z-muted);
  font-size: 12px;
  margin-bottom: 25px;
}

.z-scoreboard {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.z-score-team {
  width: 32%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  font-size: 13px;
}

.z-big-logo {
  width: 65px;
  height: 65px;
  object-fit: contain;
}

.z-center-score {
  text-align: center;
}

.z-score-number {
  font-size: 38px;
  font-weight: 900;
  white-space: nowrap;
}

.z-score-number span {
  color: var(--z-green);
}

.z-live-label {
  color: var(--z-green);
  font-weight: 800;
}

.z-match-date {
  margin-top: 25px;
  font-size: 12px;
  color: var(--z-muted);
}

.z-tabs {
  display: flex;
  overflow-x: auto;
  gap: 5px;
  padding: 15px 0;
}

.z-tabs button {
  flex-shrink: 0;
  background: var(--z-card);
  color: var(--z-muted);
  border: 1px solid var(--z-border);
  padding: 11px 13px;
  border-radius: 9px;
}

.z-tabs button.active {
  color: var(--z-green);
  border-color: var(--z-green);
}

.z-content-card {
  padding: 15px;
}

.z-content-card h3 {
  margin: 0 0 18px;
}

.z-info-line {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  padding: 12px 0;
  border-bottom: 1px solid var(--z-border);
  font-size: 13px;
}

.z-info-line span {
  color: var(--z-muted);
}

.z-events {
  display: flex;
  flex-direction: column;
}

.z-event {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  border-bottom: 1px solid var(--z-border);
  padding: 13px 0;
}

.z-event-time {
  width: 35px;
  color: var(--z-green);
  font-weight: 800;
}

.z-event-icon {
  font-size: 19px;
}

.z-event p {
  margin: 5px 0;
  font-size: 13px;
}

.z-event small {
  color: var(--z-muted);
}

.z-select-panel {
  display: flex;
  flex-direction: column;
  gap: 9px;
  background: var(--z-card);
  padding: 16px;
  border-radius: 12px;
  margin: 20px 0;
}

.z-select-panel label {
  color: var(--z-muted);
  font-size: 12px;
}

.z-select-panel select {
  background: #1d2930;
  color: white;
  border: 1px solid var(--z-border);
  padding: 12px;
  border-radius: 8px;
}

.z-table-scroll {
  overflow-x: auto;
}

.z-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.z-table th,
.z-table td {
  padding: 11px 6px;
  border-bottom: 1px solid var(--z-border);
  text-align: center;
}

.z-table-team {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 125px;
  text-align: left !important;
}

.z-highlight-row {
  background: #123b2c;
}

.z-country-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 20px;
}

.z-country-grid button {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
  background: var(--z-card);
  color: white;
  border: 1px solid var(--z-border);
  border-radius: 12px;
  padding: 18px;
}

.z-country-grid span {
  font-size: 25px;
}

.z-country-grid small {
  color: var(--z-green);
}

.z-stats-head,
.z-stat-label {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.z-stat {
  margin: 20px 0;
}

.z-stat-label {
  font-size: 12px;
  margin-bottom: 9px;
}

.z-stat-label span {
  color: var(--z-muted);
}

.z-stat-track {
  height: 7px;
  background: #334047;
  border-radius: 20px;
  overflow: hidden;
}

.z-stat-track > div {
  height: 100%;
  background: var(--z-green);
}

.z-pitch-note {
  color: var(--z-muted);
  font-size: 12px;
  margin: 5px 0 15px;
}

.z-pitch-title {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px;
}

.z-pitch-title span {
  margin-left: auto;
  color: var(--z-green);
}

.z-stadium {
  position: relative;
  background: #101b17;
  padding: 18px 12px 30px;
  overflow: hidden;
  border-radius: 14px;
}

.z-pitch-perspective {
  perspective: 900px;
}

.z-pitch-field {
  height: 440px;
  position: relative;
  border: 2px solid #ffffff70;
  border-radius: 3px;
  background: repeating-linear-gradient(
    to bottom,
    #176a42 0,
    #176a42 55px,
    #1b784a 55px,
    #1b784a 110px
  );
  box-shadow: 0 20px 35px #0008;
  transform: rotateX(9deg);
}

.z-pitch-half {
  position: absolute;
  top: 50%;
  width: 100%;
  border-top: 2px solid #ffffff70;
}

.z-pitch-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 90px;
  height: 90px;
  border: 2px solid #ffffff70;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.z-pitch-box {
  position: absolute;
  left: 23%;
  width: 54%;
  height: 65px;
  border: 2px solid #ffffff70;
}

.z-pitch-box.top {
  top: 0;
  border-top: 0;
}

.z-pitch-box.bottom {
  bottom: 0;
  border-bottom: 0;
}

.z-player-position {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 3;
}

.z-pitch-player {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: none;
  color: white;
  border: 0;
  width: 70px;
  padding: 0;
}

.z-player-photo {
  width: 39px;
  height: 39px;
  border-radius: 50%;
  object-fit: cover;
  background: #20392e;
  border: 2px solid var(--z-green);
}

.z-player-number {
  font-weight: 900;
  color: white;
  text-shadow: 0 1px 3px black;
}

.z-pitch-player small {
  font-size: 10px;
  max-width: 70px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-shadow: 0 1px 4px black;
}

.z-player-profile {
  text-align: center;
  background: var(--z-card);
  padding: 30px 20px;
  border-radius: 15px;
}

.z-profile-photo {
  width: 110px;
  height: 110px;
  object-fit: cover;
  border-radius: 50%;
  border: 3px solid var(--z-green);
}

@media (max-width: 390px) {
  .z-score-number {
    font-size: 30px;
  }

  .z-big-logo {
    width: 48px;
    height: 48px;
  }

  .z-day {
    min-width: 43px;
  }

  .z-pitch-field {
    height: 390px;
  }
}
`;

document.head.appendChild(style);

render();
loadMatches();

setInterval(() => {
  if (
    state.page === 'home' ||
    state.page === 'favorites'
  ) {
    loadMatches();
  }
}, 60000);
