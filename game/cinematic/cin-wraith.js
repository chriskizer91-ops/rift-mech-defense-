'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · THE SIGNAL'S REVEAL: THE TEAM (game/cinematic/cin-wraith.js, session D)
   Four Wraiths on the harbour wall: KESTREL, WRAITH (the player), VESPER and HALE (the team is decided: you fight as four).
   Ironhowl 4's Wraith V2 HD combat model with its jet pack and autocannons, decoded from the build the way session B's
   world does it (game/world/wt-mech.js: glbParse, kitMat, onMount, legSetup, legSolve, copied). They stand: the legs are
   solved to keep both feet planted on the wall while the hips breathe, and the torso and head turn as the timeline says.
   ===================================================================================================================== */
const TEAM=(function(){
const T=THREE,clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
function b64bytes(s){if(Uint8Array.fromBase64)return Uint8Array.fromBase64(s);const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u;}
const BUF={};
function glbBuf(key){if(!BUF[key]){const A=window.CIN_ASSETS.glb[key];
  BUF[key]=new Response(new Blob([b64bytes(A.b64)]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();}return BUF[key];}
function glbParse(key){return glbBuf(key).then(buf=>new Promise((ok,no)=>new T.GLTFLoader().parse(buf.slice(0),'',g=>ok(g.scene),no)));}
const KMAT={};
function kitMat(key){if(KMAT[key])return KMAT[key];const A=window.CIN_ASSETS.glb[key],L=new T.TextureLoader();
  const t=(u,lin)=>{const x=L.load(u);x.flipY=false;x.colorSpace=lin?T.NoColorSpace:T.SRGBColorSpace;x.anisotropy=4;return x;};
  return KMAT[key]=new T.MeshStandardMaterial({map:t(A.map),normalMap:t(A.nrm,1),roughnessMap:t(A.orm,1),metalnessMap:t(A.orm,1),roughness:1,metalness:1});}
function dress(sc,mat){sc.traverse(o=>{if(o.isMesh){o.material=mat;}});return sc;}
function onMount(host,sc){sc.updateMatrixWorld(true);const mt=sc.getObjectByName('mount');const hold=new T.Group();host.add(hold);
  if(mt){const inv=mt.matrixWorld.clone().invert();inv.decompose(sc.position,sc.quaternion,sc.scale);}hold.add(sc);return hold;}
const _ang=v=>Math.atan2(v.z,v.y),_wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
function legSetup(J,s,sd,hip0){const w=n=>{const v=new T.Vector3();J[n+'_'+s].getWorldPosition(v);return v;};
  const H=w('thigh'),K=w('knee'),Hk=w('hock'),A=w('ankle');
  const t0={y:K.y-H.y,z:K.z-H.z},s0={y:Hk.y-K.y,z:Hk.z-K.z},m0={y:A.y-Hk.y,z:A.z-Hk.z},P0={y:t0.y+m0.y,z:t0.z+m0.z};
  const L={s,sd,thigh:J['thigh_'+s],knee:J['knee_'+s],hock:J['hock_'+s],ankle:J['ankle_'+s],Hy:H.y-hip0,Hz:H.z,Ay:A.y,Az:A.z,ox:A.x,P:P0,Q:s0,
    lp:Math.hypot(P0.y,P0.z),lq:Math.hypot(s0.y,s0.z),sign:1};
  L.sign=[1,-1].map(g=>[g,legSolve(L,{y:P0.y+s0.y,z:P0.z+s0.z},g)]).sort((a,b)=>(Math.abs(a[1].a)+Math.abs(a[1].b))-(Math.abs(b[1].a)+Math.abs(b[1].b)))[0][0];
  return L;}
function legSolve(l,D,sg){let d=Math.hypot(D.y,D.z);d=Math.min((l.lp+l.lq)*.995,Math.max(Math.abs(l.lp-l.lq)*1.01,d));
  const phD=_ang(D),g=Math.acos(clamp((l.lp*l.lp+d*d-l.lq*l.lq)/(2*l.lp*d),-1,1)),phP=phD+sg*g;
  const Pp={y:Math.cos(phP)*l.lp,z:Math.sin(phP)*l.lp},Qp={y:Math.cos(phD)*d-Pp.y,z:Math.sin(phD)*d-Pp.z};
  return {a:_wrap(phP-_ang(l.P)),b:_wrap(_ang(Qp)-_ang(l.Q))};}
const NAMES=['KESTREL','WRAITH','VESPER','HALE'];
const SPOTS=[-21,-7,7,21].map(x=>new T.Vector3(x,5.5,-1.5));
const TM={list:[],ready:false,SPOTS,NAMES};
TM.build=function(scene,occluders){
  return Promise.all(SPOTS.map((p,i)=>Promise.all(['wraith','jetpack','acL','acR'].map(glbParse)).then(([w,jp,aL,aR])=>{
    dress(w,kitMat('wraith'));dress(jp,kitMat('jetpack'));dress(aL,kitMat('acL'));dress(aR,kitMat('acR'));
    const root=new T.Group();root.add(w);scene.add(root);const J={};w.traverse(o=>{if(o.name)J[o.name]=J[o.name]||o;});
    onMount(J.bk,jp);const hL=onMount(J.fa_L,aL),hR=onMount(J.fa_R,aR);
    for(const h of [hL,hR])h.traverse(o=>{const m=/^t(\d)_/.exec(o.name||'');if(m)o.visible=+m[1]===1;});
    const M={root,J,hips:J.hips,torso:J.torso,head:J.head,hip0:J.hips.position.y,tor0:J.torso.position.y,arms:[J.arm_L,J.arm_R].filter(Boolean),
      name:NAMES[i],spot:p,phase:i*1.7,yaw:0,headPitch:0,headYaw:0,torsoYaw:0};
    root.updateMatrixWorld(true);M.legs=[-1,1].map(sd=>legSetup(J,sd<0?'L':'R',sd,M.hip0));
    root.traverse(o=>{if(o.isMesh)occluders.push(o);});
    /* a small cold light at the visor, so each one reads in the dark */
    const eye=new T.PointLight(0x7fd6ff,3,5,2);eye.position.set(0,.3,1.2);(J.head||J.torso).add(eye);
    TM.list[i]=M;return M;}))).then(()=>{TM.ready=true;return TM;});};
/* per frame. look[k]: {pitch, yaw, torso, aim} (radians); mv[k]: {x, z, yaw, dist, spd}: where the Wraith is, which way it
   faces, how far it has walked (the gait's phase comes from that, so it never drifts) and how fast it walks now (m/s).
   Ironhowl 4's gait (wt-mech.js poseMech): each foot stays planted while the body passes over it, then swings. */
const lerp=(a,b,t)=>a+(b-a)*t,sm=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
TM.pose=function(t,look,mv){for(let k=0;k<TM.list.length;k++){const M=TM.list[k];if(!M)continue;const L=look[k]||{pitch:0,yaw:0,torso:0},m=mv&&mv[k];
  const x=m?m.x:M.spot.x,z=m?m.z:M.spot.z,yaw=m?m.yaw:0,sp=m?m.spd:0,dist=m?m.dist:0;
  M.root.position.set(x,M.spot.y,z);M.root.rotation.y=yaw;
  const sf=clamp(sp/7.5,0,1),w=sm(.15,1.4,sp),S_=lerp(1.3,3.2,sf);const phase=dist/(2*S_)+M.phase;
  const bob=Math.abs(Math.sin(phase*Math.PI*2))*.1*w;const br=Math.sin(t*1.1+M.phase)*.035*(1-w);
  const hipY=M.hip0-.08+br-bob-.05*w;
  M.hips.position.y=hipY;M.torso.position.y=hipY+(M.tor0-M.hip0);
  M.headPitch+=(L.pitch-M.headPitch)*.06;M.headYaw+=(L.yaw-M.headYaw)*.06;M.torsoYaw+=((L.torso||0)-M.torsoYaw)*.04;
  const roll=Math.sin(phase*Math.PI*2)*.025*w;
  M.torso.rotation.set(-.04-M.headPitch*.25-.05*sf,M.torsoYaw,roll);M.hips.rotation.z=roll*.6;if(M.head)M.head.rotation.set(-M.headPitch*.75,M.headYaw,0);
  for(const l of M.legs){let tz=0,lift=0,pitch=0;let u=(phase+(l.sd>0?.5:0))%1;if(u<0)u+=1;
    if(u<.5)tz=lerp(-S_/2,S_/2,u/.5);else{const q=(u-.5)/.5;tz=lerp(S_/2,-S_/2,q*q*(3-2*q));lift=Math.sin(Math.PI*q)*.5*w;pitch=-.3*Math.sin(Math.PI*q)*w;}
    tz*=w;const D={y:(l.Ay+lift)-(hipY+l.Hy),z:(l.Az+tz)-l.Hz};const r=legSolve(l,D,l.sign);
    l.thigh.rotation.x=r.a;l.knee.rotation.x=r.b-r.a;l.hock.rotation.x=r.a-r.b;l.ankle.rotation.x=-r.a+pitch;}
  M.arms.forEach((A,j)=>{A.rotation.x=-.12-M.headPitch*.3+(L.aim||0)+Math.sin(phase*Math.PI*2+(j?Math.PI:0))*.04*w+Math.sin(t*.9+M.phase)*.02*(1-w);});}};
return TM;
})();
