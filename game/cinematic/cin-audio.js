'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · THE SIGNAL'S REVEAL: SOUND (game/cinematic/cin-audio.js, session D)
   Everything you hear is made here with Web Audio, except the voices (ElevenLabs takes, inlined by the build when they
   are in audio/voice/). Nothing to download, so the page works offline.

   RMD.RadioVoice(ctx, out)   the radio over a clean voice take (decided: the game adds the static, not ElevenLabs)
     .play(buffer, when, {strain})   band-limited to a radio's 300 Hz to 3.4 kHz, a little drive, squelch clicks at
                                     both ends, a hiss bed under the words, and with strain (0..1) dropouts and bursts
                                     of static: OVERWATCH straining to hold the picture. The game can use this too.

   SCORE  wind and sea; the hiss of the count climbing; static that follows the picture's interference; a low pad that
          opens; one deep note when it becomes one mass; a heartbeat in the three clear seconds; the roar and the hit.
   ===================================================================================================================== */
window.RMD=window.RMD||{};
(function(){
function noiseBuf(ctx,sec,pink){const n=Math.floor(ctx.sampleRate*sec),b=ctx.createBuffer(2,n,ctx.sampleRate);
  for(let c=0;c<2;c++){const d=b.getChannelData(c);let b0=0,b1=0,b2=0;for(let i=0;i<n;i++){const w=Math.random()*2-1;
    if(pink){b0=.99765*b0+w*.099;b1=.963*b1+w*.2965;b2=.57*b2+w*1.0526;d[i]=(b0+b1+b2+w*.1848)*.18;}else d[i]=w;}}return b;}
function loopNoise(ctx,buf){const s=ctx.createBufferSource();s.buffer=buf;s.loop=true;s.start();return s;}
function drive(ctx,k){const ws=ctx.createWaveShaper(),n=1024,c=new Float32Array(n);for(let i=0;i<n;i++){const x=i/(n-1)*2-1;c[i]=Math.tanh(x*k)/Math.tanh(k);}ws.curve=c;return ws;}
function verb(ctx,sec,decay){const n=Math.floor(ctx.sampleRate*sec),b=ctx.createBuffer(2,n,ctx.sampleRate);
  for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,decay);}const v=ctx.createConvolver();v.buffer=b;return v;}

/* ---------- the radio ---------- */
RMD.RadioVoice=function(ctx,out){const white=noiseBuf(ctx,3,false);
  const hp=ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=320;hp.Q.value=.8;
  const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=3300;lp.Q.value=1.1;
  const pk=ctx.createBiquadFilter();pk.type='peaking';pk.frequency.value=1800;pk.gain.value=5;pk.Q.value=1;
  const dr=drive(ctx,2.2),comp=ctx.createDynamicsCompressor();comp.threshold.value=-24;comp.ratio.value=6;
  const gate=ctx.createGain();hp.connect(lp);lp.connect(pk);pk.connect(dr);dr.connect(comp);comp.connect(gate);gate.connect(out);
  /* the hiss bed: always there while a line plays */
  const hiss=loopNoise(ctx,white),hf=ctx.createBiquadFilter();hf.type='bandpass';hf.frequency.value=4200;hf.Q.value=.6;const hg=ctx.createGain();hg.gain.value=0;
  hiss.connect(hf);hf.connect(hg);hg.connect(out);
  function click(when,k){const s=ctx.createBufferSource();s.buffer=white;const g=ctx.createGain(),f=ctx.createBiquadFilter();f.type='highpass';f.frequency.value=1500;
    s.connect(f);f.connect(g);g.connect(out);g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(.22*k,when+.004);g.gain.exponentialRampToValueAtTime(.001,when+.09);s.start(when,Math.random()*2,.12);}
  return {input:hp,
    play(buf,when,o){o=o||{};const st=o.strain||0,d=buf.duration;const s=ctx.createBufferSource();s.buffer=buf;s.connect(hp);
      click(when-.05,1);click(when+d+.02,.7);
      hg.gain.setValueAtTime(0,when-.06);hg.gain.linearRampToValueAtTime(.025+st*.05,when-.02);hg.gain.setValueAtTime(.025+st*.05,when+d);hg.gain.linearRampToValueAtTime(0,when+d+.12);
      gate.gain.setValueAtTime(1,when);
      /* strain: the picture is breaking up, and so is the voice */
      for(let t=when+.25;t<when+d-.1;t+=.18+Math.random()*.5){if(Math.random()>st*.55)continue;const l=.03+Math.random()*.09;
        gate.gain.setValueAtTime(1,t);gate.gain.linearRampToValueAtTime(.12,t+.01);gate.gain.setValueAtTime(.12,t+l);gate.gain.linearRampToValueAtTime(1,t+l+.015);
        hg.gain.setValueAtTime(.025+st*.05,t);hg.gain.linearRampToValueAtTime(.18*st,t+.01);hg.gain.linearRampToValueAtTime(.025+st*.05,t+l+.03);}
      s.start(when);return s;}};};

/* ---------- the score ---------- */
RMD.Score=function(ctx){const S={},master=ctx.createGain();master.gain.value=.9;
  const comp=ctx.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=3;master.connect(comp);comp.connect(ctx.destination);
  const rv=verb(ctx,3.5,2.6),rvg=ctx.createGain();rvg.gain.value=.35;rv.connect(rvg);rvg.connect(master);
  const pink=noiseBuf(ctx,4,true),white=noiseBuf(ctx,3,false);
  S.out=master;S.verb=rv;
  /* wind and sea */
  const wind=loopNoise(ctx,pink),wf=ctx.createBiquadFilter();wf.type='bandpass';wf.frequency.value=500;wf.Q.value=.5;const wg=ctx.createGain();wg.gain.value=0;wind.connect(wf);wf.connect(wg);wg.connect(master);
  const sea=loopNoise(ctx,pink),sf=ctx.createBiquadFilter();sf.type='lowpass';sf.frequency.value=380;const sg=ctx.createGain();sg.gain.value=0;sea.connect(sf);sf.connect(sg);sg.connect(master);
  /* the count climbing: a hiss that rises */
  const rise=loopNoise(ctx,white),rf=ctx.createBiquadFilter();rf.type='bandpass';rf.Q.value=4;rf.frequency.value=1500;const rg=ctx.createGain();rg.gain.value=0;rise.connect(rf);rf.connect(rg);rg.connect(master);
  /* static that follows the interference */
  const stat=loopNoise(ctx,white),stf=ctx.createBiquadFilter();stf.type='highpass';stf.frequency.value=900;const stg=ctx.createGain();stg.gain.value=0;stat.connect(stf);stf.connect(stg);stg.connect(master);
  /* the pad: low saws, slowly opening */
  const padF=ctx.createBiquadFilter();padF.type='lowpass';padF.frequency.value=120;padF.Q.value=2;const padG=ctx.createGain();padG.gain.value=0;padF.connect(padG);padG.connect(master);padG.connect(rv);
  [36.71,55,73.42,110.3].forEach((f,i)=>{const o=ctx.createOscillator();o.type='sawtooth';o.frequency.value=f;o.detune.value=(i%2?7:-6);const g=ctx.createGain();g.gain.value=i<2?.22:.1;o.connect(g);g.connect(padF);o.start();});
  S.params={wind:wg.gain,sea:sg.gain,rise:rg.gain,riseF:rf.frequency,stat:stg.gain,pad:padG.gain,padF:padF.frequency};
  /* one-shots */
  S.note=function(when,dur){const g=ctx.createGain();g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(.5,when+1.2);g.gain.setValueAtTime(.5,when+dur-1.5);g.gain.linearRampToValueAtTime(0,when+dur);
    const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(90,when);f.frequency.linearRampToValueAtTime(600,when+dur*.6);f.connect(g);g.connect(master);g.connect(rv);
    [27.5,36.71,55,82.4].forEach((fr,i)=>{const o=ctx.createOscillator();o.type=i?'sawtooth':'sine';o.frequency.value=fr;const og=ctx.createGain();og.gain.value=i?.18:.6;o.connect(og);og.connect(f);o.start(when);o.stop(when+dur+.1);});};
  S.beat=function(when,k){const o=ctx.createOscillator();o.type='sine';o.frequency.setValueAtTime(62,when);o.frequency.exponentialRampToValueAtTime(34,when+.25);
    const g=ctx.createGain();g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(.8*k,when+.01);g.gain.exponentialRampToValueAtTime(.001,when+.5);o.connect(g);g.connect(master);o.start(when);o.stop(when+.6);};
  S.servo=function(when){const o=ctx.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(420,when);o.frequency.linearRampToValueAtTime(610,when+.5);o.frequency.linearRampToValueAtTime(540,when+.8);
    const f=ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=900;f.Q.value=6;const g=ctx.createGain();g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(.05,when+.1);g.gain.linearRampToValueAtTime(0,when+.85);
    o.connect(f);f.connect(g);g.connect(master);o.start(when);o.stop(when+.9);};
  S.roar=function(when,dur){const s=ctx.createBufferSource();s.buffer=pink;s.loop=true;const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(260,when);f.frequency.linearRampToValueAtTime(1400,when+.5);f.frequency.exponentialRampToValueAtTime(160,when+dur);
    const d=drive(ctx,4),g=ctx.createGain();g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(1.4,when+.35);g.gain.exponentialRampToValueAtTime(.001,when+dur);
    s.connect(f);f.connect(d);d.connect(g);g.connect(master);g.connect(rv);s.start(when);s.stop(when+dur+.1);
    [70,93,47].forEach(fr=>{const o=ctx.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(fr,when);o.frequency.exponentialRampToValueAtTime(fr*.45,when+dur);
      const og=ctx.createGain();og.gain.setValueAtTime(0,when);og.gain.linearRampToValueAtTime(.25,when+.3);og.gain.exponentialRampToValueAtTime(.001,when+dur);o.connect(d);o.start(when);o.stop(when+dur);o.connect(og);og.connect(master);});};
  S.hit=function(when){/* the drum */const o=ctx.createOscillator();o.type='sine';o.frequency.setValueAtTime(110,when);o.frequency.exponentialRampToValueAtTime(30,when+.6);
    const g=ctx.createGain();g.gain.setValueAtTime(1.4,when);g.gain.exponentialRampToValueAtTime(.001,when+1.8);o.connect(g);g.connect(master);g.connect(rv);o.start(when);o.stop(when+2);
    const n=ctx.createBufferSource();n.buffer=white;const nf=ctx.createBiquadFilter();nf.type='lowpass';nf.frequency.value=2200;const ng=ctx.createGain();ng.gain.setValueAtTime(.7,when);ng.gain.exponentialRampToValueAtTime(.001,when+.4);
    n.connect(nf);nf.connect(ng);ng.connect(master);ng.connect(rv);n.start(when,0,.5);
    /* the chord: brass made of saws, D minor, opening up */
    const cf=ctx.createBiquadFilter();cf.type='lowpass';cf.Q.value=3;cf.frequency.setValueAtTime(200,when);cf.frequency.exponentialRampToValueAtTime(2600,when+.25);cf.frequency.exponentialRampToValueAtTime(500,when+3.5);
    const cg=ctx.createGain();cg.gain.setValueAtTime(0,when);cg.gain.linearRampToValueAtTime(.55,when+.05);cg.gain.exponentialRampToValueAtTime(.001,when+4.2);cf.connect(cg);cg.connect(master);cg.connect(rv);
    [73.42,110,146.8,174.6,220].forEach((fr,i)=>[-8,0,9].forEach(dt=>{const c=ctx.createOscillator();c.type='sawtooth';c.frequency.value=fr;c.detune.value=dt;const cgi=ctx.createGain();cgi.gain.value=.07;
      c.connect(cgi);cgi.connect(cf);c.start(when);c.stop(when+4.4);}));};
  S.burst=function(when,len,k){const n=ctx.createBufferSource();n.buffer=white;const f=ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=2500+Math.random()*3000;f.Q.value=.7;
    const g=ctx.createGain();g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(.35*k,when+.005);g.gain.setValueAtTime(.35*k,when+len);g.gain.linearRampToValueAtTime(0,when+len+.02);
    n.connect(f);f.connect(g);g.connect(master);n.start(when,Math.random()*2,len+.05);};
  return S;};
})();
