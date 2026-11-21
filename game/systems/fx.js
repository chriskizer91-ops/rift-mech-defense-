/* systems/fx.js — particles and sound, from Ironhowl 4 (07_fx).
   Particles: one instanced system. Smoke blends normally, glow adds light (premultiplied alpha), ring = a thin bright blast wave.
   Ironhowl 4 drew smoke and flashes from its picture atlas; here they are drawn round in the shader, so nothing is downloaded.
   Sound: everything made on the fly with Web Audio, as in Ironhowl 4. */
const PFX={max:1400,list:[],mesh:null};
function buildFX(){
  const base=new THREE.PlaneGeometry(1,1),g=new THREE.InstancedBufferGeometry();
  g.index=base.index;g.setAttribute('position',base.attributes.position);g.setAttribute('uv',base.attributes.uv);
  const n=PFX.max;PFX.iP=new THREE.InstancedBufferAttribute(new Float32Array(n*3),3);PFX.iS=new THREE.InstancedBufferAttribute(new Float32Array(n*4),4);PFX.iC=new THREE.InstancedBufferAttribute(new Float32Array(n*3),3);
  for(const a of [PFX.iP,PFX.iS,PFX.iC])a.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('iP',PFX.iP);g.setAttribute('iS',PFX.iS);g.setAttribute('iC',PFX.iC);g.instanceCount=0;
  const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.CustomBlending,blendSrc:THREE.OneFactor,blendDst:THREE.OneMinusSrcAlphaFactor,
    vertexShader:`attribute vec3 iP;attribute vec4 iS;attribute vec3 iC;varying vec2 vUv;varying vec4 vS;varying vec3 vC;
      void main(){vUv=uv;vS=iS;vC=iC;float c=cos(iS.y),s=sin(iS.y);vec2 q=vec2(c*position.x-s*position.y,s*position.x+c*position.y)*iS.x;
        vec4 mv=viewMatrix*vec4(iP,1.);mv.xy+=q;gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`varying vec2 vUv;varying vec4 vS;varying vec3 vC;
      float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
      void main(){float r=length(vUv-.5)*2.;
        if(vS.w<.5){float t=(1.-smoothstep(.2,1.,r))*(.55+.45*n(vUv*5.+vS.y));float a=smoothstep(.04,.6,t)*vS.z;gl_FragColor=vec4(vC*(.6+.5*t)*a,a);}
        else if(vS.w<1.2){float gl=pow(max(0.,1.-r),2.2);gl_FragColor=vec4(vC*gl*vS.z,0.);}
        else{float gl=smoothstep(.55,.84,r)*(1.-smoothstep(.86,1.,r));gl_FragColor=vec4(vC*gl*vS.z,0.);}}`});
  PFX.mesh=new THREE.Mesh(g,m);PFX.mesh.frustumCulled=false;PFX.mesh.renderOrder=5;S.add(PFX.mesh);
}
/* o: {x,y,z, vx,vy,vz, life, s0,s1 (size start/end), a (alpha), col [r,g,b], glow (bool), ring (bool, with glow), drag, grav, vr} */
function part(o){o.t=0;o.rot=Math.random()*TAU;o.vr=o.vr==null?(Math.random()-.5)*1.2:o.vr;const L=PFX.list;
  if(L.length>=PFX.max)L[(PFX.ri=((PFX.ri|0)+1)%PFX.max)]=o;else L.push(o);}
const DUST=[.5,.43,.33],SMOKE=[.55,.55,.57];
function dustPuff(x,z,n,k){const y=hgt(x,z)+.2;for(let i=0;i<n;i++){const a=Math.random()*TAU,s=(1.5+Math.random()*2.5)*k;
  part({x:x+Math.cos(a)*.6,y,z:z+Math.sin(a)*.6,vx:Math.cos(a)*s,vy:.4+Math.random()*.9*k,vz:Math.sin(a)*s,life:1.1+Math.random()*.9,s0:.9*k,s1:3.2*k,a:.38,col:DUST,drag:2.2,grav:-.1});}}
function updFX(dt){
  const L=PFX.list;let n=0;const P_=PFX.iP.array,S_=PFX.iS.array,C_=PFX.iC.array;
  let w=0;for(let i=0;i<L.length;i++){const p=L[i];p.t+=dt;if(p.t>=p.life)continue;L[w++]=p;
    const dr=Math.exp(-(p.drag||0)*dt);p.vx*=dr;p.vy*=dr;p.vz*=dr;p.vy-=(p.grav||0)*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.rot+=p.vr*dt;
    const f=p.t/p.life,s=lerp(p.s0,p.s1,Math.sqrt(f)),a=p.a*(p.glow?(1-f):Math.min(1,f*6)*(1-f)*(1-f));
    P_[n*3]=p.x;P_[n*3+1]=p.y;P_[n*3+2]=p.z;S_[n*4]=s;S_[n*4+1]=p.rot;S_[n*4+2]=a;S_[n*4+3]=p.ring?1.3:p.glow?1:0;C_[n*3]=p.col[0];C_[n*3+1]=p.col[1];C_[n*3+2]=p.col[2];n++;}
  L.length=w;PFX.mesh.geometry.instanceCount=n;
  if(n)for(const A of [PFX.iP,PFX.iS,PFX.iC]){A.clearUpdateRanges();A.addUpdateRange(0,n*A.itemSize);A.needsUpdate=true;}
}
/* ===================== sound (all made on the fly, nothing to download) ===================== */
const AU={c:null,out:null,nb:null,jet:null,jetF:null,hiss:null,on:store.get('sound','1')==='1'};
function audioInit(){
  if(AU.c){if(AU.c.state==='suspended')AU.c.resume();return;}
  const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const c=AU.c=new C();
  AU.out=c.createGain();const comp=c.createDynamicsCompressor();AU.out.connect(comp);comp.connect(c.destination);setVolume();
  const nb=AU.nb=c.createBuffer(1,c.sampleRate*2,c.sampleRate),d=nb.getChannelData(0);let b=0;for(let i=0;i<d.length;i++){const w=Math.random()*2-1;b=b*.97+w*.03;d[i]=w*.6+b*3;}
  const loop=(freq,type)=>{const s=c.createBufferSource();s.buffer=nb;s.loop=true;const f=c.createBiquadFilter();f.type=type;f.frequency.value=freq;const g=c.createGain();g.gain.value=0;s.connect(f);f.connect(g);g.connect(AU.out);s.start();return {f,g};};
  const j=loop(600,'lowpass');AU.jet=j.g;AU.jetF=j.f;
  const h=loop(3800,'bandpass');AU.hiss=h.g;   /* the sensor's static: louder as the interference grows */
}
function setVolume(){if(AU.out)AU.out.gain.value=(!AU.on||(typeof G!=='undefined'&&G.paused))?0:.75;}
function env(g,t,a,peak,dec){g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(.0005,t+a+dec);}
function thump(f0,f1,dur,vol,nf,nv){const c=AU.c;if(!c)return;const t=c.currentTime,o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);
  o.connect(g);g.connect(AU.out);env(g,t,.008,vol,dur);o.start(t);o.stop(t+dur+.05);
  if(nv){const s=c.createBufferSource();s.buffer=AU.nb;const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=nf;const h=c.createGain();s.connect(f);f.connect(h);h.connect(AU.out);env(h,t,.005,nv,dur*.7);s.start(t,Math.random());s.stop(t+dur);}}
function nz(type,f0,f1,dur,vol,q){const c=AU.c;if(!c)return;const t=c.currentTime,s=c.createBufferSource();s.buffer=AU.nb;const f=c.createBiquadFilter();f.type=type;f.Q.value=q||1;
  f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(f1,t+dur);const g=c.createGain();s.connect(f);f.connect(g);g.connect(AU.out);env(g,t,.004,vol,dur);s.start(t,Math.random()*1.5);s.stop(t+dur+.05);}
function tone(type,f0,f1,dur,vol){const c=AU.c;if(!c)return;const t=c.currentTime,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);o.connect(g);g.connect(AU.out);env(g,t,.004,vol,dur);o.start(t);o.stop(t+dur+.05);}
function sStep(k){thump(78,36,.22,.42*k,420,.22*k);}
function sLand(k){thump(70,26,.5,.8*k+.2,700,.5*k+.15);}
function sJet(){const c=AU.c;if(!c)return;const t=c.currentTime,s=c.createBufferSource();s.buffer=AU.nb;const f=c.createBiquadFilter();f.type='bandpass';f.Q.value=.8;
  f.frequency.setValueAtTime(380,t);f.frequency.exponentialRampToValueAtTime(1900,t+.35);const g=c.createGain();s.connect(f);f.connect(g);g.connect(AU.out);env(g,t,.02,.55,.6);s.start(t,Math.random());s.stop(t+.8);thump(90,40,.35,.35,0,0);}
function sClick(){tone('square',180,180,.08,.08);}
function jetLoop(th){if(!AU.jet)return;const t=AU.c.currentTime;AU.jet.gain.setTargetAtTime(th*.5,t,.05);AU.jetF.frequency.setTargetAtTime(350+th*1700,t,.05);}
function hissLoop(k){if(!AU.hiss)return;AU.hiss.gain.setTargetAtTime(k*k*.22,AU.c.currentTime,.08);}
function sGun(t){nz('bandpass',1800+t*200,500,.09,.32,.9);thump(150,60,.08,.28,0,0);}
function sOver(){tone('square',880,440,.25,.08);setTimeout(()=>tone('square',880,440,.25,.08),280);}
function sVent(){nz('highpass',2500,900,1.1,.5,.7);thump(60,40,.3,.3,0,0);}
function sMissile(){nz('bandpass',600,2400,.5,.4,1.2);}
function sBoom(k){thump(80,24,.6+k*.3,.55+k*.3,900,.55*k+.2);}
function sShield(){tone('sine',1400,700,.12,.12);}
function sHurt(){nz('lowpass',900,200,.25,.45,1);thump(90,40,.2,.3,0,0);}
function sPickup(){tone('triangle',660,1320,.18,.14);setTimeout(()=>tone('triangle',990,1980,.16,.1),90);}
function sRail(k){nz('highpass',5200,700,.5,.42*k+.12,1.4);thump(110,34,.35,.5*k+.15,0,0);tone('sawtooth',1400,90,.32,.07);}
function sCharge(){tone('sine',180,1100,1.2,.05);}
function sArc(){nz('bandpass',4200,1500,.09,.11,3);tone('square',1900,700,.06,.025);}
function sBite(k){nz('bandpass',700,260,.12,.25*k+.1,2);}
function sChirp(){tone('sine',1500,1700,.05,.03);}
function sLost(){tone('sine',660,330,.5,.08);setTimeout(()=>tone('sine',520,260,.6,.06),200);}
