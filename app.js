'use strict';
// All fixtures are fictional UI samples, not live football data.
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
const root = document.getElementById('app');

const state = {
  page: 'home',
  league: 'all',
  search: '',
  day: 0,
  match: null,
  tab: 'Genel',
  country: '',
  favoriteLeague: '',
  favoriteTeam: ''
};

let favorites=[];
try { const stored=JSON.parse(localStorage.getItem('zirve90-favorites-clean')||'[]'); favorites=Array.isArray(stored)?stored:[]; } catch(e) { favorites=[]; }
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const matchKey=(league,index)=>`${league.id}-${index}`;

function header(){
  return `
    <header class="hero">
      <div class="top">
        <div style="display:flex;align-items:center;gap:12px">
          <button class="iconbtn" id="menuBtn" aria-label="Menüyü aç">☰</button>
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

function calendar(){const names=['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];return `<section class="section"><div class="heading"><h2>Maç takvimi</h2><span class="muted">Tarih seç</span></div><div class="dates">${Array.from({length:61},(_,i)=>{const offset=i-30;const d=new Date();d.setDate(d.getDate()+offset);return `<button class="date ${state.day===offset?'selected':''}" data-day="${offset}"><small>${offset===0?'Bugün':names[d.getDay()]}</small><strong>${d.getDate()}</strong><small>${d.toLocaleDateString('tr-TR',{month:'short'})}</small></button>`}).join('')}</div></section>`;}
function filters(){return `<section class="section"><div class="heading"><h2>Ligler</h2><span class="muted">${leagues.length} organizasyon</span></div><div class="chips"><button class="chip ${state.league==='all'?'selected':''}" data-league="all">🌍 Tümü</button>${leagues.map(l=>`<button class="chip ${state.league===l.id?'selected':''}" data-league="${l.id}">${l.flag} ${escapeHtml(l.name)}</button>`).join('')}</div></section>`;}
function matchCards(onlyFav=false){const groups=leagues.filter(l=>state.league==='all'||state.league===l.id).map(l=>{const games=l.games.map((g,i)=>({g,i})).filter(({g,i})=>(!onlyFav||favorites.includes(matchKey(l,i)))&&`${g[0]} ${g[1]} ${l.name}`.toLocaleLowerCase('tr').includes(state.search.toLocaleLowerCase('tr')));if(!games.length)return '';return `<article class="league"><div class="leaguehead"><span>${l.flag} ${escapeHtml(l.name)}</span><span class="muted">${games.length} maç</span></div>${games.map(({g,i})=>`<div class="match"><div class="time">${g[2]}<small>ÖRNEK</small></div><div class="teams" data-match="${l.id}:${i}"><div class="team"><span class="crest">${g[3].slice(0,2)}</span><span class="teamname">${escapeHtml(g[0])}</span></div><div class="team"><span class="crest">${g[4].slice(0,2)}</span><span class="teamname">${escapeHtml(g[1])}</span></div></div><div class="scores">–<br>–</div><button class="star ${favorites.includes(matchKey(l,i))?'on':''}" data-fav="${matchKey(l,i)}">${favorites.includes(matchKey(l,i))?'★':'☆'}</button></div>`).join('')}</article>`}).join('');return groups||'<div class="empty">Bu filtrede maç bulunamadı.</div>';}
function home(){const onlyFav=state.page==='favorites';return header()+(onlyFav?'':calendar())+`<section class="section"><input class="search" id="search" placeholder="Takım veya lig ara..." value="${escapeHtml(state.search)}"></section>`+(!onlyFav?filters():'')+`<section class="section"><div class="heading"><h2>${onlyFav?'Takip ettiklerim':'Maç merkezi'}</h2><span class="muted">Örnek veriler</span></div><div id="match-list">${matchCards(onlyFav)}</div></section>`;}
function detail(){if(!state.match)return home();const l=leagues.find(x=>x.id===state.match.id);const g=l?.games[state.match.index];if(!g)return home();const tabs=['Genel','Kadro','İstatistik','Anlatım','Puan durumu'];return `<section class="detail"><button class="back" data-go="home">‹ Geri dön</button><p class="muted" style="text-align:center">${l.flag} ${escapeHtml(l.name)} · ÖRNEK MAÇ</p><div class="versus"><div><span class="bigcrest">${g[3]}</span>${escapeHtml(g[0])}</div><span class="vs">VS</span><div><span class="bigcrest">${g[4]}</span>${escapeHtml(g[1])}</div></div><p class="muted" style="text-align:center">${g[2]} · Gerçek maç verisi bağlı değil</p></section><div class="section"><div class="tabs">${tabs.map(t=>`<button class="tab ${state.tab===t?'selected':''}" data-tab="${t}">${t}</button>`).join('')}</div></div>${state.tab==='Kadro'?`<div class="panel"><h3>Örnek 4-3-3 dizilişi</h3>Oyuncular temsili olarak gösterilmektedir.</div><div class="pitch">${[[9,10,11],[7,8,6],[3,4,5,2],[1]].map(row=>`<div class="pitchrow">${row.map(n=>`<div class="player"><div class="shirt">${n}</div>Oyuncu ${n}</div>`).join('')}</div>`).join('')}</div>`:`<div class="panel"><h3>${escapeHtml(state.tab)}</h3>${state.tab==='Genel'?'Maç detayları burada gösterilecek.': 'Gerçek futbol verileri API bağlantısından sonra gösterilecek.'}</div>`}`;}

function staticPage(){
  
  if(state.page==='country'){
    return header()+`
      <section class="section">
        <h2>🌍 Ülkeni Seç</h2>
        <div class="panel">
          <h3>Hangi ülkenin futbolunu takip ediyorsun?</h3>
          <p>Liglerini ve favori takımını seçmek için devam et.</p>

          <button class="chip"
            type="button"
            data-country="TR"
            style="display:block;width:100%;margin:12px 0;text-align:left">
            🇹🇷 Türkiye
          </button>

          <button class="chip"
            type="button"
            data-country="DE"
            style="display:block;width:100%;margin:12px 0;text-align:left">
            🇩🇪 Almanya
          </button>

          <p class="muted">
            Sonraki adım: Lig seçimi
          </p>
        </div>
      </section>`;
  }

  if(state.page==='register'){
    return header()+`
      <section class="section">
        <h2>Üye Ol</h2>
        <div class="panel">
          <h3>ZİRVE90 Hesabını Oluştur</h3>
          <p>Takımını seç, maçları takip et.</p>

          <form id="registerForm">
            <input class="search"
              type="text"
              placeholder="Ad Soyad"
              autocomplete="name"
              required>

            <input class="search"
              type="email"
              placeholder="E-posta adresin"
              autocomplete="email"
              required>

            <input class="search"
              type="password"
              placeholder="Şifre (en az 6 karakter)"
              autocomplete="new-password"
              minlength="6"
              required>

            <input class="search"
              type="password"
              placeholder="Şifre tekrar"
              autocomplete="new-password"
              minlength="6"
              required>

            <button type="button"
              class="date selected"
              style="width:100%;margin-bottom:12px"
              disabled>
              Hesap Oluştur (Yakında)
            </button>
          </form>

          <button class="chip"
            type="button"
            data-go="login"
            style="width:100%">
            Zaten hesabın var mı? Giriş Yap
          </button>

          <p class="muted">
            Demo ekranı. Gerçek üyelik henüz aktif değil.
          </p>
        </div>
      </section>`;
  }

  if(state.page==='login'){
    return header()+`
      <section class="section">
        <h2>Hesabına Giriş Yap</h2>
        <div class="panel">
          <h3>ZİRVE90 Hesabım</h3>
          <p>Favori takımlarını takip etmek için hesabını oluştur.</p>

          <form id="loginForm">
            <input class="search"
              type="email"
              placeholder="E-posta adresin"
              autocomplete="email"
              required>

            <input class="search"
              type="password"
              placeholder="Şifren"
              autocomplete="current-password"
              minlength="6"
              required>

            <button type="submit" class="date selected"
              style="width:100%;margin-bottom:12px">
              Giriş Yap
            </button>
          </form>

          
<button class="chip" type="button"
data-go="register"
  style="width:100%">
  Hesabın yok mu? Üye Ol
</button>


          <p class="muted" style="margin-top:15px">
            Üyelik sistemi henüz demo aşamasındadır.
          </p>
        </div>
      </section>`;
  }

  return header()+`
    <section class="section">
      <h2>${state.page==='standings'?'Puan durumu':'Ayarlar'}</h2>
      <div class="panel">
        <h3>${state.page==='standings'?'Gerçek puan tablosu yakında':'Zirve90 v1.0'}</h3>
        ${state.page==='standings'
          ?'Gerçek puan tablosu API bağlandığında açılacak.'
          :'Bu sürüm arayüz önizlemesidir.'}
      </div>
    </section>`;
}

function navigation(){return `<nav class="bottom">${[['home','◉','Canlı'],['matches','▦','Maçlar'],['standings','▤','Puan'],['favorites','☆','Takip'],['more','☰','Diğer']].map(([p,i,t])=>`<button class="${state.page===p?'active':''}" data-go="${p}"><b>${i}</b>${t}</button>`).join('')}</nav>`;}

function render(){
  if(!root)return;

  const page=state.page==='detail'
    ?detail()
    :['home','matches','favorites'].includes(state.page)
      ?home()
      :staticPage();

  root.innerHTML=`<div class="app">${page}<div class="notice">ⓘ DEMO: Bu ekrandaki maçlar ve saatler örnektir. Canlı skor verisi henüz bağlı değildir.</div><div class="foot">ZİRVE90 · Tasarım önizlemesi</div></div>${navigation()}`;

  const input=document.getElementById('search');

  if(input){
    input.addEventListener('input',e=>{
      state.search=e.target.value;
      document.getElementById('match-list').innerHTML=matchCards(state.page==='favorites');
    });
  }

  // Takvimde secili gunu otomatik ortala
  const selectedDate=document.querySelector('.dates .date.selected');

  if(selectedDate){
    selectedDate.scrollIntoView({
      behavior:'instant',
      block:'nearest',
      inline:'center'
    });
  }
}

document.addEventListener('click',e=>{const b=e.target.closest('[data-go],[data-league],[data-day],[data-match],[data-fav],[data-tab]');if(!b)return;if(b.hasAttribute('data-go')){state.page=b.dataset.go;render();window.scrollTo(0,0);}else if(b.hasAttribute('data-league')){state.league=b.dataset.league;render();}else if(b.hasAttribute('data-day')){state.day=Number(b.dataset.day);render();}else if(b.hasAttribute('data-match')){const [id,index]=b.dataset.match.split(':');state.match={id,index:Number(index)};state.tab='Genel';state.page='detail';render();window.scrollTo(0,0);}else if(b.hasAttribute('data-fav')){const k=b.dataset.fav;favorites=favorites.includes(k)?favorites.filter(x=>x!==k):[...favorites,k];try{localStorage.setItem('zirve90-favorites-clean',JSON.stringify(favorites));}catch(e){}render();}else if(b.hasAttribute('data-tab')){state.tab=b.dataset.tab;render();}});
try{render();}catch(err){console.error(err);if(root)root.textContent='Zirve90 başlatılamadı: '+err.message;}

