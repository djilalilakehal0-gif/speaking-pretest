const dbg=m=>{try{window.dbg&&window.dbg(m)}catch(e){}};
let THREE=null,RoomEnvironment=null;
try{
  THREE=await import('three');
  ({RoomEnvironment}=await import('three/addons/environments/RoomEnvironment.js'));
  dbg('three.js loaded r'+THREE.REVISION);
}catch(err){console.error('three.js failed to load',err);dbg('three.js FAILED: '+err.message)}

/* ================= data ================= */
const IMG=__ITEMS__;
const uri=k=>`data:image/webp;base64,${IMG[k].b64}`;
const FL=[
 {name:'Ailes glacées',color:'#f6a6c9',key:'wings',bg:'#0b0908'},
 {name:'Pilon',color:'#f291bd',key:'drumstick',bg:'#0e0a09'},
 {name:'Cuisse juteuse',color:'#ee88b4',key:'thigh',bg:'#0c0a0b'},
 {name:'Poulet rôti',color:'#f79fc6',key:'whole',bg:'#0a0a09'},
 {name:'Blanc grillé',color:'#f08fba',key:'breast',bg:'#0d0b09'},
 {name:'Brochettes',color:'#f7acd0',key:'skewers',bg:'#0b0a0c'},
 {name:'Quart de poulet',color:'#ec84b0',key:'legquarter',bg:'#0e0b0a'}];
const N=FL.length, START=3;
const BIT_KEYS=['parsley','strawberry','garlic'];
const BH=1.05, PS=.86;

/* ================= utils ================= */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const mod=(n,m)=>((n%m)+m)%m;
const smooth=t=>t*t*(3-2*t);
const D2R=Math.PI/180;
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE=matchMedia('(pointer:fine)').matches;
function bez(x1,y1,x2,y2){return t=>{if(t<=0)return 0;if(t>=1)return 1;let a=0,b=1,m=.5;for(let i=0;i<28;i++){m=(a+b)/2;const u=3*(1-m)*(1-m)*m*x1+3*(1-m)*m*m*x2+m*m*m;if(u<t)a=m;else b=m}m=(a+b)/2;return 3*(1-m)*(1-m)*m*y1+3*(1-m)*m*m*y2+m*m*m}}
const glide=bez(.25,.75,.2,1), entrEase=bez(.16,1,.3,1);
function rng(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const root=document.documentElement, body=document.body;

function imgSpr(el,key,ar){el.classList.add('spr');el.style.backgroundImage=`url("${uri(key)}")`;el.style.backgroundSize='contain';el.style.backgroundPosition='center';if(ar)el.style.aspectRatio=ar}
function wrapSpr(el,f){imgSpr(el,FL[f].key,1/BH)}
function bitSpr(el,b){const k=BIT_KEYS[b];imgSpr(el,k,IMG[k].w/IMG[k].h)}

let vw=innerWidth, vh=innerHeight, phone=vw<820;

/* ================= three setup ================= */
const canvas=$('#gl');
let renderer=null,scene,camera,envTex,glReady=false,gl=null;
const bars=[]; let trav=null, shadowTex=null, texs=[];
let geoF,geoB;

function initGL(){
  if(!THREE)return false;
  try{
    renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
  }catch(e){console.warn('WebGL unavailable',e);dbg('WebGL FAILED: '+e.message);return false}
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.NoToneMapping;
  renderer.setClearColor(0x000000,0);
  scene=new THREE.Scene();
  camera=new THREE.PerspectiveCamera(30,1,10,8000);
  const pm=new THREE.PMREMGenerator(renderer);
  envTex=pm.fromScene(new RoomEnvironment(),0.04).texture;
  scene.add(new THREE.AmbientLight(0xffffff,.7));
  const key=new THREE.DirectionalLight(0xffffff,.8);key.position.set(-.6,.9,1.4);scene.add(key);
  ray=new THREE.Raycaster();
  buildGeo();
  // shadow texture
  const sc=document.createElement('canvas');sc.width=sc.height=128;const x=sc.getContext('2d');
  const g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(30,18,40,.55)');g.addColorStop(1,'rgba(30,18,40,0)');x.fillStyle=g;x.fillRect(0,0,128,128);
  shadowTex=new THREE.CanvasTexture(sc);shadowTex.colorSpace=THREE.SRGBColorSpace;
  for(let i=0;i<12;i++){bars.push(makeBar(i));}
  trav=bars[11];
  resizeGL();
  dbg('WebGL renderer ready');
  return true;
}
function buildGeo(){
  const CR=0;
  const g=new THREE.PlaneGeometry(1,BH,30,64);
  const p=g.attributes.position,uv=g.attributes.uv;
  for(let i=0;i<p.count;i++){
    const u=uv.getX(i),v=uv.getY(i),ex=Math.abs(2*u-1),ev=Math.min(v,1-v);let z;
    {const across=Math.pow(Math.max(0,1-Math.pow(ex,2.6)),.62),along=Math.pow(clamp((ev-CR)/.11),.7);
      z=.01+.035*across*along}
    p.setZ(i,z);
  }
  g.computeVertexNormals();geoF=g;
  const b=g.clone();const bp=b.attributes.position,bu=b.attributes.uv;
  for(let i=0;i<bp.count;i++){bp.setZ(i,-bp.getZ(i));bu.setX(i,1-bu.getX(i))}
  const idx=b.index.array;for(let i=0;i<idx.length;i+=3){const t=idx[i+1];idx[i+1]=idx[i+2];idx[i+2]=t}
  b.index.needsUpdate=true;b.computeVertexNormals();geoB=b;
}
function mkMat(){
  const m=new THREE.MeshPhysicalMaterial({transparent:true,alphaTest:.5,roughness:.7,metalness:0,clearcoat:.12,clearcoatRoughness:.5,envMapIntensity:.3,envMap:envTex,emissive:0xffffff,emissiveIntensity:.55});
  m.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <alphatest_fragment>','#ifdef USE_ALPHATEST\nif(diffuseColor.a<alphaTest*opacity)discard;\n#endif')};
  return m;
}
function makeBar(i){
  const group=new THREE.Group();group.rotation.order='ZYX';
  const fm=mkMat(),bm=mkMat();
  const front=new THREE.Mesh(geoF,fm),back=new THREE.Mesh(geoB,bm);
  group.add(front,back);group.visible=false;scene.add(group);
  const sm=new THREE.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false});
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(1.25,1.04*BH),sm);shadow.renderOrder=-1;shadow.visible=false;scene.add(shadow);
  const b={i,group,front,back,fm,bm,shadow,sm,flav:-1,j:null};
  front.userData.bar=b;return b;
}
function setFlav(b,f){if(b.flav===f)return;b.flav=f;b.fm.map=b.fm.emissiveMap=texs[f].front;b.bm.map=b.bm.emissiveMap=texs[f].back;b.fm.needsUpdate=b.bm.needsUpdate=true}
function place(b,s){
  if(!s||s.op<=.01){b.group.visible=false;b.shadow.visible=false;return}
  const sc=s.h/BH,sx=s.sx||1,sy=s.sy||1;
  b.group.visible=true;
  b.group.position.set(s.x-vw/2,vh/2-s.y,s.z||0);
  b.group.scale.set(sc*sx,sc*sy,sc);
  b.group.rotation.set((s.rx||0)*D2R,s.ry*D2R,-s.rz*D2R);
  b.fm.opacity=b.bm.opacity=s.op;
  const sh=b.shadow;sh.visible=true;
  sh.position.set(s.x-vw/2,vh/2-s.y-.05*s.h,(s.z||0)-.32*s.h);
  sh.rotation.z=-s.rz*D2R;
  sh.scale.set(sc*Math.max(.3,Math.abs(Math.cos(s.ry*D2R))),sc,1);
  b.sm.opacity=.5*s.op*(s.shadow==null?1:s.shadow);
}
function resizeGL(){
  vw=innerWidth;vh=innerHeight;phone=vw<820;
  if(!renderer)return;
  const D=clamp(1500*Math.min(vw/1440,vh/900),1000,2200);
  camera.position.set(0,0,D);camera.fov=2*Math.atan((vh/2)/D)/D2R;camera.aspect=vw/vh;camera.near=10;camera.far=4*D;camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,phone?1.75:2));
  renderer.setSize(vw,vh,false);
  canvas.style.width=vw+'px';canvas.style.height=vh+'px';
}

/* ---- textures ---- */
function mix(hex,to,t){const a=parseInt(hex.slice(1),16),b=parseInt(to.slice(1),16);const c=s=>Math.round(((a>>s)&255)*(1-t)+((b>>s)&255)*t);return`rgb(${c(16)},${c(8)},${c(0)})`}
const tex_imgs={};
function buildTextures(){
  texs=FL.map(f=>{
    const img=tex_imgs[f.key],W=512,H=Math.round(W*BH);
    const fc=document.createElement('canvas');fc.width=W;fc.height=H;const c=fc.getContext('2d');
    const r=Math.min(W*.96/img.naturalWidth,H*.96/img.naturalHeight),iw=img.naturalWidth*r,ih=img.naturalHeight*r;
    c.drawImage(img,(W-iw)/2,(H-ih)/2,iw,ih);
    const bk=document.createElement('canvas');bk.width=W;bk.height=H;const b=bk.getContext('2d');
    b.translate(W,0);b.scale(-1,1);b.drawImage(fc,0,0);
    const mk=cv=>{const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t};
    return{front:mk(fc),back:mk(bk)};
  });
}
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}

/* ================= state ================= */
let pos=START-3.6, target=START, tween=null, shown=START;
let lastInteract=performance.now(), lastAuto=0, autoOn=!RM, entered=false;
let drag=null, vel=0;
const hero=$('#flavors'), arcEl=$('#arc'), titleEl=$('#title'), countEl=$('#count'), revealEl=$('#reveal');

/* ---- arc ---- */
const SL=[[0,0,430,0,0],[245,24,330,4,16],[452,44,312,8,26],[660,80,296,12,34],[860,118,280,15,40]];
let ARC={cx:0,cy:0,u:1,spread:1,H:0,top:0};
function computeArc(r){
  const H=r.height;let u,cy,spread=1;
  if(phone){u=Math.min(vw/560,H/980);cy=H*.4;spread=1.02}
  else{u=Math.min(vw/1440,vh/900);cy=H/2-78*u}
  ARC={cx:vw/2,cy,u,spread,H,top:r.top};
}
function arcState(k,j,now){
  const ak=Math.min(Math.abs(k),4),a=Math.min(3,Math.floor(ak)),t=ak-a,A=SL[a],B=SL[a+1],sg=Math.sign(k);
  const L=i=>lerp(A[i],B[i],t),{u,spread}=ARC;
  const op=ak<=3.3?1:ak>=3.9?0:1-(ak-3.3)/.6;
  let y=ARC.top+ARC.cy+L(1)*u,rz=sg*L(3)*.6;
  if(!RM){const b=Math.sin(now/4600*Math.PI*2+1.37*j);y-=(.5*b+.5)*9*u;rz+=.4*b}
  return{x:ARC.cx+sg*L(0)*u*spread,y,h:L(2)*u*PS,rz,ry:sg*L(4)*.4,rx:0,z:-Math.abs(Math.min(Math.abs(k),4))*34*u,op,sx:1,sy:1,shadow:1};
}
function lerpState(a,b,t){const o={};for(const k of['x','y','h','rz','ry','rx','z','op','shadow','sx','sy'])o[k]=lerp(a[k]??(k==='sx'||k==='sy'||k==='shadow'?1:0),b[k]??(k==='sx'||k==='sy'||k==='shadow'?1:0),t);return o}

/* ---- title / counter ---- */
const fcv=document.createElement('canvas').getContext('2d');
function textW(s){fcv.font="100px 'Archivo Black'";return fcv.measureText(s.toUpperCase()).width||1}
function curU(){return phone?Math.min(vw/560,vh/980):Math.min(vw/1440,vh/900)}
function fitTitle(){
  const name=FL[shown].name;let size;
  if(phone){const lw=Math.max(...name.split(' ').map(textW));size=Math.min(clamp(vw*.125,40,64),(vw-36)*100/lw)}
  else size=Math.min(96*curU(),760*curU()*100/textW(name));
  titleEl.style.fontSize=size+'px';
}
function buildLayer(name){
  const L=document.createElement('span');L.className='tl';L.setAttribute('aria-label',name);
  name.split(' ').forEach((wd,wi)=>{if(wi)L.append(' ');const w=document.createElement('span');w.className='w';w.setAttribute('aria-hidden','true');[...wd].forEach(ch=>{const s=document.createElement('span');s.className='l';s.textContent=ch;w.append(s)});L.append(w)});
  return L;
}
function setTitle(name,dir,anim){
  const old=titleEl.querySelector('.tl:last-child'),nl=buildLayer(name);titleEl.append(nl);fitTitle();
  if(old){
    if(anim&&!RM){const ls=old.querySelectorAll('.l');
      ls.forEach((l,i)=>l.animate([{transform:'translateY(0)',opacity:1},{transform:`translateY(${-110*dir}%)`,opacity:0}],{duration:300,delay:i*11,easing:'cubic-bezier(.45,0,.75,.3)',fill:'forwards'}));
      setTimeout(()=>old.remove(),300+ls.length*11+60);
    }else old.remove();
  }
  if(anim&&!RM)nl.querySelectorAll('.l').forEach((l,i)=>l.animate([{transform:`translateY(${110*dir}%)`,opacity:0},{transform:'translateY(0)',opacity:1}],{duration:620,delay:120+i*22,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'}));
}
const xfAnim=new WeakMap();
function crossfade(el,apply,o){
  (xfAnim.get(el)||[]).forEach(a=>{try{a.cancel()}catch(e){}});xfAnim.set(el,[]);
  const tok=(el._xt=(el._xt||0)+1);
  if(RM){apply();return}
  const a=el.animate([{translate:'0 0',opacity:1},{translate:'0 -10px',opacity:0}],{duration:o.out,easing:o.eo,fill:'forwards'});
  xfAnim.set(el,[a]);
  setTimeout(()=>{if(el._xt!==tok)return;a.cancel();apply();const b=el.animate([{translate:'0 14px',opacity:0},{translate:'0 0',opacity:1}],{duration:o.in,easing:o.ei,fill:'backwards'});xfAnim.set(el,[b])},o.out+o.gap);
}
function setCount(idx,anim=true){
  const txt='0'+(idx+1);
  if(!anim)countEl.textContent=txt;else crossfade(countEl,()=>countEl.textContent=txt,{out:220,gap:60,in:380,eo:'cubic-bezier(.5,0,.75,0)',ei:'cubic-bezier(.22,1,.36,1)'});
}

/* ---- reveal / flavour change ---- */
const rv={on:false,t0:0,color:'',cx:0,cy:0,R:0};
function finishReveal(){
  if(!rv.on)return;
  root.style.setProperty('--flav',rv.color);root.style.setProperty('--rv','transparent');
  revealEl.classList.remove('on');revealEl.style.webkitMaskImage=revealEl.style.maskImage='';rv.on=false;
}
function startReveal(color){
  finishReveal();
  if(RM){root.style.setProperty('--flav',color);return}
  const r=hero.getBoundingClientRect();
  rv.cx=ARC.cx;rv.cy=ARC.cy;
  const dx=Math.max(rv.cx,r.width-rv.cx),dy=Math.max(rv.cy,r.height-rv.cy);
  rv.R=1.45*Math.hypot(dx,dy);rv.color=color;rv.t0=performance.now();rv.on=true;
  root.style.setProperty('--rv',color);revealEl.classList.add('on');updateReveal(rv.t0);
}
function updateReveal(now){
  if(!rv.on)return;
  const t=(now-rv.t0)/420;if(t>=1){finishReveal();return}
  const r=rv.R*glide(t),f=Math.max(60,.35*r);
  const m=`radial-gradient(circle at ${rv.cx}px ${rv.cy}px, #000 ${Math.max(0,r-f)}px, transparent ${r}px)`;
  revealEl.style.webkitMaskImage=m;revealEl.style.maskImage=m;
}
let liveIdx=-1;
function changeFlavour(idx,dir){
  if(idx===shown&&liveIdx===idx)return;
  shown=idx;
  startReveal(FL[idx].bg);
  setTitle(FL[idx].name,dir,true);setCount(idx);
  markLive();refreshStep4();recolorStorm();
}
function markLive(){liveIdx=shown;$$('.card').forEach((c,i)=>c.classList.toggle('live',i===shown))}
let flavTimer=0,lastDir=1;
function goTo(t,durOverride){
  t=Math.round(t);const from=pos,d=Math.abs(t-from);
  const prev=target;target=t;
  if(t!==prev)lastDir=t>prev?1:-1;
  const dur=durOverride??(650+160*Math.max(0,d-1));
  if(RM){pos=t;tween=null}else if(d>1e-4)tween={from,to:t,t0:performance.now(),dur,ease:glide};else tween=null;
  clearTimeout(flavTimer);
  const fi=mod(t,N);
  if(fi!==shown)flavTimer=setTimeout(()=>{if(mod(target,N)!==shown)changeFlavour(mod(target,N),lastDir)},RM?0:dur*.12);
}
function next(n=1){lastInteract=performance.now();goTo(target+n)}

/* ---- hero input ---- */
function slotPx(){return 245*ARC.u*ARC.spread}
let ray=null;
function hitBar(cx,cy){
  if(!renderer||!ray)return null;
  const nd=new THREE.Vector2(cx/vw*2-1,-(cy/vh)*2+1);ray.setFromCamera(nd,camera);
  const ms=[];for(const b of bars)if(b.group.visible&&b.j!=null)ms.push(b.front);
  const hit=ray.intersectObjects(ms,false)[0];return hit?hit.object.userData.bar:null;
}
arcEl.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse'&&e.button!==0)return;
  lastInteract=performance.now();
  drag={id:e.pointerId,x0:e.clientX,pos0:pos,active:false,lx:e.clientX,lt:e.timeStamp};vel=0;
});
arcEl.addEventListener('pointermove',e=>{
  lastInteract=performance.now();
  if(drag&&e.pointerId===drag.id){
    const dx=e.clientX-drag.x0;
    if(!drag.active){
      if(Math.abs(dx)<=6)return;
      drag.active=true;drag.pos0=pos;drag.x0=e.clientX-Math.sign(dx)*0;tween=null;
      try{arcEl.setPointerCapture(e.pointerId)}catch(_){}
      body.classList.add('dragging');
    }
    const ddx=e.clientX-drag.x0;
    pos=drag.pos0-ddx/slotPx();
    const dt=Math.max(1,e.timeStamp-drag.lt);const sample=-(e.clientX-drag.lx)/slotPx()/dt;vel=lerp(vel,sample,.4);
    drag.lx=e.clientX;drag.lt=e.timeStamp;
  }else if(e.pointerType==='mouse'&&!drag){
    arcEl.style.cursor=hitBar(e.clientX,e.clientY)?'pointer':'grab';
  }
});
function endDrag(e,cancel){
  if(!drag||(e&&e.pointerId!==drag.id))return;
  const d=drag;drag=null;body.classList.remove('dragging');
  try{arcEl.releasePointerCapture(d.id)}catch(_){}
  if(d.active){
    if(cancel){const near=Math.abs(pos-Math.round(pos))<.02;if(near){pos=Math.round(pos);goTo(pos);return}}
    const to=Math.round(pos+clamp(vel*220,-2,2));
    goTo(to,Math.max(380,650*Math.min(1,Math.abs(to-pos)+.35)));
  }else if(!cancel){
    const b=hitBar(e.clientX,e.clientY);
    if(b&&b.j!==Math.round(target)){lastInteract=performance.now();goTo(b.j)}
    else if(b)pokeHero=performance.now();
  }
}
arcEl.addEventListener('pointerup',e=>endDrag(e,false));
arcEl.addEventListener('pointercancel',e=>endDrag(e,true));
$('#play').addEventListener('click',()=>next(1));
addEventListener('keydown',e=>{
  if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
    if(heroVis()>=.5&&!/INPUT|TEXTAREA/.test(document.activeElement.tagName)){e.preventDefault();next(e.key==='ArrowRight'?1:-1)}
  }
  smooth_.active=false;
});
const autoBtn=$('#auto');
autoBtn.addEventListener('click',()=>{autoOn=!autoOn;autoBtn.setAttribute('aria-pressed',autoOn);lastInteract=performance.now()});
autoBtn.setAttribute('aria-pressed',autoOn);
function heroVis(){const r=hero.getBoundingClientRect();const v=Math.min(r.bottom,vh)-Math.max(r.top,0);return clamp(v/Math.min(r.height,vh))}
setInterval(()=>{
  if(!entered||!autoOn||drag||document.hidden||RM)return;
  const n=performance.now();
  if(n-Math.max(lastInteract,lastAuto)>=3200&&heroVis()>=.6){lastAuto=n;goTo(target+1)}
},200);
let pokeHero=0;

/* ---- floating bits ---- */
const BITCFG=[[.12,.20,120,-18,0],[.86,.18,96,22,0],[.07,.74,84,12,0],[.655,.15,78,-10,1],[.205,.885,70,30,2]];
BITCFG.forEach((c,i)=>{
  const el=document.createElement('i');el.className='bit';
  el.style.cssText=`--x:${c[0]};--y:${c[1]};--s:${c[2]};--r:${c[3]}deg;--i:${i}`;
  bitSpr(el,c[4]);$('#bits').append(el);
});
// phone hides bits 1, 3 and 4
$$('#bits .bit').forEach((el,i)=>{if(i===1||i===3||i===4)el.classList.add('h')});
function startDrift(){
  if(RM)return;
  $$('#bits .bit').forEach((el,i)=>{
    const s=i%2?-1:1;
    setTimeout(()=>el.animate([{transform:'translate(0,0) rotate(0deg)'},{transform:`translate(${s*(12+i%2*2)}px,${-(22+3*i)}px) rotate(${s*(10+i%2*2)}deg)`},{transform:'translate(0,0) rotate(0deg)'}],{duration:7000+900*i,iterations:Infinity,easing:'ease-in-out',composite:'add'}),1200+90*i);
  });
}

/* ================= nav ================= */
const secEls=['flavors','inside','shop','range'].map(id=>document.getElementById(id));
const links=$$('#pill a'),hl=$('#pill .hl'),navEl=$('#nav'),pillEl=$('#pill');
let activeSec=-1;
function placeHl(){const a=links[Math.max(0,activeSec)];if(!a)return;hl.style.left=a.offsetLeft+'px';hl.style.width=a.offsetWidth+'px'}
function goSection(id){
  smooth_.active=false;
  const el=document.getElementById(id);const y=el.getBoundingClientRect().top+scrollY;
  scrollTo({top:y,behavior:RM?'auto':'smooth'});
}
$$('[data-go]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();goSection(a.dataset.go)}));

/* ================= cart ================= */
let cartN=0;const cartEl=$('#cartN'),basket=$('#basket');
function renderCart(){
  cartEl.textContent=cartN;cartEl.style.display=cartN?'block':'none';
  if(!RM)cartEl.animate([{transform:'scale(0)'},{transform:'scale(1.5)',offset:.55},{transform:'scale(1)'}],{duration:350,easing:'ease-out'});
}
function bump(){if(!RM)basket.animate([{transform:'scale(1)'},{transform:'scale(1.18)'},{transform:'scale(1)'}],{duration:320,easing:'ease-out'})}
function flyToCart(els,add=1){
  if(RM){cartN+=add;renderCart();return}
  const bk=basket.getBoundingClientRect(),bx=bk.left+bk.width/2,by=bk.top+bk.height/2;let done=0;
  els.forEach((el,i)=>{
    const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
    const c=document.createElement('div');c.className='fly spr';
    c.style.cssText=`left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;background-image:${cs.backgroundImage};background-size:${cs.backgroundSize};background-position:${cs.backgroundPosition}`;
    body.append(c);
    const dx=bx-(r.left+r.width/2),dy=by-(r.top+r.height/2),k=Math.min(.2,30/r.height),lift=Math.min(160,.35*Math.abs(dy)+60);
    const a=c.animate([
      {transform:'translate(0,0) scale(1) rotate(0deg)',opacity:1},
      {transform:`translate(${dx*.4}px,${dy*.4-lift}px) scale(${.45+k}) rotate(-10deg)`,opacity:1,offset:.45},
      {transform:`translate(${dx}px,${dy}px) scale(${k}) rotate(-18deg)`,opacity:.15}],
      {duration:900,delay:120*i,easing:'cubic-bezier(.5,0,.2,1)',fill:'both'});
    a.onfinish=()=>{c.remove();bump();if(++done===els.length){cartN+=add;renderCart()}};
  });
}

/* ================= shop ================= */
const cardsEl=$('#cards');
const tilt=FL.map(()=>({x:0,y:0,tx:0,ty:0,hover:false,down:false}));
FL.forEach((f,i)=>{
  const [a,...b]=f.name.split(' ');
  const c=document.createElement('article');c.className='card';c.style.cssText=`--c:${f.color};--i:${i}`;c.dataset.f=i;
  c.innerHTML=`<div class="nm disp">${a}${b.length?'<br>'+b.join(' '):''}</div><div class="pk"></div><button class="add" type="button" aria-label="Ajouter ${f.name} au panier"><svg viewBox="0 0 20 20"><path d="M10 4v12M4 10h12"/></svg></button>`;
  wrapSpr(c.querySelector('.pk'),i);cardsEl.append(c);
  const st=tilt[i];
  const apply=()=>{c.style.transform=st.hover?`translateY(-8px) rotateX(${-st.ty*12}deg) rotateY(${st.tx*12}deg)${st.down?' scale(.97)':''}`:(st.down?'scale(.97)':'');c.style.boxShadow=st.hover?'0 24px 40px -18px rgba(40,30,20,.35)':''};
  if(FINE){
    c.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;const r=c.getBoundingClientRect();st.tx=(e.clientX-r.left)/r.width-.5;st.ty=(e.clientY-r.top)/r.height-.5;st.hover=true;apply()});
    c.addEventListener('pointerleave',()=>{st.hover=false;st.down=false;st.tx=st.ty=0;apply()});
  }
  c.addEventListener('pointerdown',()=>{st.down=true;apply()});
  addEventListener('pointerup',()=>{if(st.down){st.down=false;apply()}});
  c.querySelector('.add').addEventListener('click',e=>{e.stopPropagation();flyToCart([c.querySelector('.pk')],1)});
  c.addEventListener('click',e=>{
    const pk=c.querySelector('.pk'),r=pk.getBoundingClientRect();
    if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)return;
    if(i===shown&&glReady)poke=performance.now();
    else if(!RM)pk.animate([{transform:'translateZ(30px) scale(1,1)'},{transform:'translateZ(30px) scale(1.06,.93)',offset:.3},{transform:'translateZ(30px) scale(.97,1.04)',offset:.6},{transform:'translateZ(30px) scale(1,1)'}],{duration:500,easing:'ease-out'});
  });
});
let poke=0;
function pokeScale(now,t0){const t=(now-t0)/500;if(t<0||t>=1)return[1,1];
  const kf=[[0,1,1],[.3,1.06,.93],[.6,.97,1.04],[1,1,1]];
  for(let i=0;i<3;i++){const a=kf[i],b=kf[i+1];if(t<=b[0]){const u=(t-a[0])/(b[0]-a[0]);return[lerp(a[1],b[1],u),lerp(a[2],b[2],u)]}}return[1,1]}
// reveal-on-view
const io=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target)}}),{threshold:.18});
[$('#shopHead'),$('#shopCap'),cardsEl,$('#bHead')].forEach(el=>io.observe(el));
let strip_done=false;

/* ================= builder ================= */
const pack=[null,null,null];let touched=false,lastPick=3;
const slotsEl=$('#slots'),thumbsEl=$('#thumbs'),buy=$('#buy'),buyL=$('#buyL'),glow=$('#glow');
const SLOTPOS=[[50.2,37],[34.8,59.3],[64.8,59.3]];
const slotEls=SLOTPOS.map((p,i)=>{
  const s=document.createElement('div');s.className='slot';s.style.left=p[0]+'%';s.style.top=p[1]+'%';
  s.innerHTML=`<div class="bar"></div><button class="x" type="button" aria-label="Retirer ou ajouter un morceau"><svg viewBox="0 0 20 20"><path d="M5 5l10 10M15 5L5 15"/></svg></button>`;
  s.querySelector('.x').addEventListener('click',()=>{touched=true;if(pack[i]!=null){pack[i]=null;renderPack()}});
  slotsEl.append(s);return s;
});
const thumbEls=FL.map((f,i)=>{
  const t=document.createElement('button');t.type='button';t.className='thumb';
  t.innerHTML=`<div class="sq" style="--c:${f.color}"><div class="spr"></div><span class="rg"></span></div><div class="nm">${f.name}</div>`;
  wrapSpr(t.querySelector('.spr'),i);
  t.addEventListener('click',()=>{touched=true;addToPack(i)});
  thumbsEl.append(t);return t;
});
function hexA(h,a){const n=parseInt(h.slice(1),16);return`rgba(${n>>16},${(n>>8)&255},${n&255},${a})`}
function addToPack(f){const i=pack.indexOf(null);if(i<0)return;pack[i]=f;lastPick=f;
  glow.style.setProperty('--g',hexA(FL[f].color,.72));glow.classList.remove('pulse');void glow.offsetWidth;glow.classList.add('pulse');renderPack()}
function renderPack(){
  slotEls.forEach((s,i)=>{
    const f=pack[i],bar=s.querySelector('.bar');s.classList.toggle('full',f!=null);
    if(f!=null&&bar.dataset.f!=f){wrapSpr(bar,f);bar.dataset.f=f;bar.classList.remove('rise');void bar.offsetWidth;bar.classList.add('rise')}
    if(f==null){bar.dataset.f='';bar.classList.remove('rise')}
    s.querySelector('.x').setAttribute('aria-label',f==null?'Emplacement vide':'Retirer '+FL[f].name);
  });
  thumbEls.forEach((t,i)=>{const n=pack.filter(x=>x===i).length,rg=t.querySelector('.rg');rg.classList.toggle('on',n>0);rg.textContent=n>1?n:'✓'});
  const empty=pack.filter(x=>x==null).length;
  if(!buy.classList.contains('done')){buy.disabled=empty>0;buyL.textContent=empty?`Encore ${empty} à choisir`:'Ajouter au panier'}
}
buy.addEventListener('click',()=>{
  if(buy.disabled||pack.includes(null))return;
  const srcs=slotEls.map(s=>s.querySelector('.bar'));
  flyToCart(srcs,1);
  setTimeout(()=>{pack.fill(null);buy.classList.add('done');buyL.textContent='Ajouté au panier';buy.disabled=false;renderPack();
    setTimeout(()=>{buy.classList.remove('done');renderPack()},1600)},60);
});
renderPack();
let startedFull=false;
new IntersectionObserver((es,ob)=>{es.forEach(en=>{if(en.isIntersecting&&!startedFull){startedFull=true;ob.disconnect();
  if(touched)return;[0,1,2].forEach((n,k)=>setTimeout(()=>{if(!touched)addToPack(mod(shown+n,N))},[250,410,570][k]))}})},{threshold:.3}).observe($('#range'));

/* ================= section 2 ================= */
const inside=$('#inside'),inFront=$('#inFront'),inBar=$('#inBar'),inDark=$('#inDark'),inNum=$('#inNum'),inHead=$('#inHead'),inCap=$('#inCap'),fwrap=$('#fwrap'),stormEl=$('#storm');
const STEPS=[
 {h:'Rôti lentement,<br>à chaque fois',c:'Poulets fermiers.<br>Rien que du vrai.',a:0},
 {h:'Glacé,<br>pas frit',c:'Miel, herbes, feu.<br>Peau croustillante, cœur juteux.',a:180},
 {h:'Frais<br>chaque jour',c:'Préparé à l\'aube.<br>Sur votre table à midi.',a:360},
 {h:null,c:'Rôti lentement.<br>Vraiment juteux.',a:720}];
function step4Html(){return FL[shown].name.split(' ').map(w=>w.length>9?`<span style="font-size:.72em">${w}</span>`:w).join('<br>')}
const stepHtml=s=>s===3?step4Html():STEPS[s].h;
let s2={step:0,angle:0,tw:null};
inHead.innerHTML=stepHtml(0);inCap.innerHTML=STEPS[0].c;
function refreshStep4(){if(s2.step===3)crossfade(inHead,()=>inHead.innerHTML=step4Html(),{out:240,gap:40,in:460,eo:'ease-out',ei:'cubic-bezier(.22,1,.36,1)'})}
const icons=$$('#inIcons button');
icons.forEach((b,i)=>b.addEventListener('click',()=>{
  smooth_.active=false;
  const top=inside.getBoundingClientRect().top+scrollY,span=inside.offsetHeight-vh;
  scrollTo({top:top+span*(i+.5)*.19,behavior:RM?'auto':'smooth'});
}));
function setStep(n,now){
  if(n===s2.step)return;
  const to=STEPS[n].a,from=s2.angle,half=clamp(Math.abs(to-s2.angle)/180,.4,2),dur=720*half;
  s2.step=n;
  icons.forEach((b,i)=>b.classList.toggle('on',i===n));
  if(RM){s2.angle=to;s2.tw=null}else s2.tw={from,to,t0:now,dur};
  const delay=RM?0:.38*Math.min(dur,720);
  const o={out:240,gap:40,in:460,eo:'ease-out',ei:'cubic-bezier(.22,1,.36,1)'};
  setTimeout(()=>{
    if(s2.step!==n)return;
    crossfade(inHead,()=>inHead.innerHTML=stepHtml(n),o);
    crossfade(inNum,()=>inNum.textContent='0'+(n+1),o);
    crossfade(inCap,()=>inCap.innerHTML=STEPS[n].c,o);
  },delay);
}
icons[0].classList.add('on');
/* storm */
const R3=rng(7);const storm=[];
for(let i=0;i<20;i++){
  const el=document.createElement('i');stormEl.append(el);
  storm.push({el,a:R3()*Math.PI*2,ph:i/20+R3()*.03,spin:(R3()*2-1)*360,sz:.7+R3()*.7,own:R3()<.7,bit:Math.floor(R3()*3)});
}
function recolorStorm(){storm.forEach(p=>{if(p.own)wrapSpr(p.el,shown);else bitSpr(p.el,p.bit)})}
recolorStorm();

/* ================= frames / scaling ================= */
function sizeFrames(){
  const k=phone?Math.min(vw/390,vh/780):Math.min(vw/1440,vh/900);
  $('#backFrame').style.setProperty('--k',k);$('#frontFrame').style.setProperty('--k',k);
  const base=.085*Math.min(vw,vh);
  storm.forEach(p=>{p.el.style.width=base*p.sz+'px'});
}

/* ================= smooth wheel ================= */
const smooth_={active:false,target:0,cur:0};
if(FINE&&!RM){
  addEventListener('wheel',e=>{
    if(e.ctrlKey||body.classList.contains('locked')||Math.abs(e.deltaX)>Math.abs(e.deltaY))return;
    e.preventDefault();
    let dy=e.deltaY;if(e.deltaMode===1)dy*=32;else if(e.deltaMode===2)dy*=vh;
    const max=document.documentElement.scrollHeight-vh;
    if(!smooth_.active){smooth_.active=true;smooth_.cur=scrollY;smooth_.target=scrollY}
    smooth_.target=clamp(smooth_.target+dy,0,max);
  },{passive:false});
  addEventListener('pointerdown',()=>{smooth_.active=false},{capture:true});
}
function smoothStep(dt){
  if(!smooth_.active)return;
  smooth_.cur+=(smooth_.target-smooth_.cur)*(1-Math.exp(-dt/120));
  if(Math.abs(smooth_.target-smooth_.cur)<.5){smooth_.cur=smooth_.target;smooth_.active=false}
  scrollTo(0,smooth_.cur);
}

/* ================= main loop ================= */
let lastT=performance.now(),stripScrolled=false;
function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min(100,now-lastT);lastT=now;
  smoothStep(dt);
  // tween
  if(tween){const t=(now-tween.t0)/tween.dur;if(t>=1){pos=tween.to;tween=null}else pos=lerp(tween.from,tween.to,tween.ease(t))}
  const hr=hero.getBoundingClientRect(),ir=inside.getBoundingClientRect(),sr=$('#shop').getBoundingClientRect();
  computeArc(hr);
  updateReveal(now);
  // front layer pin
  const pinY=ir.top>0?ir.top:(ir.bottom<vh?ir.bottom-vh:0);
  const vis=ir.top<vh&&ir.bottom>0;
  inFront.style.visibility=vis?'visible':'hidden';
  if(vis)inFront.style.transform=`translateY(${pinY}px)`;
  // section 2 mapping
  const span=Math.max(1,ir.height-vh),p=clamp(-ir.top/span);
  const st=Math.floor(Math.min(p,.759)/.19);
  setStep(clamp(st,0,3),now);
  if(s2.tw){const t=(now-s2.tw.t0)/s2.tw.dur;if(t>=1){s2.angle=s2.tw.to;s2.tw=null}else s2.angle=lerp(s2.tw.from,s2.tw.to,-(Math.cos(Math.PI*t)-1)/2)}
  const q=clamp((p-.76)/.24);
  if(window.dbgLive&&now-(window._dl||0)>400){window._dl=now;window.dbgLive('p='+p.toFixed(2)+' step='+s2.step+' angle='+Math.round(s2.angle)+' q='+q.toFixed(2)+' RM='+RM+' fps~'+Math.round(1000/Math.max(1,dt)))}
  const fade=1-clamp(4*q);
  fwrap.style.opacity=fade;inNum.style.opacity=fade;
  inDark.style.opacity=clamp(3.5*q)*.42;
  // storm pieces
  const cx=vw/2,cy=vh/2,R=.55*Math.hypot(vw,vh);
  storm.forEach(pc=>{
    const s=clamp((q-.45*pc.ph)/.55);
    if(RM||q<=0||q>=1||s<=0||s>=1){pc.el.style.visibility='hidden';return}
    const rad=(.06+Math.pow(s,1.5)*.95)*R,x=cx+Math.cos(pc.a)*rad,y=cy+Math.sin(pc.a)*rad*.8,sc=.2+1.7*s;
    pc.el.style.visibility='visible';
    pc.el.style.opacity=Math.sin(Math.PI*s)*clamp(5*q)*clamp(6*(1-q));
    pc.el.style.transform=`translate(${x}px,${y}px) translate(-50%,-50%) scale(${sc}) rotate(${pc.spin*s}deg)`;
  });
  // nav
  let act=0;secEls.forEach((s,i)=>{if(s.getBoundingClientRect().top<=vh*.35)act=i});
  if(act!==activeSec){activeSec=act;links.forEach((a,i)=>a.classList.toggle('on',i===act));placeHl();
    pillEl.classList.toggle('light',act===2);navEl.classList.toggle('dark',act!==2)}
  // 3D
  if(!glReady)return;
  const jT=Math.round(target),p1=clamp(1-ir.top/vh),p3=clamp((vh-sr.top)/(.7*vh));
  bars.forEach(b=>{b.j=null;b.group.visible=false;b.shadow.visible=false});
  const fo=1-clamp(1.6*p1);
  const base=Math.floor(pos);
  for(let j=base-5;j<=base+5;j++){
    if(j===jT)continue;
    const b=bars[mod(j,11)];b.j=j;setFlav(b,mod(j,N));
    const s=arcState(j-pos,j,now);s.op*=fo;
    place(b,s);
  }
  // traveller
  trav.j=jT;setFlav(trav,mod(jT,N));
  const A=arcState(jT-pos,jT,now);
  let S=A;
  const br=inBar.getBoundingClientRect();
  const bob=RM?0:Math.sin(now/2600*Math.PI*2)*6;
  const angB=s2.angle+720*q*(RM?0:1);
  const B={x:br.left+br.width/2,y:br.top+br.height/2+bob,h:br.height,rz:14,ry:angB,rx:0,z:0,op:1,shadow:1,sx:1,sy:1};
  if(p1>0)S=lerpState(A,B,smooth(p1));
  if(p3>0){
    const card=cardsEl.children[mod(jT,N)],pk=card.querySelector('.pk'),cr=pk.getBoundingClientRect(),ti=tilt[mod(jT,N)];
    ti.x=lerp(ti.x,ti.hover?ti.tx:0,.2);ti.y=lerp(ti.y,ti.hover?ti.ty:0,.2);
    const C={x:cr.left+cr.width/2,y:cr.top+cr.height/2,h:cr.height,rz:0,ry:Math.round(angB/360)*360+ti.x*14,rx:-ti.y*14,z:30,op:1,shadow:.7,sx:1,sy:1};
    S=lerpState(B,C,smooth(p3));
    if(!stripScrolled&&phone){stripScrolled=true;const c=card;cardsEl.scrollTo({left:c.offsetLeft-(cardsEl.clientWidth-c.offsetWidth)/2,behavior:RM?'auto':'smooth'})}
  }
  if(poke){const[sx,sy]=pokeScale(now,poke);S.sx=sx;S.sy=sy;if(now-poke>500)poke=0}
  if(pokeHero){const[sx,sy]=pokeScale(now,pokeHero);S.sx=sx;S.sy=sy;if(now-pokeHero>500)pokeHero=0}
  place(trav,S);
  renderer.render(scene,camera);
}

/* ================= entrance / boot ================= */
function enterHero(){
  if(entered)return;entered=true;
  body.classList.remove('locked');body.classList.add('entered');
  lastInteract=performance.now();
  setTitle(FL[START].name,1,true);setCount(START,false);markLive();
  const go=()=>{
    if(RM){pos=START;tween=null}else{pos=START-3.6;tween={from:pos,to:START,t0:performance.now(),dur:1700,ease:entrEase}}
    startDrift();
  };
  if(glReady||!renderer)go();else{let w=0;const iv=setInterval(()=>{w+=100;if(glReady||w>2500){clearInterval(iv);go()}},100)}
  fitTitle();
}
addEventListener('resize',()=>{resizeGL();sizeFrames();fitTitle();placeHl()});
async function boot(){
  const ok=initGL();
  sizeFrames();
  try{await Promise.all([document.fonts.load("400 100px 'Archivo Black'"),document.fonts.load("400 20px 'DM Mono'"),document.fonts.load("500 20px 'DM Mono'"),document.fonts.load("700 20px 'Inter'"),document.fonts.load("800 20px 'Inter'"),document.fonts.load("500 20px 'Inter'"),document.fonts.load("600 20px 'Inter'")])}catch(e){}
  fitTitle();placeHl();
  if(ok){
    try{
      await Promise.all(FL.map(f=>new Promise((res,rej)=>{const i=new Image();i.onload=()=>{tex_imgs[f.key]=i;res()};i.onerror=()=>rej(new Error('image '+f.key));i.src=uri(f.key)})));
      buildTextures();glReady=true;dbg('textures built, 3D ready');body.classList.add('gl');$('#shop').classList.add('gl');markLive();
    }catch(e){console.error(e);dbg('TEXTURE ERROR: '+e.message)}
  }
  enterHero();
}
setTitle(FL[START].name,1,false);setCount(START,false);
requestAnimationFrame(frame);
boot();
window.__stride={get pos(){return pos},get target(){return target},goTo,get glReady(){return glReady},enterHero,bars:()=>bars};
