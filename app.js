
'use strict';

/* ZIRVE90 - TAM APP.JS
   Kompakt mac listesi / ulkeye gore ligler
   API anahtari burada tutulmaz.
*/

const API_BASE = 'https://zirve90-api.yrdk92.workers.dev';
const root = document.getElementById('app');

function read(key) {
  try { return localStorage.getItem(key) || ''; }
  catch { return ''; }
}

function save(key, value) {
  try { localStorage.setItem(key, String(value)); }
  catch {}
}

function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  }[c]));
}

function low(v) {
  return String(v ?? '').toLocaleLowerCase('tr-TR');
}

const countryNames = {
  TR:'Türkiye', DE:'Almanya', AT:'Avusturya',
  GB:'İngiltere', EN:'İngiltere', UK:'İngiltere',
  IT:'İtalya', ES:'İspanya', FR:'Fransa',
  NL:'Hollanda', PT:'Portekiz', BE:'Belçika',
  GR:'Yunanistan', SC:'İskoçya', BR:'Brezilya',
  AR:'Arjantin', US:'ABD', USA:'ABD',
  SA:'Suudi Arabistan', CH:'İsviçre',
  PL:'Polonya', DK:'Danimarka', NO:'Norveç',
  SE:'İsveç', CZ:'Çekya', HR:'Hırvatistan',
  RS:'Sırbistan', RO:'Romanya', BG:'Bulgaristan',
  UA:'Ukrayna', JP:'Japonya', KR:'Güney Kore',
  MX:'Meksika', AU:'Avustralya',
  EU:'Avrupa', INT:'Dünya'
};

const countryFlags = {
  TR:'🇹🇷', DE:'🇩🇪', AT:'🇦🇹',
  GB:'🏴', EN:'🏴', UK:'🏴',
  IT:'🇮🇹', ES:'🇪🇸', FR:'🇫🇷',
  NL:'🇳🇱', PT:'🇵🇹', BE:'🇧🇪',
  GR:'🇬🇷', SC:'🏴', BR:'🇧🇷',
  AR:'🇦🇷', US:'🇺🇸', USA:'🇺🇸',
  SA:'🇸🇦', CH:'🇨🇭', PL:'🇵🇱',
  DK:'🇩🇰', NO:'🇳🇴', SE:'🇸🇪',
  CZ:'🇨🇿', HR:'🇭🇷', RS:'🇷🇸',
  RO:'🇷🇴', BG:'🇧🇬', UA:'🇺🇦',
  JP:'🇯🇵', KR:'🇰🇷', MX:'🇲🇽',
  AU:'🇦🇺', EU:'🌍', INT:'🌍'
};

const countries = [
  {code:'TR',name:'Türkiye',flag:'🇹🇷',leagues:[
    {id:203,name:'Süper Lig'},
    {id:204,name:'1. Lig'}
  ]},
  {code:'DE',name:'Almanya',flag:'🇩🇪',leagues:[
    {id:78,name:'Bundesliga'},
    {id:79,name:'2. Bundesliga'}
  ]},
  {code:'GB',name:'İngiltere',flag:'🏴',leagues:[
    {id:39,name:'Premier League'}
  ]},
  {code:'IT',name:'İtalya',flag:'🇮🇹',leagues:[
    {id:135,name:'Serie A'}
  ]},
  {code:'ES',name:'İspanya',flag:'🇪🇸',leagues:[
    {id:140,name:'La Liga'}
  ]},
  {code:'FR',name:'Fransa',flag:'🇫🇷',leagues:[
    {id:61,name:'Ligue 1'}
  ]},
  {code:'NL',name:'Hollanda',flag:'🇳🇱',leagues:[
    {id:88,name:'Eredivisie'}
  ]},
  {code:'PT',name:'Portekiz',flag:'🇵🇹',leagues:[
    {id:94,name:'Primeira Liga'}
  ]},
  {code:'BE',name:'Belçika',flag:'🇧🇪',leagues:[
    {id:144,name:'Pro League'}
  ]},
  {code:'BR',name:'Brezilya',flag:'🇧🇷',leagues:[
    {id:71,name:'Série A'}
  ]},
  {code:'AR',name:'Arjantin',flag:'🇦🇷',leagues:[
    {id:128,name:'Primera División'}
  ]},
  {code:'SA',name:'Suudi Arabistan',flag:'🇸🇦',leagues:[
    {id:307,name:'Saudi Pro League'}
  ]},
  {code:'US',name:'ABD',flag:'🇺🇸',leagues:[
    {id:253,name:'MLS'}
  ]},
  {code:'GR',name:'Yunanistan',flag:'🇬🇷',leagues:[
    {id:197,name:'Super League'}
  ]},
  {code:'SC',name:'İskoçya',flag:'🏴',leagues:[
    {id:179,name:'Premiership'}
  ]}
];

const teamTranslations = {
  Turkey:'Türkiye',
  Germany:'Almanya',
  Italy:'İtalya',
  England:'İngiltere',
  Spain:'İspanya',
  France:'Fransa',
  Netherlands:'Hollanda',
  Belgium:'Belçika',
  Greece:'Yunanistan',
  Switzerland:'İsviçre',
  Austria:'Avusturya',
  Scotland:'İskoçya',
  Serbia:'Sırbistan',
  Croatia:'Hırvatistan',
  Albania:'Arnavutluk',
  Finland:'Finlandiya',
  Sweden:'İsveç',
  Norway:'Norveç',
  Denmark:'Danimarka',
  Poland:'Polonya',
  Portugal:'Portekiz',
  Romania:'Romanya',
  Bulgaria:'Bulgaristan',
  Slovenia:'Slovenya',
  Slovakia:'Slovakya',
  'Czech Republic':'Çekya',
  Czechia:'Çekya',
  'North Macedonia':'Kuzey Makedonya',
  Hungary:'Macaristan',
  Ukraine:'Ukrayna',
  Wales:'Galler',
  'Northern Ireland':'Kuzey İrlanda',
  'Republic of Ireland':'İrlanda',
  Ireland:'İrlanda',
  Iceland:'İzlanda',
  Estonia:'Estonya',
  Latvia:'Letonya',
  Lithuania:'Litvanya',
  Luxembourg:'Lüksemburg',
  Liechtenstein:'Lihtenştayn',
  Moldova:'Moldova',
  Kazakhstan:'Kazakistan',
  Azerbaijan:'Azerbaycan',
  Armenia:'Ermenistan',
  Georgia:'Gürcistan',
  Cyprus:'Kıbrıs',
  Montenegro:'Karadağ',
  Belarus:'Belarus',
  'Faroe Islands':'Faroe Adaları',
  Gibraltar:'Cebelitarık',
  Andorra:'Andorra',
  'San Marino':'San Marino',
  Brazil:'Brezilya',
  Argentina:'Arjantin',
  'United States':'ABD',
  USA:'ABD',
  Mexico:'Meksika',
  Japan:'Japonya',
  'South Korea':'Güney Kore',
  'Saudi Arabia':'Suudi Arabistan',
  Morocco:'Fas',
  Egypt:'Mısır',
  Nigeria:'Nijerya',
  Senegal:'Senegal',
  Australia:'Avustralya'
};

function teamName(name) {
  const raw = String(name || '');
  if (teamTranslations[raw]) return teamTranslations[raw];

  const youth = raw.match(/^(.*?)\s+(U[- ]?\d{2})$/i);

  if (youth && teamTranslations[youth[1]]) {
    return teamTranslations[youth[1]] + ' ' + youth[2];
  }

  return raw;
}

function matchId(m) {
  return String(
    m.id ??
    m.fixture?.id ??
    `${m.date}-${m.homeTeam?.name}-${m.awayTeam?.name}`
  );
}

function dateKey(d) {
  return [
    d.getFullYear(),
    String(d.getMonth()+1).padStart(2,'0'),
    String(d.getDate()).padStart(2,'0')
  ].join('-');
}

function selectedDate() {
  const d = new Date();
  d.setDate(d.getDate()+state.day);
  return dateKey(d);
}

function youth(name) {
  return /\b(u[- ]?(17|18|19|20|21|23)|under[- ]?(17|18|19|20|21|23)|youth|junior|genç)\b/i
    .test(String(name || ''));
}

function women(name) {
  return /\b(women|woman|female|feminine|frauen|kadın|femenina|femminile|ladies)\b/i
    .test(String(name || ''));
}

function getCountryCode(m) {
  return String(
    m.country?.code ||
    m.league?.country?.code ||
    ''
  ).toUpperCase();
}

function getCountryName(m) {
  const code = getCountryCode(m);

  if (countryNames[code]) return countryNames[code];

  const raw = String(
    m.country?.name ||
    m.league?.country?.name ||
    ''
  ).trim();

  const names = {
    Turkey:'Türkiye',
    Türkiye:'Türkiye',
    Germany:'Almanya',
    Austria:'Avusturya',
    England:'İngiltere',
    Italy:'İtalya',
    Spain:'İspanya',
    France:'Fransa',
    Netherlands:'Hollanda',
    Portugal:'Portekiz',
    Belgium:'Belçika',
    Scotland:'İskoçya',
    Brazil:'Brezilya',
    Argentina:'Arjantin',
    'United States':'ABD',
    'Saudi Arabia':'Suudi Arabistan'
  };

  return names[raw] || raw || 'Dünya';
}

function getFlag(m) {
  return countryFlags[getCountryCode(m)] || '🌍';
}

function leaguePriority(m) {
  const name = low(m.league?.name);
  const country = low(getCountryName(m));

  if (women(name)) return 85;

  if (youth(name)) {
    if (/world cup|euro|european championship|uefa/.test(name)) {
      return 25;
    }
    return 88;
  }

  if (/world cup|dünya kupası/.test(name)) return 1;

  if (/uefa euro|european championship|avrupa şampiyonası/.test(name)) {
    return 2;
  }

  if (/champions league|şampiyonlar ligi/.test(name)) return 3;

  if (/europa league|avrupa ligi/.test(name)) return 10;

  if (/conference league|konferans ligi/.test(name)) return 11;

  if (/nations league|uluslar ligi/.test(name)) {
    return /uefa|europe/.test(name) ? 12 : 70;
  }

  // Turkiye ilk sirada.
  if (country === 'türkiye') {
    if (/süper lig|super lig|super league/.test(name)) return 15;
    if (/^1\. lig$|tff 1|first league/.test(name)) return 16;
    if (/cup|kupa/.test(name)) return 40;
    return 78;
  }

  // Almanya ve buyuk Avrupa ligleri.
  if (country === 'almanya' && /^bundesliga$/.test(name)) return 17;
  if (country === 'i̇ngiltere' || country === 'ingiltere') {
    if (/premier league/.test(name)) return 18;
  }
  if (country === 'i̇spanya' || country === 'ispanya') {
    if (/la liga|primera división/.test(name)) return 19;
  }
  if (country === 'i̇talya' || country === 'italya') {
    if (/^serie a$/.test(name)) return 20;
  }
  if (country === 'fransa' && /^ligue 1$/.test(name)) return 21;
  if (country === 'hollanda' && /eredivisie/.test(name)) return 22;
  if (country === 'portekiz' && /primeira liga/.test(name)) return 23;
  if (country === 'belçika' && /pro league/.test(name)) return 24;

  if (/2\. bundesliga|championship|serie b|ligue 2|segunda|second division|2\. lig/.test(name)) {
    return 95;
  }

  if (/cup|copa|pokal|kupa|supercup/.test(name)) return 50;

  if (/premier league|bundesliga|serie a|super league|liga 1|division 1/.test(name)) {
    return 60;
  }

  return 75;
}

function groupValue(m) {
  const values = [
    m.league?.group,
    m.league?.groupName,
    m.group?.name,
    typeof m.group === 'string' ? m.group : '',
    m.stage?.group,
    m.round?.group
  ];

  return values.find(
    v => typeof v === 'string' && v.trim()
  ) || '';
}

function leagueInfo(m) {
  const name = String(m.league?.name || 'Diğer Ligler');
  const country = getCountryName(m);
  const group = groupValue(m);

  let title = `${country} - ${name}`;

  if (group && !low(title).includes(low(group))) {
    title += ` · ${group}`;
  }

  // Ulke, lig ve gercek grup ayni kartta.
  const key = [
    low(country),
    String(m.league?.id || ''),
    low(name),
    low(group)
  ].join('|');

  return {
    key,
    title,
    flag:getFlag(m),
    rank:leaguePriority(m)
  };
}

function statusText(value) {
  const s = low(value);

  if (/finished|full time|after penalties/.test(s)) return 'MS';
  if (/half time|halftime/.test(s)) return 'İY';
  if (/second half/.test(s)) return '2. Yarı';
  if (/first half/.test(s)) return '1. Yarı';
  if (/extra time/.test(s)) return 'Uzatma';
  if (/postponed/.test(s)) return 'Ertelendi';
  if (/cancelled|canceled/.test(s)) return 'İptal';
  if (/not started|scheduled|fixture/.test(s)) return '';

  return value || '';
}

const state = {
  page:'home',
  country:read('zirve90-country'),
  favoriteLeague:Number(read('zirve90-league')) || null,
  favoriteTeam:read('zirve90-team'),
  teamName:read('zirve90-team-name'),
  league:'all',
  search:'',
  day:0,
  match:null,
  tab:'Genel',
  teams:[],
  teamsStatus:'idle'
};

let liveMatches = [];
let loading = false;
let loadError = '';
let requestToken = 0;
let matchRequestToken = 0;
let favorites = [];

try {
  const saved = JSON.parse(
    read('zirve90-favorites-clean') || '[]'
  );
  favorites = Array.isArray(saved) ? saved : [];
} catch {}

function country() {
  return countries.find(c => c.code === state.country);
}

function selectedLeague() {
  return country()?.leagues.find(
    l => l.id === state.favoriteLeague
  );
}

function seasonFor(id) {
  const now = new Date();
  const calendar = new Set([71,72,128,253]);

  return calendar.has(Number(id))
    ? now.getFullYear()
    : now.getMonth() >= 6
      ? now.getFullYear()
      : now.getFullYear()-1;
}

function header() {
  return `
    <header class="hero">
      <div class="top">
        <div style="display:flex;align-items:center;gap:12px">
          <button class="iconbtn" id="menuBtn">☰</button>
          <div class="brand">ZİRVE<span>90</span></div>
        </div>
        <div class="actions">
          <button class="iconbtn" data-go="favorites">☆</button>
          <button class="iconbtn" data-go="more">⚙</button>
        </div>
      </div>
    </header>
  `;
}

function calendar() {
  const days = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];

  return `
    <section class="section">
      <div class="heading">
        <h2>Maç takvimi</h2>
        <span class="muted">Tarih seç</span>
      </div>

      <div class="dates">
        ${Array.from({length:61},(_,i) => {
          const offset = i-30;
          const d = new Date();
          d.setDate(d.getDate()+offset);

          return `
            <button
              class="date ${state.day === offset ? 'selected' : ''}"
              data-day="${offset}">
              <small>${offset === 0 ? 'Bugün' : days[d.getDay()]}</small>
              <strong>${d.getDate()}</strong>
              <small>${d.toLocaleDateString('tr-TR',{month:'short'})}</small>
            </button>
          `;
        }).join('')}
      </div>
    </section>
  `;
}

function filteredMatches(onlyFav=false) {
  const search = low(state.search);

  let matches = liveMatches.filter(m => {
    const d = new Date(m.date);

    if (Number.isNaN(d.getTime())) return false;
    if (dateKey(d) !== selectedDate()) return false;

    if (onlyFav && !favorites.includes(matchId(m))) return false;

    if (!onlyFav && state.league !== 'all' &&
        leagueInfo(m).key !== state.league) {
      return false;
    }

    const text = low([
      m.homeTeam?.name,
      m.awayTeam?.name,
      teamName(m.homeTeam?.name),
      teamName(m.awayTeam?.name),
      m.league?.name,
      getCountryName(m),
      groupValue(m)
    ].join(' '));

    return text.includes(search);
  });

  matches.sort((a,b) =>
    leaguePriority(a)-leaguePriority(b) ||
    new Date(a.date)-new Date(b.date)
  );

  return matches.slice(0,100);
}

function filters() {
  const found = new Map();

  liveMatches.forEach(m => {
    const info = leagueInfo(m);

    if (!found.has(info.key)) {
      found.set(info.key,info);
    }
  });

  const leagues = [...found.values()].sort((a,b) =>
    a.rank-b.rank ||
    a.title.localeCompare(b.title,'tr')
  );

  return `
    <section class="section">
      <div class="heading">
        <h2>Ligler</h2>
        <span class="muted">${leagues.length} lig</span>
      </div>

      <div class="chips">
        <button
          class="chip ${state.league === 'all' ? 'selected' : ''}"
          data-league="all">
          🌍 Tümü
        </button>

        ${leagues.map(l => `
          <button
            class="chip ${state.league === l.key ? 'selected' : ''}"
            data-league="${esc(l.key)}">
            ${l.flag} ${esc(l.title)}
          </button>
        `).join('')}
      </div>
    </section>
  `;
}

function matchCards(onlyFav=false) {
  if (loading && !liveMatches.length) {
    return '<div class="empty">Maçlar yükleniyor...</div>';
  }

  if (loadError && !liveMatches.length) {
    return `
      <div class="empty">
        Maçlar alınamadı: ${esc(loadError)}
        <button class="chip" data-retry-matches="1">
          Yeniden dene
        </button>
      </div>
    `;
  }

  const matches = filteredMatches(onlyFav);
  const groups = new Map();

  matches.forEach(m => {
    const info = leagueInfo(m);

    if (!groups.has(info.key)) {
      groups.set(info.key,{
        ...info,
        games:[]
      });
    }

    groups.get(info.key).games.push(m);
  });

  const sortedGroups = [...groups.values()].sort((a,b) =>
    a.rank-b.rank ||
    a.title.localeCompare(b.title,'tr')
  );

  if (!sortedGroups.length) {
    return `
      <div class="empty">
        Bu tarihte veya filtrede maç bulunamadı.
      </div>
    `;
  }

  return sortedGroups.map(group => `
    <article class="league">
      <div class="leaguehead">
        <span>${group.flag} ${esc(group.title)}</span>
        <span>${group.games.length} maç</span>
      </div>

      ${group.games.map(m => {
        const id = matchId(m);
        const date = new Date(m.date);
        const time = date.toLocaleTimeString('tr-TR',{
          hour:'2-digit',
          minute:'2-digit'
        });

        const status = statusText(m.state?.description);
        const score = m.state?.score?.current;

        const scoreText = score != null && String(score).trim()
          ? String(score)
          : 'v';

        const home = teamName(m.homeTeam?.name || 'Ev sahibi');
        const away = teamName(m.awayTeam?.name || 'Deplasman');

        const homeLogo = m.homeTeam?.logo
          ? `<img class="team-logo"
              src="${esc(m.homeTeam.logo)}"
              alt="" loading="lazy">`
          : '';

        const awayLogo = m.awayTeam?.logo
          ? `<img class="team-logo"
              src="${esc(m.awayTeam.logo)}"
              alt="" loading="lazy">`
          : '';

        return `
          <div class="match compact-match" data-match="${esc(id)}">
            <div class="time">
              ${status === 'MS' || status === 'İY'
                ? esc(status)
                : esc(time)}
              ${status && status !== 'MS' && status !== 'İY'
                ? `<small>${esc(status)}</small>`
                : ''}
            </div>

            <div class="compact-home">
              <span class="teamname">${esc(home)}</span>
              ${homeLogo}
            </div>

            <div class="compact-score">
              ${esc(scoreText)}
            </div>

            <div class="compact-away">
              ${awayLogo}
              <span class="teamname">${esc(away)}</span>
            </div>

            <button
              class="star ${favorites.includes(id) ? 'on' : ''}"
              data-fav="${esc(id)}">
              ${favorites.includes(id) ? '★' : '☆'}
            </button>
          </div>
        `;
      }).join('')}
    </article>
  `).join('');
}

function home() {
  const fav = state.page === 'favorites';

  return header() +
    (fav ? '' : calendar()) +
    `
      <section class="section">
        <input
          class="search"
          id="search"
          placeholder="Takım veya lig ara..."
          value="${esc(state.search)}">
      </section>
    ` +
    (fav ? '' : filters()) +
    `
      <section class="section">
        <div class="heading">
          <h2>${fav ? 'Takip ettiklerim' : 'Maç merkezi'}</h2>
          <span class="muted">
            ${loading ? 'Yükleniyor...' : filteredMatches(fav).length+' maç'}
          </span>
        </div>
        <div id="match-list">${matchCards(fav)}</div>
      </section>
    `;
}

function detail() {
  const m = liveMatches.find(
    x => matchId(x) === state.match
  );

  if (!m) return home();

  const tabs = [
    'Genel','Kadro','İstatistik','Anlatım','Puan durumu'
  ];

  return header() + `
    <section class="detail">
      <button class="back" data-go="matches">‹ Geri dön</button>

      <p class="muted" style="text-align:center">
        ${esc(leagueInfo(m).title)}
      </p>

      <div class="versus">
        <div>
          ${m.homeTeam?.logo
            ? `<img class="team-logo"
                 src="${esc(m.homeTeam.logo)}" alt="">`
            : ''}
          ${esc(teamName(m.homeTeam?.name))}
        </div>

        <span class="vs">
          ${esc(m.state?.score?.current || 'VS')}
        </span>

        <div>
          ${m.awayTeam?.logo
            ? `<img class="team-logo"
                 src="${esc(m.awayTeam.logo)}" alt="">`
            : ''}
          ${esc(teamName(m.awayTeam?.name))}
        </div>
      </div>

      <p class="muted" style="text-align:center">
        ${esc(statusText(m.state?.description))}
      </p>
    </section>

    <section class="section">
      <div class="tabs">
        ${tabs.map(t => `
          <button
            class="tab ${state.tab === t ? 'selected' : ''}"
            data-tab="${esc(t)}">
            ${esc(t)}
          </button>
        `).join('')}
      </div>

      <div class="panel">
        <h3>${esc(state.tab)}</h3>
        ${state.tab === 'Genel'
          ? 'Maçın temel bilgileri gösteriliyor.'
          : 'Bu bölüm için ek API verileri henüz bağlı değil.'}
      </div>
    </section>
  `;
}

function choicePage(title,body) {
  return header() + `
    <section class="section">
      <h2>${title}</h2>
      <div class="panel">${body}</div>
    </section>
  `;
}

function staticPage() {
  if (state.page === 'country') {
    return choicePage('🌍 Ülkeni Seç',`
      <h3>Hangi ülkenin futbolunu takip ediyorsun?</h3>
      ${countries.map(c => `
        <button class="chip choice" data-country="${c.code}">
          ${c.flag} ${esc(c.name)}
        </button>
      `).join('')}
    `);
  }

  if (state.page === 'chooseLeague') {
    const c = country();

    if (!c) {
      return choicePage('Ülke seç',`
        <button class="chip" data-go="country">
          Ülke seçimine dön
        </button>
      `);
    }

    return choicePage('🏆 Ligini Seç',`
      <h3>${c.flag} ${esc(c.name)}</h3>
      ${c.leagues.map(l => `
        <button
          class="chip choice"
          data-choose-league="${l.id}">
          ⚽ ${esc(l.name)}
        </button>
      `).join('')}
      <button class="chip choice" data-go="country">
        ← Ülke seç
      </button>
    `);
  }

  if (state.page === 'chooseTeam') {
    const l = selectedLeague();

    if (!l) {
      return choicePage('Lig seç',`
        <button class="chip" data-go="chooseLeague">
          Geri dön
        </button>
      `);
    }

    let content = `<h3>${esc(l.name)}</h3>`;

    if (state.teamsStatus === 'loading') {
      content += '<p>Takımlar yükleniyor...</p>';
    } else if (state.teamsStatus === 'error') {
      content += `
        <p>Takımlar alınamadı. Takım API bağlantısı henüz hazır olmayabilir.</p>
        <button class="chip choice" data-retry-teams="1">
          Yeniden dene
        </button>
      `;
    } else if (state.teams.length) {
      content += state.teams.map(t => `
        <button
          class="chip choice"
          data-choose-team="${t.id}">
          ${t.logo
            ? `<img src="${esc(t.logo)}" alt="" loading="lazy">`
            : '⚽'}
          ${esc(t.name)}
        </button>
      `).join('');
    } else {
      content += '<p>Takım bulunamadı.</p>';
    }

    content += `
      <button class="chip choice" data-go="chooseLeague">
        ← Lig seçimine dön
      </button>
    `;

    return choicePage('⭐ Favori Takımını Seç',content);
  }

  if (state.page === 'leagues') {
    return choicePage('Ülkeler ve Ligler',
      countries.map(c => `
        <p>
          <strong>${c.flag} ${esc(c.name)}</strong>:
          ${c.leagues.map(l => esc(l.name)).join(', ')}
        </p>
      `).join('')
    );
  }

  if (state.page === 'more') {
    return choicePage('⚙️ Ayarlar',`
      <p>Ülke: ${esc(country()?.name || 'Seçilmedi')}</p>
      <p>Lig: ${esc(selectedLeague()?.name || 'Seçilmedi')}</p>
      <p>Takım: ${esc(state.teamName || 'Seçilmedi')}</p>

      <button class="chip choice" data-go="country">
        🌍 Ülke / Lig / Takım Değiştir
      </button>
      <button class="chip choice" data-go="login">
        👤 Giriş / Üyelik
      </button>
    `);
  }

  if (['login','register'].includes(state.page)) {
    return choicePage('Üyelik',`
      <p>Üyelik sistemi henüz aktif değil.</p>
    `);
  }

  const labels = {
    standings:[
      'Puan Durumu',
      'Puan tablosu için ek API bağlantısı gerekiyor.'
    ],
    news:[
      'Haberler',
      'Haber kaynağı henüz bağlı değil.'
    ],
    videos:[
      'Videolar',
      'Video kaynağı henüz bağlı değil.'
    ]
  };

  const [title,desc] = labels[state.page] ||
    ['Zirve90','Bu sayfa hazırlanıyor.'];

  return choicePage(title,`
    <h3>${esc(title)}</h3>
    <p>${esc(desc)}</p>
  `);
}

function navigation() {
  const items = [
    ['home','◉','Canlı'],
    ['matches','▦','Maçlar'],
    ['standings','▤','Puan'],
    ['favorites','☆','Takip'],
    ['more','☰','Diğer']
  ];

  return `
    <nav class="bottom">
      ${items.map(([p,i,t]) => `
        <button
          class="${state.page === p ? 'active' : ''}"
          data-go="${p}">
          <b>${i}</b>${t}
        </button>
      `).join('')}
    </nav>
  `;
}

function sideMenu() {
  const items = [
    ['login','👤 Giriş Yap / Üye Ol'],
    ['home','⚽ Canlı Skor'],
    ['matches','📅 Maçlar'],
    ['standings','🏆 Puan Durumu'],
    ['leagues','🌍 Ligler'],
    ['country','🌐 Ülke / Takım Değiştir'],
    ['news','📰 Haberler'],
    ['videos','▶️ Videolar'],
    ['favorites','⭐ Favoriler'],
    ['more','⚙️ Ayarlar']
  ];

  return `
    <div id="menuOverlay"></div>

    <aside id="sideMenu">
      <div class="menuHeader">
        <div class="menuLogo">ZİRVE<span>90</span></div>
        <button id="closeMenu">×</button>
      </div>

      ${items.map(([page,label]) => `
        <button data-menu-page="${page}">
          ${label}
        </button>
      `).join('')}
    </aside>
  `;
}

function render() {
  if (!root) return;

  const page = state.page === 'detail'
    ? detail()
    : ['home','matches','favorites'].includes(state.page)
      ? home()
      : staticPage();

  root.innerHTML = `
    <div class="app">
      ${page}
      <div class="foot">ZİRVE90</div>
    </div>
    ${navigation()}
    ${sideMenu()}
  `;

  const input = document.getElementById('search');

  if (input) {
    input.addEventListener('input',e => {
      state.search = e.target.value;
      const list = document.getElementById('match-list');

      if (list) {
        list.innerHTML = matchCards(
          state.page === 'favorites'
        );
      }
    });
  }

  document.querySelector('.dates .date.selected')
    ?.scrollIntoView({
      behavior:'instant',
      block:'nearest',
      inline:'center'
    });
}

async function loadLiveMatches() {
  const token = ++matchRequestToken;
  const date = selectedDate();

  loading = true;
  loadError = '';
  liveMatches = [];
  render();

  try {
    const response = await fetch(
      `${API_BASE}/matches?date=${encodeURIComponent(date)}`,
      {headers:{Accept:'application/json'}}
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (!Array.isArray(result.data)) {
      throw new Error('Beklenmeyen veri biçimi');
    }

    if (token !== matchRequestToken) return;

    liveMatches = result.data;
  } catch(err) {
    if (token !== matchRequestToken) return;

    console.error('Maçlar yüklenemedi:',err);
    loadError = err.message || 'Bağlantı hatası';
  } finally {
    if (token === matchRequestToken) {
      loading = false;
      render();
    }
  }
}

async function loadTeams() {
  const token = ++requestToken;

  state.teams = [];
  state.teamsStatus = 'loading';
  render();

  try {
    const league = selectedLeague();

    if (!league) throw new Error('Lig seçilmedi');

    const url =
      `${API_BASE}/teams?league=${encodeURIComponent(league.id)}` +
      `&season=${encodeURIComponent(seasonFor(league.id))}`;

    const response = await fetch(url,{
      headers:{Accept:'application/json'}
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    const raw = Array.isArray(data.response)
      ? data.response
      : Array.isArray(data.data)
        ? data.data
        : [];

    const teams = raw
      .map(x => x.team || x)
      .filter(x =>
        x &&
        Number.isInteger(Number(x.id)) &&
        typeof x.name === 'string'
      )
      .map(x => ({
        id:Number(x.id),
        name:x.name,
        logo:typeof x.logo === 'string' &&
          /^https:\/\//.test(x.logo)
          ? x.logo
          : ''
      }))
      .sort((a,b) => a.name.localeCompare(b.name,'tr'));

    if (token !== requestToken) return;

    state.teams = teams;
    state.teamsStatus = 'ready';
  } catch(err) {
    console.error('Takım yükleme hatası:',err);
    if (token !== requestToken) return;
    state.teamsStatus = 'error';
  }

  render();
}

function closeMenu() {
  document.getElementById('sideMenu')
    ?.classList.remove('open');

  document.getElementById('menuOverlay')
    ?.classList.remove('open');
}

function openMenu() {
  document.getElementById('sideMenu')
    ?.classList.add('open');

  document.getElementById('menuOverlay')
    ?.classList.add('open');
}

function go(page) {
  state.page = page;
  render();
  window.scrollTo(0,0);
}

document.addEventListener('click',e => {
  if (e.target.closest('#menuBtn')) {
    openMenu();
    return;
  }

  if (e.target.closest('#closeMenu') ||
      e.target.id === 'menuOverlay') {
    closeMenu();
    return;
  }

  const menuItem = e.target.closest('[data-menu-page]');

  if (menuItem) {
    closeMenu();
    go(menuItem.dataset.menuPage);
    return;
  }

  const b = e.target.closest(
    '[data-go],[data-country],[data-choose-league],' +
    '[data-choose-team],[data-retry-teams],' +
    '[data-retry-matches],[data-league],[data-day],' +
    '[data-match],[data-fav],[data-tab]'
  );

  if (!b) return;

  if (b.hasAttribute('data-fav')) {
    const key = b.dataset.fav;

    favorites = favorites.includes(key)
      ? favorites.filter(x => x !== key)
      : [...favorites,key];

    save('zirve90-favorites-clean',JSON.stringify(favorites));
    render();
    return;
  }

  if (b.hasAttribute('data-go')) {
    go(b.dataset.go);
  } else if (b.hasAttribute('data-country')) {
    state.country = b.dataset.country;
    state.favoriteLeague = null;
    state.favoriteTeam = '';
    state.teamName = '';
    go('chooseLeague');
  } else if (b.hasAttribute('data-choose-league')) {
    state.favoriteLeague = Number(b.dataset.chooseLeague);
    state.favoriteTeam = '';
    state.teamName = '';
    state.page = 'chooseTeam';
    loadTeams();
    window.scrollTo(0,0);
  } else if (b.hasAttribute('data-retry-teams')) {
    loadTeams();
  } else if (b.hasAttribute('data-retry-matches')) {
    loadLiveMatches();
  } else if (b.hasAttribute('data-choose-team')) {
    const t = state.teams.find(
      x => x.id === Number(b.dataset.chooseTeam)
    );

    if (!t) return;

    state.favoriteTeam = String(t.id);
    state.teamName = t.name;

    save('zirve90-country',state.country);
    save('zirve90-league',state.favoriteLeague);
    save('zirve90-team',state.favoriteTeam);
    save('zirve90-team-name',state.teamName);

    go('home');
  } else if (b.hasAttribute('data-league')) {
    state.league = b.dataset.league;
    render();
  } else if (b.hasAttribute('data-day')) {
    const nextDay = Number(b.dataset.day);

    if (state.day !== nextDay) {
      state.day = nextDay;
      state.league = 'all';
      loadLiveMatches();
    }
  } else if (b.hasAttribute('data-match')) {
    state.match = b.dataset.match;
    state.tab = 'Genel';
    go('detail');
  } else if (b.hasAttribute('data-tab')) {
    state.tab = b.dataset.tab;
    render();
  }
});

render();
loadLiveMatches();

setInterval(() => {
  if (
    state.day === 0 &&
    ['home','matches','favorites'].includes(state.page) &&
    !document.hidden &&
    !loading
  ) {
    loadLiveMatches();
  }
},120000);

/* ========================================
   KOMPAKT MAC TASARIMI
   CSS DOSYASINA DOKUNMADAN UYGULANIR
======================================== */

(function compactDesign() {
  const style = document.createElement('style');

  style.textContent = `
    .league {
      margin-bottom: 6px !important;
      border-radius: 9px !important;
    }

    .leaguehead {
      min-height: 34px !important;
      padding: 7px 10px !important;
      font-size: 12px !important;
    }

    .compact-match {
      min-height: 38px !important;
      height: auto !important;
      padding: 6px 7px !important;
      gap: 4px !important;
      grid-template-columns:
        42px minmax(0,1fr) 37px
        minmax(0,1fr) 23px !important;
    }

    .compact-home,
    .compact-away {
      font-size: 11px !important;
      gap: 3px !important;
    }

    .compact-match .time {
      font-size: 10px !important;
    }

    .compact-match .time small {
      font-size: 9px !important;
    }

    .compact-score {
      font-size: 12px !important;
    }

    .compact-match .team-logo {
      width: 17px !important;
      height: 17px !important;
      min-width: 17px !important;
      max-width: 17px !important;
      max-height: 17px !important;
    }

    .compact-match .star {
      font-size: 19px !important;
    }

    @media (max-width:390px) {
      .compact-match {
        grid-template-columns:
          37px minmax(0,1fr) 33px
          minmax(0,1fr) 21px !important;
        gap: 2px !important;
        padding: 6px 5px !important;
      }

      .compact-home,
      .compact-away {
        font-size: 10px !important;
      }
    }
  `;

  document.head.appendChild(style);
})();
