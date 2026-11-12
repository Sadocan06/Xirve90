
'use strict';

// ZIRVE90 - Canli mac uygulamasi
// API anahtarini buraya yazma.
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
    {id:39,name:'Premier League'},
    {id:40,name:'Championship'}
  ]},
  {code:'ES',name:'İspanya',flag:'🇪🇸',leagues:[
    {id:140,name:'La Liga'}
  ]},
  {code:'IT',name:'İtalya',flag:'🇮🇹',leagues:[
    {id:135,name:'Serie A'}
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
  {code:'SA',name:'Suudi Arabistan',flag:'🇸🇦',leagues:[
    {id:307,name:'Saudi Pro League'}
  ]},
  {code:'US',name:'ABD',flag:'🇺🇸',leagues:[
    {id:253,name:'MLS'}
  ]},
  {code:'BR',name:'Brezilya',flag:'🇧🇷',leagues:[
    {id:71,name:'Série A'}
  ]},
  {code:'AR',name:'Arjantin',flag:'🇦🇷',leagues:[
    {id:128,name:'Primera División'}
  ]},
  {code:'GR',name:'Yunanistan',flag:'🇬🇷',leagues:[
    {id:197,name:'Super League'}
  ]},
  {code:'SC',name:'İskoçya',flag:'🏴',leagues:[
    {id:179,name:'Premiership'}
  ]}
];

const state = {
  page: read('zirve90-team') ? 'home' : 'country',
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
  teamsStatus: 'idle'
};

let liveMatches = [];
let loading = false;
let loadError = '';
let requestToken = 0;
let favorites = [];

try {
  const stored = JSON.parse(
    read('zirve90-favorites-clean') || '[]'
  );
  favorites = Array.isArray(stored) ? stored : [];
} catch {}

const country = () =>
  countries.find(c => c.code === state.country);

const selectedLeague = () =>
  country()?.leagues.find(
    l => l.id === state.favoriteLeague
  );

function seasonFor(id) {
  const now = new Date();
  const calendar = new Set([71,72,128,253]);
  return calendar.has(Number(id))
    ? now.getFullYear()
    : now.getMonth() >= 6
      ? now.getFullYear()
      : now.getFullYear() - 1;
}

function matchId(m) {
  return String(
    m.id ??
    m.fixture?.id ??
    `${m.date || ''}-${m.homeTeam?.name || ''}-${m.awayTeam?.name || ''}`
  );
}

function dateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth()+1).padStart(2,'0'),
    String(date.getDate()).padStart(2,'0')
  ].join('-');
}

function selectedDate() {
  const d = new Date();
  d.setDate(d.getDate() + state.day);
  return dateKey(d);
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
  const names = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];

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
              class="date ${state.day===offset?'selected':''}"
              data-day="${offset}">
              <small>${offset===0?'Bugün':names[d.getDay()]}</small>
              <strong>${d.getDate()}</strong>
              <small>${d.toLocaleDateString('tr-TR',{month:'short'})}</small>
            </button>
          `;
        }).join('')}
      </div>
    </section>
  `;
}

function filters() {
  const found = new Map();

  liveMatches.forEach(m => {
    if(m.league?.id && m.league?.name) {
      found.set(String(m.league.id),m.league);
    }
  });

  const priority = {203:0,204:1,78:2,79:3};

  const leagues = [...found.values()].sort((a,b) =>
    (priority[a.id] ?? 10) -
    (priority[b.id] ?? 10) ||
    a.name.localeCompare(b.name,'tr')
  );

  return `
    <section class="section">
      <div class="heading">
        <h2>Ligler</h2>
        <span class="muted">${leagues.length} organizasyon</span>
      </div>
      <div class="chips">
        <button
          class="chip ${state.league==='all'?'selected':''}"
          data-league="all">
          🌍 Tümü
        </button>
        ${leagues.map(l => `
          <button
            class="chip ${String(state.league)===String(l.id)?'selected':''}"
            data-league="${esc(l.id)}">
            ⚽ ${esc(l.name)}
          </button>
        `).join('')}
      </div>
    </section>
  `;
}

function matchCards(onlyFav=false) {
  if(loading && !liveMatches.length) {
    return '<div class="empty">Maçlar yükleniyor...</div>';
  }

  if(loadError && !liveMatches.length) {
    return `
      <div class="empty">
        Maçlar alınamadı: ${esc(loadError)}
        <button class="chip" data-retry-matches="1">
          Yeniden dene
        </button>
      </div>
    `;
  }

  const search = state.search.toLocaleLowerCase('tr');

  const matches = liveMatches.filter(m => {
    const text = `
      ${m.homeTeam?.name || ''}
      ${m.awayTeam?.name || ''}
      ${m.league?.name || ''}
    `.toLocaleLowerCase('tr');

    const date = new Date(m.date);
    const validDate = !Number.isNaN(date.getTime());

    return (
      (onlyFav
        ? favorites.includes(matchId(m))
        : state.league === 'all' ||
          String(m.league?.id) === String(state.league)
      ) &&
      text.includes(search) &&
      validDate &&
      dateKey(date) === selectedDate()
    );
  });

  const groups = new Map();

  matches.forEach(m => {
    const name = m.league?.name || 'Diğer Ligler';
    if(!groups.has(name)) groups.set(name,[]);
    groups.get(name).push(m);
  });

  return [...groups].map(([name,games]) => `
    <article class="league">
      <div class="leaguehead">
        <span>⚽ ${esc(name)}</span>
        <span class="muted">${games.length} maç</span>
      </div>

      ${games.map(m => {
        const score = m.state?.score?.current;
        const parts = score != null
          ? String(score).split(/\s*-\s*/)
          : [];

        const date = new Date(m.date);
        const time = date.toLocaleTimeString('tr-TR',{
          hour:'2-digit',
          minute:'2-digit'
        });

        const id = matchId(m);

        return `
          <div class="match" data-match="${esc(id)}">
            <div class="time">
              ${time}
              <small>${esc(m.state?.description || '')}</small>
            </div>

            <div class="teams">
              <div class="team">
                ${m.homeTeam?.logo
                  ? `<img class="team-logo"
                       src="${esc(m.homeTeam.logo)}"
                       alt="" loading="lazy">`
                  : '<span class="crest">⚽</span>'}
                <span class="teamname">
                  ${esc(m.homeTeam?.name || '')}
                </span>
              </div>

              <div class="team">
                ${m.awayTeam?.logo
                  ? `<img class="team-logo"
                       src="${esc(m.awayTeam.logo)}"
                       alt="" loading="lazy">`
                  : '<span class="crest">⚽</span>'}
                <span class="teamname">
                  ${esc(m.awayTeam?.name || '')}
                </span>
              </div>
            </div>

            <div class="scores">
              ${esc(parts[0] || '–')}<br>
              ${esc(parts[1] || '–')}
            </div>

            <button
              class="iconbtn"
              data-fav="${esc(id)}">
              ${favorites.includes(id)?'★':'☆'}
            </button>
          </div>
        `;
      }).join('')}
    </article>
  `).join('') ||
  '<div class="empty">Bu tarihte veya filtrede maç bulunamadı.</div>';
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
          <h2>${fav?'Takip ettiklerim':'Maç merkezi'}</h2>
          <span class="muted">API maç verileri</span>
        </div>
        <div id="match-list">${matchCards(fav)}</div>
      </section>
    `;
}

function detail() {
  const m = liveMatches.find(
    x => matchId(x) === state.match
  );

  if(!m) return home();

  const tabs = [
    'Genel','Kadro','İstatistik',
    'Anlatım','Puan durumu'
  ];

  return header() + `
    <section class="detail">
      <button class="back" data-go="home">
        ‹ Geri dön
      </button>

      <p class="muted" style="text-align:center">
        ${esc(m.league?.name || 'Maç')}
      </p>

      <div class="versus">
        <div>
          ${m.homeTeam?.logo
            ? `<img class="team-logo"
                 src="${esc(m.homeTeam.logo)}" alt="">`
            : ''}
          ${esc(m.homeTeam?.name || '')}
        </div>

        <span class="vs">
          ${esc(m.state?.score?.current || 'VS')}
        </span>

        <div>
          ${m.awayTeam?.logo
            ? `<img class="team-logo"
                 src="${esc(m.awayTeam.logo)}" alt="">`
            : ''}
          ${esc(m.awayTeam?.name || '')}
        </div>
      </div>

      <p class="muted" style="text-align:center">
        ${esc(m.state?.description || '')}
      </p>
    </section>

    <section class="section">
      <div class="tabs">
        ${tabs.map(t => `
          <button
            class="tab ${state.tab===t?'selected':''}"
            data-tab="${t}">
            ${t}
          </button>
        `).join('')}
      </div>

      <div class="panel">
        <h3>${esc(state.tab)}</h3>
        ${state.tab==='Genel'
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
  if(state.page==='country') {
    return choicePage('🌍 Ülkeni Seç',`
      <h3>Hangi ülkenin futbolunu takip ediyorsun?</h3>
      ${countries.map(c => `
        <button class="chip choice" data-country="${c.code}">
          ${c.flag} ${esc(c.name)}
        </button>
      `).join('')}
    `);
  }

  if(state.page==='chooseLeague') {
    const c = country();

    if(!c) {
      return choicePage('Ülke seç',
        '<button class="chip" data-go="country">Ülke seçimine dön</button>');
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

  if(state.page==='chooseTeam') {
    const l = selectedLeague();

    if(!l) {
      return choicePage('Lig seç',
        '<button class="chip" data-go="chooseLeague">Geri dön</button>');
    }

    let content = `<h3>${esc(l.name)}</h3>`;

    if(state.teamsStatus==='loading') {
      content += '<p>Takımlar yükleniyor...</p>';
    } else if(state.teamsStatus==='error') {
      content += `
        <p>Takımlar alınamadı.</p>
        <button class="chip choice" data-retry-teams="1">
          Yeniden dene
        </button>`;
    } else if(state.teams.length) {
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
      </button>`;

    return choicePage('⭐ Favori Takımını Seç',content);
  }

  if(state.page==='leagues') {
    return choicePage('Ülkeler ve Ligler',
      countries.map(c => `
        <p>
          <strong>${c.flag} ${esc(c.name)}</strong>:
          ${c.leagues.map(l=>esc(l.name)).join(', ')}
        </p>
      `).join('')
    );
  }

  if(state.page==='more') {
    return choicePage('⚙️ Ayarlar',`
      <p>Ülke: ${esc(country()?.name || 'Yok')}</p>
      <p>Lig: ${esc(selectedLeague()?.name || 'Yok')}</p>
      <p>Takım: ${esc(state.teamName || 'Yok')}</p>

      <button class="chip choice" data-go="country">
        Ülke / Lig / Takım Değiştir
      </button>
      <button class="chip choice" data-go="login">
        Giriş / Üyelik
      </button>
    `);
  }

  if(['login','register'].includes(state.page)) {
    return choicePage('Üyelik',
      '<p>Üyelik sistemi henüz aktif değil.</p>');
  }

  const labels = {
    standings:[
      'Puan Durumu',
      'Puan tablosu için ek API bağlantısı gerekiyor.'
    ],
    news:['Haberler','Haber kaynağı henüz bağlı değil.'],
    videos:['Videolar','Video kaynağı henüz bağlı değil.']
  };

  const [title,desc] = labels[state.page] ||
    ['Zirve90','Bu sayfa hazırlanıyor.'];

  return choicePage(title,
    `<h3>${title}</h3><p>${desc}</p>`);
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
          class="${state.page===p?'active':''}"
          data-go="${p}">
          <b>${i}</b>${t}
        </button>
      `).join('')}
    </nav>
  `;
}

function render() {
  if(!root) return;

  const page = state.page==='detail'
    ? detail()
    : ['home','matches','favorites'].includes(state.page)
      ? home()
      : staticPage();

  root.innerHTML = `
    <div class="app">
      ${page}
      <div class="foot">
        ZİRVE90 · Geliştirme sürümü
      </div>
    </div>
    ${navigation()}
  `;

  const input = document.getElementById('search');

  if(input) {
    input.addEventListener('input',e => {
      state.search = e.target.value;
      const list = document.getElementById('match-list');
      if(list) {
        list.innerHTML = matchCards(
          state.page==='favorites'
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
  loading = true;
  loadError = '';
  render();

  try {
    const response = await fetch(`${API_BASE}/matches`,{
      headers:{Accept:'application/json'}
    });

    if(!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if(!Array.isArray(result.data)) {
      throw new Error('Beklenmeyen veri biçimi');
    }

    liveMatches = result.data;
  } catch(err) {
    console.error('Maçlar yüklenemedi:',err);
    loadError = err.message || 'Bağlantı hatası';
  } finally {
    loading = false;
    render();
  }
}

async function loadTeams() {
  const token = ++requestToken;
  state.teams = [];
  state.teamsStatus = 'loading';
  render();

  try {
    const league = selectedLeague();
    if(!league) return;

    const url = `${API_BASE}/teams?league=${encodeURIComponent(league.id)}&season=${encodeURIComponent(seasonFor(league.id))}`;

    const response = await fetch(url,{
      headers:{Accept:'application/json'}
    });

    if(!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if(data.errors &&
      (Array.isArray(data.errors)
        ? data.errors.length
        : Object.keys(data.errors).length)) {
      throw new Error('API yanıt hatası');
    }

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
        typeof x.name==='string'
      )
      .map(x => ({
        id:Number(x.id),
        name:x.name,
        logo:typeof x.logo==='string' &&
          /^https:\/\//.test(x.logo)
          ? x.logo
          : ''
      }))
      .sort((a,b) => a.name.localeCompare(b.name,'tr'));

    if(token!==requestToken) return;

    state.teams = teams;
    state.teamsStatus = 'ready';
  } catch(err) {
    console.error('Takım yükleme hatası:',err);

    if(token!==requestToken) return;
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
  const menu = document.getElementById('sideMenu');

  if(menu) {
    menu.classList.add('open');
    document.getElementById('menuOverlay')
      ?.classList.add('open');
  } else {
    go('more');
  }
}

function go(page) {
  state.page = page;
  render();
  window.scrollTo(0,0);
}

document.addEventListener('click',e => {
  if(e.target.closest('#menuBtn')) {
    openMenu();
    return;
  }

  if(e.target.closest('#closeMenu') ||
    e.target.id==='menuOverlay') {
    closeMenu();
    return;
  }

  const menuItem = e.target.closest('[data-menu-page]');

  if(menuItem) {
    closeMenu();
    go(menuItem.dataset.menuPage);
    return;
  }

  const b = e.target.closest(
    '[data-go],[data-country],[data-choose-league],[data-choose-team],[data-retry-teams],[data-retry-matches],[data-league],[data-day],[data-match],[data-fav],[data-tab]'
  );

  if(!b) return;

  if(b.hasAttribute('data-fav')) {
    const key = b.dataset.fav;

    favorites = favorites.includes(key)
      ? favorites.filter(x=>x!==key)
      : [...favorites,key];

    save('zirve90-favorites-clean',
      JSON.stringify(favorites));

    render();
    return;
  }

  if(b.hasAttribute('data-go')) {
    go(b.dataset.go);
  } else if(b.hasAttribute('data-country')) {
    state.country = b.dataset.country;
    state.favoriteLeague = null;
    state.favoriteTeam = '';
    state.teamName = '';
    go('chooseLeague');
  } else if(b.hasAttribute('data-choose-league')) {
    state.favoriteLeague = Number(b.dataset.chooseLeague);
    state.favoriteTeam = '';
    state.teamName = '';
    state.page = 'chooseTeam';
    loadTeams();
    window.scrollTo(0,0);
  } else if(b.hasAttribute('data-retry-teams')) {
    loadTeams();
  } else if(b.hasAttribute('data-retry-matches')) {
    loadLiveMatches();
  } else if(b.hasAttribute('data-choose-team')) {
    const t = state.teams.find(x =>
      x.id===Number(b.dataset.chooseTeam)
    );

    if(!t) return;

    state.favoriteTeam = String(t.id);
    state.teamName = t.name;

    save('zirve90-country',state.country);
    save('zirve90-league',state.favoriteLeague);
    save('zirve90-team',state.favoriteTeam);
    save('zirve90-team-name',state.teamName);

    go('home');
  } else if(b.hasAttribute('data-league')) {
    state.league = b.dataset.league;
    render();
  } else if(b.hasAttribute('data-day')) {
    state.day = Number(b.dataset.day);
    render();
  } else if(b.hasAttribute('data-match')) {
    state.match = b.dataset.match;
    state.tab = 'Genel';
    go('detail');
  } else if(b.hasAttribute('data-tab')) {
    state.tab = b.dataset.tab;
    render();
  }
});

try {
  render();
  loadLiveMatches();
} catch(err) {
  console.error(err);
  if(root) {
    root.textContent =
      'Zirve90 başlatılamadı: ' + err.message;
  }
}
