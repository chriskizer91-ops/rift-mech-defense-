'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · THE MINIMAP (game/world/wt-minimap.js)
   A round map in the top-left corner, turned with the camera so what's ahead is up. The ground is painted once from the
   map (fields, water, tracks, rock, trees, buildings, the cracks); over it each frame: the rift mouths (red ring open,
   grey cross sealed), the swarm's contacts (red; the sensor sees them even when the real view doesn't), the Wraith
   (green arrow) and the camera's view (two lines). Tap it to change its range.
   For other sessions: miniInit(canvas) once the map is built, then miniDraw(px, pz, camYaw, contacts) where contacts is
   a list of {x, z, n} (n: its dot count).
   ===================================================================================================================== */
const MINI={cv:null,cx:null,base:null,mpp:4,ranges:[150,300,600],ri:0,t:0};
function miniInit(cv){MINI.cv=cv;MINI.cx=cv.getContext('2d');
  if(MAPID!=='fields'){MINI.ranges=[60,120,200];}
  const mpp=MINI.mpp=MAP.S>600?4:1,n=Math.round(MAP.S/mpp),c=document.createElement('canvas');c.width=c.height=n;const g=c.getContext('2d'),im=g.createImageData(n,n),d=im.data,K={};
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const x=MAP.X0+(i+.5)*mpp,z=MAP.X0+(j+.5)*mpp;baseKind(x,z,K);const h=K.h,dep=K.wl-h;let r,gg,b;
    if(dep>0){const k=Math.min(1,dep/4);r=40-20*k;gg=78-30*k;b=96-20*k;}
    else{r=96;gg=88;b=70;                                                               /* dirt */
      const mix=(w,R,G,B)=>{r+=(R-r)*w;gg+=(G-gg)*w;b+=(B-b)*w;};
      mix(K.meadow,70,96,48);mix(K.plough,104,78,56);mix(K.wheat,150,126,70);mix(K.sand,170,150,110);mix(K.mud,74,62,48);mix(K.asph,92,90,86);mix(K.pave,118,114,104);
      if(K.slope>.9)mix(Math.min(1,(K.slope-.9)*2),112,108,102);
      const sh=Math.max(.7,Math.min(1.2,1+(baseH(x-2,z-2)-baseH(x+2,z+2))*.12));r*=sh;gg*=sh;b*=sh;}
    const c2=MAP.crk[Math.round((z-MAP.X0)/MAP.C)*MAP.N+Math.round((x-MAP.X0)/MAP.C)]||0;if(c2>.2){r+=(255-r)*c2;gg+=(110-gg)*c2;b*=1-c2;}
    const q=(j*n+i)*4;d[q]=r;d[q+1]=gg;d[q+2]=b;d[q+3]=255;}
  g.putImageData(im,0,0);
  const T=MAP.def.TREES;if(T){g.fillStyle='rgba(28,48,24,.85)';for(const t of T){g.beginPath();g.arc((t.x-MAP.X0)/mpp,(t.z-MAP.X0)/mpp,Math.max(1,3.5/mpp),0,TAU);g.fill();}}
  g.fillStyle='#2a2622';for(const b of BUILD)g.fillRect((b.x0-MAP.X0)/mpp,(b.z0-MAP.X0)/mpp,(b.x1-b.x0)/mpp,(b.z1-b.z0)/mpp);
  MINI.base=c;cv.addEventListener('pointerdown',e=>{MINI.ri=(MINI.ri+1)%MINI.ranges.length;e.stopPropagation();});}
function miniDraw(px,pz,yaw,contacts,dt){if(!MINI.cx)return;MINI.t+=dt||0;
  const cv=MINI.cv,dpr=Math.min(2,devicePixelRatio||1),S=cv.clientWidth;if(cv.width!==Math.round(S*dpr)){cv.width=cv.height=Math.round(S*dpr);}
  const g=MINI.cx,R=cv.width/2,range=MINI.ranges[MINI.ri],k=R/range;   /* pixels a metre */
  g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,cv.width,cv.height);g.save();g.beginPath();g.arc(R,R,R-1,0,TAU);g.clip();
  g.fillStyle='#0b1110';g.fillRect(0,0,cv.width,cv.height);
  /* the world turned so the camera's forward is up: forward is (-sin yaw, -cos yaw) */
  g.translate(R,R);g.rotate(yaw);g.scale(k,k);g.translate(-px,-pz);
  g.globalAlpha=.92;g.imageSmoothingEnabled=true;g.drawImage(MINI.base,MAP.X0,MAP.X0,MAP.S,MAP.S);g.globalAlpha=1;
  /* rifts */
  for(const Rf of RIFTS){const M=Rf.M,s=1/k;g.lineWidth=2*s;
    if(Rf.state==='sealed'){g.strokeStyle='#9aa39f';g.beginPath();g.moveTo(M.x-5*s,M.zf-5*s);g.lineTo(M.x+5*s,M.zf+5*s);g.moveTo(M.x+5*s,M.zf-5*s);g.lineTo(M.x-5*s,M.zf+5*s);g.stroke();}
    else{const p=1+.25*Math.sin(MINI.t*4);g.strokeStyle='#ff3b26';g.beginPath();g.arc(M.x,M.zf,7*s*p,0,TAU);g.stroke();g.fillStyle='#ff3b2655';g.fill();}}
  /* contacts */
  g.fillStyle='#ff4a2a';for(const c of contacts){const r=Math.max(1.6,Math.sqrt(c.n)*.7)/k;g.beginPath();g.arc(c.x,c.z,r,0,TAU);g.fill();}
  g.restore();
  /* the view and the Wraith, fixed: up is ahead */
  g.save();g.translate(R,R);g.strokeStyle='#4fe0b866';g.lineWidth=1.2*dpr;g.beginPath();g.moveTo(0,0);g.lineTo(-R*.55,-R);g.moveTo(0,0);g.lineTo(R*.55,-R);g.stroke();
  const hd=(MECH.P?MECH.P.legYaw:0)-yaw;g.rotate(-hd);g.fillStyle='#4fe0b8';g.beginPath();g.moveTo(0,-7*dpr);g.lineTo(5*dpr,6*dpr);g.lineTo(0,3*dpr);g.lineTo(-5*dpr,6*dpr);g.closePath();g.fill();g.restore();
  /* north on the rim, the range */
  const na=yaw;g.fillStyle='#cfe2dc';g.font=`800 ${9*dpr}px system-ui,sans-serif`;g.textAlign='center';g.textBaseline='middle';
  g.fillText('N',R+Math.sin(na)*(R-8*dpr),R-Math.cos(na)*(R-8*dpr));
  g.fillStyle='#8fd0c0';g.font=`700 ${8*dpr}px system-ui,sans-serif`;g.fillText(range+' M',R,cv.height-9*dpr);
  g.strokeStyle='#2c4a43';g.lineWidth=1.5*dpr;g.beginPath();g.arc(R,R,R-1,0,TAU);g.stroke();}
