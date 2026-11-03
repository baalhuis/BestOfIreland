// Automatische layoutcontrole: telefoonbreedtes x schermstanden, met meetbare regels en schermafbeeldingen.
const {chromium}=require('playwright');
const URL=process.argv[2]||'http://localhost:8767/';const OUT=process.argv[3]||'qa/out';
const fs=require('fs');fs.mkdirSync(OUT,{recursive:true});
// De echte lettertypen (Alegreya) lokaal laden, zodat tekstbreedtes kloppen met de telefoon.
const FD=process.env.FONTS||'';const FONTDIR='/fontfiles';
const FF=[['Alegreya','alegreya',[500,700,800]],['Alegreya Sans','alegreya-sans',[400,500,700]]];
const FONTCSS=FF.flatMap(([fam,slug,ws])=>ws.map(w=>`@font-face{font-family:'${fam}';font-weight:${w};font-style:normal;src:url(http://fonts.local/${slug}-latin-${w}-normal.woff2) format('woff2')}`)).join('\n');
const fontPath=f=>FD+'/node_modules/@fontsource/'+(f.startsWith('alegreya-sans')?'alegreya-sans':'alegreya')+'/files/'+f;
const WIDTHS=[320,375,393,402,430],H=800;
const STATES={
  start:async p=>{},
  ingelogd:async p=>{await p.goto(URL+'?testacc');await p.waitForTimeout(1200)},
  filters:async p=>{await p.click('#ftoggle');await p.waitForTimeout(400)},
  filters_ingelogd:async p=>{await p.goto(URL+'?testacc');await p.waitForTimeout(1200);await p.click('#ftoggle');await p.waitForTimeout(400)},
  zoeken:async p=>{await p.fill('#q','Galway');await p.waitForTimeout(400)},
  popup:async p=>{await p.evaluate(()=>{const x=PLACES.find(p=>p.w&&p.ig);map.setView([x.la,x.lo],15);setTimeout(()=>cluster.zoomToShowLayer(x.m,()=>x.m.openPopup()),300)});await p.waitForTimeout(1500)},
};
const RULES=()=>{const W=innerWidth,out=[];const vis=e=>{const r=e.getBoundingClientRect(),cs=getComputedStyle(e);return r.width>0&&r.height>0&&cs.visibility!=='hidden'&&cs.display!=='none'&&cs.opacity!=='0'};
 const skip=e=>e.closest('.leaflet-pane,.leaflet-marker-pane,.leaflet-tile-container,.leaflet-zoom-animated,svg')&&!e.closest('.leaflet-popup');
 const name=e=>(e.id?'#'+e.id:e.tagName.toLowerCase()+(e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\s+/).join('.'):''))+(e.textContent.trim()?' "'+e.textContent.trim().slice(0,30)+'"':'');
 if(document.documentElement.scrollWidth>W+1)out.push(['FOUT','pagina breder dan scherm',document.documentElement.scrollWidth+' > '+W]);
 for(const e of document.querySelectorAll('body *')){if(skip(e)||!vis(e))continue;const r=e.getBoundingClientRect();
   // buiten beeld (rechts/links), tenzij in een horizontaal scrollende ouder
   if((r.right>W+1||r.left<-1)&&!e.closest('[style*=overflow],.seg,#list,.leaflet-control-scale')){let p=e.parentElement,clipped=false;while(p){const o=getComputedStyle(p).overflowX;if(o!=='visible'){const pr=p.getBoundingClientRect();if(pr.right<=W+1&&pr.left>=-1){clipped=true;break}}p=p.parentElement}
     if(!clipped)out.push(['FOUT','valt buiten beeld',name(e)+' ['+Math.round(r.left)+'..'+Math.round(r.right)+']'])}
   const cs=getComputedStyle(e);
   // knoppen: te klein om te raken
   if(e.matches('button,a,input')&&!e.closest('.leaflet-control-attribution')&&e.closest('aside,.leaflet-control,.leaflet-popup')&&(r.height<28||r.width<28))out.push(['LET OP','klein tikdoel',name(e)+' '+Math.round(r.width)+'x'+Math.round(r.height)]);
   // tekst afgekapt
   if(e.children.length===0&&e.textContent.trim()&&r.width>2&&e.scrollWidth>e.clientWidth+1&&cs.overflow!=='visible'&&cs.textOverflow!=='ellipsis')out.push(['LET OP','tekst afgekapt',name(e)]);
   // omrande rij met lege ruimte achteraan (zoals een knoppenbalk die niet volloopt)
   if(cs.display==='flex'&&cs.flexDirection==='row'&&parseFloat(cs.borderTopWidth)>0&&e.children.length>1){const last=[...e.children].filter(vis).pop();if(last){const gap=r.right-parseFloat(cs.borderRightWidth)-last.getBoundingClientRect().right;if(gap>16&&gap>r.width*.08)out.push(['FOUT','lege ruimte in omrande balk',name(e).slice(0,40)+' '+Math.round(gap)+'px'])}}
 }
 // overlappende knoppen
 const top=e=>{const r=e.getBoundingClientRect();const t=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return t&&(t===e||e.contains(t))};
 const bs=[...document.querySelectorAll('aside button,aside a,aside input,.leaflet-control a,.leaflet-control button')].filter(e=>vis(e)&&top(e));
 for(let i=0;i<bs.length;i++)for(let j=i+1;j<bs.length;j++){const a=bs[i].getBoundingClientRect(),b=bs[j].getBoundingClientRect();if(bs[i].contains(bs[j])||bs[j].contains(bs[i]))continue;const ox=Math.min(a.right,b.right)-Math.max(a.left,b.left),oy=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);if(ox>2&&oy>2)out.push(['FOUT','knoppen overlappen',name(bs[i]).slice(0,30)+' / '+name(bs[j]).slice(0,30)])}
 return out};
(async()=>{const b=await chromium.launch();let total=0;const seen=new Map();
 const jobs=[];for(const w of WIDTHS)for(const [st,fn] of Object.entries(STATES))jobs.push([w,st,fn]);
 const run=async([w,st,fn])=>{const c=await b.newContext({viewport:{width:w,height:H},deviceScaleFactor:1,isMobile:true,hasTouch:true});const p=await c.newPage();
  await p.route('**/sw.js',r=>r.abort());await p.route(/arcgisonline|openstreetmap/,r=>r.abort());
  await p.route(/fonts\.googleapis\.com/,r=>r.fulfill({contentType:'text/css',body:FONTCSS}));
  await p.route(/fonts\.local\//,r=>r.fulfill({contentType:'font/woff2',body:fs.readFileSync(fontPath(r.request().url().split('/').pop()))}));
  const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(URL);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(900);await fn(p);await p.evaluate(()=>document.fonts.ready);
  const res=await p.evaluate(RULES);errs.forEach(e=>res.push(['FOUT','scriptfout',e]));
  for(const r of res){const k=r.join(' | ');if(!seen.has(k))seen.set(k,new Set());seen.get(k).add(w+'/'+st)}
  await p.screenshot({path:`${OUT}/${w}-${st}.png`});await c.close()};
 for(let i=0;i<jobs.length;i+=6)await Promise.all(jobs.slice(i,i+6).map(run));
 for(const [k,v] of seen){v=[...v];console.log(k,'  ←',v.length>6?v.length+' situaties':v.join(', '))}
 console.log(seen.size?`${seen.size} bevindingen`:'Geen bevindingen');await b.close()})();
