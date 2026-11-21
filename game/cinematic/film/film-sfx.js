'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · THE FILM: MORE SOUNDS AND THE INSTRUMENTS (game/cinematic/film/film-sfx.js, session D)
   Adds to the reveal's score (RMD.Score in cin-audio.js) everything the other scenes need. All made in code:
     the world   surf(when,dur,k) gull(when,pan,k) motor(when,dur,pan,k) crowd(when,dur,k) city(when,dur,k) beep(when,f,k)
     the fight   ac(when,pan,k,n) thud(when,pan,k) fizz(when,pan,k) burstC(when,pan,k) lance(when,pan,k) zap(when,pan,k)
     the feed    switchV(when,k) lock(when) sting(when,k) glitch(when,dur,k)
     the music   N('D3') -> Hz; chord(when,dur,notes,k,kind) kind: str | brass | choir | pno | pad; arp(when,dur,notes,step,k);
                 pulse(when,dur,root,bpm,k) (an eighth-note bass and a soft kick: the battle's motor)
   ===================================================================================================================== */
const FSFX=(function(){
const X={};
const NT={C:-9,D:-7,E:-5,F:-4,G:-2,A:0,B:2};
X.N=n=>{const m=/^([A-G])([#b]?)(-?\d)$/.exec(n);let s=NT[m[1]]+(m[2]==='#'?1:m[2]==='b'?-1:0)+(+m[3]-4)*12;return 440*Math.pow(2,s/12);};
X.extend=function(S){if(S._film)return S;S._film=true;const ctx=S.ctx;
  const nb=(sec,pink)=>{const n=Math.floor(ctx.sampleRate*sec),b=ctx.createBuffer(1,n,ctx.sampleRate),d=b.getChannelData(0);let l=0;
    for(let i=0;i<n;i++){const w=Math.random()*2-1;if(pink){l=.985*l+.15*w;d[i]=l*1.4;}else d[i]=w;}return b;};
  const white=nb(3,false),pink=nb(5,true);
  const pan=(p,dest)=>{const pn=ctx.createStereoPanner();pn.pan.value=Math.max(-1,Math.min(1,p||0));pn.connect(dest);return pn;};
  const env=(g,when,a,peak,rel)=>{g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(peak,when+a);g.gain.exponentialRampToValueAtTime(.0001,when+a+rel);};
  const noise=(buf,when,dur,dest,f,type,q)=>{const s=ctx.createBufferSource();s.buffer=buf;s.loop=true;const fl=ctx.createBiquadFilter();fl.type=type||'lowpass';fl.frequency.value=f;if(q)fl.Q.value=q;
    s.connect(fl);fl.connect(dest);s.start(when,Math.random()*2);s.stop(when+dur+.05);return fl;};
  const sfx=S.sfx,music=S.music;
  const verb=ctx.createConvolver();{const n=Math.floor(ctx.sampleRate*2.6),b=ctx.createBuffer(2,n,ctx.sampleRate);for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.6);}verb.buffer=b;}
  const verbG=ctx.createGain();verbG.gain.value=.35;verb.connect(verbG);verbG.connect(music);
  const sverb=ctx.createConvolver();sverb.buffer=verb.buffer;const sverbG=ctx.createGain();sverbG.gain.value=.25;sverb.connect(sverbG);sverbG.connect(sfx);
  /* ---------------- the world ---------------- */
  /* surf: a wave every 6 to 10 s: the crash, then the long hiss running up the sand. k = how loud */
  S.surf=function(when,dur,k,pn){k=k==null?1:k;let t=when+Math.random()*2;while(t<when+dur){const big=.6+Math.random()*.6;
      const g=ctx.createGain();g.connect(pan((pn||0)+(Math.random()-.5)*.6,sfx));const f=noise(pink,t,6,g,300,'lowpass',.6);
      f.frequency.setValueAtTime(260,t);f.frequency.linearRampToValueAtTime(1500*big,t+.7);f.frequency.exponentialRampToValueAtTime(380,t+5.5);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.55*k*big,t+.6);g.gain.linearRampToValueAtTime(.38*k*big,t+1.6);g.gain.exponentialRampToValueAtTime(.001,t+5.8);
      const h=ctx.createGain();h.connect(pan((pn||0)+(Math.random()-.5),sfx));noise(white,t+.8,5,h,2600,'highpass');h.gain.setValueAtTime(0,t+.8);h.gain.linearRampToValueAtTime(.07*k*big,t+1.6);h.gain.exponentialRampToValueAtTime(.001,t+5.6);
      t+=6+Math.random()*4;}};
  /* a gull: two to four cries, gliding */
  S.gull=function(when,p,k){k=k||1;const n=2+Math.floor(Math.random()*3);const dest=pan(p,sfx);for(let i=0;i<n;i++){const t=when+i*(.22+Math.random()*.12);
      const o=ctx.createOscillator();o.type='triangle';const f0=1300+Math.random()*500;o.frequency.setValueAtTime(f0,t);o.frequency.linearRampToValueAtTime(f0*1.55,t+.06);o.frequency.exponentialRampToValueAtTime(f0*.85,t+.22);
      const o2=ctx.createOscillator();o2.type='sine';o2.frequency.value=31;const og=ctx.createGain();og.gain.value=120;o2.connect(og);og.connect(o.frequency);
      const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=2200;bp.Q.value=1.2;const g=ctx.createGain();o.connect(bp);bp.connect(g);g.connect(dest);g.connect(sverb);
      env(g,t,.02,.12*k,.24);o.start(t);o2.start(t);o.stop(t+.35);o2.stop(t+.35);}};
  /* a boat's diesel: thudding, rising as it pulls away (rate goes up) */
  S.motor=function(when,dur,p,k){const g=ctx.createGain();g.connect(pan(p,sfx));const o=ctx.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(34,when);o.frequency.linearRampToValueAtTime(46,when+Math.min(6,dur));
    const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=260;const am=ctx.createGain();o.connect(lp);lp.connect(am);am.connect(g);
    const lfo=ctx.createOscillator();lfo.frequency.setValueAtTime(5.5,when);lfo.frequency.linearRampToValueAtTime(8,when+Math.min(6,dur));const lg=ctx.createGain();lg.gain.value=.5;lfo.connect(lg);lg.connect(am.gain);am.gain.value=.5;
    g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(.22*k,when+1.2);g.gain.setValueAtTime(.22*k,when+dur-3);g.gain.linearRampToValueAtTime(0,when+dur);
    o.start(when);lfo.start(when);o.stop(when+dur+.1);lfo.stop(when+dur+.1);};
  /* far voices of people moving (a murmur, no words) */
  S.crowd=function(when,dur,k){const g=ctx.createGain();g.connect(sfx);for(let i=0;i<3;i++){const f=noise(pink,when,dur,g,500+i*350,'bandpass',4);
      const l=ctx.createOscillator();l.frequency.value=1.3+i*.7;const lg=ctx.createGain();lg.gain.value=300;l.connect(lg);lg.connect(f.frequency);l.start(when);l.stop(when+dur);}
    g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(.06*k,when+1.5);g.gain.setValueAtTime(.06*k,when+dur-1.5);g.gain.linearRampToValueAtTime(0,when+dur);};
  /* a city at night: a wide low roar and a far siren */
  S.city=function(when,dur,k){const g=ctx.createGain();g.connect(sfx);noise(pink,when,dur,g,420,'lowpass');g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(.22*k,when+1);g.gain.setValueAtTime(.22*k,when+dur-1);g.gain.linearRampToValueAtTime(0,when+dur);
    const o=ctx.createOscillator();o.type='sine';const sg=ctx.createGain();o.connect(sg);sg.connect(pan(.6,sfx));sg.connect(sverb);const lf=ctx.createOscillator();lf.frequency.value=.35;const lg=ctx.createGain();lg.gain.value=180;lf.connect(lg);lg.connect(o.frequency);o.frequency.value=760;
    sg.gain.setValueAtTime(0,when);sg.gain.linearRampToValueAtTime(.025*k,when+2);sg.gain.setValueAtTime(.025*k,when+dur-1);sg.gain.linearRampToValueAtTime(0,when+dur);o.start(when);lf.start(when);o.stop(when+dur);lf.stop(when+dur);};
  S.beep=function(when,f,k){const o=ctx.createOscillator();o.type='square';o.frequency.value=f||1800;const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=3000;const g=ctx.createGain();o.connect(lp);lp.connect(g);g.connect(sfx);env(g,when,.003,.05*(k||1),.07);o.start(when);o.stop(when+.12);};
  /* ---------------- the fight ---------------- */
  /* the autocannon: n rounds, 0.085 s apart. k: 1 close, .3 far */
  S.ac=function(when,p,k,n){k=k||1;n=n||6;const dest=pan(p,sfx);for(let i=0;i<n;i++){const t=when+i*.085+Math.random()*.008;
      const o=ctx.createOscillator();o.type='sine';o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(42,t+.07);const og=ctx.createGain();o.connect(og);og.connect(dest);env(og,t,.002,.42*k,.09);o.start(t);o.stop(t+.14);
      const s=ctx.createBufferSource();s.buffer=white;const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1800+Math.random()*900;bp.Q.value=.8;const g=ctx.createGain();s.connect(bp);bp.connect(g);g.connect(dest);g.connect(sverb);
      env(g,t,.001,.5*k,.05);s.start(t,Math.random()*2,.08);}
    const tail=ctx.createGain();tail.connect(sverb);noise(pink,when,n*.085+.6,tail,700,'lowpass');tail.gain.setValueAtTime(0,when);tail.gain.linearRampToValueAtTime(.25*k,when+.05);tail.gain.exponentialRampToValueAtTime(.001,when+n*.085+.6);};
  /* a round into the sand */
  S.thud=function(when,p,k){const s=ctx.createBufferSource();s.buffer=pink;const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=500;const g=ctx.createGain();s.connect(lp);lp.connect(g);g.connect(pan(p,sfx));env(g,when,.003,.3*(k||1),.22);s.start(when,Math.random()*3,.3);};
  /* dots knocked off: the sensor's sound for a hit, a dry digital crackle */
  S.fizz=function(when,p,k){k=k||1;const dest=pan(p,sfx);const s=ctx.createBufferSource();s.buffer=pink;const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.Q.value=.7;
      lp.frequency.setValueAtTime(1400,when);lp.frequency.exponentialRampToValueAtTime(300,when+.22);const g=ctx.createGain();s.connect(lp);lp.connect(g);g.connect(dest);
      g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(.22*k,when+.02);g.gain.exponentialRampToValueAtTime(.001,when+.26);s.start(when,Math.random()*3,.3);};
  /* a creature coming apart: a falling digital chirp and a burst of crackle */
  S.burstC=function(when,p,k){k=k||1;const dest=pan(p,sfx);const o=ctx.createOscillator();o.type='sine';o.frequency.setValueAtTime(900,when);o.frequency.exponentialRampToValueAtTime(90,when+.45);
    const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1600;const g=ctx.createGain();o.connect(lp);lp.connect(g);g.connect(dest);g.connect(sverb);
    g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(.09*k,when+.02);g.gain.exponentialRampToValueAtTime(.0008,when+.5);o.start(when);o.stop(when+.55);
    S.fizz(when,p,k*1.2);S.fizz(when+.1,p,k*.8);};
  /* the Lance: a rising charge and the crack of it going */
  S.lance=function(when,p,k,charge){k=k||1;charge=charge||1.2;const dest=pan(p,sfx);const o=ctx.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(90,when);o.frequency.exponentialRampToValueAtTime(1600,when+charge);
    const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.Q.value=4;bp.frequency.setValueAtTime(300,when);bp.frequency.exponentialRampToValueAtTime(5000,when+charge);const g=ctx.createGain();o.connect(bp);bp.connect(g);g.connect(dest);
    g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(.12*k,when+charge);g.gain.linearRampToValueAtTime(0,when+charge+.02);o.start(when);o.stop(when+charge+.05);
    const t=when+charge;S.hit(t,.8*k);const s=ctx.createBufferSource();s.buffer=white;const hp=ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=900;const g2=ctx.createGain();s.connect(hp);hp.connect(g2);g2.connect(dest);g2.connect(sverb);env(g2,t,.001,.6*k,.4);s.start(t,0,.6);};
  /* the Arc: a buzzing crack of lightning */
  S.zap=function(when,p,k){k=k||1;const dest=pan(p,sfx);for(let i=0;i<5;i++){const t=when+i*.03+Math.random()*.02;const s=ctx.createBufferSource();s.buffer=white;const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1200+Math.random()*3000;bp.Q.value=2;
      const g=ctx.createGain();s.connect(bp);bp.connect(g);g.connect(dest);env(g,t,.001,.35*k,.04);s.start(t,Math.random()*2,.08);}
    const o=ctx.createOscillator();o.type='sawtooth';o.frequency.value=120;const g=ctx.createGain();o.connect(g);g.connect(dest);env(g,when,.005,.06*k,.3);o.start(when);o.stop(when+.4);};
  /* ---------------- the feed ---------------- */
  /* the view switching (real to sensor, sensor to thermal): a data chirp, a click, static */
  S.switchV=function(when,k){k=k||1;const o=ctx.createOscillator();o.type='sine';o.frequency.setValueAtTime(400,when);o.frequency.exponentialRampToValueAtTime(3200,when+.18);
    const g=ctx.createGain();o.connect(g);g.connect(sfx);env(g,when,.005,.08*k,.2);o.start(when);o.stop(when+.3);S.beep(when+.2,2400,k);S.beep(when+.28,1800,k);
    const s=ctx.createBufferSource();s.buffer=white;const hp=ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=1500;const g2=ctx.createGain();s.connect(hp);hp.connect(g2);g2.connect(sfx);
    g2.gain.setValueAtTime(0,when);g2.gain.linearRampToValueAtTime(.15*k,when+.03);g2.gain.exponentialRampToValueAtTime(.001,when+.5);s.start(when,0,.6);
    const th=ctx.createOscillator();th.type='sine';th.frequency.setValueAtTime(90,when+.18);th.frequency.exponentialRampToValueAtTime(40,when+.4);const tg=ctx.createGain();th.connect(tg);tg.connect(sfx);env(tg,when+.18,.005,.3*k,.3);th.start(when+.18);th.stop(when+.6);};
  S.lock=function(when){S.beep(when,1400,.8);S.beep(when+.1,2100,.8);};
  /* a low hit with a long tail: under a title or a turn */
  S.sting=function(when,k){k=k||1;S.hit(when,.7*k);const g=ctx.createGain();g.connect(verb);g.connect(music);const f=noise(pink,when,5,g,300,'lowpass');f.frequency.setValueAtTime(800,when);f.frequency.exponentialRampToValueAtTime(90,when+4);
    g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(.25*k,when+.05);g.gain.exponentialRampToValueAtTime(.001,when+4.5);};
  S.glitch=function(when,dur,k){k=k||1;for(let t=when;t<when+dur;t+=.04+Math.random()*.09)if(Math.random()<.6)S.burst(t,.02+Math.random()*.06,k);};
  /* ---------------- the music ---------------- */
  /* one chord. kind: str (bowed, slow), brass (a swell that opens), choir (ah), pno (struck, decaying), pad (soft saws) */
  S.chord=function(when,dur,notes,k,kind,pn){k=k||1;kind=kind||'str';const out=ctx.createGain();out.connect(pan(pn||0,music));out.connect(verb);
    const fs=notes.map(n=>typeof n==='number'?n:X.N(n));
    if(kind==='pno'){fs.forEach((f,i)=>{[1,2,3,4.2].forEach((h,j)=>{const o=ctx.createOscillator();o.type='sine';o.frequency.value=f*h;const g=ctx.createGain();o.connect(g);g.connect(out);
        const a=[.5,.2,.08,.04][j]*k*.35,d=Math.min(dur,[3.5,2,1.1,.6][j]*(1.4-Math.min(1,f/1000)));g.gain.setValueAtTime(0,when+i*.012);g.gain.linearRampToValueAtTime(a,when+i*.012+.006);g.gain.exponentialRampToValueAtTime(.0001,when+i*.012+d);
        o.start(when);o.stop(when+d+.1);});});return;}
    const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.Q.value=kind==='brass'?3:.7;lp.connect(out);
    let src=lp;if(kind==='choir'){const f1=ctx.createBiquadFilter();f1.type='bandpass';f1.frequency.value=720;f1.Q.value=5;const f2=ctx.createBiquadFilter();f2.type='bandpass';f2.frequency.value=1180;f2.Q.value=6;
      const m=ctx.createGain();m.gain.value=2.4;f1.connect(m);f2.connect(m);m.connect(lp);src={connect:(x)=>{}};src=[f1,f2];}
    const att=kind==='brass'?.25:kind==='pno'?.01:kind==='choir'?.9:.7,rel=Math.min(2.2,dur*.4);
    lp.frequency.setValueAtTime(kind==='brass'?300:kind==='choir'?5000:1400,when);if(kind==='brass'){lp.frequency.linearRampToValueAtTime(2600,when+att+.3);lp.frequency.linearRampToValueAtTime(900,when+dur);}
    out.gain.setValueAtTime(0,when);out.gain.linearRampToValueAtTime(k*.11,when+att);out.gain.setValueAtTime(k*.11,when+Math.max(att,dur-rel));out.gain.linearRampToValueAtTime(0,when+dur);
    fs.forEach(f=>[-7,0,6].forEach(dt=>{const o=ctx.createOscillator();o.type='sawtooth';o.frequency.value=f;o.detune.value=dt+(Math.random()-.5)*4;
      const v=ctx.createOscillator();v.frequency.value=4.6+Math.random();const vg=ctx.createGain();vg.gain.value=kind==='pad'?2:6;v.connect(vg);vg.connect(o.detune);
      const g=ctx.createGain();g.gain.value=kind==='pad'?.18:.3/Math.sqrt(fs.length);o.connect(g);if(Array.isArray(src))src.forEach(x=>g.connect(x));else g.connect(src);
      o.start(when);v.start(when);o.stop(when+dur+.05);v.stop(when+dur+.05);}));};
  /* plucked notes cycling through a chord */
  S.arp=function(when,dur,notes,step,k,pn){const fs=notes.map(n=>typeof n==='number'?n:X.N(n));let i=0;for(let t=when;t<when+dur-.01;t+=step,i++)S.pluck(t,fs[i%fs.length],(k||1)*(i%4===0?1:.7),pn||((i%2)?.3:-.3));};
  /* the battle's motor: eighth-note bass on the root, a soft kick on the beat, a shaker */
  S.pulse=function(when,dur,root,bpm,k,opt){opt=opt||{};const r=typeof root==='number'?root:X.N(root);const e=60/bpm/2;let i=0;
    for(let t=when;t<when+dur-.01;t+=e,i++){const acc=i%8===0?1:i%2===0?.8:.6;S.bass(t,r*(opt.oct&&i%8===7?2:1),e*.85,k*acc*.8);
      if(i%2===0&&opt.kick!==false)S.kick(t,k*(i%4===0?.7:.45));if(opt.snare&&i%4===2)S.snare(t,k*.6);
      if(opt.shaker!==false){const s=ctx.createBufferSource();s.buffer=white;const hp=ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=6000;const g=ctx.createGain();s.connect(hp);hp.connect(g);g.connect(pan(.35,music));env(g,t,.002,.035*k*acc,.05);s.start(t,Math.random()*2,.08);}}};
  return S;};
return X;
})();
