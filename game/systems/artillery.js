/* systems/artillery.js — the artillery round (Christopher, 20 Nov: once your area is clear you set up heavy long-range guns to
   support Wraith teams nearby; a battleship-style map of red and green dots; aim so as not to hit your own).
   After every second wave cleared, the view goes to the sensor's long-range map: an 8 × 8 grid (A–H across, 1–8 down) of 20 m
   squares, two km north. Two friendly Wraith teams (green dots, four each) hold the south of it and fire on anything within 28 m;
   red clusters come down from the north at them. Tap a square: a shell lands there 3.2 s later and hits everything within 14 m
   (300 damage at the middle, 40 % of that at the edge). A green dot inside it is lost (friendly fire). Shells: 8, plus one for
   every two waves. The round ends when the red is gone, when both teams are gone, or after 90 s.
   Scrap: half of the dots destroyed, plus 20 for each green dot alive, minus 60 for each one you hit. */
const ART={on:false,cx:0,cz:-2400,n:8,cell:20,shells:0,t:0,tmax:90,flights:[],ff:0,dots0:0,cd:0,end:0,grid:null,labels:[]};
function artyCellC(i,j){const h=ART.n*ART.cell/2;return [ART.cx-h+(i+.5)*ART.cell,ART.cz-h+(j+.5)*ART.cell];}
function artyCellName(i,j){return 'ABCDEFGH'[i]+(j+1);}
function buildArtyGrid(){if(ART.grid)return;const p=[],c=[],h=ART.n*ART.cell/2,x0=ART.cx-h,z0=ART.cz-h;
  for(let k=0;k<=ART.n;k++){const v=k*ART.cell,a=(k===0||k===ART.n)?.7:.35;
    p.push(x0+v,.05,z0,x0+v,.05,z0+2*h, x0,.05,z0+v,x0+2*h,.05,z0+v);c.push(0,a,0,0,a,0,0,a,0,0,a,0);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));
  ART.grid=new THREE.LineSegments(g,new THREE.LineBasicMaterial(Object.assign({vertexColors:true},ADD)));ART.grid.frustumCulled=false;ART.grid.visible=false;DS.add(ART.grid);
  for(let k=0;k<ART.n*2;k++){const el=document.createElement('div');el.className='alab';el.textContent=k<ART.n?'ABCDEFGH'[k]:String(k-ART.n+1);document.body.appendChild(el);ART.labels.push(el);}
  ART.ringG=new THREE.RingGeometry(.86,1,40);ART.ringG.rotateX(-Math.PI/2);}
function startArty(){buildArtyGrid();G.mode='arty';ART.on=true;ART.t=0;ART.ff=0;ART.end=0;ART.cd=0;ART.flights.length=0;ART.shells=8+Math.floor(G.wave/2);
  EN.length=0;SW.list.length=0;ALLIES.length=0;document.body.classList.add('arty');$('upg').style.display='none';ART.grid.visible=true;
  /* two friendly teams in the south rows, apart */
  const ci=[1+(Math.random()*2|0),5+(Math.random()*2|0)];
  ['BRAVO','CHARLIE'].forEach((sq,k)=>{const [x,z]=artyCellC(ci[k],5+(Math.random()*2|0));
    for(let i=0;i<4;i++){const ax=x+(i%2-.5)*6,az=z+((i>>1)-.5)*6;ALLIES.push({x:ax,z:az,hx:ax,hz:az,vx:0,vz:0,state:0,t0:0,by:null,sq,i:i+1,ph:Math.random()*6,pos:V3(ax,0,az),kind:'ally',h:[V3(ax,1,az),V3(ax,1,az),V3(ax,1,az),V3(ax,1,az),V3(ax,1,az)]});}});
  /* the red: packs out of the north rows, bigger every time */
  const w=G.wave,list=[['knot',6],['knot',6],['knot',6],['runner',1],['runner',1],['stalker',1]];
  if(w>=4)list.push(['stalker',1],['brute',1],['knot',8]);if(w>=6)list.push(['brute',1],['stalker',2],['runner',3]);
  for(const [id,n] of list){const i=Math.random()*ART.n|0,j=Math.random()*2|0;const [x,z]=artyCellC(i,j);
    for(let k=0;k<n;k++){const c=spawnCluster(id,{x:x+(Math.random()-.5)*10,z:z+(Math.random()-.5)*10});c.spawnT=.6+Math.random()*.6;}}
  ART.dots0=liveDots();CAMS.ready=false;
  radio('<b>OVERWATCH</b> Guns are up. BRAVO and CHARLIE are the green. Call the squares, and keep it off them.',4.5);HUD.banner('ARTILLERY');}
/* a tap on the map: which square */
const _ar=new THREE.Raycaster(),_ap=new THREE.Vector2(),_apl=new THREE.Plane(new THREE.Vector3(0,1,0),0),_ah=new THREE.Vector3();
addEventListener('pointerdown',e=>{if(!ART.on||G.mode!=='arty'||ART.end)return;if(e.target.closest&&e.target.closest('button,.panel'))return;audioInit();
  _ap.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1);_ar.setFromCamera(_ap,cam);if(!_ar.ray.intersectPlane(_apl,_ah))return;
  const h=ART.n*ART.cell/2,i=Math.floor((_ah.x-(ART.cx-h))/ART.cell),j=Math.floor((_ah.z-(ART.cz-h))/ART.cell);if(i<0||j<0||i>=ART.n||j>=ART.n)return;artyFire(i,j);});
function artyFire(i,j){if(ART.shells<=0||ART.cd>0){sClick();if(ART.shells<=0)HUD.msg('NO SHELLS LEFT',1);return;}
  ART.shells--;ART.cd=.5;const [x,z]=artyCellC(i,j);
  const ring=new THREE.Mesh(ART.ringG,new THREE.MeshBasicMaterial({color:new THREE.Color(1,.6,.2).multiplyScalar(2),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
  ring.position.set(x,.1,z);ring.scale.setScalar(14);S.add(ring);
  ART.flights.push({x,z,t:3.2,ring,name:artyCellName(i,j)});tone('sine',1500,420,3.1,.05);HUD.msg('SHOT OUT · '+artyCellName(i,j),1);}
function artyLand(f){S.remove(f.ring);const x=f.x+(Math.random()-.5)*5,z=f.z+(Math.random()-.5)*5,r=14;
  for(const e of EN){if(e.dead)continue;const d=Math.hypot(e.x-x,e.z-z);if(d<r+e.r){const k=1-.6*clamp(d/r,0,1);hurtCluster(e,300*k,lerp(e.x,x,.4),e.cy,lerp(e.z,z,.4));}}
  for(const a of ALLIES){if(a.state===2)continue;if(Math.hypot(a.x-x,a.z-z)<r){if(a.state===1&&a.by)a.by=null;a.state=2;ART.ff++;
    radio('<b>'+a.sq+'</b> CHECK FIRE! CHECK FIRE! You hit '+a.sq+'-'+a.i+'!',3);sLost();}}
  part({x,y:1,z,vx:0,vy:0,vz:0,life:.5,s0:10,s1:16,a:1.8,col:[1,.62,.28],glow:true});part({x,y:1,z,vx:0,vy:0,vz:0,life:.45,s0:6,s1:34,a:.9,col:[1,.85,.6],glow:true,ring:true,vr:0});
  for(let k=0;k<30;k++){const a=Math.random()*TAU,s=6+Math.random()*14;part({x,y:1,z,vx:Math.cos(a)*s,vy:2+Math.random()*6,vz:Math.sin(a)*s,life:1.6+Math.random(),s0:3,s1:9,a:.4,col:[.32,.3,.29],drag:1.5,grav:-.5});}
  sBoom(2.5);CAMS.shake=Math.max(CAMS.shake,1.1);}
function updArty(dt){if(!ART.on)return;ART.t+=dt;ART.cd=Math.max(0,ART.cd-dt);
  for(let i=ART.flights.length-1;i>=0;i--){const f=ART.flights[i];f.t-=dt;f.ring.scale.setScalar(14*(.6+.4*Math.abs(Math.sin(f.t*6))));if(f.t<=0){artyLand(f);ART.flights.splice(i,1);}}
  const ok=alliesOK(),red=EN.length;
  if(!ART.end&&(red===0&&ART.t>2||ok===0||ART.t>=ART.tmax)){ART.end=G.t;
    radio(red===0?'<b>OVERWATCH</b> Grid’s clear. Good shooting.':ok===0?'<b>OVERWATCH</b> We lost both teams.':'<b>OVERWATCH</b> Out of time. The teams will take it from here.',3.5);}
  if(ART.end&&G.t-ART.end>2.5)endArty();
  /* the labels along the grid's top and left edges */
  const h=ART.n*ART.cell/2;ART.labels.forEach((el,k)=>{if(k<ART.n)_hp.set(ART.cx-h+(k+.5)*ART.cell,0,ART.cz-h-4);else _hp.set(ART.cx-h-4,0,ART.cz-h+(k-ART.n+.5)*ART.cell);
    _hp.project(cam);sty(el,'display','block');sty(el,'transform','translate('+((_hp.x*.5+.5)*innerWidth).toFixed(0)+'px,'+((-_hp.y*.5+.5)*innerHeight).toFixed(0)+'px)');});
  const s=Math.max(0,Math.ceil(ART.tmax-ART.t));HUD.set('arty1','text','ARTILLERY · SHELLS '+ART.shells+' · '+Math.floor(s/60)+':'+String(s%60).padStart(2,'0'));
  HUD.set('arty2','text','BRAVO '+ALLIES.filter(a=>a.sq==='BRAVO'&&a.state!==2).length+'/4 · CHARLIE '+ALLIES.filter(a=>a.sq==='CHARLIE'&&a.state!==2).length+'/4 · RED '+liveDots().toLocaleString('en-US')+' DOTS');}
function endArty(){const ok=alliesOK(),killed=Math.max(0,ART.dots0-liveDots());const bonus=Math.max(0,Math.round(killed/2)+ok*20-ART.ff*60);addScrap(bonus);saveScrap();
  for(const f of ART.flights)S.remove(f.ring);ART.flights.length=0;ART.on=false;ART.grid.visible=false;ART.labels.forEach(el=>sty(el,'display','none'));
  EN.length=0;SW.list.length=0;SW.dLife.fill(0);document.body.classList.remove('arty');G.mode='clear';CAMS.ready=false;
  ART.last={ok,ff:ART.ff,killed,bonus};const okA=ok;ALLIES.length=0;openUpg('arty',bonus,okA);}
/* the camera over the grid: straight down, the whole grid on screen */
function artyCam(dt){const tv=Math.tan(cam.fov*Math.PI/360),Wg=ART.n*ART.cell+24;
  const dist=Math.max(Wg/(2*tv),Wg/(2*tv*cam.aspect))*1.04,pitch=82*Math.PI/180;
  CAMS.shake=Math.max(0,CAMS.shake-dt*2.2);const sh=CAMS.shake*CAMS.shake*2;
  cam.position.set(ART.cx+(Math.random()-.5)*sh,dist*Math.sin(pitch),ART.cz+dist*Math.cos(pitch)+(Math.random()-.5)*sh);cam.lookAt(ART.cx,0,ART.cz);}
