/* systems/base.js — basics, from Ironhowl 4 (01_base).
   World: three.js axes. x east, y up, z south. A yaw of 0 faces north (-z);
   forward(yaw) = (-sin yaw, 0, -cos yaw). Object3D.rotation.y = yaw.
   The top-down camera looks north, so screen right = east (+x) and screen down = south (+z). */
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,TAU=Math.PI*2;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const ss=smooth;   /* the viewer's name for it */
const damp=(rate,dt)=>1-Math.exp(-rate*dt);
const angD=(a,b)=>{let d=(a-b)%TAU;if(d>Math.PI)d-=TAU;if(d<-Math.PI)d+=TAU;return d;};
const Q=new URLSearchParams(location.search);
const DEV=Q.has('dev')||location.hash.includes('dev');
const KP='rmd-arena-';
const store={get(k,d){try{const v=localStorage.getItem(KP+k);return v==null?d:v;}catch(e){return d;}},set(k,v){try{localStorage.setItem(KP+k,String(v));}catch(e){}}};
const touchy=Q.has('touch')||matchMedia('(hover: none)').matches;
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
/* the arena is flat for now; session B's world will answer this with its ground */
const hgt=(x,z)=>0;
/* the Wraith and the swarm stay inside this circle (metres). A stand-in open field until session B's map lands (PLAN: big open fields) */
const ARENA_R=170;
