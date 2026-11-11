'use strict';
/* ZIRVE90 v3: Static prototype + API-Football-ready team discovery.
   IMPORTANT: Never place your API key here. Set API_BASE to your own secure proxy URL.
   Proxy contract: GET /teams?league=203&season=2026 -> API-Football JSON response.
*/
const API_BASE = 'https://zirve90-api.yrdk92.workers.dev'; // Example: 'https://your-secure-api.example.com' (no trailing slash)
let liveMatches = [];

async function loadLiveMatches() {
  try {
    const response = await fetch(`${API_BASE}/matches`);
    if (!response.ok) throw new Error('API hatası');

    const result = await response.json();
    liveMatches = Array.isArray(result.data) ? result.data : [];

    render();
  } catch (error) {
    console.error('Maçlar yüklenemedi:', error);
  }
}
const countries = [
 {code:'TR',name:'Türkiye',flag:'🇹🇷',leagues:[{id:203,name:'Süper Lig'},{id:204,name:'1. Lig'}]},
 {code:'DE',name:'Almanya',flag:'🇩🇪',leagues:[{id:78,name:'Bundesliga'},{id:79,name:'2. Bundesliga'}]},
 {code:'GB',name:'İngiltere',flag:'🏴',leagues:[{id:39,name:'Premier League'},{id:40,name:'Championship'}]},
 {code:'ES',name:'İspanya',flag:'🇪🇸',leagues:[{id:140,name:'La Liga'},{id:141,name:'Segunda División'}]},
 {code:'IT',name:'İtalya',flag:'🇮🇹',leagues:[{id:135,name:'Serie A'},{id:136,name:'Serie B'}]},
 {code:'FR',name:'Fransa',flag:'🇫🇷',leagues:[{id:61,name:'Ligue 1'},{id:62,name:'Ligue 2'}]},
 {code:'NL',name:'Hollanda',flag:'🇳🇱',leagues:[{id:88,name:'Eredivisie'},{id:89,name:'Eerste Divisie'}]},
 {code:'PT',name:'Portekiz',flag:'🇵🇹',leagues:[{id:94,name:'Primeira Liga'},{id:95,name:'Liga Portugal 2'}]},
 {code:'BE',name:'Belçika',flag:'🇧🇪',leagues:[{id:144,name:'Pro League'},{id:145,name:'Challenger Pro League'}]},
 {code:'SA',name:'Suudi Arabistan',flag:'🇸🇦',leagues:[{id:307,name:'Saudi Pro League'}]},
 {code:'US',name:'ABD',flag:'🇺🇸',leagues:[{id:253,name:'MLS'}]},
 {code:'BR',name:'Brezilya',flag:'🇧🇷',leagues:[{id:71,name:'Série A'},{id:72,name:'Série B'}]},
 {code:'AR',name:'Arjantin',flag:'🇦🇷',leagues:[{id:128,name:'Primera División'}]},
 {code:'GR',name:'Yunanistan',flag:'🇬🇷',leagues:[{id:197,name:'Super League'}]},
 {code:'SC',name:'İskoçya',flag:'🏴',leagues:[{id:179,name:'Premiership'}]}
];
// Fictional matches only. API connection for live fixtures is NOT active.
const leagues = [
 {id:'tr',name:'Trendyol Süper Lig',flag:'🇹🇷',games:[['Galatasaray','Fenerbahçe','19:00','GS','FB'],['Beşiktaş','Trabzonspor','21:00','BJK','TS']]},
 {id:'en',name:'Premier League',flag:'🏴',games:[['Arsenal','Liverpool','18:30','ARS','LIV'],['Chelsea','Manchester City','21:00','CHE','MCI']]},
 {id:'de',name:'Bundesliga',flag:'🇩🇪',games:[['Bayern Münih','Borussia Dortmund','18:30','FCB','BVB']]},
 {id:'es',name:'La Liga',flag:'🇪🇸',games:[['Real Madrid','Barcelona','22:00','RMA','BAR']]},
 {id:'it',name:'Serie A',flag:'🇮🇹',games:[['Inter','Milan','20:45','INT','MIL']]},
 {id:'fr',name:'Ligue 1',flag:'🇫🇷',games:[['PSG','Marseille','21:00','PSG','OM']]},
 {id:'pt',name:'Primeira Liga',flag:'🇵🇹',games:[['Benfica','Porto','21:15','BEN','POR']]},
 {id:'nl',name:'Eredivisie',flag:'🇳🇱',games:[['Ajax','PSV','20:00','AJA','PSV']]},
 {id:'be',name:'Pro League',flag:'🇧🇪',games:[['Club Brugge','Anderlecht','19:30','BRU','AND']]},
 {id:'sa',name:'Saudi Pro League',flag:'🇸🇦',games:[['Al Hilal','Al Nassr','20:00','HIL','NAS']]},
 {id:'br',name:'Brasileirão',flag:'🇧🇷',games:[['Flamengo','Palmeiras','22:00','FLA','PAL']]},
 {id:'ar',name:'Primera División',flag:'🇦🇷',games:[['Boca Juniors','River Plate','23:00','BOC','RIV']]},
 {id:'uefa',name:'UEFA Şampiyonlar Ligi',flag:'🏆',games:[['Real Madrid','Bayern Münih','22:00','RMA','FCB']]}
];
const root=document.getElementById('app');
const read=(key)=>{try{return localStorage.getItem(key)||'';}catch{return '';}};
const save=(key,val)=>{try{localStorage.setItem(key,String(val));}catch{}};
const state={page:read('zirve90-team')?'home':'country',league:'all',search:'',day:0,match:null,tab:'Genel',country:read('zirve90-country'),favoriteLeague:Number(read('zirve90-league'))||null,favoriteTeam:read('zirve90-team'),teamName:read('zirve90-team-name'),teams:[],teamsStatus:'idle'};
let favorites=[];
try{const f=JSON.parse(read('zirve90-favorites-clean')||'[]');favorites=Array.isArray(f)?f:[];}catch{}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const matchKey=(l,i)=>`${l.id}-${i}`;
const country=()=>countries.find(c=>c.code===state.country);
const selectedLeague=()=>country()?.leagues.find(l=>l.id===state.favoriteLeague);
const seasonFor=(leagueId)=>{const now=new Date();const year=now.getFullYear();const month=now.getMonth()+1;const calendarYearLeagues=new Set([71,72,128,253]);return calendarYearLeagues.has(Number(leagueId))?year:(month>=7?year:year-1);};
function header(){return `<header class="hero"><div class="top"><div style="display:flex;align-items:center;gap:12px"><button class="iconbtn" id="menuBtn" aria-label="Menüyü aç">☰</button><div class="brand">ZİRVE<span>90</span></div></div><div class="actions"><button class="iconbtn" data-go="favorites">☆</button><button class="iconbtn" data-go="more">⚙</button></div></div></header>`;}
function calendar(){const names=['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];return `<section class="section"><div class="heading"><h2>Maç takvimi</h2><span class="muted">Tarih seç</span></div><div class="dates">${Array.from({length:61},(_,i)=>{const offset=i-30,d=new Date();d.setDate(d.getDate()+offset);return `<button class="date ${state.day===offset?'selected':''}" data-day="${offset}"><small>${offset===0?'Bugün':names[d.getDay()]}</small><strong>${d.getDate()}</strong><small>${d.toLocaleDateString('tr-TR',{month:'short'})}</small></button>`;}).join('')}</div></section>`;}

function filters(){
  const realLeagues = [...new Map(
    liveMatches
      .filter(m => m.league?.name)
      .map(m => [m.league.id, m.league])
  ).values()];

  return `<section class="section">
    <div class="heading">
      <h2>Ligler</h2>
      <span class="muted">${realLeagues.length} organizasyon</span>
    </div>
    <div class="chips">
      <button class="chip ${state.league==='all'?'selected':''}"
        data-league="all">🌍 Tümü</button>
      ${realLeagues.map(l=>`
        <button class="chip ${String(state.league)===String(l.id)?'selected':''}"
          data-league="${esc(String(l.id))}">
          ⚽ ${esc(l.name)}
        </button>
      `).join('')}
    </div>
  </section>`;
}


let realMatches = [];

async function loadMatches() {
  try {
    const response = await fetch(`${API_BASE}/matches`);
    if (!response.ok) throw new Error('API hatası');

    const result = await response.json();
    realMatches = Array.isArray(result.data) ? result.data : [];
    console.log('Gerçek maç sayısı:', realMatches.length);
  } catch (error) {
    console.error('Maçlar alınamadı:', error);
  }
}

loadLiveMatches();


function matchCards(onlyFav=false){
  if (!liveMatches.length) {
    return '<div class="empty">Şu anda gösterilecek gerçek maç bulunamadı.</div>';
  }

  const matches = liveMatches.filter(m => {
    const search = `${m.homeTeam?.name || ''} ${m.awayTeam?.name || ''} ${m.league?.name || ''}`.toLocaleLowerCase('tr');
    return search.includes(state.search.toLocaleLowerCase('tr'));
  });

  const groups = {};
  matches.forEach(m => {
    const name = m.league?.name || 'Diğer Ligler';
    (groups[name] ||= []).push(m);
  });

  return Object.entries(groups).map(([name, games]) => `
    <article class="league">
      <div class="leaguehead">
        <span>⚽ ${esc(name)}</span>
        <span class="muted">${games.length} maç</span>
      </div>
      ${games.map(m => {
        const score = m.state?.score?.current;
        const parts = score ? String(score).split(/\s*-\s*/) : [];
        const time = new Date(m.date).toLocaleTimeString('tr-TR', {
          hour:'2-digit', minute:'2-digit'
        });
        return `
          <div class="match">
            <div class="time">${time}<small>${esc(m.state?.description || '')}</small></div>
            <div class="teams">
              <div class="team"><span class="teamname">${esc(m.homeTeam?.name || '')}</span></div>
              <div class="team"><span class="teamname">${esc(m.awayTeam?.name || '')}</span></div>
            </div>
            <div class="scores">${esc(parts[0] || '–')}<br>${esc(parts[1] || '–')}</div>
          </div>
        `;
      }).join('')}
    </article>
  `).join('') || '<div class="empty">Maç bulunamadı.</div>';
}


function home(){
  const fav=state.page==='favorites';
  return header()+
    (fav?'':calendar())+
    `<section class="section">
      <input class="search" id="search" placeholder="Takım veya lig ara..." value="${esc(state.search)}">
    </section>`+
    (!fav?filters():'')+
    `<section class="section">
      <div class="heading">
        <h2>${fav?'Takip ettiklerim':'Maç merkezi'}</h2>
        <span class="muted">Gerçek maç verileri</span>
      </div>
      <div id="match-list">${matchCards(fav)}</div>
    </section>`;
}

function detail(){if(!state.match)return home();const l=leagues.find(x=>x.id===state.match.id),g=l?.games[state.match.index];if(!g)return home();const tabs=['Genel','Kadro','İstatistik','Anlatım','Puan durumu'];return `<section class="detail"><button class="back" data-go="home">‹ Geri dön</button><p class="muted" style="text-align:center">${l.flag} ${esc(l.name)} · ÖRNEK MAÇ</p><div class="versus"><div><span class="bigcrest">${esc(g[3])}</span>${esc(g[0])}</div><span class="vs">VS</span><div><span class="bigcrest">${esc(g[4])}</span>${esc(g[1])}</div></div><p class="muted" style="text-align:center">${g[2]} · Gerçek maç verisi bağlı değil</p></section><div class="section"><div class="tabs">${tabs.map(t=>`<button class="tab ${state.tab===t?'selected':''}" data-tab="${t}">${t}</button>`).join('')}</div></div>${state.tab==='Kadro'?`<div class="panel"><h3>Örnek 4-3-3 dizilişi</h3>Oyuncular temsili olarak gösterilmektedir.</div><div class="pitch">${[[9,10,11],[7,8,6],[3,4,5,2],[1]].map(row=>`<div class="pitchrow">${row.map(n=>`<div class="player"><div class="shirt">${n}</div>Oyuncu ${n}</div>`).join('')}</div>`).join('')}</div>`:`<div class="panel"><h3>${esc(state.tab)}</h3>${state.tab==='Genel'?'Maç detayları burada gösterilecek.':'Gerçek futbol verileri API bağlantısından sonra gösterilecek.'}</div>`}`;}
function choicePage(title,body){return header()+`<section class="section"><h2>${title}</h2><div class="panel">${body}</div></section>`;}
function staticPage(){
 if(state.page==='country')return choicePage('🌍 Ülkeni Seç',`<h3>Hangi ülkenin futbolunu takip ediyorsun?</h3><p>15 ülke arasından seçimini yap.</p>${countries.map(c=>`<button class="chip choice" data-country="${c.code}">${c.flag} ${esc(c.name)}</button>`).join('')}`);
 if(state.page==='chooseLeague'){const c=country();if(!c)return choicePage('Ülke seçimi','<button class="chip" data-go="country">Ülke seçimine dön</button>');return choicePage('🏆 Ligini Seç',`<h3>${c.flag} ${esc(c.name)}</h3><p>Takip etmek istediğin ligi seç.</p>${c.leagues.map(l=>`<button class="chip choice" data-choose-league="${l.id}">⚽ ${esc(l.name)} <small>API-Football Lig ID: ${l.id}</small></button>`).join('')}<button class="chip choice" data-go="country">← Ülke Seçimine Dön</button>`);}
 if(state.page==='chooseTeam'){const l=selectedLeague();if(!l)return choicePage('Lig seçimi','<button class="chip" data-go="chooseLeague">Lig seçimine dön</button>');let content=`<h3>${esc(l.name)}</h3><p>Favori takımını seç.</p>`;if(state.teamsStatus==='loading')content+='<p>Takımlar yükleniyor...</p>';else if(state.teamsStatus==='unconfigured')content+='<p>Gerçek takımları listelemek için güvenli API bağlantısı gerekiyor. Takım isimlerini uydurmak yerine API-Football üzerinden çekeceğiz.</p><p class="hint">Lig ID: '+l.id+' · Sezon: '+seasonFor(l.id)+'</p>';else if(state.teamsStatus==='error')content+='<p>Takımlar alınamadı. API bağlantısını kontrol edin.</p><button class="chip choice" data-retry-teams="1">Yeniden dene</button>';else if(state.teams.length)content+=state.teams.map(t=>`<button class="chip choice" data-choose-team="${t.id}">${t.logo?`<img src="${esc(t.logo)}" alt="" loading="lazy">`: '⚽'} ${esc(t.name)}</button>`).join('');else content+='<p>Bu sezon için takım bulunamadı.</p>';content+='<button class="chip choice" data-go="chooseLeague">← Lig Seçimine Dön</button>';return choicePage('⭐ Favori Takımını Seç',content);}
 if(state.page==='login')return choicePage('Hesabına Giriş Yap',`<h3>ZİRVE90 Hesabım</h3><p>Üyelik henüz demo aşamasında.</p><form id="loginForm"><input class="search" type="email" placeholder="E-posta adresin" autocomplete="email" required><input class="search" type="password" placeholder="Şifren" autocomplete="current-password" minlength="6" required><button type="button" class="date selected" disabled style="width:100%">Giriş Yap (Yakında)</button></form><button class="chip choice" data-go="register">Hesabın yok mu? Üye Ol</button>`);
 if(state.page==='register')return choicePage('Üye Ol',`<h3>ZİRVE90 Hesabını Oluştur</h3><p>Üyelik sistemi henüz aktif değil.</p><form id="registerForm"><input class="search" type="text" placeholder="Ad Soyad" autocomplete="name" required><input class="search" type="email" placeholder="E-posta adresin" autocomplete="email" required><input class="search" type="password" placeholder="Şifre (en az 6 karakter)" minlength="6" required><input class="search" type="password" placeholder="Şifre tekrar" minlength="6" required><button class="date selected" type="button" disabled style="width:100%">Hesap Oluştur (Yakında)</button></form><button class="chip choice" data-go="login">Zaten hesabın var mı? Giriş Yap</button>`);
 if(state.page==='leagues')return choicePage('🌍 Ülkeler ve Ligler',`<p>API-Football ID sistemindeki ${countries.length} ülke ve ligleri incele.</p>${countries.map(c=>`<div style="margin:14px 0"><strong>${c.flag} ${esc(c.name)}</strong>${c.leagues.map(l=>`<div class="muted">${esc(l.name)} · ID ${l.id}</div>`).join('')}</div>`).join('')}<button class="chip choice" data-go="country">Favori ülke seç</button>`);
 if(state.page==='more')return choicePage('⚙️ Ayarlar',`<h3>Zirve90 v3</h3><p>Seçili ülke: ${esc(country()?.name||'Yok')}</p><p>Seçili lig: ${esc(selectedLeague()?.name||'Yok')}</p><p>Favori takım: ${esc(state.teamName||'Henüz seçilmedi')}</p><button class="chip choice" data-go="country">🌍 Ülke / Lig / Takım Değiştir</button><p class="hint">Üyelik ve gerçek canlı skor bağlantısı henüz aktif değil.</p>`);
 const labels={standings:['Puan Durumu','Gerçek puan tablosu API bağlantısından sonra açılacak.'],news:['Haberler','Haber kaynağı henüz bağlı değil.'],videos:['Videolar','Video kaynağı henüz bağlı değil.']};const [title,desc]=labels[state.page]||['Zirve90','Bu sayfa hazırlanıyor.'];return choicePage(title,`<h3>${esc(title)}</h3><p>${esc(desc)}</p>`);
}
function navigation(){return `<nav class="bottom">${[['home','◉','Canlı'],['matches','▦','Maçlar'],['standings','▤','Puan'],['favorites','☆','Takip'],['more','☰','Diğer']].map(([p,i,t])=>`<button class="${state.page===p?'active':''}" data-go="${p}"><b>${i}</b>${t}</button>`).join('')}</nav>`;}
function render(){if(!root)return;const page=state.page==='detail'?detail():['home','matches','favorites'].includes(state.page)?home():staticPage();root.innerHTML=`<div class="app">${page}<div class="notice">ⓘ DEMO: Maçlar ve saatler örnektir. Gerçek canlı skor henüz bağlı değildir.</div><div class="foot">ZİRVE90 · Geliştirme sürümü</div></div>${navigation()}`;const input=document.getElementById('search');if(input)input.addEventListener('input',e=>{state.search=e.target.value;const list=document.getElementById('match-list');if(list)list.innerHTML=matchCards(state.page==='favorites');});const selected=document.querySelector('.dates .date.selected');if(selected)selected.scrollIntoView({behavior:'instant',block:'nearest',inline:'center'});}
let requestToken=0;
async function loadTeams(){const token=++requestToken;state.teams=[];state.teamsStatus=API_BASE?'loading':'unconfigured';render();if(!API_BASE)return;try{const league=selectedLeague();if(!league)return;const url=`${API_BASE}/teams?league=${encodeURIComponent(league.id)}&season=${encodeURIComponent(seasonFor(league.id))}`;const response=await fetch(url,{headers:{Accept:'application/json'}});if(!response.ok)throw Error('HTTP '+response.status);const data=await response.json();if(data.errors&&(Array.isArray(data.errors)?data.errors.length:Object.keys(data.errors).length))throw Error('API response error');const teams=(data.response||[]).map(x=>x.team).filter(x=>x&&Number.isInteger(x.id)&&typeof x.name==='string').map(x=>({id:x.id,name:x.name,logo:typeof x.logo==='string'&&/^https:\/\//.test(x.logo)?x.logo:''})).sort((a,b)=>a.name.localeCompare(b.name,'tr'));if(token!==requestToken)return;state.teams=teams;state.teamsStatus='ready';render();}catch(err){console.error('Team request failed',err);if(token!==requestToken)return;state.teamsStatus='error';render();}}
function closeMenu(){document.getElementById('sideMenu')?.classList.remove('open');document.getElementById('menuOverlay')?.classList.remove('open');}
function openMenu(){document.getElementById('sideMenu')?.classList.add('open');document.getElementById('menuOverlay')?.classList.add('open');}
function go(page){state.page=page;render();window.scrollTo(0,0);}
document.addEventListener('click',e=>{
 if(e.target.closest('#menuBtn')){openMenu();return;}
 if(e.target.closest('#closeMenu')||e.target.id==='menuOverlay'){closeMenu();return;}
 const menuItem=e.target.closest('[data-menu-page]');if(menuItem){closeMenu();go(menuItem.dataset.menuPage);return;}
 const b=e.target.closest('[data-go],[data-country],[data-choose-league],[data-choose-team],[data-retry-teams],[data-league],[data-day],[data-match],[data-fav],[data-tab]');if(!b)return;
 if(b.hasAttribute('data-go'))go(b.dataset.go);
 else if(b.hasAttribute('data-country')){state.country=b.dataset.country;state.favoriteLeague=null;state.favoriteTeam='';state.teamName='';go('chooseLeague');}
 else if(b.hasAttribute('data-choose-league')){state.favoriteLeague=Number(b.dataset.chooseLeague);state.favoriteTeam='';state.teamName='';state.page='chooseTeam';loadTeams();window.scrollTo(0,0);}
 else if(b.hasAttribute('data-retry-teams'))loadTeams();
 else if(b.hasAttribute('data-choose-team')){const t=state.teams.find(x=>x.id===Number(b.dataset.chooseTeam));if(!t)return;state.favoriteTeam=String(t.id);state.teamName=t.name;save('zirve90-country',state.country);save('zirve90-league',state.favoriteLeague);save('zirve90-team',state.favoriteTeam);save('zirve90-team-name',state.teamName);go('home');}
 else if(b.hasAttribute('data-league')){state.league=b.dataset.league;render();}
 else if(b.hasAttribute('data-day')){state.day=Number(b.dataset.day);render();}
 else if(b.hasAttribute('data-match')){const [id,index]=b.dataset.match.split(':');state.match={id,index:Number(index)};state.tab='Genel';go('detail');}
 else if(b.hasAttribute('data-fav')){const k=b.dataset.fav;favorites=favorites.includes(k)?favorites.filter(x=>x!==k):[...favorites,k];save('zirve90-favorites-clean',JSON.stringify(favorites));render();}
 else if(b.hasAttribute('data-tab')){state.tab=b.dataset.tab;render();}
});
try{render();}catch(err){console.error(err);if(root)root.textContent='Zirve90 başlatılamadı: '+err.message;}
