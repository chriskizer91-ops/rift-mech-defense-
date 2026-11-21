/* systems/input.js — controls, from Ironhowl 4 (02_input), changed for a top-down view.
   Touch: the left thumb's stick moves (it appears where the thumb lands, left 45 % of the screen). The right thumb's stick aims:
   it appears wherever the right thumb lands, and pushing it past a quarter of its reach fires (the Lance charges and fires on release).
   Buttons (JET, SALVO, MSL, VENT) sit on the right edge, above the aim stick's area.
   Mouse and keys: WASD moves, the mouse points at the ground where you want to shoot, hold the left button to fire,
   right button or G missiles, Space jet (hold to hover), Q or E salvo, R vent, T thermal, U upgrades, P or Esc pause.
   Gamepad: left stick moves, right stick aims (and fires past a third), A or LB jet, RT fire, LT missiles, X salvo, B vent.
   readCtl(dt) gives one frame of intent:
     mx,my  move in world directions (-1..1; mx east, my north)
     aim    true while aiming; ax,az = aim direction on the ground (unit), or the point under the mouse (mouse: aimPt)
     fire, jet (held), jetHit (pressed this frame), msl, vent, salvo, thermal, pause, upg (pressed this frame) */
const KEYS=new Set(),HIT=new Set();
const MOUSE={x:0,y:0,seen:0,l:false,rHit:false,inside:false};
const TS={id:-1,ox:0,oy:0,ax:0,ay:0,aid:-1,aox:0,aoy:0,aax:0,aay:0,jet:false,jetHit:false,msl:false,vent:false,salvo:false};
const STICK_R=58;
let PAD_PREV={};
addEventListener('keydown',e=>{if(e.repeat)return;KEYS.add(e.code);HIT.add(e.code);if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();});
addEventListener('keyup',e=>KEYS.delete(e.code));
addEventListener('blur',()=>{KEYS.clear();TS.id=TS.aid=-1;TS.jet=false;MOUSE.l=false;});
addEventListener('mousemove',e=>{MOUSE.x=e.clientX;MOUSE.y=e.clientY;MOUSE.seen=performance.now();MOUSE.inside=true;});
addEventListener('mousedown',e=>{if(e.target.closest&&e.target.closest('button,.panel'))return;audioInit();if(e.button===0)MOUSE.l=true;if(e.button===2)MOUSE.rHit=true;});
addEventListener('mouseup',e=>{if(e.button===0)MOUSE.l=false;});
addEventListener('contextmenu',e=>e.preventDefault());
function uiOpen(){return G.mode!=='play'||G.paused;}
function touchStart(e){audioInit();if(uiOpen())return;let field=false;
  for(const t of e.changedTouches){
    if(t.target.closest&&t.target.closest('button,.panel'))continue;field=true;
    if(t.clientX<innerWidth*.45&&TS.id<0){TS.id=t.identifier;TS.ox=t.clientX;TS.oy=t.clientY;TS.ax=TS.ay=0;HUD.stick('stick',true,TS.ox,TS.oy,0,0);}
    else if(TS.aid<0){TS.aid=t.identifier;TS.aox=t.clientX;TS.aoy=t.clientY;TS.aax=TS.aay=0;HUD.stick('astick',true,TS.aox,TS.aoy,0,0);}
  }
  if(field)e.preventDefault();
}
/* a stick's base follows the thumb so it never runs out of room */
function follow(t,ox,oy){let dx=t.clientX-ox,dy=t.clientY-oy;const d=Math.hypot(dx,dy);if(d>STICK_R){ox+=dx/d*(d-STICK_R);oy+=dy/d*(d-STICK_R);dx=t.clientX-ox;dy=t.clientY-oy;}return [ox,oy,dx,dy];}
function touchMove(e){if(uiOpen())return;
  for(const t of e.changedTouches){
    if(t.identifier===TS.id){const [ox,oy,dx,dy]=follow(t,TS.ox,TS.oy);TS.ox=ox;TS.oy=oy;TS.ax=dx/STICK_R;TS.ay=dy/STICK_R;HUD.stick('stick',true,ox,oy,dx,dy);}
    else if(t.identifier===TS.aid){const [ox,oy,dx,dy]=follow(t,TS.aox,TS.aoy);TS.aox=ox;TS.aoy=oy;TS.aax=dx/STICK_R;TS.aay=dy/STICK_R;HUD.stick('astick',true,ox,oy,dx,dy);}
  }
  e.preventDefault();
}
function touchEnd(e){for(const t of e.changedTouches){if(t.identifier===TS.id){TS.id=-1;TS.ax=TS.ay=0;HUD.stick('stick',false);}if(t.identifier===TS.aid){TS.aid=-1;TS.aax=TS.aay=0;HUD.stick('astick',false);}}}
addEventListener('touchstart',touchStart,{passive:false});
addEventListener('touchmove',touchMove,{passive:false});
addEventListener('touchend',touchEnd);addEventListener('touchcancel',touchEnd);
/* where the mouse points on the ground, at the height the guns fire (so the shot goes where the cursor is) */
const _ray=new THREE.Raycaster(),_mp=new THREE.Vector2(),_pl=new THREE.Plane(new THREE.Vector3(0,1,0),-1.2),_hit=new THREE.Vector3();
function mouseGround(){_mp.set(MOUSE.x/innerWidth*2-1,-(MOUSE.y/innerHeight)*2+1);_ray.setFromCamera(_mp,cam);return _ray.ray.intersectPlane(_pl,_hit)?_hit:null;}
let LAST_AIM='touch';
function readCtl(dt){
  const o={mx:0,my:0,aim:false,ax:0,az:-1,aimPt:null,fire:false,jet:false,jetHit:false,msl:false,vent:false,salvo:false,thermal:false,pause:false,upg:false};
  const k=c=>KEYS.has(c);
  o.mx=(k('KeyD')||k('ArrowRight')?1:0)-(k('KeyA')||k('ArrowLeft')?1:0);o.my=(k('KeyW')||k('ArrowUp')?1:0)-(k('KeyS')||k('ArrowDown')?1:0);
  o.jet=k('Space');o.jetHit=HIT.has('Space');o.msl=MOUSE.rHit||HIT.has('KeyG');o.vent=HIT.has('KeyR');o.salvo=HIT.has('KeyQ')||HIT.has('KeyE');MOUSE.rHit=false;
  o.thermal=HIT.has('KeyT');o.pause=HIT.has('KeyP')||HIT.has('Escape');o.upg=HIT.has('KeyU');o.zoom=HIT.has('KeyZ');
  /* mouse: aim at the cursor whenever it has moved in the last 20 s */
  if(!touchy&&performance.now()-MOUSE.seen<2e4&&MOUSE.inside&&P){const g=mouseGround();if(g){const dx=g.x-P.x,dz=g.z-P.z,d=Math.hypot(dx,dz);
    if(d>.5){o.aim=true;o.ax=dx/d;o.az=dz/d;o.aimPt={x:g.x,z:g.z,d};LAST_AIM='mouse';}}
    o.fire=MOUSE.l||k('KeyF');}
  /* touch */
  if(TS.id>=0){const m=Math.min(1,Math.hypot(TS.ax,TS.ay)),dz=m<.12?0:(m-.12)/.88,l=Math.hypot(TS.ax,TS.ay)||1;o.mx+=TS.ax/l*dz;o.my-=TS.ay/l*dz;}
  if(TS.aid>=0){const m=Math.hypot(TS.aax,TS.aay);if(m>.12){o.aim=true;o.ax=TS.aax/m;o.az=TS.aay/m;o.aimPt=null;LAST_AIM='touch';}if(m>.25)o.fire=true;}
  if(TS.jet)o.jet=true;if(TS.jetHit){o.jetHit=true;TS.jetHit=false;}
  if(TS.msl){o.msl=true;TS.msl=false;}if(TS.vent){o.vent=true;TS.vent=false;}if(TS.salvo){o.salvo=true;TS.salvo=false;}
  /* gamepad */
  const pads=navigator.getGamepads?navigator.getGamepads():[];
  for(const p of pads){if(!p||!p.connected)continue;const ax=i=>Math.abs(p.axes[i]||0)>.16?p.axes[i]:0,b=i=>p.buttons[i]&&p.buttons[i].pressed;
    o.mx+=ax(0);o.my-=ax(1);const rx=ax(2),ry=ax(3),rm=Math.hypot(rx,ry);if(rm>.2){o.aim=true;o.ax=rx/rm;o.az=ry/rm;o.aimPt=null;if(rm>.35)o.fire=true;LAST_AIM='pad';}
    if(b(0)||b(4))o.jet=true;const pr=PAD_PREV;if((b(0)||b(4))&&!pr.j)o.jetHit=true;if(b(9)&&!pr.s)o.pause=true;
    if(b(7)||b(5))o.fire=true;if(b(6)&&!pr.m)o.msl=true;if(b(1)&&!pr.x)o.vent=true;if(b(2)&&!pr.q)o.salvo=true;if(b(3)&&!pr.t)o.thermal=true;
    PAD_PREV={j:b(0)||b(4),s:b(9),m:b(6),x:b(1),q:b(2),t:b(3)};break;}
  const l=Math.hypot(o.mx,o.my);if(l>1){o.mx/=l;o.my/=l;}
  HIT.clear();
  return o;
}
