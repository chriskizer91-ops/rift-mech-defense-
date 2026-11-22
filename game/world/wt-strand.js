'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · GREYWATER STRAND (game/world/wt-strand.js)
   Mission 1's map (First Light), laid out like session D's film set (game/cinematic/film/set-strand.js) so the film and
   the game are the same place, but 1,408 m square and open behind the dunes (PLAN: big open fields).
   x runs east, z south, y up; the sea is north (-z) and the waterline runs near z = 0.
     the sea         a shallow shelf (about 3 cm deeper a metre: 2.4 m deep 80 m out, wadeable), then down to 10 m
     the beach       grey sand rising 3 cm a metre to the dunes at z 52
     the pier        at x = 70, 100 m out into the shelf; Gull's two boats moored at its head
     the dunes       to z 100, up to 6.5 m, dry grass on them; a fence along z 64, the lifeguard tower at (-70, 34), the
                     truck sunk in the grit at (-150, 22), huts at the dunes' west end
     behind          the coast road (gravel) along z 118, a hamlet, then fields to the south edge: meadow, ploughed, wheat,
                     tree lines between them (Field 1's patchwork), farm tracks
   ===================================================================================================================== */
(function(){
const S=1408,X0=-704,L=MAPS.lib;
const coast=x=>6*Math.sin(x*.009)+3*Math.sin(x*.023+1)-(x>120?Math.min(30,(x-120)*.06):0);   /* the waterline's z */
const PIER={x:70,z0:12,z1:-86,w:6,y:3.2,head:{x:70,z:-93,w:18,d:16}};
const TRACKS=[L.line([[-704,118,6],[-300,121,6],[0,116,6],[300,122,6],[704,118,6]],10),            /* the coast road */
  L.line([[70,14,4],[66,60,4],[60,118,4]],10),                                                         /* the pier road over the dunes */
  L.line([[0,116,4],[-30,300,4],[20,480,4],[-10,704,4]],10),L.line([[300,122,4],[340,320,4],[260,520,4]],10),L.line([[-300,121,4],[-380,330,4],[-300,600,4]],10)];
const TK=L.index(TRACKS,30);
function hills(x,z){return 6+9*fbm(x/380+1.3,z/380-2.1,3)+3*fbm(x/110,z/110,2);}
const FQ={},TQ={};
function ground0(x,z){
  const o=G0;const zc=coast(x),s=zc-z;let h,wl=0,sand=0,mud=0,asph=0,pave=0,meadow=0,plough=0,wheat=0,dry=0;
  const n1=vnoise(x/9,z/9)-.5,n2=vnoise(x/41,z/41)-.5;
  if(s>0){/* the sea floor: the shelf, then the drop */
    const dep=.03*s+.25*n2*smooth(5,30,s)+4.8*smooth(95,170,s)+3*smooth(170,280,s);h=-dep;sand=1-smooth(60,160,s);mud=1-sand;
    /* sandbars across the shelf: the surf breaks on them */
    h+=.35*Math.exp(-(((s-38+6*Math.sin(x*.02))/7)**2))+.25*Math.exp(-(((s-66+5*Math.sin(x*.017+2))/9)**2));}
  else{const l=-s;
    /* the beach, its ripples, then the dunes */
    h=.03*Math.min(l,52)+(.35*Math.sin(x*.013+z*.004)+.12*Math.sin(x*.041-z*.02))*smooth(0,15,l)*.5;
    const d=l-52;if(d>0){h+=Math.min(6.5,d*.16)*(1-Math.exp(-d*.06))+Math.sin(x*.05)*Math.min(1.6,d*.05)+Math.sin(x*.11+z*.07)*Math.min(.8,d*.03);}
    sand=1;dry=smooth(56,80,l)*(.5+.5*smooth(.4,.6,vnoise(x/14,z/14)));
    /* behind the dunes the land drops a little to the road, then rolls up into the fields */
    const b=smooth(100,140,l);if(b>0){const dn=1.6+Math.min(6.5,48*.16)*(1-Math.exp(-48*.06));h=lerp(h,lerp(dn,hills(x,z),smooth(130,260,l)),b);sand*=1-b;dry*=1-b;}
    if(l>130){L.fieldAt(x,z,FQ);const e=smooth(1.5,4,FQ.edge),k=smooth(130,160,l);meadow=(FQ.t===0?1:1-e)*k;plough=(FQ.t===1?e:0)*k;wheat=(FQ.t===2?e:0)*k;dry=Math.max(dry,(1-k)*.8);}
    /* the tracks and the road */
    L.near(TK,TRACKS,x,z,TQ);if(TQ.n>=0){const hw=TQ.n===0?3.2:2.1,t=smooth(hw+1.2,hw-.3,TQ.d);if(t>0){if(TQ.n===0)pave=Math.max(pave,t);else asph=Math.max(asph,t);}}}
  /* the pier's root: a firmer ramp of sand */
  const free=1-Math.max(asph,pave);if(free<1){meadow*=free;plough*=free;wheat*=free;sand*=free;dry*=free;}
  o.h=h;o.crk=0;o.wl=s>-5?0:h-6;o.wet=s>=0?1:smooth(1.1,.1,h);o.sand=Math.max(0,sand-dry);o.mud=mud;o.asph=asph;o.pave=pave;o.meadow=meadow;o.plough=plough;o.wheat=wheat;o.x4=0;
  return o;}
const TREES=[],PROPS=[];
function setup(){
  /* trees: tree lines and groves in the fields, nothing on the dunes or the beach */
  const Fq={};
  for(let z=150;z<X0+S-12;z+=6.5)for(let x=X0+12;x<X0+S-12;x+=6.5){
    const jx=x+(hash2(Math.round(x),Math.round(z))-.5)*5,jz=z+(hash2(Math.round(z),Math.round(x)+9)-.5)*5;
    const g=ground0(jx,jz);if(g.asph>.05||g.pave>.05)continue;L.near(TK,TRACKS,jx,jz,TQ);if(TQ.d<6)continue;
    L.fieldAt(jx,jz,Fq);const hedge=Fq.edge<2.6&&hash2(Fq.i*3+Math.round(jx/40),Fq.j*5+Math.round(jz/40))>.28;
    const grove=smooth(.66,.74,fbm(jx/170+5,jz/170,3));const p=hash2(Math.round(jx*3),Math.round(jz*3));
    if(hedge&&p<.8||p<grove*.85)TREES.push({x:jx,z:jz,y:baseH(jx,jz),kind:0,s:.75+.6*hash2(Math.round(jx*2),Math.round(jz*2)),r:hash2(Math.round(jx*3),Math.round(jz*7))*TAU});}
  /* huts at the dunes' west end, the hamlet behind the road */
  const B=(x0,z0,w,d,ht,kind)=>{let y=1e9;for(const [x,z] of [[x0,z0],[x0+w,z0],[x0,z0+d],[x0+w,z0+d]])y=Math.min(y,baseH(x,z));BUILD.push({x0,x1:x0+w,z0,z1:z0+d,y0:y-2,y1:y+ht,kind});};
  B(-262,70,8,6,4,3);B(-238,74,7,6,4,3);B(-214,68,9,7,4.5,1);
  RS=17;for(let i=0;i<9;i++){const x=-40+(i%5)*34+rnd()*8,z=136+Math.floor(i/5)*30+rnd()*6;B(x,z,10+rnd()*6,8+rnd()*5,5+rnd()*4,rnd()<.4?3:rnd()<.5?1:2);}
  /* wrecks: the truck sunk in the grit, two cars on the road */
  WRECKS.push({x:-150,z:22,s:1.3,y:baseH(-150,22)-.5},{x:210,z:120,s:1,y:baseH(210,120)},{x:-410,z:117,s:1.1,y:baseH(-410,117)});
  /* the pier, the fence, the tower (meshes are made by wt-world.js) */
  PROPS.push({k:'pier',...PIER},{k:'fence',z:64,x0:-420,x1:420},{k:'tower',x:-70,z:34});
}
/* the swarm's routes (Field 1 style, used by the world pages; the mission spawns its own from the surf) */
function route(c){const x0=-60+rnd()*240;return [{x:x0,z:-50},{x:x0+(rnd()-.5)*20,z:coast(x0)+8},{x:PIER.x+(rnd()-.5)*30,z:20},{x:60+(rnd()-.5)*80,z:118},{x:(rnd()-.5)*300,z:300}];}
MAPS.strand={S,X0,C:2,ground0,setup,SPAWN:{x:40,z:22,yaw:0},MOUTHS:[],name:'Greywater Strand',TRACKS,TREES,PROPS,PIER,coast,route,
  tex:{sand:'sand',mud:'mud',dirt:'dirt',asph:'track',pave:'gravel',rock:'rock',meadow:'meadow',plough:'plough',wheat:'wheat'},fog:[220,850],
  swarm:{sea:true}};
})();
