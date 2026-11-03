// ---- Accounts en vinkjes (Supabase). Kaart en lijst werken zonder inloggen;
// pas bij het eerste vinkje of de knop "Inloggen" wordt om een e-mailcode gevraagd.
(function(){
  const CFG=window.BOI_CONFIG||{};
  const accEl=document.getElementById('account');
  const syncEl=document.getElementById('sync');
  if(!CFG.url||!CFG.key||!window.supabase){
    // Geen database ingesteld: vinkjes blijven lokaal, zoals voorheen.
    syncEl.textContent='Vinkjes worden op dit apparaat bewaard';
    return;
  }
  const sb=window.supabase.createClient(CFG.url,CFG.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'boi-auth'}});
  // Vinkjes uit de vorige (lokale) versie: worden bij de eerste keer inloggen meegenomen.
  const LEGACY={...MARKS};
  let user=null, pending=null;
  MARKS={};refreshMarks();
  syncEl.textContent='';

  // ---------- inlogvenster
  const dlg=document.createElement('dialog');
  dlg.className='login';
  dlg.innerHTML=`<form method="dialog" class="lg" novalidate>
    <button type="button" class="lg-x" aria-label="Sluiten">×</button>
    <h2>Inloggen</h2>
    <p class="lg-why">Log in om bij te houden waar je bent geweest en waar je nog heen wilt. Je vinkjes worden in je account bewaard en zijn op al je apparaten hetzelfde.</p>
    <div class="lg-step lg-1">
      <label for="lg-email">E-mailadres</label>
      <input id="lg-email" type="email" autocomplete="email" inputmode="email" placeholder="naam@voorbeeld.nl" required>
      <button type="submit" class="lg-go" id="lg-send">Stuur inlogcode</button>
      <p class="lg-note">Je krijgt een mail met een code van 6 cijfers. Geen wachtwoord nodig.</p>
      <p class="lg-note" id="lg-have" hidden><button type="button" class="lg-link" id="lg-havebtn">Ik heb al een code</button></p>
    </div>
    <div class="lg-step lg-2" hidden>
      <label for="lg-code">Code uit de mail naar <b id="lg-to"></b></label>
      <input id="lg-code" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]*" maxlength="8" placeholder="123456">
      <button type="submit" class="lg-go" id="lg-verify">Inloggen</button>
      <p class="lg-note"><button type="button" class="lg-link" id="lg-back">Ander e-mailadres</button> · <button type="button" class="lg-link" id="lg-resend">Code opnieuw sturen</button></p>
    </div>
    <p class="lg-err" id="lg-err" role="alert"></p>
    <p class="lg-priv">Er wordt alleen je e-mailadres en je vinkjes bewaard. <a href="/privacy" target="_blank" rel="noopener">Privacy</a></p>
  </form>`;
  document.body.appendChild(dlg);
  const $=s=>dlg.querySelector(s);
  const step=n=>{$('.lg-1').hidden=n!==1;$('.lg-2').hidden=n!==2;$('#lg-err').textContent='';(n===1?$('#lg-email'):$('#lg-code')).focus()};
  const err=m=>{$('#lg-err').textContent=m};
  const busy=(b,el)=>{el.disabled=b;el.dataset.t=el.dataset.t||el.textContent;el.textContent=b?'Even geduld…':el.dataset.t};
  // Laatst verstuurde code onthouden, zodat wegklikken of herladen niet betekent dat je opnieuw moet aanvragen.
  const SENT_KEY='boi-otp-sent',WAIT=60e3,VALID=60*60e3;
  let sent=null;try{sent=JSON.parse(sessionStorage.getItem(SENT_KEY)||'null')}catch(e){}
  const sentFresh=()=>sent&&Date.now()-sent.t<VALID;
  function markSent(email){sent={email,t:Date.now()};try{sessionStorage.setItem(SENT_KEY,JSON.stringify(sent))}catch(e){}}
  let tick=null;
  function cooldown(){
    const b=$('#lg-resend');clearInterval(tick);
    const upd=()=>{const left=sent?Math.ceil((sent.t+WAIT-Date.now())/1e3):0;
      if(left>0){b.disabled=true;b.textContent='Nieuwe code over '+left+' s'}else{b.disabled=false;b.textContent='Code opnieuw sturen';clearInterval(tick)}};
    upd();tick=setInterval(upd,1000);
  }
  function toCode(email,note){$('#lg-email').value=email;$('#lg-to').textContent=email;step(2);if(note)$('#lg-err').textContent=note;cooldown()}
  function openLogin(p){pending=p||null;dlg.showModal?dlg.showModal():dlg.setAttribute('open','');
    if(sentFresh())toCode(sent.email);else{step(1)}
    $('#lg-have').hidden=!sentFresh();}
  $('.lg-x').onclick=()=>{pending=null;dlg.close()};
  dlg.addEventListener('click',e=>{if(e.target===dlg){pending=null;dlg.close()}});
  async function sendCode(){
    const email=$('#lg-email').value.trim();
    if(!/^\S+@\S+\.\S+$/.test(email)){err('Vul een geldig e-mailadres in.');return}
    const b=$('#lg-send');busy(true,b);
    if(sent&&sent.email===email&&Date.now()-sent.t<WAIT){busy(false,b);toCode(email,'Er is net al een code naar dit adres gestuurd. Vul die hieronder in.');return}
    const {error}=await sb.auth.signInWithOtp({email,options:{shouldCreateUser:true,emailRedirectTo:location.origin+'/'}});
    busy(false,b);
    if(error){
      if(error.status===429){
        if(sent&&sent.email===email){toCode(email,'Er is net al een code gestuurd. Vul die in, of vraag over een minuut een nieuwe aan.');return}
        err('Er zijn net te veel codes verstuurd. Probeer het over een minuut opnieuw.');return}
      err('De code kon niet verstuurd worden: '+error.message);return}
    markSent(email);toCode(email,'');
  }
  async function verify(){
    const email=$('#lg-email').value.trim(),token=$('#lg-code').value.replace(/\D/g,'');
    if(token.length<6){err('Vul de code uit de mail in.');return}
    const b=$('#lg-verify');busy(true,b);
    const {error}=await sb.auth.verifyOtp({email,token,type:'email'});
    busy(false,b);
    if(error){err('Deze code klopt niet of is verlopen. Vraag een nieuwe code aan.');return}
    try{sessionStorage.removeItem(SENT_KEY)}catch(e){}sent=null;
    dlg.close();
  }
  dlg.querySelector('form').addEventListener('submit',e=>{e.preventDefault();$('.lg-1').hidden?verify():sendCode()});
  $('#lg-back').onclick=()=>{step(1);$('#lg-have').hidden=!sentFresh()};
  $('#lg-havebtn').onclick=()=>toCode(sent.email);
  $('#lg-resend').onclick=sendCode;

  // ---------- account-knop
  const topEl=document.getElementById('account-top');
  function renderAccount(){
    // testhaak: ?testacc toont de knop zoals bij een ingelogde gebruiker met een lang adres (verandert niets aan inloggen)
    if(/[?&]testacc\b/.test(location.search)&&topEl){topEl.hidden=false;topEl.className='acc-top in';topEl.textContent='voorbeeld.naam@example.com';return}
    if(topEl){topEl.hidden=false;topEl.className='acc-top'+(user?' in':'');topEl.textContent=user?(user.email||'Ingelogd'):'Inloggen';topEl.title=user?'Ingelogd als '+(user.email||''):'Inloggen om vinkjes te bewaren';
      topEl.onclick=()=>{if(!user)openLogin();else{const f=document.getElementById('filters'),t=document.getElementById('ftoggle');if(f&&!f.classList.contains('open')&&t&&getComputedStyle(t).display!=='none')t.click();document.getElementById('account').scrollIntoView({block:'nearest'})}}}
    accEl.innerHTML=user
      ?`<span class="acc-who" title="${esc(user.email||'')}">${esc(user.email||'Ingelogd')}</span><button type="button" id="acc-out">Uitloggen</button><button type="button" id="acc-del" class="acc-del">Account verwijderen</button>`
      :`<button type="button" id="acc-in" class="acc-in">Inloggen</button>`;
    const i=document.getElementById('acc-in'),o=document.getElementById('acc-out');
    if(i)i.onclick=()=>openLogin();
    if(o)o.onclick=async()=>{await sb.auth.signOut();};
    const d=document.getElementById('acc-del');
    if(d)d.onclick=async()=>{
      if(!confirm('Je account en al je vinkjes worden definitief verwijderd. Doorgaan?'))return;
      const {data}=await sb.auth.getSession();const t=data.session&&data.session.access_token;
      const r=await fetch('/api/delete-account',{method:'POST',headers:{Authorization:'Bearer '+t}}).catch(()=>null);
      if(r&&r.ok){try{localStorage.removeItem(cacheKey())}catch(e){}await sb.auth.signOut();alert('Je account en vinkjes zijn verwijderd.')}
      else alert('Verwijderen is niet gelukt. Probeer het later opnieuw.');
    };
  }

  // ---------- vinkjes laden en opslaan
  const cacheKey=()=>'boi-marks-'+user.id;
  async function loadMarks(){
    try{const c=JSON.parse(localStorage.getItem(cacheKey())||'null');if(c){MARKS=c;refreshMarks()}}catch(e){}
    const {data,error}=await sb.from('marks').select('place_key,visited,want');
    if(error){syncEl.textContent='Vinkjes konden niet geladen worden';return}
    const m={};for(const r of data)if(r.visited||r.want)m[r.place_key]={v:r.visited,w:r.want};
    // eerste keer: lokale vinkjes van vóór de accounts meenemen
    const leg=Object.entries(LEGACY).filter(([k,v])=>(v.v||v.w)&&!m[k]);
    if(leg.length){
      const rows=leg.map(([k,v])=>({place_key:k,visited:!!v.v,want:!!v.w&&!v.v}));
      const {error:e2}=await sb.from('marks').upsert(rows);
      if(!e2){rows.forEach(r=>m[r.place_key]={v:r.visited,w:r.want});try{localStorage.removeItem('boi-marks')}catch(_){}for(const k in LEGACY)delete LEGACY[k]}
    }
    MARKS=m;try{localStorage.setItem(cacheKey(),JSON.stringify(m))}catch(e){}
    refreshMarks();syncEl.textContent='';
  }
  const queue={};
  persist=function(key){
    if(!user)return;
    try{localStorage.setItem(cacheKey(),JSON.stringify(MARKS))}catch(e){}
    const s=MARKS[key];
    queue[key]=(queue[key]||Promise.resolve()).then(async()=>{
      const {error}=s&&(s.v||s.w)
        ?await sb.from('marks').upsert({place_key:key,visited:!!s.v,want:!!s.w,updated_at:new Date().toISOString()})
        :await sb.from('marks').delete().eq('place_key',key);
      if(error){syncEl.textContent='Opslaan mislukt, controleer je verbinding';}
      else if(syncEl.textContent)syncEl.textContent='';
    });
  };
  const baseToggle=toggleMark;
  toggleMark=function(id,f){
    if(!user){openLogin({id,f});return}
    baseToggle(id,f);
  };

  // ---------- sessie
  sb.auth.onAuthStateChange((ev,session)=>{
    const nu=session?session.user:null;
    const changed=(nu&&nu.id)!==(user&&user.id);
    user=nu;renderAccount();
    if(changed){
      if(user){loadMarks().then(()=>{if(pending){const p=pending;pending=null;const pl=PLACES[p.id];if(!(MARKS[pl.key]||{})[p.f])baseToggle(p.id,p.f)}})}
      else{MARKS={};refreshMarks()}
    }
  });
  // bij terugkeren naar de app: vinkjes van andere apparaten ophalen
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&user)loadMarks()});
  renderAccount();
})();
