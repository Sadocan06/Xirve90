
'
'use strict';

/* ZIRVE90 - Premium Futbol Uygulamasi
   API anahtarini bu dosyaya yazma.
*/

const API_BASE = 'https://zirve90-api.yrdk92.workers.dev';
const root = document.getElementById('app');

const read = key => {
  try { return localStorage.getItem(key) || ''; }
  catch { return ''; }
};

const save = (key, value) => {
  try { localStorage.setItem(key, String(value)); }
  catch {}
};

const esc = value => String(value ?? '').replace(
  /[&<>"']/g,
  c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c])
);

const lower = value =>
  String(value ?? '').toLocaleLowerCase('tr-TR');

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
  'Turkey':'Türkiye',
  'Germany':'Almanya',
  'Italy':'İtalya',
  'England':'İngiltere',
  'Spain':'İspanya',
  'France':'Fransa',
  'Netherlands':'Hollanda',
  'Belgium':'Belçika',
  'Greece':'Yunanistan',
  'Switzerland':'İsviçre',
  'Austria':'Avusturya',
  'Scotland':'İskoçya',
  'Serbia':'Sırbistan',
  'Croatia':'Hırvatistan',
  'Albania':'Arnavutluk',
  'Finland':'Finlandiya',
  'Sweden':'İsveç',
  'Norway':'Norveç',
  'Denmark':'Danimarka',
  'Poland':'Polonya',
  'Portugal':'Portekiz',
  'Romania':'Romanya',
  'Bulgaria':'Bulgaristan',
  'Slovenia':'Slovenya',
  'Slovakia':'Slovakya',
  'Czech Republic':'Çekya',
  'Czechia':'Çekya',
  'North Macedonia':'Kuzey Makedonya',
  'Hungary':'Macaristan',
  'Ukraine':'Ukrayna',
  'Wales':'Galler',
  'Northern Ireland':'Kuzey İrlanda',
  'Republic of Ireland':'İrlanda',
  'Ireland':'İrlanda',
  'Iceland':'İzlanda',
  'Estonia':'Estonya',
  'Latvia':'Letonya',
  'Lithuania':'Litvanya',
  'Luxembourg':'Lüksemburg',
  'Liechtenstein':'Lihtenştayn',
  'Moldova':'Moldova',
  'Kazakhstan':'Kazakistan',
  'Azerbaijan':'Azerbaycan',
  'Armenia':'Ermenistan',
  'Georgia':'Gürcistan',
  'Cyprus':'Kıbrıs',
  'Montenegro':'Karadağ',
  'Belarus':'Belarus',
  'Faroe Islands':'Faroe Adaları',
  'Gibraltar':'Cebelitarık',
  'Andorra':'Andorra',
  'San Marino':'San Marino',
  'Brazil':'Brezilya',
  'Argentina':'Arjantin',
  'United States':'ABD',
  'USA':'ABD',
  'Mexico':'Meksika',
  'Japan':'Japonya',
  'South Korea':'Güney Kore',
  'Saudi Arabia':'Suudi Arabistan',
  'Morocco':'Fas',
  'Egypt':'Mısır',
  'Nigeria':'Nijerya',
  'Senegal':'Senegal',
  'Australia':'Avustralya'
};

function displayTeam(name) {
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
    `${m.date || ''}-${m.homeTeam?.name || ''}-${m.awayTeam?.name || ''}`
  );
}

function dateKey(d) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0')
  ].join('-');
}

function selectedDate() {
  const d = new Date();
  d.setDate(d.getDate() + state.day);
  return dateKey(d);
}

function isWomen(value) {
  return /\b(women|woman|female|feminine|frauen|kadın|femenina|femminile|ladies)\b/i
    .test(String(value || ''));
}

function isYouth(value) {
  return /\b(u[- ]?(?:17|18|19|20|21|23)|under[- ]?(?:17|18|19|20|21|23)|youth|junior|genç)\b/i
    .test(String(value || ''));
}

function leaguePriority(m) {
  const name = lower(m.league?.name);
  const code = String(m.country?.code || '').toUpperCase();

  // Kadinlar ve altyapi turnuvalari ana turnuvalarla karismasin.
  if (isWomen(name)) return 80;

  if (isYouth(name)) {
    if (/world cup|euro|european championship|uefa/.test(name)) {
      return 25;
    }
    return 85;
  }

  // En buyuk uluslararasi turnuvalar.
  if (/world cup|dünya kupası/.test(name)) return 1;

  if (/uefa euro|european championship|avrupa şampiyonası/.test(name)) {
    return 2;
  }

  if (/champions league|şampiyonlar ligi/.test(name)) return 3;

  if (/europa league|avrupa ligi/.test(name)) return 10;

  if (/conference league|konferans ligi/.test(name)) return 11;

  if (/nations league|uluslar ligi/.test(name)) {
    // UEFA, CONCACAF'tan daha oncelikli.
    if (/uefa/.test(name) || /europe/.test(name) ||
        code === 'EU') return 12;
    return 65;
  }

  // Ulkelerin birinci ligleri.
  const firstLeagues = [
    {codes:['TR'], re:/süper lig|super lig/, rank:30},
    {codes:['DE'], re:/^bundesliga$/, rank:31},
    {codes:['IT'], re:/^serie a$/, rank:32},
    {codes:['GB','EN'], re:/^premier league$/, rank:33},
    {codes:['ES'], re:/la liga|primera división/, rank:34},
    {codes:['FR'], re:/^ligue 1$/, rank:35},
    {codes:['NL'], re:/eredivisie/, rank:36},
    {codes:['PT'], re:/primeira liga/, rank:37},
    {codes:['BE'], re:/pro league/, rank:38},
    {codes:['SA'], re:/saudi pro league/, rank:39},
    {codes:['BR'], re:/série a|serie a/, rank:40},
    {codes:['AR'], re:/liga profesional|primera división/, rank:41},
    {codes:['US'], re:/major league soccer|^mls$/, rank:42}
  ];

  for (const item of firstLeagues) {
    if (item.codes.includes(code) && item.re.test(name)) {
      return item.rank;
    }
  }

  // Lig ismi yeterince aciksa, ulke kodu olmasa da tani.
  const fallbackFirst = [
    [/^süper lig$|^super lig$/,30],
    [/^bundesliga$/,31],
    [/^serie a$/,32],
    [/^premier league$/,33],
    [/^la liga$/,34],
    [/^ligue 1$/,35],
    [/^eredivisie$/,36],
    [/^primeira liga$/,37]
  ];

  for (const [re, rank] of fallbackFirst) {
    if (re.test(name)) return rank;
  }

  if (/cup|copa|pokal|kupa|final|supercup|super cup/.test(name)) {
    return 50;
  }

  if (/segunda|second|2\. bundesliga|championship|serie b|ligue 2|1\. lig|primera b|division 2|division ii/.test(name)) {
    return 90;
  }

  return 65;
}

function statusText(description) {
  const s = lower(description);

  if (/finished|full time|after penalties/.test(s)) return 'MS';
  if (/half time|halftime/.test(s)) return 'İY';
  if (/second half/.test(s)) return '2. Yarı';
  if (/first half/.test(s)) return '1. Yarı';
  if (/extra time/.test(s)) return 'Uzatma';
  if (/postponed/.test(s)) return 'Ertelendi';
  if (/cancelled|canceled/.test(s)) return 'İptal';
  if (/not started|scheduled|fixture/.test(s)) return '';

  return description || '';
}

function leagueGroupName(m) {
  const name = String(m.league?.name || 'Diğer Ligler');

  // Yalnizca API'den gelen grup bilgisi kullanilir.
  const candidates = [
    m.league?.group,
    m.league?.groupName,
    m.group?.name,
    typeof m.group === 'string' ? m.group : '',
    m.stage?.group,
    m.round?.group
  ];

  const group = candidates.find(
    x => typeof x === 'string' && x.trim()
  );

  if (!group) return name;

  if (lower(name).includes(lower(group))) return name;

  return `${name} · ${group}`;
}

function isLive(m) {
  const s = lower(m.state?.description);

  return /first half|second half|half time|halftime|extra time|penalties|in progress|live/.test(s);
}

const state = {
  page: read('zirve90-team') ? 'home' : 'home',
  country: read('zirve90-country'),
  favoriteLeague: Number(read('zirve90-league')) || null,
  favoriteTeam: read('zirve90-team'),
  teamName: read('zirve90-team-name'),
  league: 'all',
  search: '',
  day: 0,
  match: null,
  tab: 'Genel',
  teams: [],
  teamsStatus: 'idle',
  language: read('zirve90-language') || 'tr'
};

let liveMatches = [];
let loading = false;
let loadError = '';
let requestToken = 0;
let matchRequestToken = 0;
let favorites = [];

try {
  const stored = JSON.parse(
    read('zirve90-favorites-clean') || '[]'
  );
  favorites = Array.isArray(stored) ? stored : [];
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
      : now.getFullYear() - 1;
}

function header() {
  return `
    <header class="hero">
      <div class="top">
        <div style="display:flex;align-items:center;gap:12px">
          <button class="iconbtn" id="menuBtn" aria-label="Menü">
            ☰
          </button>
          <div class="brand">ZİRVE<span>90</span></div>
        </div>
        <div class="actions">
          <button class="iconbtn" data-go="favorites" aria-label="Favoriler">
            ☆
          </button>
          <button class="iconbtn" data-go="more" aria-label="Ayarlar">
            ⚙
          </button>
        </div>
      </div>
    </header>
  `;
}

function calendar() {
  const names = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];

  return `
    <section class="section">
      <div class="heading">
        <h2>Maç takvimi</h2>
        <span class="muted">Tarih seç</span>
      </div>

      <div class="dates">
        ${Array.from({length:61}, (_,i) => {
          const offset = i - 30;
          const d = new Date();
          d.setDate(d.getDate() + offset);

          return `
            <button
              class="date ${state.day === offset ? 'selected' : ''}"
              data-day="${offset}">
              <small>${offset === 0 ? 'Bugün' : names[d.getDay()]}</small>
              <strong>${d.getDate()}</strong>
              <small>${d.toLocaleDateString('tr-TR',{month:'short'})}</small>
            </button>
          `;
        }).join('')}
      </div>
    </section>
  `;
}

function filteredMatches(onlyFav = false) {
  const search = lower(state.search);

  let matches = liveMatches.filter(m => {
    const date = new Date(m.date);

    if (Number.isNaN(date.getTime())) return false;

    if (dateKey(date) !== selectedDate()) return false;

    if (onlyFav && !favorites.includes(matchId(m))) {
      return false;
    }

    if (!onlyFav && state.league !== 'all' &&
        String(m.league?.id) !== String(state.league)) {
      return false;
    }

    const text = lower([
      m.homeTeam?.name,
      m.awayTeam?.name,
      displayTeam(m.homeTeam?.name),
      displayTeam(m.awayTeam?.name),
      m.league?.name,
      leagueGroupName(m)
    ].join(' '));

    return text.includes(search);
  });

  matches.sort((a,b) =>
    leaguePriority(a) - leaguePriority(b) ||
    new Date(a.date) - new Date(b.date)
  );

  return matches.slice(0,100);
}

function filters() {
  const found = new Map();

  liveMatches.forEach(m => {
    if (m.league?.id && m.league?.name) {
      const key = String(m.league.id);

      if (!found.has(key)) {
        found.set(key, {
          id:m.league.id,
          name:m.league.name,
          rank:leaguePriority(m)
        });
      }
    }
  });

  const leagues = [...found.values()].sort((a,b) =>
    a.rank - b.rank ||
    a.name.localeCompare(b.name,'tr')
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
            class="chip ${String(state.league) === String(l.id) ? 'selected' : ''}"
            data-league="${esc(l.id)}">
            ⚽ ${esc(l.name)}
          </button>
        `).join('')}
      </div>
    </section>
  `;
}

function matchCards(onlyFav = false) {
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
    const name = leagueGroupName(m);
    const key = `${m.league?.id || name}::${name}`;

    if (!groups.has(key)) {
      groups.set(key, {
        name,
        rank:leaguePriority(m),
        games:[]
      });
    }

    groups.get(key).games.push(m);
  });

  const sortedGroups = [...groups.values()].sort((a,b) =>
    a.rank - b.rank ||
    a.name.localeCompare(b.name,'tr')
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
        <span>🏆 ${esc(group.name)}</span>
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

        const home = displayTeam(m.homeTeam?.name || 'Ev sahibi');
        const away = displayTeam(m.awayTeam?.name || 'Deplasman');

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
              data-fav="${esc(id)}"
              aria-label="Favorilere ekle">
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
            ${loading ? 'Yükleniyor...' : filteredMatches(fav).length + ' maç'}
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
    'Genel',
    'Kadro',
    'İstatistik',
    'Anlatım',
    'Puan durumu'
  ];

  const homeName = displayTeam(m.homeTeam?.name);
  const awayName = displayTeam(m.awayTeam?.name);

  return header() + `
    <section class="detail">
      <button class="back" data-go="matches">
        ‹ Geri dön
      </button>

      <p class="muted" style="text-align:center">
        ${esc(leagueGroupName(m))}
      </p>

      <div class="versus">
        <div>
          ${m.homeTeam?.logo
            ? `<img class="team-logo"
                 src="${esc(m.homeTeam.logo)}" alt="">`
            : ''}
          ${esc(homeName)}
        </div>

        <span class="vs">
          ${esc(m.state?.score?.current || 'VS')}
        </span>

        <div>
          ${m.awayTeam?.logo
            ? `<img class="team-logo"
                 src="${esc(m.awayTeam.logo)}" alt="">`
            : ''}
          ${esc(awayName)}
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
    return choicePage('🌍 Ülkeni Seç', `
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
      return choicePage('Ülke seç', `
        <button class="chip" data-go="country">
          Ülke seçimine dön
        </button>
      `);
    }

    return choicePage('🏆 Ligini Seç', `
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
      return choicePage('Lig seç', `
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
    return choicePage('⚙️ Ayarlar', `
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
    return choicePage('Üyelik', `
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

  return choicePage(title, `
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
        <div class="menuLogo">
          ZİRVE<span>90</span>
        </div>
        <button id="closeMenu" aria-label="Menüyü kapat">
          ×
        </button>
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

    if (!league) {
      throw new Error('Lig seçilmedi');
    }

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

    save('zirve90-favorites-clean',
      JSON.stringify(favorites));

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

// Maclari periyodik olarak yenile.
// Sadece bugunun maclari acikken calisir.
setInterval(() => {
  if (
    state.day === 0 &&
    ['home','matches','favorites'].includes(state.page) &&
    !document.hidden &&
    !loading
  ) {
    loadLiveMatches();
  }
}, 120000);
