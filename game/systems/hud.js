/* systems/hud.js — the HUD, from Ironhowl 4 (09_hud and the Watcher's radar in 06k_kit), laid out for a phone held upright.
   Top left: shield, hull, jet cells, hover tank, the arms, missiles, gun heat. Top middle: the wave and the dots still to clear,
   allies alive. Top right: the Watcher's radar (north up, like the camera), sensor confidence, scrap.
   On the ground: the aim mark where the shots go, lock brackets on creatures the missiles are locking.
   Radio lines run along the bottom. Damage arcs at the screen edge point at whatever hit you. */
const ROMAN=['','I','II','III','IV'];
function sty(el,k,v){const c=el._st||(el._st={});if(c[k]!==v){c[k]=v;el.style[k]=v;}}
const HUD={_c:{},
  set(id,prop,v){const k=id+prop;if(this._c[k]===v)return;this._c[k]=v;const el=$(id);if(!el)return;if(prop==='text')el.textContent=v;else if(prop==='html')el.innerHTML=v;else if(prop==='cls')el.className=v;else el.style[prop]=v;},
  stick(id,on,x,y,dx,dy){const s=$(id);if(!on){s.style.display='none';return;}s.style.display='block';s.style.left=x+'px';s.style.top=y+'px';s.firstChild.style.transform='translate('+dx+'px,'+dy+'px)';},
  msg(t,sec){const h=$('msg');h.textContent=t;h.style.opacity=1;clearTimeout(HUD._mt);HUD._mt=setTimeout(()=>h.style.opacity=0,(sec||1.2)*1000);},
  banner(t){const h=$('banner');h.textContent=t;h.classList.remove('go');void h.offsetWidth;h.classList.add('go');},
  /* a red (hull) or blue (shield) arc at the screen edge pointing to whoever hit you (north is up on screen) */
  hit(fx,fz,kind){const a=Math.atan2(fx-P.x,-(fz-P.z));const d=$('dmg'+(HUD._di=(HUD._di+1||0)%4));
    d.className='dmg '+kind;d.style.transform='rotate('+a+'rad)';d.style.opacity=1;clearTimeout(d._t);d._t=setTimeout(()=>d.style.opacity=0,450);},
  fuel(){const el=$('fuel');if(el.children.length!==P.cells){el.innerHTML='';for(let i=0;i<P.cells;i++){const c=document.createElement('i');c.appendChild(document.createElement('b'));el.appendChild(c);}}
    for(let i=0;i<P.cells;i++){const f=Math.round(clamp(P.fuel-i,0,1)*50)/50,c=el.children[i];if(c._f!==f){c._f=f;c.firstChild.style.width=(f*100)+'%';c.className=f>=1?'full':'';}}},
  flashFuel(){const el=$('fuel');el.classList.remove('no');void el.offsetWidth;el.classList.add('no');},
  frame(dt,conf){
    if(!P)return;
    this.set('bshield','width',(P.shield/P.shieldMax*100).toFixed(0)+'%');this.set('bhull','width',(P.hull/P.hullMax*100).toFixed(0)+'%');
    this.set('bhull','cls',P.hull<30?'low':'');this.fuel();
    this.set('hov','cls',P.hovering?'on act':P.hov<.999?'on':'');this.set('hovb','width',(P.hov*100).toFixed(0)+'%');
    const L=loadout(),nm={ac:'GUN '+ROMAN[GUN.tier],ln:'LANCE',ar:'ARC'};
    this.set('arms','text',nm[L.fa_L]+(L.fa_R!==L.fa_L?' · '+nm[L.fa_R]:' ×2'));
    this.set('mslc','text',MSL.max>0?'MSL '+MSL.ammo:'NO POD');this.set('bmsl','html','MSL<small>'+(MSL.max>0?MSL.ammo:'—')+'</small>');
    let ac=false;if(M&&M.ready)for(const A of M.arms)if(A.kind==='ac'||!A.kind)ac=true;
    this.set('heat','visibility',ac?'':'hidden');this.set('heatb','width',GUN.heat.toFixed(0)+'%');this.set('heat','cls',GUN.over?'over':GUN.heat>70?'warm':'');
    this.set('bvent','cls','pad tb'+(GUN.ventCd>0?' cool':GUN.over?' hot':''));
    const sr=SALVO.cd<=0;this.set('bsalvo','cls','pad tb'+(sr?'':' cool'));this.set('bsalvo','html',sr?'SALVO':'SALVO<small>'+Math.ceil(SALVO.cd)+'</small>');
    this.set('wave','text',G.wave?'WAVE '+G.wave+' · '+dotsLeft().toLocaleString('en-US')+' DOTS':'');
    const ok=alliesOK();this.set('allies','text',ALLIES.length?'ALLIES '+ok+'/'+ALLIES.length:'');this.set('allies','cls',ok<ALLIES.length?'bad':'');
    this.set('scrapc','text','SCRAP '+scrap().toLocaleString('en-US'));
    this.set('confb','width',(conf*100).toFixed(0)+'%');this.set('conf','cls',conf<.45?'bar bad':'bar');
    this.set('bthermal','cls','tb sm'+(G.thermal?' on':''));
    /* the aim mark on the ground and the Lance's charge */
    const cr=$('cross');if(G.mode==='play'&&!P.dead){_hp.set(AIM.x,AIM.e?AIM.e.cy*.5:0,AIM.z).project(cam);
      sty(cr,'display','block');sty(cr,'transform','translate('+((_hp.x*.5+.5)*innerWidth).toFixed(0)+'px,'+((-_hp.y*.5+.5)*innerHeight).toFixed(0)+'px)');
      this.set('cross','cls',GUN.hitT>0?'hit':AIM.e?'on':'');}
    else sty(cr,'display','none');
    let ch=0;if(M&&M.ready)for(const A of M.arms)if(A.kind==='ln')ch=Math.max(ch,A.ch||0);
    this.set('lch','cls',ch>0?(ch>=.99?'on full':'on'):'');this.set('lchb','width',Math.round(ch*100)+'%');
    this.marks();this.radar(dt);this.edges();
  },
  /* lock brackets: creatures the missiles are locking (or have locked) */
  marks(){const list=[];if(G.mode==='play'&&MSL.ammo>0)for(const e of EN){if(e.dead||e.spawnT>0||(e.lk||0)<.02)continue;list.push(e);}
    list.sort((a,b)=>b.lk-a.lk);
    while(this._mk.length<8){const el=document.createElement('div');el.className='mk';el.innerHTML='<i></i>';document.body.appendChild(el);this._mk.push(el);}
    this._mk.forEach((el,i)=>{const e=list[i];if(!e){sty(el,'display','none');return;}
      _hp.set(e.x,e.cy,e.z).project(cam);if(_hp.z>1||Math.abs(_hp.x)>1.05||Math.abs(_hp.y)>1.05){sty(el,'display','none');return;}
      const s=Math.max(26,Math.min(140,e.r*2*innerHeight/(Math.tan(cam.fov*Math.PI/360)*2*cam.position.distanceTo(_hp.set(e.x,0,e.z)))));
      sty(el,'display','block');sty(el,'width',s.toFixed(0)+'px');sty(el,'height',s.toFixed(0)+'px');
      _hp.set(e.x,e.cy,e.z).project(cam);sty(el,'transform','translate('+((_hp.x*.5+.5)*innerWidth).toFixed(0)+'px,'+((-_hp.y*.5+.5)*innerHeight).toFixed(0)+'px)');
      const cls='mk'+(e.lk>=1?' lock':' locking');if(el.className!==cls)el.className=cls;});},
  _mk:[],_rt:0,
  /* the Watcher's radar: north up like the camera; red = a creature (bigger for more dots), green = an ally */
  radar(dt){const W=kitHas('watcher');sty($('radar'),'display',W?'block':'none');if(!W||(this._rt-=dt)>0)return;this._rt=.1;
    const cv=$('radar'),g=cv.getContext('2d'),w=cv.width,r=w/2-3,R=120,k=r/R;g.clearRect(0,0,w,w);
    g.fillStyle='rgba(8,14,18,.6)';g.beginPath();g.arc(w/2,w/2,r,0,TAU);g.fill();g.strokeStyle='rgba(79,224,184,.35)';g.lineWidth=1;
    for(const f of [1,.5]){g.beginPath();g.arc(w/2,w/2,r*f,0,TAU);g.stroke();}
    const sw=(G.t*1.6)%TAU;g.fillStyle='rgba(79,224,184,.10)';g.beginPath();g.moveTo(w/2,w/2);g.arc(w/2,w/2,r,sw-.5,sw);g.fill();
    const pt=(x,z)=>{const dx=x-P.x,dz=z-P.z;return [w/2+dx*k,w/2+dz*k,Math.hypot(dx,dz)];};
    g.fillStyle='rgba(255,90,26,.7)';for(const rf of RIFTS){const [x,y,d]=pt(rf.x,rf.z);if(d<R)g.fillRect(x-2,y-2,4,4);}
    for(const a of ALLIES){if(a.state===2)continue;const [x,y,d]=pt(a.x,a.z);if(d>R)continue;g.fillStyle=a.state===1?(Math.sin(G.t*30)>0?'#ff3b26':'#4fe08a'):'#4fe08a';g.fillRect(x-1.5,y-1.5,3,3);}
    for(const e of EN){if(e.dead)continue;const [x,y,d]=pt(e.x,e.z);if(d>R)continue;g.fillStyle='#ff3b26';g.beginPath();g.arc(x,y,clamp(1.2+Math.sqrt(e.alive)*.22,1.4,6),0,TAU);g.fill();}
    g.fillStyle='#fff';g.save();g.translate(w/2,w/2);g.rotate(-P.yaw);g.beginPath();g.moveTo(0,-5);g.lineTo(3.5,4);g.lineTo(-3.5,4);g.closePath();g.fill();g.restore();},
  /* arrows at the screen edge for creatures off screen within 60 m */
  edges(){let n=0;
    for(const e of EN){if(n>=6)break;if(e.dead||e.spawnT>0)continue;const d=Math.hypot(e.x-P.x,e.z-P.z);if(d>60)continue;
      _hp.set(e.x,e.cy,e.z).project(cam);if(Math.abs(_hp.x)<1&&Math.abs(_hp.y)<1)continue;
      let sx=_hp.x,sy=-_hp.y;if(_hp.z>1){sx=-sx;sy=-sy;}const m=Math.max(Math.abs(sx),Math.abs(sy))||1,kx=(innerWidth/2-22)/(innerWidth/2),ky=(innerHeight/2-22)/(innerHeight/2);
      sx=sx/m;sy=sy/m;const px=(.5+.5*sx*kx)*innerWidth,py=(.5+.5*sy*ky)*innerHeight,a=Math.atan2(sx*innerWidth,-sy*innerHeight);
      const el=$('ea'+n++);sty(el,'display','block');sty(el,'transform','translate('+px.toFixed(0)+'px,'+py.toFixed(0)+'px) rotate('+a.toFixed(2)+'rad)');sty(el,'opacity',d<25?'1':'.6');}
    for(;n<6;n++)sty($('ea'+n),'display','none');}
};
const _hp=new THREE.Vector3();
/* radio and OVERWATCH lines along the bottom */
let RADIO_T=0;
function radio(html,sec){$('cap').innerHTML=html;$('cap').style.opacity=1;RADIO_T=sec||3;}
function updRadio(dt){if(RADIO_T>0){RADIO_T-=dt;if(RADIO_T<=0)$('cap').style.opacity=0;}}
function setupHud(){
  if(touchy)document.body.classList.add('touch');
  const hold=(id,on,off)=>{const b=$(id);b.addEventListener('touchstart',e=>{e.preventDefault();audioInit();on(e);b.classList.add('on');},{passive:false});
    const up=e=>{off&&off(e);b.classList.remove('on');};b.addEventListener('touchend',up);b.addEventListener('touchcancel',up);
    b.addEventListener('mousedown',e=>{e.stopPropagation();audioInit();on(e);});b.addEventListener('mouseup',e=>{off&&off(e);});};
  hold('bjet',()=>{TS.jet=true;TS.jetHit=true;},()=>{TS.jet=false;});
  hold('bmsl',()=>{TS.msl=true;});hold('bvent',()=>{TS.vent=true;});hold('bsalvo',()=>{TS.salvo=true;});
  $('bthermal').onclick=e=>{e.stopPropagation();setThermal(!G.thermal);};
  $('bzoom').onclick=e=>{e.stopPropagation();cycleZoom();};
  $('bpause').onclick=e=>{e.stopPropagation();if(G.mode==='play')setPause(!G.paused);};
  for(let i=0;i<4;i++){const d=document.createElement('div');d.id='dmg'+i;d.className='dmg';document.body.appendChild(d);}
  for(let i=0;i<6;i++){const d=document.createElement('div');d.id='ea'+i;d.className='ea';d.innerHTML='<i></i>';document.body.appendChild(d);}
}
