
'use strict';

/* ZIRVE90 - MAC MERKEZI V2
   API anahtarini bu dosyaya yazma.
*/

const API_BASE = 'https://zirve90-api.yrdk92.workers.dev';
const root = document.getElementById('app');
const MAX_MATCHES = 100;

function read(key) {
  try { return localStorage.getItem(key) || ''; }
  catch { return ''; }
}

function save(key, value) {
  try { localStorage.setItem(key, String(value)); }
  catch {}
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function norm(value) {
  return String(value ?? '')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function dateKey(d) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0')
  ].join('-');
}

function dayDate(offset) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
}

const countries = [
  {code:'TR',name:'Türkiye',flag:'🇹🇷',leagues:[
    {id:203,name:'Süper Lig'},
    {id:204,name:'1. Lig'}]},
  {code:'DE',name:'Almanya',flag:'🇩🇪',leagues:[
    {id:78,name:'Bundesliga'},
    {id:79,name:'2. Bundesliga'}]},
  {code:'IT',name:'İtalya',flag:'🇮🇹',leagues:[
    {id:135,name:'Serie A'}]},
  {code:'GB',name:'İngiltere',flag:'🏴',leagues:[
    {id:39,name:'Premier League'},
    {id:40,name:'Championship'}]},
  {code:'ES',name:'İspanya',flag:'🇪🇸',leagues:[
    {id:140,name:'La Liga'}]},
  {code:'FR',name:'Fransa',flag:'🇫🇷',leagues:[
    {id:61,name:'Ligue 1'}]},
  {code:'PT',name:'Portekiz',flag:'🇵🇹',leagues:[
    {id:94,name:'Primeira Liga'}]},
  {code:'NL',name:'Hollanda',flag:'🇳🇱',leagues:[
    {id:88,name:'Eredivisie'}]},
  {code:'BE',name:'Belçika',flag:'🇧🇪',leagues:[
    {id:144,name:'Pro League'}]},
  {code:'GR',name:'Yunanistan',flag:'🇬🇷',leagues:[
    {id:197,name:'Super League'}]},
  {code:'SA',name:'Suudi Arabistan',flag:'🇸🇦',leagues:[
    {id:307,name:'Saudi Pro League'}]},
  {code:'BR',name:'Brezilya',flag:'🇧🇷',leagues:[
    {id:71,name:'Série A'}]},
  {code:'AR',name:'Arjantin',flag:'🇦🇷',leagues:[
    {id:128,name:'Primera División'}]},
  {code:'US',name:'ABD',flag:'🇺🇸',leagues:[
    {id:253,name:'MLS'}]}
];

const state = {
  page: read('zirve90-team') ? 'matches' : 'country',
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

let matches = [];
let loading = false;
let loadError = '';
let loadedDate = '';
let requestId = 0;
let teamRequestId = 0;
let favorites = [];

try {
  const stored = JSON.parse(
    read('zirve90-favorites-clean') || '[]'
  );
  favorites = Array.isArray(stored)
    ? stored.map(String)
    : [];
} catch {}

const country = () =>
  countries.find(c => c.code === state.country);

const selectedLeague = () =>
  country()?.leagues.find(
    l => l.id === state.favoriteLeague
  );

function matchId(m) {
  return String(
    m.id ??
    `${m.date}-${m.homeTeam?.name}-${m.awayTeam?.name}`
  );
}

const translations = {
  Turkey:'Türkiye',
  Germany:'Almanya',
  Italy:'İtalya',
  France:'Fransa',
  Spain:'İspanya',
  England:'İngiltere',
  Belgium:'Belçika',
  Netherlands:'Hollanda',
  Greece:'Yunanistan',
  Scotland:'İskoçya',
  Switzerland:'İsviçre',
  Austria:'Avusturya',
  Croatia:'Hırvatistan',
  Serbia:'Sırbistan',
  Albania:'Arnavutluk',
  Finland:'Finlandiya',
  Sweden:'İsveç',
  Norway:'Norveç',
  Denmark:'Danimarka',
  Poland:'Polonya',
  Portugal:'Portekiz',
  Ukraine:'Ukrayna',
  Romania:'Romanya',
  Hungary:'Macaristan',
  Czechia:'Çekya',
  'Czech Republic':'Çekya',
  Slovakia:'Slovakya',
  Slovenia:'Slovenya',
  Bulgaria:'Bulgaristan',
  Cyprus:'Kıbrıs',
  Armenia:'Ermenistan',
  Georgia:'Gürcistan',
  Azerbaijan:'Azerbaycan',
  Kazakhstan:'Kazakistan',
  Moldova:'Moldova',
  Belarus:'Belarus',
  Latvia:'Letonya',
  Lithuania:'Litvanya',
  Estonia:'Estonya',
  Iceland:'İzlanda',
  Ireland:'İrlanda',
  Wales:'Galler',
  'Northern Ireland':'Kuzey İrlanda',
  'North Macedonia':'Kuzey Makedonya',
  Montenegro:'Karadağ',
  'Bosnia and Herzegovina':'Bosna Hersek',
  Luxembourg:'Lüksemburg',
  Liechtenstein:'Lihtenştayn',
  'Faroe Islands':'Faroe Adaları',
  Gibraltar:'Cebelitarık'
};

function teamName(value) {
  return translations[value] || value || 'Bilinmiyor';
}

function status(value) {
  const s = norm(value);

  if (!s || /not started|scheduled|upcoming/.test(s))
    return '';
  if (/finished|full time/.test(s))
    return 'MS';
  if (/half.?time/.test(s))
    return 'İY';
  if (/first half/.test(s))
    return '1. Yarı';
  if (/second half/.test(s))
    return '2. Yarı';
  if (/postponed/.test(s))
    return 'Ertelendi';
  if (/cancelled|canceled/.test(s))
    return 'İptal';
  if (/extra time/.test(s))
    return 'Uzatma';
  if (/penalt/.test(s))
    return 'Penaltı';

  return String(value || '');
}

/* ONCELIK SIRASI */

function priority(m) {
  const name = norm(m.league?.name);
  const code = String(m.country?.code || '').toUpperCase();

  if (/world cup/.test(name) &&
      !/qualification|qualifier/.test(name))
    return 1;

  if (/uefa euro|european championship/.test(name) &&
      !/qualification/.test(name))
    return 2;

  if (/champions league/.test(name))
    return 3;

  if (/europa league/.test(name))
    return 4;

  if (/conference league/.test(name))
    return 5;

  if (/nations league/.test(name))
    return 6;

  if (/world cup.*qualif|world cup.*qualifier/.test(name))
    return 7;

  if (/euro.*qualif/.test(name))
    return 8;

  if (/copa america|africa cup of nations|asian cup/.test(name))
    return 9;

  const lower =
    /2\.\s*bundesliga|3\.\s*liga|1\.\s*lig|2\.\s*lig|3\.\s*lig|championship|segunda|serie b|serie c|ligue 2|league one|league two|reserve|u17|u18|u19|u20|u21|u23|youth|amateur|regional|primavera/.test(name);

  if (lower) return 800;

  const mainCountries = {
    TR:20, DE:21, IT:22, GB:23,
    UK:23, ENG:23, ES:24, FR:25,
    PT:26, NL:27, BE:28, GR:29,
    SA:30, BR:31, AR:32, US:33
  };

  const firstLeague =
    /super lig|süper lig|bundesliga|serie a|premier league|la liga|primera division|primera división|ligue 1|primeira liga|eredivisie|pro league|super league|premiership|major league soccer|^mls$|brasileirao|brasileirão|série a/.test(name);

  if (firstLeague) {
    if (mainCountries[code] !== undefined)
      return mainCountries[code];

    if (/super lig|süper lig/.test(name)) return 20;
    if (/bundesliga/.test(name)) return 21;
    if (/serie a/.test(name)) return 22;
    if (/premier league/.test(name)) return 23;
    if (/la liga/.test(name)) return 24;
    if (/ligue 1/.test(name)) return 25;

    return 70;
  }

  if (/super cup|supercopa|super kupa|superkupa/.test(name))
    return 90;

  if (/cup|kupa|copa|pokal|coppa/.test(name))
    return 100;

  if (mainCountries[code] !== undefined)
    return 180 + mainCountries[code];

  if (/friendly|friendlies/.test(name))
    return 300;

  return 400;
}

function sortMatches(list) {
  return [...list].sort((a,b) =>
    priority(a)-priority(b) ||
    String(a.league?.name || '').localeCompare(
      String(b.league?.name || ''),'tr'
    ) ||
    new Date(a.date)-new Date(b.date)
  );
}

function shownMatches(favoriteOnly=false) {
  const search = norm(state.search);

  return sortMatches(matches)
    .slice(0, MAX_MATCHES)
    .filter(m => {
      const text = norm([
        m.homeTeam?.name,
        m.awayTeam?.name,
        teamName(m.homeTeam?.name),
        teamName(m.awayTeam?.name),
        m.league?.name,
        m.country?.name
      ].join(' '));

      return (
        (!favoriteOnly ||
          favorites.includes(matchId(m))) &&
        (favoriteOnly ||
          state.league==='all' ||
          String(state.league)===String(m.league?.id)) &&
        text.includes(search)
      );
    });
}

function matchTime(m) {
  const d = new Date(m.date);

  return Number.isNaN(d.getTime())
    ? '--:--'
    : d.toLocaleTimeString('tr-TR',{
        hour:'2-digit',
        minute:'2-digit'
      });
}

function score(m) {
  const raw = m.state?.score?.current;
  return raw == null || raw === ''
    ? 'v'
    : String(raw).replace(/\s*-\s*/g,' - ');
}

function groupInfo(m) {
  const league = m.league || {};
  const group =
    league.group ||
    m.group?.name ||
    (typeof m.group==='string' ? m.group : '') ||
    '';

  return {
    key:String(league.id ?? league.name) + '|' + group,
    title:(league.name || 'Diğer Maçlar') +
      (group ? ' · ' + group : '')
  };
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
  const days=['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];

  return `
    <section class="section">
      <div class="heading">
        <h2>Maç takvimi</h2>
        <span class="muted">Tarih seç</span>
      </div>

      <div class="dates">
        ${Array.from({length:61},(_,i)=>{
          const offset=i-30;
          const d=dayDate(offset);

          return `
            <button class="date ${
              state.day===offset?'selected':''
            }" data-day="${offset}">
              <small>${
                offset===0?'Bugün':days[d.getDay()]
              }</small>
              <strong>${d.getDate()}</strong>
              <small>${d.toLocaleDateString('tr-TR',{
                month:'short'
              })}</small>
            </button>
          `;
        }).join('')}
      </div>
    </section>
  `;
}

function filters() {
  const found=new Map();

  shownMatches().forEach(m=>{
    if (m.league?.name) {
      const key=String(m.league.id ?? m.league.name);
      if (!found.has(key)) found.set(key,m);
    }
  });

  // Secili lig filtresi aktifken de diger ligler gorunsun.
  if (state.league!=='all') {
    sortMatches(matches).slice(0,MAX_MATCHES)
      .forEach(m=>{
        if (m.league?.name) {
          const key=String(m.league.id ?? m.league.name);
          if (!found.has(key)) found.set(key,m);
        }
      });
  }

  const leagues=[...found.values()].sort((a,b)=>
    priority(a)-priority(b)
  );

  return `
    <section class="section">
      <div class="heading">
        <h2>Ligler</h2>
        <span class="muted">${leagues.length} lig</span>
      </div>

      <div class="chips">
        <button class="chip ${
          state.league==='all'?'selected':''
        }" data-league="all">🌍 Tümü</button>

        ${leagues.map(m=>`
          <button class="chip ${
            String(state.league)===String(m.league.id)
              ? 'selected':''
          }" data-league="${esc(m.league.id)}">
            ⚽ ${esc(m.league.name)}
          </button>
        `).join('')}
      </div>
    </section>
  `;
}

function matchCards(favoriteOnly=false) {
  if (loading && !matches.length)
    return '<div class="empty">Maçlar yükleniyor...</div>';

  if (loadError && !matches.length) {
    return `
      <div class="empty">
        Maçlar yüklenemedi: ${esc(loadError)}
        <button class="chip" data-retry-matches="1">
          Yeniden dene
        </button>
      </div>
    `;
  }

  const list=shownMatches(favoriteOnly);

  if (!list.length) {
    return `<div class="empty">${
      favoriteOnly
        ? 'Bu tarihte favori maçın yok.'
        : 'Bu tarihte veya filtrede maç bulunamadı.'
    }</div>`;
  }

  const groups=new Map();

  list.forEach(m=>{
    const g=groupInfo(m);

    if (!groups.has(g.key)) {
      groups.set(g.key,{
        title:g.title,
        games:[]
      });
    }

    groups.get(g.key).games.push(m);
  });

  return [...groups.values()].map(g=>`
    <article class="league">
      <div class="leaguehead">
        <span>🏆 ${esc(g.title)}</span>
        <span class="muted">${g.games.length} maç</span>
      </div>

      ${g.games.map(m=>{
        const id=matchId(m);
        const home=teamName(m.homeTeam?.name);
        const away=teamName(m.awayTeam?.name);
        const matchStatus=status(m.state?.description);

        return `
          <div class="match compact-match">
            <div class="time">
              ${matchStatus==='MS'
                ? 'MS'
                : esc(matchTime(m))}
              ${matchStatus && matchStatus!=='MS'
                ? `<small>${esc(matchStatus)}</small>`
                : ''}
            </div>

            <div class="compact-teams"
              data-match="${esc(id)}">

              <div class="compact-team home-team">
                <span class="teamname">${esc(home)}</span>
                ${m.homeTeam?.logo
                  ? `<img class="team-logo"
                      src="${esc(m.homeTeam.logo)}"
                      alt="" loading="lazy">`
                  : ''}
              </div>

              <strong class="compact-score">
                ${esc(score(m))}
              </strong>

              <div class="compact-team away-team">
                ${m.awayTeam?.logo
                  ? `<img class="team-logo"
                      src="${esc(m.awayTeam.logo)}"
                      alt="" loading="lazy">`
                  : ''}
                <span class="teamname">${esc(away)}</span>
              </div>
            </div>

            <button class="star ${
              favorites.includes(id)?'on':''
            }" data-fav="${esc(id)}">
              ${favorites.includes(id)?'★':'☆'}
            </button>
          </div>
        `;
      }).join('')}
    </article>
  `).join('');
}

function home() {
  const fav=state.page==='favorites';

  return header()+
    (fav?'':calendar())+
    `
      <section class="section">
        <input class="search" id="search"
          placeholder="Takım veya lig ara..."
          value="${esc(state.search)}">
      </section>
    `+
    (fav?'':filters())+
    `
      <section class="section">
        <div class="heading">
          <h2>${
            fav?'Takip ettiklerim':'Maç merkezi'
          }</h2>
          <span class="muted">${
            loading
              ? 'Yükleniyor...'
              : shownMatches(fav).length+' maç'
          }</span>
        </div>

        <div id="match-list">
          ${matchCards(fav)}
        </div>
      </section>
    `;
}

function detail() {
  const m=matches.find(x=>matchId(x)===state.match);
  if (!m) return home();

  const tabs=[
    'Genel','Kadro','İstatistik',
    'Anlatım','Puan durumu'
  ];

  return header()+`
    <section class="detail">
      <button class="back" data-go="matches">
        ‹ Geri dön
      </button>

      <p class="muted" style="text-align:center">
        ${esc(groupInfo(m).title)}
      </p>

      <div class="versus">
        <div>
          ${m.homeTeam?.logo
            ? `<img class="team-logo"
                src="${esc(m.homeTeam.logo)}" alt="">`
            : ''}
          ${esc(teamName(m.homeTeam?.name))}
        </div>

        <span class="vs">${esc(score(m))}</span>

        <div>
          ${m.awayTeam?.logo
            ? `<img class="team-logo"
                src="${esc(m.awayTeam.logo)}" alt="">`
            : ''}
          ${esc(teamName(m.awayTeam?.name))}
        </div>
      </div>

      <p class="muted" style="text-align:center">
        ${esc(status(m.state?.description))}
      </p>
    </section>

    <section class="section">
      <div class="tabs">
        ${tabs.map(t=>`
          <button class="tab ${
            state.tab===t?'selected':''
          }" data-tab="${esc(t)}">
            ${esc(t)}
          </button>
        `).join('')}
      </div>

      <div class="panel">
        <h3>${esc(state.tab)}</h3>
        <p>${
          state.tab==='Genel'
            ? 'Maçın temel bilgileri gösteriliyor.'
            : 'Bu bölüm için ek API bağlantısı gerekiyor.'
        }</p>
      </div>
    </section>
  `;
}

function choicePage(title,body) {
  return header()+`
    <section class="section">
      <h2>${title}</h2>
      <div class="panel">${body}</div>
    </section>
  `;
}

function staticPage() {
  if (state.page==='country') {
    return choicePage('🌍 Ülkeni Seç',`
      <h3>Hangi ülkeyi takip ediyorsun?</h3>
      ${countries.map(c=>`
        <button class="chip choice"
          data-country="${c.code}">
          ${c.flag} ${esc(c.name)}
        </button>
      `).join('')}
    `);
  }

  if (state.page==='chooseLeague') {
    const c=country();

    if (!c) return choicePage('Ülke seç',`
      <button class="chip" data-go="country">
        Ülke seçimine dön
      </button>`);

    return choicePage('🏆 Ligini Seç',`
      <h3>${c.flag} ${esc(c.name)}</h3>
      ${c.leagues.map(l=>`
        <button class="chip choice"
          data-choose-league="${l.id}">
          ⚽ ${esc(l.name)}
        </button>
      `).join('')}
      <button class="chip choice" data-go="country">
        ← Ülke seç
      </button>
    `);
  }

  if (state.page==='chooseTeam') {
    const l=selectedLeague();

    if (!l) return choicePage('Lig seç',`
      <button class="chip" data-go="chooseLeague">
        Geri dön
      </button>`);

    let content=`<h3>${esc(l.name)}</h3>`;

    if (state.teamsStatus==='loading') {
      content+='<p>Takımlar yükleniyor...</p>';
    } else if (state.teamsStatus==='error') {
      content+=`
        <p>Takım listesi alınamadı.
        API takım bağlantısı henüz hazır değil.</p>
        <button class="chip choice"
          data-retry-teams="1">Yeniden dene</button>
        <button class="chip choice"
          data-skip-team="1">
          Takım seçmeden devam et
        </button>`;
    } else if (state.teams.length) {
      content+=state.teams.map(t=>`
        <button class="chip choice"
          data-choose-team="${esc(t.id)}">
          ${t.logo
            ? `<img src="${esc(t.logo)}" alt="">`
            : '⚽'}
          ${esc(t.name)}
        </button>
      `).join('');
    } else {
      content+=`
        <p>Takım bulunamadı.</p>
        <button class="chip choice"
          data-skip-team="1">
          Takım seçmeden devam et
        </button>`;
    }

    content+=`
      <button class="chip choice"
        data-go="chooseLeague">
        ← Lig seçimine dön
      </button>`;

    return choicePage('⭐ Favori Takımını Seç',content);
  }

  if (state.page==='leagues') {
    return choicePage('Ülkeler ve Ligler',
      countries.map(c=>`
        <p><strong>${c.flag} ${esc(c.name)}</strong>:
          ${c.leagues.map(l=>esc(l.name)).join(', ')}
        </p>
      `).join(''));
  }

  if (state.page==='more') {
    return choicePage('⚙️ Ayarlar',`
      <h3>🎨 Görünüm</h3>
      <select id="themeSelect"
        style="width:100%;padding:13px;
        border-radius:12px;
        background:var(--surface-alt);
        color:var(--text);
        border:1px solid var(--border)">
        <option value="light">☀️ Beyaz / Yeşil</option>
        <option value="dark">🌙 Siyah / Yeşil</option>
        <option value="auto">📱 Otomatik</option>
      </select>

      <h3 style="margin-top:22px">Futbol Tercihleri</h3>
      <p>Ülke: ${esc(country()?.name || 'Yok')}</p>
      <p>Lig: ${esc(selectedLeague()?.name || 'Yok')}</p>
      <p>Takım: ${esc(state.teamName || 'Yok')}</p>

      <button class="chip choice"
        data-go="country">
        Ülke / Lig / Takım Değiştir
      </button>
    `);
  }

  if (state.page==='login') {
    return choicePage('Üyelik',
      '<p>Üyelik sistemi henüz aktif değil.</p>');
  }

  const labels={
    standings:['Puan Durumu',
      'Puan tablosu API bağlantısı henüz hazır değil.'],
    news:['Haberler',
      'Haber kaynağı henüz bağlı değil.'],
    videos:['Videolar',
      'Video kaynağı henüz bağlı değil.']
  };

  const [title,desc]=labels[state.page] ||
    ['Zirve90','Bu sayfa hazırlanıyor.'];

  return choicePage(title,`
    <h3>${esc(title)}</h3>
    <p>${esc(desc)}</p>
  `);
}

function navigation() {
  const items=[
    ['home','◉','Canlı'],
    ['matches','▦','Maçlar'],
    ['standings','▤','Puan'],
    ['favorites','☆','Takip'],
    ['more','☰','Diğer']
  ];

  return `
    <nav class="bottom">
      ${items.map(([p,i,t])=>`
        <button class="${
          state.page===p?'active':''
        }" data-go="${p}">
          <b>${i}</b>${t}
        </button>
      `).join('')}
    </nav>
  `;
}

function sideMenu() {
  const items=[
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
        <button id="closeMenu">×</button>
      </div>
      ${items.map(([p,label])=>`
        <button data-menu-page="${p}">
          ${label}
        </button>
      `).join('')}
    </aside>
  `;
}

function render() {
  if (!root) return;

  const page=state.page==='detail'
    ? detail()
    : ['home','matches','favorites'].includes(state.page)
      ? home()
      : staticPage();

  root.innerHTML=`
    <div class="app">
      ${page}
      <div class="foot">ZİRVE90</div>
    </div>
    ${navigation()}
    ${sideMenu()}
  `;

  const input=document.getElementById('search');

  if (input) {
    input.addEventListener('input',e=>{
      state.search=e.target.value;
      const list=document.getElementById('match-list');
      if (list) {
        list.innerHTML=matchCards(
          state.page==='favorites'
        );
      }
    });
  }

  const themeSelect=document.getElementById('themeSelect');

  if (themeSelect) {
    themeSelect.value=read('zirve90-theme') || 'light';

    themeSelect.addEventListener('change',e=>{
      applyTheme(e.target.value);
    });
  }

  document.querySelector('.dates .date.selected')
    ?.scrollIntoView({
      behavior:'instant',
      block:'nearest',
      inline:'center'
    });
}

function applyTheme(mode) {
  if (mode==='auto') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute(
      'data-theme',
      mode==='dark'?'dark':'light'
    );
  }
  save('zirve90-theme',mode);
}

async function loadMatches(silent=false) {
  const id=++requestId;
  const date=dateKey(dayDate(state.day));

  if (!silent) {
    loading=true;
    loadError='';
    matches=[];
    render();
  }

  try {
    const response=await fetch(
      `${API_BASE}/matches?date=${encodeURIComponent(date)}`,
      {headers:{Accept:'application/json'}}
    );

    if (!response.ok)
      throw new Error(`HTTP ${response.status}`);

    const result=await response.json();

    if (!Array.isArray(result.data))
      throw new Error('API veri biçimi hatalı');

    if (id!==requestId) return;

    // En onemli 100 mac.
    matches=sortMatches(result.data).slice(0,MAX_MATCHES);
    loadedDate=date;
    loadError='';
  } catch(err) {
    if (id!==requestId) return;

    console.error('Maç hatası:',err);

    if (!silent || !matches.length)
      loadError=err.message || 'Bağlantı hatası';
  } finally {
    if (id===requestId) {
      loading=false;
      render();
    }
  }
}

async function loadTeams() {
  const id=++teamRequestId;
  state.teams=[];
  state.teamsStatus='loading';
  render();

  try {
    const league=selectedLeague();
    if (!league) throw new Error('Lig seçilmedi');

    // Bu endpoint Worker tarafinda henuz eklenmemis olabilir.
    const response=await fetch(
      `${API_BASE}/teams?league=${league.id}`,
      {headers:{Accept:'application/json'}}
    );

    if (!response.ok)
      throw new Error(`HTTP ${response.status}`);

    const result=await response.json();

    const raw=Array.isArray(result.data)
      ? result.data
      : Array.isArray(result.response)
        ? result.response
        : [];

    if (id!==teamRequestId) return;

    state.teams=raw.map(x=>x.team || x)
      .filter(x=>x && x.id!=null && x.name)
      .map(x=>({
        id:String(x.id),
        name:x.name,
        logo:x.logo || ''
      }));

    state.teamsStatus='ready';
  } catch(err) {
    if (id!==teamRequestId) return;
    console.error(err);
    state.teamsStatus='error';
  }

  render();
}

function go(page) {
  state.page=page;
  render();
  window.scrollTo(0,0);
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

document.addEventListener('click',e=>{
  if (e.target.closest('#menuBtn')) {
    openMenu();
    return;
  }

  if (e.target.closest('#closeMenu') ||
      e.target.id==='menuOverlay') {
    closeMenu();
    return;
  }

  const menu=e.target.closest('[data-menu-page]');

  if (menu) {
    closeMenu();
    go(menu.dataset.menuPage);
    return;
  }

  const b=e.target.closest(
    '[data-go],[data-country],[data-choose-league],' +
    '[data-choose-team],[data-skip-team],' +
    '[data-retry-teams],[data-retry-matches],' +
    '[data-league],[data-day],[data-match],' +
    '[data-fav],[data-tab]'
  );

  if (!b) return;

  if (b.hasAttribute('data-fav')) {
    const id=b.dataset.fav;

    favorites=favorites.includes(id)
      ? favorites.filter(x=>x!==id)
      : [...favorites,id];

    save('zirve90-favorites-clean',
      JSON.stringify(favorites));

    render();
    return;
  }

  if (b.hasAttribute('data-go')) {
    go(b.dataset.go);
  } else if (b.hasAttribute('data-country')) {
    state.country=b.dataset.country;
    state.favoriteLeague=null;
    state.favoriteTeam='';
    state.teamName='';
    go('chooseLeague');
  } else if (b.hasAttribute('data-choose-league')) {
    state.favoriteLeague=Number(b.dataset.chooseLeague);
    go('chooseTeam');
    loadTeams();
  } else if (b.hasAttribute('data-retry-teams')) {
    loadTeams();
  } else if (b.hasAttribute('data-retry-matches')) {
    loadMatches();
  } else if (b.hasAttribute('data-skip-team')) {
    save('zirve90-country',state.country);
    save('zirve90-league',state.favoriteLeague);
    go('matches');
  } else if (b.hasAttribute('data-choose-team')) {
    const t=state.teams.find(x=>
      x.id===b.dataset.chooseTeam
    );

    if (!t) return;

    state.favoriteTeam=t.id;
    state.teamName=t.name;

    save('zirve90-country',state.country);
    save('zirve90-league',state.favoriteLeague);
    save('zirve90-team',t.id);
    save('zirve90-team-name',t.name);

    go('matches');
  } else if (b.hasAttribute('data-league')) {
    state.league=b.dataset.league;
    render();
  } else if (b.hasAttribute('data-day')) {
    const nextDay=Number(b.dataset.day);

    if (nextDay!==state.day) {
      state.day=nextDay;
      state.league='all';
      loadMatches();
    }
  } else if (b.hasAttribute('data-match')) {
    state.match=b.dataset.match;
    state.tab='Genel';
    go('detail');
  } else if (b.hasAttribute('data-tab')) {
    state.tab=b.dataset.tab;
    render();
  }
});

applyTheme(read('zirve90-theme') || 'light');
render();
loadMatches();

// Uygulama acikken her 60 saniyede veri yenile.
setInterval(()=>{
  if (document.visibilityState!=='visible') return;

  if (['home','matches','favorites'].includes(state.page)) {
    const currentDate=dateKey(dayDate(state.day));

    if (currentDate!==loadedDate) {
      loadMatches();
    } else if (!loading) {
      loadMatches(true);
    }
  }
},60000);
