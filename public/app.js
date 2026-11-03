const PLACES=window.PLACES;
const GEO={};
const S='fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';
const ic=d=>`<svg viewBox="0 0 24 24" ${S} aria-hidden="true">${d}</svg>`;
const CATS={
 pub:{l:'Pubs',c:'#c9780a',i:ic('<path d="M7 4h10l-1.4 16H8.4z"/><path d="M7.4 9h9.2"/>')},
 bar:{l:'Wijn, cocktails & craft beer',c:'#9b2c6e',i:ic('<path d="M7 3h10c0 5-2 8-5 8s-5-3-5-8z"/><path d="M12 11v9M8 21h8"/>')},
 brew:{l:'Brouwerijen & whiskey',c:'#5b8c12',i:ic('<ellipse cx="12" cy="5" rx="6" ry="2"/><path d="M6 5c-1 5-1 9 0 14 0 1 3 2 6 2s6-1 6-2c1-5 1-9 0-14"/><path d="M5.6 12h12.8"/>')},
 food:{l:'Restaurants',c:'#d1342b',i:ic('<path d="M7 3v7a2 2 0 0 0 2 2v9M11 3v7a2 2 0 0 1-2 2M9 3v6"/><path d="M17 21V3c-2 1-3 4-3 8h3"/>')},
 sea:{l:'Seafood & oesters',c:'#0b8aa8',i:ic('<path d="M3 12c3-5 9-6 13 0-4 6-10 5-13 0z"/><path d="M16 12l5-4v8z"/><circle cx="8" cy="11" r=".6" fill="#fff"/>')},
 cafe:{l:'Koffie & cafés',c:'#7a4b30',i:ic('<path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M16 11h2a2 2 0 0 1 0 4h-2M8 3v3M12 3v3"/>')},
 bake:{l:'Bakkerijen',c:'#d0457f',i:ic('<path d="M3 15c0-5 4-8 9-8s9 3 9 8v3H3z"/><path d="M9 9l-1 4M14 8.5l-1 4.5M18 10l-1 3"/>')},
 cult:{l:'Cultuur & boeken',c:'#2f5fd0',i:ic('<path d="M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1z"/><path d="M12 6v14"/>')},
 heri:{l:'Erfgoed & kastelen',c:'#6b625a',i:ic('<path d="M4 21V9h3V6h2v3h2V6h2v3h2V6h2v3h3v12z"/><path d="M10 21v-4a2 2 0 0 1 4 0v4"/>')},
 nat:{l:'Natuur, stranden & wandelen',c:'#14805a',i:ic('<path d="M12 3l6 9h-3l4 6H5l4-6H6z"/><path d="M12 18v3"/>')},
 fest:{l:'Festivals & sport',c:'#b43ac4',i:ic('<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>')},
 shop:{l:'Winkels & markten',c:'#0f7068',i:ic('<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>')},
 stay:{l:'Overnachten',c:'#2a3f86',i:ic('<path d="M3 19V6M3 15h18v4M21 15v-3a3 3 0 0 0-3-3h-7v6"/><circle cx="7" cy="11" r="1.6"/>')},
 town:{l:'Dorpen & food towns',c:'#a3461f',i:ic('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>')}
};
const ORDER=['pub','bar','brew','food','sea','cafe','bake','town','cult','heri','nat','fest','shop','stay'];

let active=new Set(ORDER);
try{const s=JSON.parse(localStorage.getItem('boi-cats')||'null');if(Array.isArray(s))active=new Set(s.filter(k=>CATS[k]))}catch(e){}
const save=()=>{try{localStorage.setItem('boi-cats',JSON.stringify([...active]))}catch(e){}};
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fold=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const place=p=>(p.t&&p.t!==p.n?p.t+', ':'')+'Co. '+p.c;
const gmaps=p=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(p.n+', '+(p.t&&p.t!==p.n?p.t+', ':'')+'Co. '+p.c+', Ireland');
const gsearch=(p,x)=>'https://www.google.com/search?q='+encodeURIComponent(x+'"'+p.n+'" '+(p.t||'')+' '+p.c+' Ireland');

const TILE_MODE=true;
const map=L.map('map',{zoomSnap:.5,zoomDelta:1,wheelPxPerZoomLevel:35,wheelDebounceTime:20,minZoom:5,maxZoom:TILE_MODE?19:15,maxBounds:[[45.5,-15],[58.5,-1.5]],attributionControl:true});
L.control.scale({imperial:false}).addTo(map);
const zoomLayers=[];
const atZoom=(z,layer)=>zoomLayers.push([z,layer]);
if(TILE_MODE){
  map.attributionControl.setPrefix(false);
  const esri=(s,n)=>L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/'+s+'/MapServer/tile/{z}/{y}/{x}',{maxZoom:n||19,attribution:'Tiles © Esri'});
  const base={
    'Wegenkaart':esri('World_Street_Map'),
    'Topografisch':esri('World_Topo_Map'),
    'OpenStreetMap':L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}),
    'Satelliet':esri('World_Imagery'),
    'Donker':esri('Canvas/World_Dark_Gray_Base',16)
  };
  const dark=matchMedia('(prefers-color-scheme: dark)').matches;
  (dark?base['Donker']:base['Wegenkaart']).addTo(map);
  L.control.layers(base,null,{position:'topright'}).addTo(map);
}else{
  map.attributionControl.setPrefix('Kaartdata: Natural Earth');
  const o=cls=>({className:cls,interactive:false,smoothFactor:1});
  L.polygon(GEO.gb,o('other')).addTo(map);
  L.polygon(GEO.ie.concat(GEO.ni),o('land')).addTo(map);
  L.polyline(GEO.borders,o('border')).addTo(map);
  L.polygon(GEO.lakes.map(l=>l.r),o('lake')).addTo(map);
  L.polyline(GEO.rivers.map(r=>r.l),o('river')).addTo(map);
  const rd=k=>GEO.roads.filter(r=>r[0]===k).map(r=>r[1]);
  L.polyline(rd(4),o('ferry')).addTo(map);
  L.polyline(GEO.rail,o('rail')).addTo(map);
  L.polyline(rd(3),o('road3')).addTo(map);
  L.polyline(rd(2),o('road2-case')).addTo(map);L.polyline(rd(2),o('road2')).addTo(map);
  L.polyline(rd(1),o('road1-case')).addTo(map);L.polyline(rd(1),o('road1')).addTo(map);
  const lbl=(p,cls,html,anchor)=>L.marker(p,{interactive:false,keyboard:false,icon:L.divIcon({className:cls,html,iconSize:null,iconAnchor:anchor||[0,0]})});
  atZoom(6,L.layerGroup(GEO.counties.map(c=>lbl(c.p,'county-lbl','<span>'+c.n+'</span>'))));
  atZoom(7.5,L.layerGroup(GEO.lakelabels.map(l=>lbl(l.c,'lake-lbl','<span>'+l.n+'</span>'))));
  const sym=s=>`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${s}</svg>`;
  atZoom(7,L.layerGroup(GEO.air.map(a=>lbl(a.p,'poi-lbl',sym('<path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/>')+'<span>'+a.n+'</span>',[7,7]))));
  atZoom(8,L.layerGroup(GEO.ports.map(a=>lbl(a.p,'poi-lbl',sym('<circle cx="12" cy="5" r="2"/><path d="M12 7v14M5 12H2a10 10 0 0 0 20 0h-3M8 11h8"/>')+'<span>'+a.n+'</span>',[7,7]))));
  [[1,6],[2,6.5],[3,7.75],[4,9]].forEach(([r,z])=>atZoom(z,L.layerGroup(GEO.towns.filter(t=>t[3]===r).map(t=>lbl([t[1],t[2]],'town-lbl r'+r,'<i></i><span>'+t[0]+'</span>',[3,3])))));
}
const IRL=L.latLngBounds([51.38,-10.6],[55.42,-5.4]);
map.fitBounds(IRL,{padding:[10,10]});
function syncZoomLayers(){const z=map.getZoom();zoomLayers.forEach(([min,l])=>{z>=min-1e-6?l.addTo(map):l.remove()});map.getContainer().dataset.z=Math.floor(z)}
map.on('zoomend',syncZoomLayers);syncZoomLayers();

const cluster=L.markerClusterGroup({showCoverageOnHover:false,maxClusterRadius:42,disableClusteringAtZoom:14,spiderfyOnMaxZoom:true,
  iconCreateFunction:c=>L.divIcon({html:'<div>'+c.getChildCount()+'</div>',className:'marker-cluster',iconSize:[40,40]})});
map.addLayer(cluster);

const ICO={
 v:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
 w:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.3L12 17.1l-5.7 3.1 1.2-6.3L2.8 9.5l6.4-.8z"/></svg>',
 m:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>'};
let MARKS={};
try{const s=JSON.parse(localStorage.getItem('boi-marks')||'{}');if(s&&typeof s==='object')MARKS=s}catch(e){}
const mk=p=>MARKS[p.key]||{};
function pinHtml(p){const s=mk(p);return `<div class="pin${s.v?' is-v':''}${s.w?' is-w':''}" style="--c:${CATS[p.k].c}">${CATS[p.k].i}${s.v?`<b class="bdg bv">${ICO.v}</b>`:s.w?`<b class="bdg bw">${ICO.w}</b>`:''}</div>`}
const markBtns=(p,cls)=>{const s=mk(p);return `<button type="button" class="mk ${cls} mw" data-mark="w" data-id="${p.id}" aria-pressed="${!!s.w}" title="Wil ik heen">${ICO.w}<span>Wil ik heen</span></button><button type="button" class="mk ${cls} mv" data-mark="v" data-id="${p.id}" aria-pressed="${!!s.v}" title="Bezocht">${ICO.v}<span>Bezocht</span></button>`};
function popup(p){
  const k=CATS[p.k];
  const web=p.w?`<a href="${p.w}" target="_blank" rel="noopener">Website</a>`:p.fb?`<a href="${p.fb}" target="_blank" rel="noopener">Facebook</a>`:`<a href="${gsearch(p,'')}" target="_blank" rel="noopener">Zoek website</a>`;
  return `<div class="pp" style="--c:${k.c}"><h3>${esc(p.n)}</h3><div class="meta"><b>${k.l}</b> · ${esc(place(p))} · p. ${p.p}</div><div class="addr">${p.x?esc(p.a):'Locatie bij benadering (plaatsniveau)'}</div>
  <div class="marks">${markBtns(p,'big')}</div>
  <div class="links"><a class="primary" href="${gmaps(p)}" target="_blank" rel="noopener">Google Maps</a>${web}${p.ig?`<a href="${p.ig}" target="_blank" rel="noopener">Instagram</a>`:`<a href="${gsearch(p,'instagram ')}" target="_blank" rel="noopener">Zoek Instagram</a>`}</div></div>`;
}
const pinIcon=p=>L.divIcon({className:'',html:pinHtml(p),iconSize:[26,26],iconAnchor:[13,13],popupAnchor:[0,-12]});
PLACES.forEach((p,i)=>{
  p.id=i; p.f=fold(p.n+' '+p.t+' '+p.c);
  p.key=(fold(p.n+'-'+(p.t||p.c)).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')).slice(0,120)||('p'+i);
  p.m=L.marker([p.la,p.lo],{title:p.n,icon:pinIcon(p)}).bindPopup(()=>popup(p),{maxWidth:290});
});

// ---- bezocht / wil ik heen: opgeslagen in je account (db) of anders in deze browser
let store=null;const syncEl=document.getElementById('sync');
const setSync=s=>{syncEl.textContent=s};
setSync('Vinkjes worden op dit apparaat bewaard');
const localSave=()=>{try{localStorage.setItem('boi-marks',JSON.stringify(MARKS))}catch(e){}};
const queue={};
function persist(key){
  localSave();
  if(!store)return;
  const val=MARKS[key];
  queue[key]=(queue[key]||Promise.resolve()).then(()=>val&&(val.v||val.w)?store.doc(key).set({v:!!val.v,w:!!val.w}):store.doc(key).delete()).catch(()=>setSync('Opslaan mislukt; vinkjes staan alleen in deze browser'));
}
function refreshMarks(keys){
  PLACES.forEach(p=>{if(!keys||keys.has(p.key)){p.m.setIcon(pinIcon(p));if(p.m.isPopupOpen())p.m.setPopupContent(popup(p))}});
  renderSeg();if(SF==='all')renderList();else applyFilter();
}
function toggleMark(id,f){
  const p=PLACES[id];const s={...mk(p)};s[f]=!s[f];
  if(f==='v'&&s.v)s.w=false;
  if(s.v||s.w)MARKS[p.key]=s;else delete MARKS[p.key];
  persist(p.key);refreshMarks(new Set([p.key]));
}
document.addEventListener('click',e=>{const b=e.target.closest('.mk');if(!b)return;e.preventDefault();e.stopPropagation();toggleMark(+b.dataset.id,b.dataset.mark)});


const chips=document.getElementById('chips'),list=document.getElementById('list'),q=document.getElementById('q'),count=document.getElementById('count');
function renderChips(){
  chips.innerHTML=ORDER.map(k=>{const n=PLACES.filter(p=>p.k===k).length;return `<button type="button" class="chip" id="chip-${k}" data-k="${k}" aria-pressed="${active.has(k)}" style="--c:${CATS[k].c}"><i>${CATS[k].i}</i>${CATS[k].l} <small>${n}</small></button>`}).join('');
}
chips.addEventListener('click',e=>{const b=e.target.closest('.chip');if(!b)return;const k=b.dataset.k;active.has(k)?active.delete(k):active.add(k);b.setAttribute('aria-pressed',active.has(k));save();applyFilter()});
document.getElementById('all').onclick=()=>{active=new Set(ORDER);save();renderChips();applyFilter()};
document.getElementById('none').onclick=()=>{active=new Set();save();renderChips();applyFilter()};
document.getElementById('fit').onclick=()=>map.flyToBounds(IRL,{padding:[10,10],duration:.6});

let SF='all';try{SF=localStorage.getItem('boi-sf')||'all'}catch(e){}
const seg=document.getElementById('seg');
function renderSeg(){
  const nw=PLACES.filter(p=>mk(p).w).length,nv=PLACES.filter(p=>mk(p).v).length;
  const opts=[['all','Alle'],['w',`Wil ik heen <small>${nw}</small>`],['v',`Bezocht <small>${nv}</small>`],['nv','Nog niet bezocht']];
  seg.innerHTML=opts.map(([k,l])=>`<button type="button" id="sf-${k}" data-sf="${k}" aria-pressed="${SF===k}">${l}</button>`).join('');
}
seg.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;SF=b.dataset.sf;try{localStorage.setItem('boi-sf',SF)}catch(_){}renderSeg();applyFilter()});
const sfOk=p=>{const s=mk(p);return SF==='all'||(SF==='w'&&s.w)||(SF==='v'&&s.v)||(SF==='nv'&&!s.v)};
let shown=[];
function applyFilter(){
  const t=fold(q.value.trim());
  shown=PLACES.filter(p=>active.has(p.k)&&sfOk(p)&&(!t||p.f.includes(t)));
  cluster.clearLayers();cluster.addLayers(shown.map(p=>p.m));
  renderList();
}
q.addEventListener('input',()=>{clearTimeout(q._t);q._t=setTimeout(applyFilter,120)});

function renderList(){
  const b=map.getBounds();
  const vis=shown.filter(p=>b.contains([p.la,p.lo])).sort((a,c)=>a.c.localeCompare(c.c)||a.t.localeCompare(c.t)||a.n.localeCompare(c.n));
  count.innerHTML=`<b>${vis.length}</b> van ${PLACES.length} in beeld`;
  if(!vis.length){list.innerHTML=`<p class="empty">${!active.size?'Alle categorieën staan uit. Zet er een paar aan om plekken te zien.':SF==='w'?'Nog niets gemarkeerd als "Wil ik heen" in dit kaartbeeld. Tik op de ster bij een plek om hem toe te voegen.':SF==='v'?'Nog niets gemarkeerd als bezocht in dit kaartbeeld.':'Geen plekken in dit kaartbeeld. Zoom uit of verschuif de kaart.'}</p>`;return}
  let h='',lc='',lt=null;
  for(const p of vis){
    if(p.c!==lc){h+=`<div class="county">Co. ${esc(p.c)}</div>`;lc=p.c;lt=null}
    if(p.t!==lt){if(p.t)h+=`<div class="town">${esc(p.t)}</div>`;lt=p.t}
    h+=`<div class="item" tabindex="0" data-id="${p.id}" style="--c:${CATS[p.k].c}"><span class="dot">${CATS[p.k].i}</span><span class="nm">${esc(p.n)}<em>${p.x&&p.a?esc(p.a):CATS[p.k].l} · p. ${p.p}</em></span><span class="acts">${markBtns(p,'sm')}<a class="mapl" href="${gmaps(p)}" target="_blank" rel="noopener" title="Open in Google Maps" aria-label="Open in Google Maps">${ICO.m}</a></span></div>`;
  }
  h+=`<p class="note">Wisselende locatie (niet op de kaart): Fleadh Cheoil na hÉireann (p. 145) en Irish Open (p. 146). Plekken met een adres staan op hun exacte locatie. De overige pins staan op plaatsniveau; de Google Maps-link zoekt daar de exacte plek. Kies rechtsboven je kaartondergrond.</p>`;
  list.innerHTML=h;
}
function focusPlace(id){
  const p=PLACES[id];
  const phone=window.matchMedia('(max-width:760px)').matches;
  if(phone&&typeof setSheet==='function')setSheet('peek');
  cluster.zoomToShowLayer(p.m,()=>{
    const ll=p.m.getLatLng();
    if(phone){const off=(document.getElementById('sheet').offsetHeight)/2;const pt=map.project(ll).add([0,off-60]);map.panTo(map.unproject(pt))}else map.panTo(ll);
    p.m.openPopup()});
}
list.addEventListener('click',e=>{if(e.target.closest('a,.mk'))return;const it=e.target.closest('.item');if(it)focusPlace(+it.dataset.id)});
list.addEventListener('keydown',e=>{const it=e.target.closest('.item');if(it&&(e.key==='Enter'||e.key===' ')){e.preventDefault();focusPlace(+it.dataset.id)}});
list.addEventListener('mouseover',e=>{const it=e.target.closest('.item');document.querySelectorAll('.pin.hot').forEach(x=>x.classList.remove('hot'));if(!it)return;const el=PLACES[+it.dataset.id].m.getElement();el&&el.firstChild.classList.add('hot')});
list.addEventListener('mouseleave',()=>document.querySelectorAll('.pin.hot').forEach(x=>x.classList.remove('hot')));
map.on('moveend',renderList);

renderSeg();renderChips();applyFilter();

// ---- telefoon: lijst als schuifpaneel over de kaart
const sheet=document.getElementById('sheet'),grab=document.getElementById('grab'),appEl=document.querySelector('.app'),ftog=document.getElementById('ftoggle'),filtersEl=document.getElementById('filters');
const mqPhone=matchMedia('(max-width:760px)');
let sheetState='half';
const snaps=()=>{const H=appEl.clientHeight;const head=sheet.querySelector('.head').offsetHeight+22;return {peek:Math.min(Math.max(head,120),H*.45),half:Math.round(H*.52),full:H-48}};
function setSheet(state,px){
  if(!mqPhone.matches){sheet.style.height='';appEl.style.removeProperty('--sheetpx');return}
  const s=snaps();const h=Math.round(px!=null?px:s[state]);
  sheet.style.height=h+'px';appEl.style.setProperty('--sheetpx',h+'px');
  if(state)sheetState=state;
}
function nearest(h){const s=snaps();return Object.entries(s).sort((a,b)=>Math.abs(a[1]-h)-Math.abs(b[1]-h))[0][0]}
let drag=null;
function dStart(e){if(!mqPhone.matches||e.target.closest('input,button,a'))return;drag={y:e.clientY,h:sheet.offsetHeight,moved:false};sheet.classList.add('dragging');e.currentTarget.setPointerCapture&&e.currentTarget.setPointerCapture(e.pointerId)}
function dMove(e){if(!drag)return;const dy=drag.y-e.clientY;if(Math.abs(dy)>4)drag.moved=true;const s=snaps();setSheet(null,Math.min(s.full,Math.max(90,drag.h+dy)))}
function dEnd(){if(!drag)return;sheet.classList.remove('dragging');const order=['peek','half','full'];
  if(!drag.moved)setSheet(order[(order.indexOf(sheetState)+1)%3]);else setSheet(nearest(sheet.offsetHeight));drag=null}
[grab,sheet.querySelector('.brand')].forEach(el=>{el.addEventListener('pointerdown',dStart);el.addEventListener('pointermove',dMove);el.addEventListener('pointerup',dEnd);el.addEventListener('pointercancel',dEnd)});
grab.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();const o=['peek','half','full'];setSheet(o[(o.indexOf(sheetState)+1)%3])}});
// lijst helemaal omhoog geveegd en dan naar beneden trekken: paneel kleiner
let lt=null;list.addEventListener('touchstart',e=>{lt=list.scrollTop<=0?e.touches[0].clientY:null},{passive:true});
list.addEventListener('touchmove',e=>{if(lt!=null&&mqPhone.matches&&e.touches[0].clientY-lt>60&&sheetState!=='peek'){setSheet(sheetState==='full'?'half':'peek');lt=null}},{passive:true});
function filterCount(){const n=ORDER.length-active.size+(SF!=='all'?1:0);ftog.innerHTML=n?`Filters <b>${n}</b>`:'Filters'}
ftog.addEventListener('click',()=>{const o=!filtersEl.classList.contains('open');filtersEl.classList.toggle('open',o);ftog.setAttribute('aria-expanded',o);if(o&&sheetState!=='full')setSheet('full');else setSheet(sheetState)});
q.addEventListener('focus',()=>{if(mqPhone.matches&&sheetState==='peek')setSheet('half')});
mqPhone.addEventListener('change',()=>{setSheet(sheetState);map.invalidateSize()});
addEventListener('resize',()=>{if(mqPhone.matches)setSheet(sheetState)});
const _af=applyFilter;applyFilter=function(){_af();filterCount()};
setSheet('half');filterCount();
const fitIRL=(anim)=>{const o=mqPhone.matches?{paddingTopLeft:[10,10],paddingBottomRight:[10,sheet.offsetHeight+10]}:{padding:[10,10]};anim?map.flyToBounds(IRL,{...o,duration:.6}):map.fitBounds(IRL,o)};
fitIRL(false);document.getElementById('fit').onclick=()=>fitIRL(true);
map.on('popupopen',e=>{if(!mqPhone.matches)return;const y=map.latLngToContainerPoint(e.popup.getLatLng()).y;const lim=map.getSize().y-sheet.offsetHeight-16;if(y>lim)map.panBy([0,y-lim],{animate:true})});

const toast=m=>{const d=document.createElement('div');d.className='toast';d.textContent=m;document.body.appendChild(d);setTimeout(()=>d.remove(),2600)};
// ---- mijn locatie
const Locate=L.Control.extend({options:{position:'topleft'},onAdd(){
  const c=L.DomUtil.create('div','leaflet-bar leaflet-control leaflet-control-locate');
  c.innerHTML='<a href="#" role="button" title="Toon mijn locatie" aria-label="Toon mijn locatie"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg></a>';
  L.DomEvent.disableClickPropagation(c);
  let watch=null,me=null,acc=null,first=true;
  c.firstChild.onclick=e=>{e.preventDefault();
    if(watch!==null){navigator.geolocation.clearWatch(watch);watch=null;me&&me.remove();acc&&acc.remove();me=acc=null;c.classList.remove('on');return}
    if(!navigator.geolocation){toast('Locatie wordt niet ondersteund');return}
    c.classList.add('on');first=true;
    watch=navigator.geolocation.watchPosition(pos=>{const ll=[pos.coords.latitude,pos.coords.longitude];
      if(!me){me=L.marker(ll,{icon:L.divIcon({className:'',html:'<div class="me-dot"></div>',iconSize:[16,16],iconAnchor:[8,8]}),interactive:false,keyboard:false}).addTo(map);acc=L.circle(ll,{radius:pos.coords.accuracy,interactive:false,color:'#1a73e8',weight:1,fillOpacity:.08}).addTo(map)}
      else{me.setLatLng(ll);acc.setLatLng(ll).setRadius(pos.coords.accuracy)}
      if(first){first=false;map.setView(ll,Math.max(map.getZoom(),13))}
    },()=>{toast('Locatie niet beschikbaar of geen toestemming');c.classList.remove('on');watch&&navigator.geolocation.clearWatch(watch);watch=null},{enableHighAccuracy:true,maximumAge:15000});
  };
  return c}});
new Locate().addTo(map);
// ---- service worker (offline / installeerbaar)
if('serviceWorker' in navigator&&location.protocol==='https:')addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
