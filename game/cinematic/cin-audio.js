'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · THE SIGNAL'S REVEAL: SOUND (game/cinematic/cin-audio.js, session D)
   Everything you hear is made here with Web Audio, except the voices: Christopher's ElevenLabs takes (audio/voice/),
   inlined by the build and played through the radio. Nothing is downloaded, so the page works offline.

   RMD.RadioVoice(ctx, out)   the radio over a clean take (decided: the game adds the static, not ElevenLabs)
     .play(buffer, when, {strain, pan})   300 Hz to 3.3 kHz, a little drive, squelch clicks at both ends, a hiss bed, and
                                          with strain (0..1) dropouts and bursts of static. The game can use this too.

   RMD.Score(ctx)   three buses (music, effects, voices) into one master, with a hall for the music and a wide space for
                    the guns. The music ducks under every line (duck). Instruments, each scheduled at an exact time:
     beds      wind, sea, rain, the count's hiss, the static that follows the picture, the low pad, tremolo strings
     foley     the foghorn, the Wraiths' footsteps and servos, ANVIL's guns, the shells' whistle, blasts on the water
     music     plucked notes, the deep note, the heartbeat, the drums (kick, taiko, snare), the bass, brass stabs,
               a riser, the roar, the hit
   ===================================================================================================================== */
window.RMD=window.RMD||{};
(function(){
function noiseBuf(ctx,sec,pink){const n=Math.floor(ctx.sampleRate*sec),b=ctx.createBuffer(2,n,ctx.sampleRate);
  for(let c=0;c<2;c++){const d=b.getChannelData(c);let b0=0,b1=0,b2=0;for(let i=0;i<n;i++){const w=Math.random()*2-1;
    if(pink){b0=.99765*b0+w*.099;b1=.963*b1+w*.2965;b2=.57*b2+w*1.0526;d[i]=(b0+b1+b2+w*.1848)*.18;}else d[i]=w;}}return b;}
function loopNoise(ctx,buf){const s=ctx.createBufferSource();s.buffer=buf;s.loop=true;s.start();return s;}
function drive(ctx,k){const ws=ctx.createWaveShaper(),n=1024,c=new Float32Array(n);for(let i=0;i<n;i++){const x=i/(n-1)*2-1;c[i]=Math.tanh(x*k)/Math.tanh(k);}ws.curve=c;return ws;}
function verb(ctx,sec,decay,pre){const n=Math.floor(ctx.sampleRate*sec),p=Math.floor(ctx.sampleRate*(pre||0)),b=ctx.createBuffer(2,n+p,ctx.sampleRate);
  for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<n;i++)d[i+p]=(Math.random()*2-1)*Math.pow(1-i/n,decay);}const v=ctx.createConvolver();v.buffer=b;return v;}
const pan=(ctx,x,dest)=>{const p=ctx.createStereoPanner?ctx.createStereoPanner():ctx.createGain();if(p.pan)p.pan.value=Math.max(-1,Math.min(1,x||0));p.connect(dest);return p;};
const env=(g,when,a,peak,d,end)=>{g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(peak,when+a);g.gain.exponentialRampToValueAtTime(Math.max(1e-4,end||1e-4),when+a+d);};

/* ---------- the radio ---------- */
/* play(buffer, when, {strain, panic}): panic (0..1) is how bad the moment is, and the clean, calm take is pushed that far:
     faster (and so a little higher), shaking (pitch and level wobble), a narrower, dirtier band, crackle and dropouts,
     and stutters, where the transmission breaks and repeats a fragment before it carries on: "it can't, can't, can't..."
   panic 0 is a clean radio (the three clear seconds). Returns how long the line now runs (s). */
RMD.RadioVoice=function(ctx,out){const white=noiseBuf(ctx,3,false);
  /* static and crackle go through the same narrow band as the voice: it is all one radio */
  const nb=ctx.createBiquadFilter();nb.type='bandpass';nb.frequency.value=2200;nb.Q.value=.9;const nl=ctx.createBiquadFilter();nl.type='lowpass';nl.frequency.value=4200;nb.connect(nl);nl.connect(out);
  const hiss=loopNoise(ctx,white),hg=ctx.createGain();hg.gain.value=0;hiss.connect(hg);hg.connect(nb);
  const crk=noiseBuf(ctx,1,false);
  function click(when,k){const s=ctx.createBufferSource();s.buffer=white;const g=ctx.createGain(),f=ctx.createBiquadFilter();f.type='highpass';f.frequency.value=1500;
    s.connect(f);f.connect(g);g.connect(out);g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(.2*k,when+.004);g.gain.exponentialRampToValueAtTime(.001,when+.09);s.start(when,Math.random()*2,.12);
    const o=ctx.createOscillator();o.type='sine';o.frequency.value=k>.9?1350:1050;const og=ctx.createGain();o.connect(og);og.connect(out);env(og,when+.01,.004,.035*k,.07);o.start(when);o.stop(when+.12);}
  function crackle(t0,t1,dens,k){for(let t=t0;t<t1;t+=-Math.log(1-Math.random())/dens){const s=ctx.createBufferSource();s.buffer=crk;const g=ctx.createGain();
    s.connect(g);g.connect(nb);const l=.002+Math.random()*.006;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(k*(.3+Math.random()),t+.001);g.gain.linearRampToValueAtTime(0,t+l);s.start(t,Math.random()*.9,l+.01);}}
  /* one chain per line, so each line can be as broken as its moment */
  function chain(p,when,dur){const hp=ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=320+380*p;hp.Q.value=.8+.6*p;
    const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=3300-1100*p;lp.Q.value=1.1+1.4*p;
    const pk=ctx.createBiquadFilter();pk.type='peaking';pk.frequency.value=1700+300*p;pk.gain.value=5+5*p;pk.Q.value=1.2;
    const pre=ctx.createGain();pre.gain.value=1+1.4*p;const dr=drive(ctx,2+3.5*p);
    const comp=ctx.createDynamicsCompressor();comp.threshold.value=-26-6*p;comp.ratio.value=6+8*p;comp.attack.value=.002;comp.release.value=.08;
    const trem=ctx.createGain();trem.gain.value=1;const gate=ctx.createGain();const mk=ctx.createGain();mk.gain.value=.75-.2*p;
    /* drive first, then band-limit, so the distortion stays inside the radio's band */
    const lp2=ctx.createBiquadFilter();lp2.type='lowpass';lp2.frequency.value=3400-1000*p;lp2.Q.value=.7;
    hp.connect(pk);pk.connect(pre);pre.connect(dr);dr.connect(lp);lp.connect(lp2);lp2.connect(comp);comp.connect(trem);trem.connect(gate);gate.connect(mk);mk.connect(out);
    /* the shake in the level: fast, uneven */
    if(p>.05){const a=ctx.createOscillator();a.frequency.value=7.3+2*p;const ag=ctx.createGain();ag.gain.value=.22*p;a.connect(ag);ag.connect(trem.gain);
      const b=ctx.createOscillator();b.type='triangle';b.frequency.value=11.1;const bg=ctx.createGain();bg.gain.value=.09*p;b.connect(bg);bg.connect(trem.gain);
      a.start(when);b.start(when);a.stop(when+dur+1);b.stop(when+dur+1);}
    return {input:hp,gate};}
  /* the wobble in the pitch, on every piece of the take */
  function shake(src,p,when,dur){if(p<=.05)return;const v=ctx.createOscillator();v.frequency.value=6.2+2.5*p;const vg=ctx.createGain();vg.gain.value=14+42*p;v.connect(vg);vg.connect(src.detune);
    const w=ctx.createOscillator();w.type='triangle';w.frequency.value=1.7;const wg=ctx.createGain();wg.gain.value=25*p;w.connect(wg);wg.connect(src.detune);
    v.start(when);w.start(when);v.stop(when+dur+.5);w.stop(when+dur+.5);}
  return {
    play(buf,when,o){o=o||{};const p=Math.max(0,Math.min(1,o.panic!=null?o.panic:(o.strain||0)));const st=Math.max(o.strain||0,p*.85);
      const rate=1+.13*p;const d=buf.duration;
      /* where the transmission breaks: up to three stutters inside the words (each take has ~0.5 s of silence at each end) */
      const cuts=[];const nCut=p<.3?0:Math.round(p*3*Math.random()+p);
      for(let i=0;i<nCut;i++){const at=.75+Math.random()*Math.max(.1,d-1.6);if(cuts.every(c=>Math.abs(c.at-at)>.5))cuts.push({at,len:.06+Math.random()*.07,n:2+Math.floor(Math.random()*2.2)});}
      cuts.sort((a,b)=>a.at-b.at);
      const extra=cuts.reduce((s,c)=>s+(c.n-1)*c.len,0),dur=(d+extra)/rate;
      const C=chain(p,when,dur);
      let off=0,tt=when;const piece=(from,len)=>{const s=ctx.createBufferSource();s.buffer=buf;s.playbackRate.value=rate;s.connect(C.input);shake(s,p,tt,len/rate);s.start(tt,from,len);tt+=len/rate;};
      for(const c of cuts){piece(off,c.at-off);for(let k=0;k<c.n;k++){const g0=tt;piece(c.at,c.len);if(k<c.n-1){C.gate.gain.setValueAtTime(1,g0+c.len/rate-.004);C.gate.gain.linearRampToValueAtTime(.35,g0+c.len/rate);C.gate.gain.linearRampToValueAtTime(1,g0+c.len/rate+.01);}}
        hg.gain.setValueAtTime(.06+.08*p,tt-.05);off=c.at+c.len;}
      piece(off,d-off);
      click(when+.35/rate,1);click(when+dur-.35/rate,.7);
      const bed=.03+st*.04+p*.05;hg.gain.setValueAtTime(0,when+.3/rate);hg.gain.linearRampToValueAtTime(bed,when+.38/rate);hg.gain.setValueAtTime(bed,when+dur-.4/rate);hg.gain.linearRampToValueAtTime(0,when+dur-.25/rate);
      C.gate.gain.setValueAtTime(1,when);
      for(let t=when+.75;t<when+dur-.6;t+=.16+Math.random()*.45){if(Math.random()>st*.6)continue;const l=.025+Math.random()*(.06+.08*p);
        C.gate.gain.setValueAtTime(1,t);C.gate.gain.linearRampToValueAtTime(.08,t+.008);C.gate.gain.setValueAtTime(.08,t+l);C.gate.gain.linearRampToValueAtTime(1,t+l+.012);
        hg.gain.setValueAtTime(bed,t);hg.gain.linearRampToValueAtTime(.14+.16*st,t+.008);hg.gain.linearRampToValueAtTime(bed,t+l+.03);}
      if(p>.1)crackle(when+.3,when+dur-.2,4+22*p,.05+.1*p);
      return dur;}};};

/* ---------- the score ---------- */
RMD.Score=function(ctx){const S={},master=ctx.createGain();master.gain.value=.5;
  /* glue, then a brick wall, then a soft clip: nothing leaves above full scale */
  const glue=ctx.createDynamicsCompressor();glue.threshold.value=-18;glue.ratio.value=2.5;glue.attack.value=.02;glue.release.value=.25;
  const lim=ctx.createDynamicsCompressor();lim.threshold.value=-4;lim.knee.value=0;lim.ratio.value=20;lim.attack.value=.001;lim.release.value=.12;
  const clipr=drive(ctx,1.15),og=ctx.createGain();og.gain.value=.9;master.connect(glue);glue.connect(lim);lim.connect(clipr);clipr.connect(og);og.connect(ctx.destination);
  const music=ctx.createGain(),duckG=ctx.createGain(),sfx=ctx.createGain(),voice=ctx.createGain();music.connect(duckG);duckG.connect(master);sfx.connect(master);voice.connect(master);
  voice.gain.value=.95;sfx.gain.value=.75;music.gain.value=.85;
  const hall=verb(ctx,4.2,2.4,.03),hallG=ctx.createGain();hallG.gain.value=.4;hall.connect(hallG);hallG.connect(duckG);
  const wide=verb(ctx,5.5,3,.08),wideG=ctx.createGain();wideG.gain.value=.5;wide.connect(wideG);wideG.connect(sfx);
  const pink=noiseBuf(ctx,4,true),white=noiseBuf(ctx,3,false);
  S.ctx=ctx;S.out=master;S.voice=voice;S.music=music;S.sfx=sfx;
  /* ducking: the music dips under a line and comes back after it */
  S.duck=function(t0,t1,k){duckG.gain.setTargetAtTime(1-(k||.55),t0,.08);duckG.gain.setTargetAtTime(1,t1,.35);sfx.gain.setTargetAtTime(.5,t0,.08);sfx.gain.setTargetAtTime(.75,t1,.35);};
  /* beds */
  const bed=(buf,type,f,q,dest)=>{const s=loopNoise(ctx,buf),fl=ctx.createBiquadFilter();fl.type=type;fl.frequency.value=f;if(q)fl.Q.value=q;const g=ctx.createGain();g.gain.value=0;s.connect(fl);fl.connect(g);g.connect(dest);return [g.gain,fl.frequency];};
  const [wind]=bed(pink,'bandpass',520,.5,sfx),[sea]=bed(pink,'lowpass',380,0,sfx),[rain]=bed(white,'highpass',3200,0,sfx);
  const [rise,riseF]=bed(white,'bandpass',1500,4,music),[stat]=bed(white,'highpass',900,0,sfx);
  /* the sea's swell: a slow breathing on the low noise */
  const sw=ctx.createOscillator();sw.frequency.value=.11;const swg=ctx.createGain();swg.gain.value=.05;sw.connect(swg);swg.connect(sea);sw.start();
  /* the pad: low saws through a slowly opening filter */
  const padF=ctx.createBiquadFilter();padF.type='lowpass';padF.frequency.value=120;padF.Q.value=2;const padG=ctx.createGain();padG.gain.value=0;padF.connect(padG);padG.connect(music);padG.connect(hall);
  [36.71,55,73.42,110.3,146.8].forEach((f,i)=>{const o=ctx.createOscillator();o.type='sawtooth';o.frequency.value=f;o.detune.value=[-6,7,-4,5,-8][i];const g=ctx.createGain();g.gain.value=[.22,.22,.1,.08,.05][i];o.connect(g);g.connect(padF);o.start();});
  /* tremolo strings: a D minor cluster, bowed fast */
  const strF=ctx.createBiquadFilter();strF.type='bandpass';strF.frequency.value=700;strF.Q.value=.7;const strT=ctx.createGain();const strG=ctx.createGain();strG.gain.value=0;
  strF.connect(strT);strT.connect(strG);strG.connect(music);strG.connect(hall);
  const trem=ctx.createOscillator();trem.frequency.value=9;const tremG=ctx.createGain();tremG.gain.value=.5;trem.connect(tremG);tremG.connect(strT.gain);strT.gain.value=.5;trem.start();
  [146.8,174.6,220,293.7,349.2].forEach((f,i)=>[-9,0,8].forEach(dt=>{const o=ctx.createOscillator();o.type='sawtooth';o.frequency.value=f;o.detune.value=dt+i;const g=ctx.createGain();g.gain.value=.035;o.connect(g);g.connect(strF);o.start();}));
  /* the harbour's mains hum (dies with the lamps) */
  const buzzF=ctx.createBiquadFilter();buzzF.type='bandpass';buzzF.frequency.value=240;buzzF.Q.value=1.2;const buzzG=ctx.createGain();buzzG.gain.value=0;buzzF.connect(buzzG);buzzG.connect(sfx);
  [60,120,180].forEach((f,i)=>{const o=ctx.createOscillator();o.type='sawtooth';o.frequency.value=f;const g=ctx.createGain();g.gain.value=[.25,.18,.1][i];o.connect(g);g.connect(buzzF);o.start();});
  /* the low hum that builds before it comes: two sines a hair apart, beating, and a slow swell */
  const humG=ctx.createGain();humG.gain.value=0;humG.connect(music);humG.connect(hall);
  [[41.2,.5],[41.9,.5],[82.4,.25],[123.6,.12]].forEach(([f,a])=>{const o=ctx.createOscillator();o.type='sine';o.frequency.value=f;const g=ctx.createGain();g.gain.value=a;o.connect(g);g.connect(humG);o.start();});
  S.params={wind,sea,rain,rise,riseF,stat,pad:padG.gain,padF:padF.frequency,str:strG.gain,strF:strF.frequency,buzz:buzzG.gain,hum:humG.gain};
  /* ---------- foley ---------- */
  /* the foghorn; choke: it dies mid-blast, the pitch falling away like a machine losing power */
  S.horn=function(when,p,len,choke){const dest=pan(ctx,p,sfx);const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=520;f.Q.value=1.5;const g=ctx.createGain();f.connect(g);g.connect(dest);g.connect(wide);
    g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(.55,when+.45);g.gain.setValueAtTime(.55,when+len);
    if(choke){g.gain.linearRampToValueAtTime(.7,when+len+.08);g.gain.setValueAtTime(.2,when+len+.25);g.gain.linearRampToValueAtTime(.45,when+len+.3);g.gain.exponentialRampToValueAtTime(.001,when+len+.75);}
    else g.gain.linearRampToValueAtTime(0,when+len+1.3);
    [[73.4,'sawtooth',.5],[110,'sawtooth',.35],[36.7,'square',.25]].forEach(([fr,ty,k])=>{const o=ctx.createOscillator();o.type=ty;o.frequency.setValueAtTime(fr*.97,when);o.frequency.linearRampToValueAtTime(fr,when+.4);
      if(choke){o.frequency.setValueAtTime(fr,when+len);o.frequency.exponentialRampToValueAtTime(fr*.28,when+len+.7);}
      const og=ctx.createGain();og.gain.value=k;o.connect(og);og.connect(f);o.start(when);o.stop(when+len+1.4);});};
  /* a lamp dying: a crackle of arcing, a pop, the hum of it gone */
  S.pop=function(when,p,k){k=k||1;const dest=pan(ctx,p,sfx);for(let i=0;i<5;i++){const t=when-.3+Math.random()*.28;const n=ctx.createBufferSource();n.buffer=white;const f=ctx.createBiquadFilter();f.type='highpass';f.frequency.value=2500;
      const g=ctx.createGain();env(g,t,.001,.08*k,.03);n.connect(f);f.connect(g);g.connect(dest);n.start(t,Math.random()*2,.05);}
    const n=ctx.createBufferSource();n.buffer=white;const f=ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=1400;f.Q.value=.8;const g=ctx.createGain();env(g,when,.001,.3*k,.12);n.connect(f);f.connect(g);g.connect(dest);n.start(when,Math.random()*2,.15);
    const o=ctx.createOscillator();o.type='sine';o.frequency.setValueAtTime(140,when);o.frequency.exponentialRampToValueAtTime(40,when+.12);const og=ctx.createGain();env(og,when,.002,.25*k,.18);o.connect(og);og.connect(dest);o.start(when);o.stop(when+.25);};
  /* the sea pulling back: a long sucking roar, the water draining off the wall */
  S.drain=function(when,dur){const n=ctx.createBufferSource();n.buffer=pink;n.loop=true;const f=ctx.createBiquadFilter();f.type='lowpass';f.Q.value=2;f.frequency.setValueAtTime(1600,when);f.frequency.exponentialRampToValueAtTime(110,when+dur);
    const g=ctx.createGain();g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(.9,when+dur*.25);g.gain.exponentialRampToValueAtTime(.001,when+dur);n.connect(f);f.connect(g);g.connect(sfx);g.connect(wide);n.start(when);n.stop(when+dur+.1);
    for(let i=0;i<40;i++){const t=when+Math.random()*dur*.8;const o=ctx.createOscillator();o.type='sine';const fr=220+Math.random()*420;o.frequency.setValueAtTime(fr,t);o.frequency.exponentialRampToValueAtTime(fr*1.8,t+.05);
      const og=ctx.createGain();env(og,t,.003,.03,.07);o.connect(og);og.connect(pan(ctx,Math.random()*1.6-.8,sfx));o.start(t);o.stop(t+.1);}};
  /* the sea coming back */
  S.wash=function(when,dur){const n=ctx.createBufferSource();n.buffer=pink;n.loop=true;const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(250,when);f.frequency.exponentialRampToValueAtTime(2600,when+dur*.5);f.frequency.exponentialRampToValueAtTime(400,when+dur);
    const g=ctx.createGain();g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(1,when+dur*.45);g.gain.exponentialRampToValueAtTime(.001,when+dur);n.connect(f);f.connect(g);g.connect(sfx);g.connect(wide);n.start(when);n.stop(when+dur+.1);};
  /* the Signal rising: a groan, low saws through moving vowel-like bands, sinking in pitch */
  S.moan=function(when,dur){const out=ctx.createGain();out.gain.setValueAtTime(0,when);out.gain.linearRampToValueAtTime(.75,when+dur*.3);out.gain.setValueAtTime(.75,when+dur*.7);out.gain.exponentialRampToValueAtTime(.001,when+dur);
    out.connect(sfx);out.connect(wide);const d=drive(ctx,2);d.connect(out);
    [[300,520],[700,420],[1150,1500]].forEach(([a,b],i)=>{const f=ctx.createBiquadFilter();f.type='bandpass';f.Q.value=6;f.frequency.setValueAtTime(a,when);f.frequency.linearRampToValueAtTime(b,when+dur*.5);f.frequency.linearRampToValueAtTime(a*.8,when+dur);
      const fg=ctx.createGain();fg.gain.value=[1,.7,.35][i];f.connect(fg);fg.connect(d);
      [55,82.4,110,41.2].forEach(fr=>{const o=ctx.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(fr,when);o.frequency.exponentialRampToValueAtTime(fr*.82,when+dur);
        const v=ctx.createOscillator();v.frequency.value=4.5+i;const vg=ctx.createGain();vg.gain.value=9;v.connect(vg);vg.connect(o.detune);o.connect(f);o.start(when);v.start(when);o.stop(when+dur+.1);v.stop(when+dur+.1);});});};
  S.step=function(when,p,k){const dest=pan(ctx,p,sfx);const o=ctx.createOscillator();o.type='sine';o.frequency.setValueAtTime(70,when);o.frequency.exponentialRampToValueAtTime(32,when+.18);
    const g=ctx.createGain();env(g,when,.006,.55*k,.35);o.connect(g);g.connect(dest);o.start(when);o.stop(when+.45);
    const n=ctx.createBufferSource();n.buffer=white;const nf=ctx.createBiquadFilter();nf.type='bandpass';nf.frequency.value=2300;nf.Q.value=3;const ng=ctx.createGain();env(ng,when+.01,.003,.12*k,.12);
    n.connect(nf);nf.connect(ng);ng.connect(dest);n.start(when,Math.random()*2,.2);
    const r=ctx.createOscillator();r.type='triangle';r.frequency.value=880+Math.random()*120;const rg=ctx.createGain();env(rg,when+.012,.002,.03*k,.25);r.connect(rg);rg.connect(dest);r.start(when);r.stop(when+.3);};
  S.servo=function(when,p,k){const dest=pan(ctx,p,sfx);const o=ctx.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(420,when);o.frequency.linearRampToValueAtTime(640,when+.5);o.frequency.linearRampToValueAtTime(560,when+.85);
    const f=ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=950;f.Q.value=6;const g=ctx.createGain();g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(.06*(k||1),when+.1);g.gain.linearRampToValueAtTime(0,when+.9);
    o.connect(f);f.connect(g);g.connect(dest);o.start(when);o.stop(when+.95);};
  /* a gun far away: the flash first, the boom later (the timeline places it) */
  S.boom=function(when,p,k){const dest=pan(ctx,p,sfx);const n=ctx.createBufferSource();n.buffer=pink;const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(900,when);f.frequency.exponentialRampToValueAtTime(120,when+1.6);
    const g=ctx.createGain();env(g,when,.01,.8*k,2.2);n.connect(f);f.connect(g);g.connect(dest);g.connect(wide);n.start(when,Math.random()*2,2.4);
    const o=ctx.createOscillator();o.type='sine';o.frequency.setValueAtTime(58,when);o.frequency.exponentialRampToValueAtTime(30,when+.9);const og=ctx.createGain();env(og,when,.008,.7*k,1.4);o.connect(og);og.connect(dest);o.start(when);o.stop(when+1.6);};
  S.whistle=function(when,dur,p,k){const dest=pan(ctx,p,sfx);const o=ctx.createOscillator();o.type='sine';o.frequency.setValueAtTime(2400,when);o.frequency.exponentialRampToValueAtTime(420,when+dur);
    const g=ctx.createGain();g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(.05*k,when+dur*.6);g.gain.linearRampToValueAtTime(.09*k,when+dur*.95);g.gain.linearRampToValueAtTime(0,when+dur);
    o.connect(g);g.connect(dest);o.start(when);o.stop(when+dur+.05);};
  S.blast=function(when,p,k){S.boom(when,p,1.3*k);const dest=pan(ctx,p,sfx);const n=ctx.createBufferSource();n.buffer=white;const f=ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=1100;f.Q.value=.5;
    const g=ctx.createGain();g.gain.setValueAtTime(0,when+.15);g.gain.linearRampToValueAtTime(.35*k,when+.3);g.gain.exponentialRampToValueAtTime(.001,when+3.2);n.connect(f);f.connect(g);g.connect(dest);g.connect(wide);n.start(when,0,3.4);};
  S.burst=function(when,len,k){const n=ctx.createBufferSource();n.buffer=white;const f=ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=2500+Math.random()*3000;f.Q.value=.7;
    const g=ctx.createGain();g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(.3*k,when+.005);g.gain.setValueAtTime(.3*k,when+len);g.gain.linearRampToValueAtTime(0,when+len+.02);
    n.connect(f);f.connect(g);g.connect(sfx);n.start(when,Math.random()*2,len+.05);};
  /* ---------- music ---------- */
  S.pluck=function(when,fr,k,p){const dest=pan(ctx,p||0,music);const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(3200,when);f.frequency.exponentialRampToValueAtTime(500,when+2);
    const g=ctx.createGain();env(g,when,.004,.16*k,4);f.connect(g);g.connect(dest);g.connect(hall);
    [[1,'triangle',1],[2,'sine',.3],[1.003,'sine',.5]].forEach(([m,ty,a])=>{const o=ctx.createOscillator();o.type=ty;o.frequency.value=fr*m;const og=ctx.createGain();og.gain.value=a;o.connect(og);og.connect(f);o.start(when);o.stop(when+4.2);});};
  S.note=function(when,dur){const g=ctx.createGain();g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(.5,when+1.2);g.gain.setValueAtTime(.5,when+dur-1.5);g.gain.linearRampToValueAtTime(0,when+dur);
    const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(90,when);f.frequency.linearRampToValueAtTime(700,when+dur*.6);f.connect(g);g.connect(music);g.connect(hall);
    [27.5,36.71,55,82.4,110].forEach((fr,i)=>{const o=ctx.createOscillator();o.type=i?'sawtooth':'sine';o.frequency.value=fr;const og=ctx.createGain();og.gain.value=i?.16:.6;o.connect(og);og.connect(f);o.start(when);o.stop(when+dur+.1);});};
  S.beat=function(when,k){const o=ctx.createOscillator();o.type='sine';o.frequency.setValueAtTime(62,when);o.frequency.exponentialRampToValueAtTime(34,when+.25);
    const g=ctx.createGain();env(g,when,.01,.8*k,.5);o.connect(g);g.connect(music);o.start(when);o.stop(when+.6);};
  S.kick=function(when,k){const o=ctx.createOscillator();o.type='sine';o.frequency.setValueAtTime(150,when);o.frequency.exponentialRampToValueAtTime(38,when+.12);
    const g=ctx.createGain();env(g,when,.003,1.0*k,.45);o.connect(g);g.connect(music);o.start(when);o.stop(when+.5);};
  S.taiko=function(when,k,p){const dest=pan(ctx,p||0,music);const o=ctx.createOscillator();o.type='sine';o.frequency.setValueAtTime(130,when);o.frequency.exponentialRampToValueAtTime(52,when+.25);
    const g=ctx.createGain();env(g,when,.003,.85*k,.9);o.connect(g);g.connect(dest);g.connect(hall);o.start(when);o.stop(when+1);
    const n=ctx.createBufferSource();n.buffer=pink;const nf=ctx.createBiquadFilter();nf.type='lowpass';nf.frequency.value=1400;const ng=ctx.createGain();env(ng,when,.002,.5*k,.18);n.connect(nf);nf.connect(ng);ng.connect(dest);n.start(when,Math.random()*2,.3);};
  S.snare=function(when,k){const n=ctx.createBufferSource();n.buffer=white;const f=ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=1900;f.Q.value=.9;const g=ctx.createGain();env(g,when,.002,.32*k,.22);
    n.connect(f);f.connect(g);g.connect(music);g.connect(hall);n.start(when,Math.random()*2,.3);
    const o=ctx.createOscillator();o.type='triangle';o.frequency.setValueAtTime(220,when);o.frequency.exponentialRampToValueAtTime(140,when+.08);const og=ctx.createGain();env(og,when,.002,.25*k,.12);o.connect(og);og.connect(music);o.start(when);o.stop(when+.2);};
  S.bass=function(when,fr,dur,k){const f=ctx.createBiquadFilter();f.type='lowpass';f.Q.value=4;f.frequency.setValueAtTime(900,when);f.frequency.exponentialRampToValueAtTime(140,when+dur);
    const g=ctx.createGain();g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(.42*k,when+.01);g.gain.setValueAtTime(.42*k,when+dur*.8);g.gain.linearRampToValueAtTime(0,when+dur);f.connect(g);g.connect(music);
    [[1,'sawtooth',.6],[.5,'square',.4],[1.005,'sawtooth',.4]].forEach(([m,ty,a])=>{const o=ctx.createOscillator();o.type=ty;o.frequency.value=fr*m;const og=ctx.createGain();og.gain.value=a;o.connect(og);og.connect(f);o.start(when);o.stop(when+dur+.02);});};
  S.stab=function(when,k,root){const r=root||1;const cf=ctx.createBiquadFilter();cf.type='lowpass';cf.Q.value=3;cf.frequency.setValueAtTime(220,when);cf.frequency.exponentialRampToValueAtTime(3000,when+.12);cf.frequency.exponentialRampToValueAtTime(500,when+1.6);
    const cg=ctx.createGain();env(cg,when,.03,.42*k,2.2);cf.connect(cg);cg.connect(music);cg.connect(hall);
    [73.42,110,146.8,174.6,220].forEach(fr=>[-8,0,9].forEach(dt=>{const c=ctx.createOscillator();c.type='sawtooth';c.frequency.value=fr*r;c.detune.value=dt;const g=ctx.createGain();g.gain.value=.06;c.connect(g);g.connect(cf);c.start(when);c.stop(when+2.4);}));};
  S.riser=function(when,dur){const n=ctx.createBufferSource();n.buffer=white;n.loop=true;const f=ctx.createBiquadFilter();f.type='bandpass';f.Q.value=3;f.frequency.setValueAtTime(300,when);f.frequency.exponentialRampToValueAtTime(7000,when+dur);
    const g=ctx.createGain();g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(.22,when+dur);g.gain.linearRampToValueAtTime(0,when+dur+.05);n.connect(f);f.connect(g);g.connect(music);n.start(when);n.stop(when+dur+.1);
    const o=ctx.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(55,when);o.frequency.exponentialRampToValueAtTime(440,when+dur);const of=ctx.createBiquadFilter();of.type='lowpass';of.frequency.value=1200;
    const og=ctx.createGain();og.gain.setValueAtTime(0,when);og.gain.linearRampToValueAtTime(.1,when+dur);og.gain.linearRampToValueAtTime(0,when+dur+.05);o.connect(of);of.connect(og);og.connect(music);o.start(when);o.stop(when+dur+.1);};
  S.roar=function(when,dur){const s=ctx.createBufferSource();s.buffer=pink;s.loop=true;const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(260,when);f.frequency.linearRampToValueAtTime(1500,when+.5);f.frequency.exponentialRampToValueAtTime(160,when+dur);
    const d=drive(ctx,4),g=ctx.createGain();g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(.75,when+.35);g.gain.exponentialRampToValueAtTime(.001,when+dur);
    s.connect(f);f.connect(d);d.connect(g);g.connect(sfx);g.connect(wide);s.start(when);s.stop(when+dur+.1);
    [70,93,47,35].forEach(fr=>{const o=ctx.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(fr,when);o.frequency.exponentialRampToValueAtTime(fr*.45,when+dur);
      const og=ctx.createGain();og.gain.setValueAtTime(0,when);og.gain.linearRampToValueAtTime(.2,when+.3);og.gain.exponentialRampToValueAtTime(.001,when+dur);o.connect(d);o.connect(og);og.connect(sfx);o.start(when);o.stop(when+dur);});};
  S.hit=function(when,k){k=k||1;const o=ctx.createOscillator();o.type='sine';o.frequency.setValueAtTime(110,when);o.frequency.exponentialRampToValueAtTime(28,when+.7);
    const g=ctx.createGain();g.gain.setValueAtTime(.9*k,when);g.gain.exponentialRampToValueAtTime(.001,when+2.2);o.connect(g);g.connect(music);g.connect(hall);o.start(when);o.stop(when+2.4);
    const n=ctx.createBufferSource();n.buffer=white;const nf=ctx.createBiquadFilter();nf.type='lowpass';nf.frequency.value=2400;const ng=ctx.createGain();ng.gain.setValueAtTime(.7*k,when);ng.gain.exponentialRampToValueAtTime(.001,when+.45);
    n.connect(nf);nf.connect(ng);ng.connect(music);ng.connect(hall);n.start(when,0,.5);S.stab(when,1.2*k);};
  return S;};
})();
