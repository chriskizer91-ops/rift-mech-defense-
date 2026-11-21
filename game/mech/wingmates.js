/* mech/wingmates.js — the team: three more Wraiths beside the player (Christopher, 20 Nov: "a team of 4 Wraiths, the player
   and three others, and you still have to help keep your allies alive").
   Each wingmate walks with the Wraith's own legs (poseMech), carries two autocannons and fires Ironhowl 4's rounds (the same
   shots, the same through-the-gaps rule), keeps a loose formation round the player, backs off from anything that gets close,
   and is a target for the swarm like the player is.
   Shield 30 (back at 8 a second after 3 s without a hit), hull 100. At 0 hull it goes down and stays down; stand within 7 m of it for 3 s and it gets back up at 40 % hull.
   Downed wingmates are repaired between waves. Every wingmate standing at the end of a wave is worth 40 scrap.
   The names are placeholders for session D. */
const WING_NAMES=['KESTREL','VESPER','HALE'];
const WING_LOAD={fa_L:'ac',fa_R:'ac',sh_L:'watcher',sh_R:'mpod',bk:'jetpack'};
const WING_OFF=[[-10,5],[10,5],[0,-11]];   /* where each keeps to, round the player (metres east, south) */
const WING={rate:3.2,dmg:8,spread:.05,range:36,revive:3,reviveR:7};   /* weaker than the player: 3.2 rounds a second, 8 each, 36 m */
const WINGS=[];
function buildWings(){
  for(let i=0;i<3;i++){const M2=buildMech(WING_LOAD);
    /* a green ring on the ground under each, so they read as yours from above */
    const ring=new THREE.Mesh(new THREE.RingGeometry(2.6,3.1,40),new THREE.MeshBasicMaterial({color:new THREE.Color(.2,1,.45).multiplyScalar(1.6),transparent:true,opacity:.55,depthWrite:false}));
    ring.rotation.x=-Math.PI/2;ring.position.y=.06;S.add(ring);
    const lab=document.createElement('div');lab.className='wlab';document.body.appendChild(lab);
    WINGS.push({name:WING_NAMES[i],i,M:M2,ring,lab,kind:'wing',pos:new THREE.Vector3(),x:0,z:0,y:0,yaw:0,legYaw:0,vx:0,vz:0,spd:0,
      hull:100,hullMax:100,shield:30,shieldMax:30,regenT:0,down:false,revive:0,cd:Math.random()*.2,side:0,tgt:null,tgtT:0});}
}
function resetWings(full){WINGS.forEach((w,i)=>{const o=WING_OFF[i];if(full){w.x=P.x+o[0];w.z=P.z+o[1];w.vx=w.vz=0;w.yaw=w.legYaw=0;}
  w.hull=w.hullMax;w.shield=w.shieldMax;w.down=false;w.revive=0;w.M.root.visible=true;});}
function wingsUp(){let n=0;for(const w of WINGS)if(!w.down)n++;return n;}
function hurtWing(w,dmg,fx,fz){if(w.down||G.mode!=='play')return;dmg*=DIFF.bite;w.regenT=3;
  const s=Math.min(w.shield,dmg);w.shield-=s;dmg-=s;if(dmg>0)w.hull-=dmg;
  if(w.hull<=0){w.hull=0;w.down=true;w.revive=0;boom(w.x,3,w.z,1.4);radio('<b>OVERWATCH</b> '+w.name+' is down. Get to them, stand close and I’ll bring them up.',4);sLost();}
  else if(w.hull<35&&!w.warned){w.warned=true;radio('<b>'+w.name+'</b> Taking a beating here!',2.2);}}
const _wm=new THREE.Vector3();
function updWings(dt,live){
  for(const w of WINGS){
    if(w.down){/* down: the player brings it back up by standing close */
      const d=Math.hypot(P.x-w.x,P.z-w.z);if(live&&!P.dead&&d<WING.reviveR){w.revive+=dt;if(w.revive>=WING.revive){w.down=false;w.hull=w.hullMax*.4;w.shield=0;w.warned=false;
        radio('<b>'+w.name+'</b> I’m up. Thanks.',2.4);sPickup();}}else w.revive=Math.max(0,w.revive-dt*.5);
      if(Math.random()<dt*6)part({x:w.x+(Math.random()-.5)*2,y:1+Math.random()*2,z:w.z+(Math.random()-.5)*2,vx:0,vy:2,vz:0,life:2,s0:1,s1:4,a:.35,col:[.2,.2,.21],drag:.6,grav:-.5});
      poseW(w,0,dt);continue;}
    if(w.regenT>0)w.regenT-=dt;else w.shield=Math.min(w.shieldMax,w.shield+8*dt);
    /* the target: the nearest creature in range (checked a few times a second) */
    w.tgtT-=dt;if(w.tgtT<=0||w.tgt&&w.tgt.dead){w.tgtT=.3;w.tgt=null;let bd=WING.range;for(const e of EN){if(e.dead||e.spawnT>0)continue;const d=Math.hypot(e.x-w.x,e.z-w.z)-e.r;if(d<bd){bd=d;w.tgt=e;}}}
    /* where to stand: its spot round the player, pushed back from anything within 9 m of it */
    let tx=P.x+WING_OFF[w.i][0],tz=P.z+WING_OFF[w.i][1];
    for(const e of EN){if(e.dead||e.spawnT>0)continue;const dx=w.x-e.x,dz=w.z-e.z,d=Math.hypot(dx,dz)-e.r;if(d<9){const k=(9-d)*1.4/(Math.hypot(dx,dz)||1);tx+=dx*k;tz+=dz*k;}}
    for(const o of WINGS)if(o!==w){const dx=w.x-o.x,dz=w.z-o.z,d=Math.hypot(dx,dz);if(d<6&&d>0){tx+=dx/d*(6-d);tz+=dz/d*(6-d);}}
    const l=Math.hypot(tx,tz);if(l>ARENA_R-4){tx*=(ARENA_R-4)/l;tz*=(ARENA_R-4)/l;}
    let mx=tx-w.x,mz=tz-w.z;const md=Math.hypot(mx,mz);const sp=md>1.2?Math.min(WALK,md*1.2):0;if(md>0){mx/=md;mz/=md;}
    const k=damp(3.4,dt);w.vx+=(mx*sp-w.vx)*k;w.vz+=(mz*sp-w.vz)*k;
    if(!live){w.vx*=.9;w.vz*=.9;}
    w.x+=w.vx*dt;w.z+=w.vz*dt;
    /* the body turns to the target (or the way it walks), the legs to the walk (the player's rule) */
    let want=w.yaw;if(w.tgt)want=Math.atan2(-(w.tgt.x-w.x),-(w.tgt.z-w.z));else if(Math.hypot(w.vx,w.vz)>1)want=Math.atan2(-w.vx,-w.vz);
    const da=angD(want,w.yaw);w.yaw+=clamp(da,-6*dt,6*dt);
    /* fire: when facing the target */
    w.cd-=dt;if(live&&w.tgt&&Math.abs(da)<.25&&w.cd<=0&&w.M.ready){w.cd+=1/WING.rate;if(w.cd<0)w.cd=0;
      const A=w.M.ac[w.side++%w.M.ac.length];if(A){A.muzzle.getWorldPosition(_wm);A.kick=1;}else _wm.set(w.x,3.6,w.z);
      let ax=w.tgt.x-_wm.x,ay=w.tgt.cy-_wm.y,az=w.tgt.z-_wm.z;const al=Math.hypot(ax,ay,az)||1;ax=ax/al+(Math.random()-.5)*WING.spread*2;ay/=al;az=az/al+(Math.random()-.5)*WING.spread*2;
      BOLTS.push({x:_wm.x,y:_wm.y,z:_wm.z,vx:ax*BOLT.speed,vy:ay*BOLT.speed,vz:az*BOLT.speed,life:BOLT.range/BOLT.speed,dmg:WING.dmg});
      part({x:_wm.x,y:_wm.y,z:_wm.z,vx:0,vy:0,vz:0,life:.07,s0:1.5,s1:.7,a:2.2,col:[1,.7,.35],glow:true});if(Math.random()<.35)sGun(1);}
    poseW(w,live?1:0,dt);}
}
function poseW(w,live,dt){w.pos.set(w.x,0,w.z);w.ring.position.set(w.x,hgt(w.x,w.z)+.06,w.z);w.ring.visible=!w.down;
  const hs=Math.hypot(w.vx,w.vz);let tgt=w.legYaw;if(hs>.6){const my=Math.atan2(-w.vx,-w.vz);tgt=Math.abs(angD(my,w.yaw))>1.95?my+Math.PI:my;}else if(Math.abs(angD(w.yaw,w.legYaw))>.55)tgt=w.yaw;
  const dl=angD(tgt,w.legYaw);w.legYaw+=clamp(dl,-5.5*dt,5.5*dt);w.spd=w.vx*-Math.sin(w.legYaw)+w.vz*-Math.cos(w.legYaw);
  if(!w.M.ready)return;
  if(w.down){w.M.root.rotation.z=lerp(w.M.root.rotation.z,.35,damp(3,dt));}else w.M.root.rotation.z*=.9;
  poseMech(w.M,{x:w.x,z:w.z,gy:hgt(w.x,w.z)-(w.down?.8:0),legYaw:w.legYaw,aimYaw:w.yaw,spd:w.down?0:w.spd,air:false,vy:0,land:0,thrust:0,pitch:0},live||w.down?dt:0);}
/* the names over them, and the revive bar over a downed one */
function wingLabels(){for(const w of WINGS){const el=w.lab;if(G.mode==='arty'||G.mode==='title'){sty(el,'display','none');continue;}
  _hp.set(w.x,8.5,w.z).project(cam);if(_hp.z>1||Math.abs(_hp.x)>1.1||Math.abs(_hp.y)>1.1){sty(el,'display','none');continue;}
  sty(el,'display','block');sty(el,'transform','translate('+((_hp.x*.5+.5)*innerWidth).toFixed(0)+'px,'+((-_hp.y*.5+.5)*innerHeight).toFixed(0)+'px)');
  const t=w.down?(w.revive>0?w.name+' · '+Math.round(w.revive/WING.revive*100)+'%':w.name+' DOWN'):w.name;if(el._t!==t){el._t=t;el.textContent=t;}
  const c='wlab'+(w.down?' down':w.hull<35?' low':'');if(el.className!==c)el.className=c;}}
