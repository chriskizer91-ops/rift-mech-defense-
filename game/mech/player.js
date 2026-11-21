/* mech/player.js — the Wraith on its feet and in the air, from Ironhowl 4 (06_player).
   Walk 7.5 m/s. Jet hop: tap for about 30 m, hold for about 55 m, one fuel cell a hop, cells refill on the ground.
   Hover (JP-2): keep holding JET after the hop's push, or press it again while falling, and the Wraith holds its height;
   the stick moves it at up to 9 m/s; 30 s of hover in a full tank, refilled on the ground in 12 s.
   Top-down changes: the stick moves in world directions (up = north on screen); the body turns to the aim, the legs to the walk. */
const WALK=7.5,RAD=1.6;
const JET={vh:30,vy:11,grav:22,hold:.9,holdG:.35,refill:3.2,drain:.55};
const HOV={time:30,refill:12,speed:9};
const TURN=9;   /* how fast the body turns to the aim, radians a second */
let P=null;
function mkPlayer(){return {x:0,z:12,y:0,yaw:0,pitch:0,legYaw:0,vx:0,vz:0,vy:0,air:false,
  cells:2,fuel:2,hov:1,hovering:false,jetT:9,land:0,thrust:0,spd:0,groundT:9,ev:[],hull:100,hullMax:100,shield:60,shieldMax:60,regenT:0,dead:false,aimHeld:false};}
function updPlayer(c,dt){
  if(P.dead){P.thrust=0;return;}
  /* shield comes back after 3 s without a hit */
  if(P.regenT>0)P.regenT-=dt;else P.shield=Math.min(P.shieldMax,P.shield+(P.regenRate||22)*dt);
  const wx=c.mx,wz=-c.my,ml=Math.hypot(wx,wz);
  /* the body turns to the aim; with no aim it turns to the way you walk */
  P.aimHeld=c.aim;
  let want=P.yaw;if(c.aim)want=Math.atan2(-c.ax,-c.az);else if(ml>.3)want=Math.atan2(-wx,-wz);
  const da=angD(want,P.yaw),st=TURN*(c.aim?1:.45)*dt;P.yaw+=clamp(da,-st,st);
  const fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw);
  /* jet hop */
  if(c.jetHit){
    if(!P.air&&P.fuel>=.98){const dx=ml>.2?wx/ml:fx,dz=ml>.2?wz/ml:fz;
      P.vx=dx*JET.vh;P.vz=dz*JET.vh;P.vy=JET.vy;P.air=true;P.fuel-=1;P.jetT=0;P.ev.push({t:'jet'});}
    else if(!P.air)P.ev.push({t:'nofuel'});
  }
  if(P.air){
    P.jetT+=dt;const hold=c.jet&&P.jetT<JET.hold&&P.fuel>.02;
    if(hold)P.fuel=Math.max(0,P.fuel-JET.drain*dt);
    const hov=c.jet&&!hold&&P.jetT>.3&&P.hov>0&&kitHas('jetpack');
    if(hov&&!P.hovering)P.ev.push({t:'hover'});P.hovering=hov;
    if(hov){P.hov=Math.max(0,P.hov-dt/HOV.time);P.vy+=(Math.sin(G.t*2.2)*.25-P.vy)*damp(3.5,dt);
      const k=damp(1.8,dt);P.vx+=(wx*HOV.speed-P.vx)*k;P.vz+=(wz*HOV.speed-P.vz)*k;
      if(P.hov<=0)P.ev.push({t:'hoverout'});}
    else{P.vy-=JET.grav*(hold?JET.holdG:1)*dt;
      P.vx+=wx*5*dt;P.vz+=wz*5*dt;const hv=Math.hypot(P.vx,P.vz);if(hv>JET.vh*1.05){P.vx*=JET.vh*1.05/hv;P.vz*=JET.vh*1.05/hv;}}
    P.thrust+=((P.jetT<.28?1:hold?.75:hov?.6:0)-P.thrust)*damp(14,dt);
    P.y+=P.vy*dt;
  }else{
    const tx=wx*WALK,tz=wz*WALK,k=damp(Math.hypot(P.vx,P.vz)>WALK*1.1?2.6:ml>.05?3.4:5.5,dt);
    P.vx+=(tx-P.vx)*k;P.vz+=(tz-P.vz)*k;P.thrust+=(0-P.thrust)*damp(10,dt);P.groundT+=dt;
    if(P.groundT>.6){P.fuel=Math.min(P.cells,P.fuel+dt/JET.refill);P.hov=Math.min(1,P.hov+dt/HOV.refill);}P.hovering=false;
  }
  /* move, then keep inside the arena */
  let nx=P.x+P.vx*dt,nz=P.z+P.vz*dt;const d=Math.hypot(nx,nz);
  if(d>ARENA_R){nx*=ARENA_R/d;nz*=ARENA_R/d;const nxu=nx/ARENA_R,nzu=nz/ARENA_R,vn=P.vx*nxu+P.vz*nzu;if(vn>0){P.vx-=vn*nxu*1.2;P.vz-=vn*nzu*1.2;}}
  P.x=nx;P.z=nz;
  const g=hgt(P.x,P.z);
  if(P.air){if(P.y<=g&&(P.vy<0||P.hovering)){const k=clamp(-P.vy/16,0,1.3);P.y=g;P.air=false;P.vy=0;P.groundT=0;P.land=Math.max(P.land,.18+k*.32);P.ev.push({t:'land',k});
    /* stomp landing (jets upgrade 3): knocks dots off whatever is under you */
    if(UP.stomp&&k>.35)for(const e of EN){if(e.dead||e.spawnT>0)continue;const dd=Math.hypot(e.x-P.x,e.z-P.z);if(dd<7+e.r*.5){hurtCluster(e,60*k*(1-Math.min(1,dd/(9+e.r*.5))),e.x,1,e.z);e.kx+=(e.x-P.x)/(dd||1)*12;e.kz+=(e.z-P.z)/(dd||1)*12;}}}}
  else P.y=g;
  P.land=Math.max(0,P.land-dt*1.6);
  /* legs: face the way you walk (backwards when walking backwards), shuffle round when turning on the spot */
  const hs=Math.hypot(P.vx,P.vz);let tgt=P.legYaw,turnStep=0;
  if(hs>.6){const my=Math.atan2(-P.vx,-P.vz);tgt=Math.abs(angD(my,P.yaw))>1.95?my+Math.PI:my;}
  else if(Math.abs(angD(P.yaw,P.legYaw))>.55){tgt=P.yaw;turnStep=2.4;}
  const dl=angD(tgt,P.legYaw),mx=(P.air?2:5.5)*dt;P.legYaw+=clamp(dl,-mx,mx);
  /* the torso can only twist so far from the hips: past 100 degrees the legs come round */
  if(Math.abs(angD(P.yaw,P.legYaw))>1.75&&hs<.6)P.legYaw+=clamp(angD(P.yaw,P.legYaw),-mx*1.5,mx*1.5);
  const lf=-Math.sin(P.legYaw),lz=-Math.cos(P.legYaw);
  P.spd=P.vx*lf+P.vz*lz;if(Math.abs(P.spd)<turnStep&&!P.air&&Math.abs(dl)>.05)P.spd=turnStep*Math.sign(P.spd||1);
}
function hurtPlayer(dmg,fx,fz){if(P.dead||G.mode!=='play')return;dmg*=DIFF.bite;P.regenT=P.regenDelay||3;
  const s=Math.min(P.shield,dmg);P.shield-=s;dmg-=s;if(s>0){sShield();shieldFlash();HUD.hit(fx,fz,'s');}
  if(dmg>0){P.hull-=dmg;sHurt();HUD.hit(fx,fz,'h');CAMS.shake=Math.max(CAMS.shake,.3+dmg*.02);G.hurt=Math.min(1,G.hurt+.25+dmg*.02);}
  if(P.hull<=0){P.hull=0;playerDown();}}
/* shield flash: a soft blue bubble when the shield soaks a hit */
let SHF=null;
function shieldFlash(){if(!SHF){SHF=new THREE.Mesh(new THREE.SphereGeometry(4.6,24,14),new THREE.ShaderMaterial({uniforms:{uA:{value:0}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  vertexShader:'varying vec3 vN,vV;void main(){vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=-mv.xyz;gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform float uA;varying vec3 vN,vV;void main(){float f=1.-abs(dot(normalize(vN),normalize(vV)));gl_FragColor=vec4(vec3(.35,.7,1.6)*pow(f,2.5)*uA,1.);}'}));S.add(SHF);}
  SHF.material.uniforms.uA.value=1;}
function updShieldFx(dt){if(!SHF)return;const u=SHF.material.uniforms.uA;u.value=Math.max(0,u.value-dt*3.5);SHF.visible=u.value>0;SHF.position.set(P.x,P.y+3.6,P.z);}
