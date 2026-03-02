import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';

// ─── AUDIO ENGINE ───
let audioReady=false;
let crackleLoop=null;
let crackleNoise=null;
let crackleFilter=null;
let crackleGain=null;
let popSynth=null;
let bootSynth=null;
let clickSynth=null;
let whooshNoise=null;
let whooshFilter=null;
let whooshGain=null;
let selectSynth=null;
let confirmSynth=null;

async function initAudio(){
  if(audioReady)return;
  await Tone.start();

  // Ambient wood crackle — filtered brown noise
  crackleNoise=new Tone.Noise('brown');
  crackleFilter=new Tone.AutoFilter({frequency:'0.8hz',depth:0.7,baseFrequency:200,octaves:3}).toDestination();
  crackleGain=new Tone.Gain(0.06).connect(crackleFilter);
  crackleNoise.connect(crackleGain);
  crackleFilter.start();

  // Random pops for crackle texture
  popSynth=new Tone.MembraneSynth({
    pitchDecay:0.01,octaves:3,
    envelope:{attack:0.001,decay:0.08,sustain:0,release:0.02}
  });
  const popGain=new Tone.Gain(0.08).toDestination();
  popSynth.connect(popGain);

  // Boot sequence beeps
  bootSynth=new Tone.Synth({
    oscillator:{type:'square'},
    envelope:{attack:0.005,decay:0.08,sustain:0,release:0.05}
  });
  const bootGain=new Tone.Gain(0.06).toDestination();
  bootSynth.connect(bootGain);

  // Click / UI interaction
  clickSynth=new Tone.NoiseSynth({
    noise:{type:'white'},
    envelope:{attack:0.001,decay:0.03,sustain:0,release:0.01}
  });
  const clickGain=new Tone.Gain(0.08).toDestination();
  clickSynth.connect(clickGain);

  // Whoosh for transitions
  whooshNoise=new Tone.Noise('pink');
  whooshFilter=new Tone.Filter({frequency:400,type:'bandpass',Q:2});
  whooshGain=new Tone.Gain(0).toDestination();
  whooshNoise.connect(whooshFilter);
  whooshFilter.connect(whooshGain);

  // Era select tone
  selectSynth=new Tone.Synth({
    oscillator:{type:'sine'},
    envelope:{attack:0.01,decay:0.2,sustain:0,release:0.3}
  });
  const selGain=new Tone.Gain(0.05).toDestination();
  selectSynth.connect(selGain);

  // Confirm / big action tone
  confirmSynth=new Tone.PolySynth(Tone.Synth,{
    oscillator:{type:'triangle'},
    envelope:{attack:0.01,decay:0.3,sustain:0,release:0.4}
  });
  const confGain=new Tone.Gain(0.04).toDestination();
  confirmSynth.connect(confGain);

  audioReady=true;
}

function startCrackle(){
  if(!audioReady||!crackleNoise)return;
  try{ crackleNoise.start(); }catch(e){}
  // Random pops
  if(crackleLoop)crackleLoop.dispose();
  crackleLoop=new Tone.Loop(()=>{
    if(!popSynth)return;
    if(Math.random()>0.4){
      const freq=80+Math.random()*200;
      try{ popSynth.triggerAttackRelease(freq,'32n'); }catch(e){}
    }
  },'8n');
  crackleLoop.start(0);
  Tone.Transport.start();
}

function stopCrackle(){
  try{ crackleNoise?.stop(); }catch(e){}
  try{ crackleLoop?.stop(); }catch(e){}
}

function playBoot(){
  if(!bootSynth)return;
  const notes=['C5','E5','G5','C6'];
  const n=notes[Math.floor(Math.random()*notes.length)];
  try{ bootSynth.triggerAttackRelease(n,'32n'); }catch(e){}
}

function playBootOK(){
  if(!bootSynth)return;
  try{ bootSynth.triggerAttackRelease('G5','16n'); }catch(e){}
}

function playBootLogo(){
  if(!confirmSynth)return;
  try{ confirmSynth.triggerAttackRelease(['C4','E4','G4'],'8n'); }catch(e){}
}

function playBootDone(){
  if(!confirmSynth)return;
  try{ confirmSynth.triggerAttackRelease(['C4','G4','C5'],'4n'); }catch(e){}
}

function playClick(){
  if(!clickSynth)return;
  try{ clickSynth.triggerAttackRelease('32n'); }catch(e){}
}

function playSelect(idx){
  if(!selectSynth)return;
  const base=220+idx*15;
  try{ selectSynth.triggerAttackRelease(base,'16n'); }catch(e){}
}

function playDeselect(){
  if(!selectSynth)return;
  try{ selectSynth.triggerAttackRelease(180,'16n'); }catch(e){}
}

function playWhoosh(){
  if(!whooshNoise||!whooshGain||!whooshFilter)return;
  try{
    whooshNoise.start();
    whooshGain.gain.setValueAtTime(0,Tone.now());
    whooshGain.gain.linearRampToValueAtTime(0.12,Tone.now()+0.08);
    whooshGain.gain.linearRampToValueAtTime(0,Tone.now()+0.35);
    whooshFilter.frequency.setValueAtTime(200,Tone.now());
    whooshFilter.frequency.linearRampToValueAtTime(2000,Tone.now()+0.15);
    whooshFilter.frequency.linearRampToValueAtTime(300,Tone.now()+0.35);
    setTimeout(()=>{try{whooshNoise.stop();}catch(e){}},400);
  }catch(e){}
}

function playTabSwitch(){
  if(!confirmSynth)return;
  try{ confirmSynth.triggerAttackRelease(['E4','B4'],'16n'); }catch(e){}
}

function playUplink(){
  if(!confirmSynth)return;
  try{ confirmSynth.triggerAttackRelease(['A3','E4','A4'],'8n'); }catch(e){}
}

// ─── DATA ───
const bootLines=[
  {t:"[SYS] BRISKETBOWLS MECHA-PIT OS v4.20.69",d:200,s:'b'},
  {t:"[SYS] Initializing smoke core reactor...",d:400,s:'b'},
  {t:"[OK ] Smoke core online — Post Oak reserves at 98%",d:300,s:'ok'},
  {t:"[SYS] Loading thermal array...",d:350,s:'b'},
  {t:"[OK ] Thermal array calibrated — 225°F nominal",d:250,s:'ok'},
  {t:"[SYS] Establishing neural link to pit sensors...",d:400,s:'b'},
  {t:"[OK ] Neural link active — bark formation optimal",d:300,s:'ok'},
  {t:"[SYS] Scanning BBQ intelligence archives...",d:500,s:'b'},
  {t:"[OK ] 21 historical epochs loaded",d:200,s:'ok'},
  {t:"[SYS] Calibrating flavor profile matrix...",d:350,s:'b'},
  {t:"[OK ] Salt · Pepper · Time — locked",d:200,s:'ok'},
  {t:"[SYS] Uplink to Galactic BBQ Network...",d:400,s:'b'},
  {t:"[OK ] Live feed antenna deployed",d:250,s:'ok'},
  {t:"[SYS] Verifying pitmaster credentials...",d:500,s:'b'},
  {t:"[OK ] PILOT AUTHENTICATED",d:300,s:'ok'},
  {t:"",d:200,s:null},
  {t:"    ██████╗ ██████╗ ██╗███████╗██╗  ██╗███████╗████████╗",d:60,s:'logo'},
  {t:"    ██╔══██╗██╔══██╗██║██╔════╝██║ ██╔╝██╔════╝╚══██╔══╝",d:60,s:null},
  {t:"    ██████╔╝██████╔╝██║███████╗█████╔╝ █████╗     ██║",d:60,s:null},
  {t:"    ██╔══██╗██╔══██╗██║╚════██║██╔═██╗ ██╔══╝     ██║",d:60,s:null},
  {t:"    ██████╔╝██║  ██║██║███████║██║  ██╗███████╗   ██║",d:60,s:null},
  {t:"    ╚═════╝ ╚═╝  ╚═╝╚═╝╚══════╝╚═╝  ╚═╝╚══════╝   ╚═╝",d:60,s:null},
  {t:"               ██████╗  ██████╗ ██╗    ██╗██╗     ███████╗",d:60,s:null},
  {t:"               ██╔══██╗██╔═══██╗██║    ██║██║     ██╔════╝",d:60,s:null},
  {t:"               ██████╔╝██║   ██║██║ █╗ ██║██║     ███████╗",d:60,s:null},
  {t:"               ██╔══██╗██║   ██║██║███╗██║██║     ╚════██║",d:60,s:null},
  {t:"               ██████╔╝╚██████╔╝╚███╔███╔╝███████╗███████║",d:60,s:null},
  {t:"               ╚═════╝  ╚═════╝  ╚══╝╚══╝ ╚══════╝╚══════╝",d:60,s:null},
  {t:"",d:300,s:null},
  {t:"[SYS] ★ MECHA-PIT OS READY — ALL SYSTEMS NOMINAL ★",d:400,s:'done'},
  {t:"[SYS] Launching cockpit interface...",d:600,s:'b'},
];

const evts=[
  {year:"~1.5M BC",era:"ORIGIN",code:"IG-001",title:"The First Flame",detail:"Homo erectus mastered fire — the act that rewired the human brain forever. Cooked meat was softer, safer, richer. Every brisket traces back here.",src:"Smithsonian",url:"https://www.smithsonianmag.com/arts-culture/the-evolution-of-american-barbecue-13770775/",pwr:98},
  {year:"~8000 BC",era:"ANCIENT",code:"IG-002",title:"Pit Cooking Emerges",detail:"Indigenous peoples perfected earth-oven cooking — wrapping meat in leaves over hot coals. The Taíno called this 'barbacoa.' The word, the technique — born in the dirt.",src:"NPR / Smithsonian",url:"https://www.npr.org/2025/07/02/nx-s1-5453850/barbecue-independence-day-history-of-explained",pwr:90},
  {year:"1492",era:"CONTACT",code:"IG-003",title:"Barbacoa Meets Europe",detail:"Spanish explorers found the Taíno slow-smoking meat on wooden frameworks. They adapted 'barabicu' into 'barbacoa.' A word crossed an ocean.",src:"Smithsonian",url:"https://www.smithsonianmag.com/arts-culture/the-evolution-of-american-barbecue-13770775/",pwr:85},
  {year:"1540",era:"DE SOTO",code:"IG-004",title:"The Chickasaw Feast",detail:"Near Tupelo, Mississippi, the Chickasaw cooked pork over barbacoa for de Soto. The technique spread north through Virginia and the Carolinas.",src:"AmazingRibs",url:"https://amazingribs.com/barbecue-history-and-culture/barbecue-history/",pwr:80},
  {year:"1672",era:"ENGLISH",code:"IG-005",title:"'Barbecue' in English Print",detail:"The word appeared in English texts for the first time. Colonial America was falling for slow-cooked hog. The Carolinas became strongholds.",src:"Smithsonian",url:"https://www.smithsonianmag.com/arts-culture/the-evolution-of-american-barbecue-13770775/",pwr:75},
  {year:"1769",era:"FOUNDING",code:"IG-006",title:"Washington's All-Nighter",detail:"George Washington's diary, May 27, 1769: 'Went in to Alexandria to a Barbecue and stayed all Night.' He brought 48 bottles of claret to his own BBQ in 1773.",src:"AmazingRibs",url:"https://amazingribs.com/barbecue-history-and-culture/barbecue-history/",pwr:72},
  {year:"1793",era:"REPUBLIC",code:"IG-007",title:"Capitol Cornerstone BBQ",detail:"After laying the U.S. Capitol cornerstone, a 500-pound ox was barbecued. The enslaved Black cooks went uncredited — a pattern persisting for centuries.",src:"Atlanta History Ctr",url:"https://www.atlantahistorycenter.com/blog/from-pit-to-plate-a-brief-history-of-american-barbecue/",pwr:70},
  {year:"1830s",era:"PITMASTER",code:"IG-008",title:"The Pitmaster Tradition",detail:"Enslaved African Americans became indispensable to BBQ. Their slow-and-low techniques defined American BBQ. 'Pitmaster' originally meant an enslaved cook overseeing the pit.",src:"Adrian Miller",url:"https://www.vastage.org/blog/2025/1/22/the-history-of-american-barbeques",pwr:68},
  {year:"1881",era:"DIASPORA",code:"IG-009",title:"Mrs. Fisher's Cookbook",detail:"Abby Fisher, formerly enslaved, published 'What Mrs. Fisher Knows About Old Southern Cooking.' She'd won a bronze medal for pickles in San Francisco.",src:"Virginia Stage Co.",url:"https://www.vastage.org/blog/2025/1/22/the-history-of-american-barbeques",pwr:65},
  {year:"1895",era:"EXPO",code:"IG-010",title:"Atlanta Exposition BBQ",detail:"At the 1895 Cotton States Exposition, Black BBQ chefs catered the event — credited to white Sheriff Callaway. The whitewashing was underway.",src:"Atlanta History Ctr",url:"https://www.atlantahistorycenter.com/blog/from-pit-to-plate-a-brief-history-of-american-barbecue/",pwr:62},
  {year:"1907",era:"KC BBQ",code:"IG-011",title:"Henry Perry's Stand",detail:"Henry Perry opened KC's first commercial BBQ stand after years on steamboats. Slabs in newspaper, 25 cents. Kansas City BBQ was born.",src:"AmazingRibs",url:"https://amazingribs.com/barbecue-history-and-culture/barbecue-history/",pwr:58},
  {year:"1920s",era:"FORD ERA",code:"IG-012",title:"Ford's Briquettes",detail:"Henry Ford mass-produced charcoal briquettes from Model T scraps. Kingsford still dominates. Anyone could hold fire in a bag.",src:"VonHaus",url:"https://www.vonhaus.com/vh_en/blog/the-history-of-bbqs",pwr:52},
  {year:"1930s",era:"WPA ERA",code:"IG-013",title:"WPA Preserves BBQ",detail:"The Federal Writers' Project documented BBQ traditions through interviews with formerly enslaved people, preserving recipes and techniques for future generations.",src:"AmazingRibs / WPA",url:"https://amazingribs.com/barbecue-history-and-culture/barbecue-history/",pwr:48},
  {year:"1940s",era:"POST-WAR",code:"IG-014",title:"GIs Bring Fire Home",detail:"WWII soldiers brought open-fire skills back to suburban families. BBQ went from community events to intimate backyard rituals.",src:"Martin's",url:"https://potatorolls.com/blog/history-of-bbq-in-america/",pwr:42},
  {year:"1952",era:"SUBURBAN",code:"IG-015",title:"The Weber Kettle",detail:"George Stephen cut a buoy in half and welded on legs. Weber Kettle: portable, affordable. Every suburban dad was now a pitmaster.",src:"Martin's / VonHaus",url:"https://potatorolls.com/blog/history-of-bbq-in-america/",pwr:38},
  {year:"1958",era:"TEXAS",code:"IG-016",title:"Lockhart: BBQ Capital",detail:"Kreuz Market and Smitty's solidified Lockhart as the BBQ Capital of Texas. No sauce. Post oak smoke. Salt, pepper, time.",src:"Texas Monthly",url:"https://en.wikipedia.org/wiki/Barbecue_in_the_United_States",pwr:35},
  {year:"1985",era:"KCBS",code:"IG-017",title:"KCBS Founded",detail:"Kansas City Barbeque Society standardized competition judging. 300+ contests per year in 44 states. Trophies, rules, prize money.",src:"KCBS",url:"https://en.wikipedia.org/wiki/Barbecue_in_the_United_States",pwr:30},
  {year:"2009",era:"FRANKLIN",code:"IG-018",title:"Franklin Opens a Trailer",detail:"Aaron Franklin launched a BBQ trailer in Austin. First pitmaster to win James Beard in 2015. Obama bought lunch in 2014.",src:"TX Monthly",url:"https://www.texasmonthly.com/bbq/a-james-beard-for-barbecue/",pwr:22},
  {year:"2020",era:"PANDEMIC",code:"IG-019",title:"The Backyard Boom",detail:"Grill ownership surged to 80% of U.S. households. Pellet smokers went mainstream. Patience and smoke became therapy.",src:"Burn Pit BBQ",url:"https://burnpitbbq.com/blogs/news/current-state-of-barbecue-and-grilling-in-america-2024",pwr:15},
  {year:"2025",era:"NOW",code:"IG-020",title:"Smart Smoke & Fusion",detail:"AI temp control. Thai-BBQ fusion. Cuban-American brisket. $5.28B → $7B by 2030. The craft found new tools.",src:"BBQ Bible",url:"https://barbecuebible.com/2024/12/31/11-grilling-trends-for-2025/",pwr:8},
  {year:"2030+",era:"FRONTIER",code:"IG-021",title:"The Final Frontier",detail:"Orbital smokehouses. Zero-gravity bark. Mars-colony mesquite. Every era started with 'what if?' The trail ride never ends, pilot.",src:"BrisketBowls",url:null,pwr:100}
];

const ac={ORIGIN:'#ff4500',ANCIENT:'#e08040',CONTACT:'#f0c040','DE SOTO':'#cc8844',ENGLISH:'#aa9070',FOUNDING:'#ddaa55',REPUBLIC:'#dd7733',PITMASTER:'#bb5522',DIASPORA:'#ddbb88',EXPO:'#ccaa33','KC BBQ':'#dd8833','FORD ERA':'#998866','WPA ERA':'#aa8866','POST-WAR':'#889088',SUBURBAN:'#ddaa55',TEXAS:'#ff3300',KCBS:'#ffcc00',FRANKLIN:'#ff4444',PANDEMIC:'#cc7733',NOW:'#00ffcc',FRONTIER:'#aa44ff'};

// ─── BOOT ───
function BootSequence({onDone}){
  const [lines,setLines]=useState([]);
  const [progress,setProgress]=useState(0);
  const [phase,setPhase]=useState('init');
  const [started,setStarted]=useState(false);
  const ref=useRef(null);
  const idx=useRef(0);

  const begin=useCallback(async()=>{
    await initAudio();
    setStarted(true);
    setPhase('boot');
    startCrackle();
    let timeout;
    const add=()=>{
      if(idx.current>=bootLines.length){
        setTimeout(()=>setPhase('fade'),400);
        setTimeout(()=>onDone(),1200);
        return;
      }
      const line=bootLines[idx.current];
      setLines(p=>[...p,line.t]);
      setProgress(Math.round(((idx.current+1)/bootLines.length)*100));
      if(line.s==='b')playBoot();
      else if(line.s==='ok')playBootOK();
      else if(line.s==='logo')playBootLogo();
      else if(line.s==='done')playBootDone();
      idx.current++;
      timeout=setTimeout(add,line.d);
    };
    timeout=setTimeout(add,300);
    return()=>clearTimeout(timeout);
  },[onDone]);

  useEffect(()=>{if(ref.current)ref.current.scrollTop=ref.current.scrollHeight;},[lines]);

  if(!started)return(
    <div style={{position:'fixed',inset:0,zIndex:100,background:'#020406',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center'}}>
      <div style={{position:'absolute',inset:0,background:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,204,0.012) 2px,rgba(0,255,204,0.012) 3px)',pointerEvents:'none'}}/>
      <div style={{fontSize:'clamp(11px, 2vw, 14px)',fontFamily:'monospace',letterSpacing:6,color:'#00ffcc44',marginBottom:16}}>★ MECHA-PIT OS ★</div>
      <button onClick={begin} style={{padding:'14px 40px',fontSize:'clamp(14px, 2.5vw, 18px)',fontFamily:'monospace',letterSpacing:4,background:'#00ffcc0a',border:'1px solid #00ffcc44',color:'#00ffcc',cursor:'pointer',transition:'all .3s',position:'relative',overflow:'hidden'}}>
        <span style={{position:'relative',zIndex:1}}>ENGAGE SYSTEMS</span>
      </button>
      <div style={{fontSize:'clamp(11px, 1.8vw, 13px)',fontFamily:'monospace',color:'#00ffcc22',marginTop:12,letterSpacing:2}}>AUDIO REQUIRED · CLICK TO INITIALIZE</div>
    </div>
  );

  return(
    <div style={{position:'fixed',inset:0,zIndex:100,background:'#020406',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',
      opacity:phase==='fade'?0:1,transition:'opacity 0.8s ease-out',pointerEvents:phase==='fade'?'none':'all'}}>
      <style>{`@keyframes blinkcur{0%,50%{opacity:1}51%,100%{opacity:0}}`}</style>
      <div style={{position:'absolute',inset:0,background:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,204,0.012) 2px,rgba(0,255,204,0.012) 3px)',pointerEvents:'none'}}/>
      <div style={{width:'min(92vw,580px)',maxHeight:'70vh',position:'relative'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 12px',background:'#00ffcc08',borderBottom:'1px solid #00ffcc1a'}}>
          <span style={{fontSize:'clamp(11px, 1.8vw, 13px)',fontFamily:'monospace',color:'#00ffcc',letterSpacing:3}}>MECHA-PIT OS</span>
          <div style={{display:'flex',gap:5}}>{['#ff4444','#ffcc00','#00ffcc'].map((c,i)=><div key={i} style={{width:5,height:5,borderRadius:'50%',background:c,opacity:.4}}/>)}</div>
        </div>
        <div ref={ref} style={{padding:'10px 12px',fontFamily:'monospace',fontSize:'clamp(13px, 2.2vw, 16px)',lineHeight:1.7,color:'#00ffcc',maxHeight:'55vh',overflowY:'auto',background:'#020406'}}>
          {lines.map((l,i)=>(
            <div key={i} style={{color:l.startsWith('[OK')?'#00ffcc':l.startsWith('[SYS')?'#00ffcc77':l.includes('██')?'#ff4400':'#00ffcc55',whiteSpace:'pre',opacity:l.includes('██')?.65:1}}>{l}</div>
          ))}
          <span style={{animation:'blinkcur 1s step-end infinite'}}>▊</span>
        </div>
        <div style={{padding:'8px 12px',borderTop:'1px solid #00ffcc0d',background:'#020406'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
            <span style={{fontSize:'clamp(10px, 1.6vw, 12px)',fontFamily:'monospace',color:'#00ffcc55',letterSpacing:2}}>SYSTEM INIT</span>
            <span style={{fontSize:'clamp(10px, 1.6vw, 12px)',fontFamily:'monospace',color:'#00ffcc',letterSpacing:2}}>{progress}%</span>
          </div>
          <div style={{height:2,background:'#0a1510',borderRadius:1,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${progress}%`,background:'linear-gradient(90deg,#00ffcc33,#00ffcc)',transition:'width .3s',borderRadius:1}}/>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── COCKPIT ───
function CockpitHUD({sel,tab,muted,setMuted}){
  const [time,setTime]=useState('');
  useEffect(()=>{const t=setInterval(()=>{setTime(new Date().toLocaleTimeString('en-US',{hour12:false}));},1000);return()=>clearInterval(t);},[]);
  const cur=sel!==null?evts[sel]:null;
  const c=cur?ac[cur.era]:'#00ffcc';
  const ep=sel!==null?Math.round(((sel+1)/evts.length)*100):0;
  return(<>
    <div style={{position:'fixed',top:0,left:0,right:0,zIndex:10,height:34,background:'linear-gradient(180deg,#020406ee,#02040600)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 12px',borderBottom:'1px solid #00ffcc0d'}}>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <div style={{width:5,height:5,borderRadius:'50%',background:'#00ffcc',animation:'blink 2s infinite'}}/>
        <span style={{fontSize:'clamp(10px, 1.6vw, 12px)',fontFamily:'monospace',color:'#00ffcc77',letterSpacing:2}}>MECHA-PIT</span>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <button onClick={()=>{setMuted(m=>{if(!m){stopCrackle();}else{startCrackle();}return!m;});playClick();}}
          style={{background:'none',border:'none',cursor:'pointer',color:muted?'#ff444488':'#00ffcc66',padding:'0 4px',fontFamily:'monospace',fontSize:'clamp(11px, 1.8vw, 13px)'}}>{muted?'◉ MUTE':'◈ AUDIO'}</button>
        <span style={{fontSize:'clamp(10px, 1.6vw, 12px)',fontFamily:'monospace',color:'#00ffcc44'}}>{time}</span>
      </div>
    </div>
    <div style={{position:'fixed',left:0,top:38,bottom:32,width:36,zIndex:10,display:'flex',flexDirection:'column',justifyContent:'space-between',alignItems:'center',padding:'8px 0'}}>
      {[{l:'SMOKE',v:cur?cur.pwr:50,c},{l:'HEAT',v:cur?Math.min(100,cur.pwr+15):40,c:'#ff4400'},{l:'EPOCH',v:ep,c:'#aa44ff'}].map((b,i)=>(
        <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
          <span style={{fontSize:'clamp(9px, 1.2vw, 11px)',fontFamily:'monospace',color:b.c+'44',letterSpacing:1,writingMode:'vertical-rl',transform:'rotate(180deg)'}}>{b.l}</span>
          <div style={{width:4,height:52,background:'#0a1510',borderRadius:1,overflow:'hidden',position:'relative'}}>
            <div style={{position:'absolute',bottom:0,width:'100%',height:`${b.v}%`,background:`linear-gradient(0deg,${b.c}77,${b.c}18)`,transition:'all .5s',borderRadius:1}}/>
          </div>
        </div>
      ))}
    </div>
    <div style={{position:'fixed',right:6,top:38,width:48,height:48,zIndex:10}}>
      <svg viewBox="0 0 50 50" style={{width:'100%',height:'100%'}}>
        <circle cx="25" cy="25" r="21" fill="none" stroke="#00ffcc" strokeWidth=".3" opacity=".12"/>
        <circle cx="25" cy="25" r="13" fill="none" stroke="#00ffcc" strokeWidth=".2" opacity=".08"/>
        <line x1="25" y1="4" x2="25" y2="46" stroke="#00ffcc" strokeWidth=".15" opacity=".06"/>
        <line x1="4" y1="25" x2="46" y2="25" stroke="#00ffcc" strokeWidth=".15" opacity=".06"/>
        <line x1="25" y1="25" x2="25" y2="6" stroke="#00ffcc" strokeWidth=".4" opacity=".35">
          <animateTransform attributeName="transform" type="rotate" values="0 25 25;360 25 25" dur="4s" repeatCount="indefinite"/>
        </line>
        {sel!==null&&<circle cx={25+Math.cos(sel*.5)*11} cy={25+Math.sin(sel*.5)*11} r="1.5" fill={c} opacity=".5"><animate attributeName="opacity" values=".5;.15;.5" dur="1.5s" repeatCount="indefinite"/></circle>}
      </svg>
    </div>
    <div style={{position:'fixed',bottom:0,left:0,right:0,zIndex:10,height:30,background:'linear-gradient(0deg,#020406ee,#02040600)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 12px',borderTop:'1px solid #00ffcc0d'}}>
      <div style={{display:'flex',gap:12}}>
        {[{l:'CORE',v:'ONLINE',c:'#00ffcc'},{l:'OAK',v:'98%',c:'#ff8c00'},{l:'TEMP',v:'225°F',c:'#ff4444'}].map((s,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:4}}>
            <div style={{width:4,height:4,borderRadius:'50%',background:s.c,opacity:.4}}/>
            <span style={{fontSize:'clamp(10px, 1.4vw, 12px)',fontFamily:'monospace',color:s.c+'77',letterSpacing:1}}>{s.l}:{s.v}</span>
          </div>
        ))}
      </div>
      <span style={{fontSize:'clamp(10px, 1.4vw, 12px)',fontFamily:'monospace',color:c+'77',letterSpacing:1}}>{cur?`${cur.code}·${cur.era}`:tab==='news'?'UPLINK':tab==='log'?'PILOT LOG':'STANDBY'}</span>
    </div>
  </>);
}

// ─── MECHA SCENES ───
function MechaScene({era}){
  const color=ac[era]||'#00ffcc';
  const base=(<svg viewBox="0 0 400 120" style={{width:'100%',display:'block'}}>
    <rect width="400" height="120" fill="#050810"/>
    <defs><radialGradient id={`r${era}`} cx="50%" cy="50%"><stop offset="0%" stopColor={color} stopOpacity=".07"/><stop offset="100%" stopColor="#050810"/></radialGradient></defs>
    <rect width="400" height="120" fill={`url(#r${era})`}/>
    {Array.from({length:8}).map((_,i)=><line key={i} x1="0" y1={82+i*5} x2="400" y2={82+i*5} stroke={color} strokeWidth=".25" opacity={.05-i*.004}/>)}
    <circle cx="200" cy="52" r="26" fill="none" stroke={color} strokeWidth=".4" opacity=".1" strokeDasharray="3 5"><animateTransform attributeName="transform" type="rotate" values="0 200 52;360 200 52" dur="15s" repeatCount="indefinite"/></circle>
    <circle cx="200" cy="52" r="14" fill="none" stroke={color} strokeWidth=".3" opacity=".07" strokeDasharray="1 3"><animateTransform attributeName="transform" type="rotate" values="360 200 52;0 200 52" dur="10s" repeatCount="indefinite"/></circle>
    <line x1="170" y1="52" x2="178" y2="52" stroke={color} strokeWidth=".4" opacity=".18"/><line x1="222" y1="52" x2="230" y2="52" stroke={color} strokeWidth=".4" opacity=".18"/>
    <line x1="200" y1="22" x2="200" y2="30" stroke={color} strokeWidth=".4" opacity=".18"/><line x1="200" y1="74" x2="200" y2="82" stroke={color} strokeWidth=".4" opacity=".18"/>
    <g transform="translate(200,52)"><polygon points="0,-4 3.5,-2 3.5,2 0,4 -3.5,2 -3.5,-2" fill="none" stroke={color} strokeWidth=".5" opacity=".25"/></g>
    <text x="242" y="38" fontSize="5.5" fontFamily="monospace" fill={color} opacity=".2">{era}</text>
    {[0,1,2,3].map(i=><rect key={i} x={242} y={42+i*5} width={10+Math.sin(i*2.1)*12} height={2} rx={.5} fill={color} opacity={.06+Math.sin(i)*.04}/>)}
  </svg>);
  const custom={
    ORIGIN:(<svg viewBox="0 0 400 120" style={{width:'100%',display:'block'}}>
      <rect width="400" height="120" fill="#050810"/><defs><radialGradient id="ro" cx="50%" cy="68%"><stop offset="0%" stopColor="#ff4500" stopOpacity=".14"/><stop offset="100%" stopColor="#050810"/></radialGradient><filter id="fg"><feGaussianBlur stdDeviation="2"/></filter></defs><rect width="400" height="120" fill="url(#ro)"/>
      {Array.from({length:8}).map((_,i)=><line key={i} x1="0" y1={78+i*5} x2="400" y2={78+i*5} stroke="#ff4500" strokeWidth=".25" opacity={.06-i*.005}/>)}
      <g filter="url(#fg)">{[{x:200,s:1.3,d:1.5},{x:193,s:1,d:2},{x:207,s:1,d:1.8},{x:187,s:.7,d:2.3},{x:213,s:.7,d:2.5}].map((f,i)=>(<path key={i} d={`M${f.x},78 Q${f.x-7*f.s},${56-i*3} ${f.x},${44-i*3} Q${f.x+7*f.s},${56-i*3} ${f.x},78`} fill={i<2?'#ff4500':'#ff6b35'} opacity={.35-i*.05}><animate attributeName="d" values={`M${f.x},78 Q${f.x-7*f.s},${56-i*3} ${f.x},${44-i*3} Q${f.x+7*f.s},${56-i*3} ${f.x},78;M${f.x},78 Q${f.x-9*f.s},${50-i*3} ${f.x},${36-i*3} Q${f.x+9*f.s},${50-i*3} ${f.x},78;M${f.x},78 Q${f.x-7*f.s},${56-i*3} ${f.x},${44-i*3} Q${f.x+7*f.s},${56-i*3} ${f.x},78`} dur={`${f.d}s`} repeatCount="indefinite"/></path>))}</g>
      {[{x:196,d:2.5},{x:204,d:3},{x:200,d:3.5}].map((p,i)=><circle key={i} cx={p.x} r={1.2} fill="#ff4500" opacity="0"><animate attributeName="cy" values="46;10" dur={`${p.d}s`} repeatCount="indefinite"/><animate attributeName="opacity" values="0;.6;0" dur={`${p.d}s`} repeatCount="indefinite"/></circle>)}
      <circle cx="200" cy="55" r="22" fill="none" stroke="#ff4500" strokeWidth=".35" opacity=".1" strokeDasharray="2 4"/>
      <text x="238" y="28" fontSize="5.5" fontFamily="monospace" fill="#ff4500" opacity=".2">THERMAL_SIG</text>
    </svg>),
    TEXAS:(<svg viewBox="0 0 400 120" style={{width:'100%',display:'block'}}>
      <rect width="400" height="120" fill="#080406"/><defs><radialGradient id="rt" cx="50%" cy="50%"><stop offset="0%" stopColor="#ff3300" stopOpacity=".08"/><stop offset="100%" stopColor="#080406"/></radialGradient></defs><rect width="400" height="120" fill="url(#rt)"/>
      {Array.from({length:6}).map((_,i)=><line key={i} x1="0" y1={84+i*6} x2="400" y2={84+i*6} stroke="#ff3300" strokeWidth=".25" opacity=".05"/>)}
      <g transform="translate(200,50)" opacity=".65"><path d="M-38,20 L-38,-10 L-25,-10 L-25,-20 L25,-20 L25,-10 L38,-10 L38,20Z" fill="#ff330005" stroke="#ff3300" strokeWidth=".8"/><rect x="-16" y="-14" width="32" height="7" fill="#ff330008" stroke="#ff330028" strokeWidth=".4"/><text x="0" y="-9" textAnchor="middle" fontSize="4.5" fontFamily="monospace" fill="#ff3300" opacity=".5">KREUZ MKT</text>
        {[-18,18].map((x,i)=><g key={i}><rect x={x-1.5} y={-27} width={3} height={8} fill="none" stroke="#ff330044" strokeWidth=".5"/>
          {[0,1,2].map(j=><circle key={j} cx={x} r={1.2} fill="#ff3300" opacity="0"><animate attributeName="cy" values="-29;-48" dur={`${2+j*.5}s`} repeatCount="indefinite" begin={`${j*.6}s`}/><animate attributeName="opacity" values="0;.3;0" dur={`${2+j*.5}s`} repeatCount="indefinite" begin={`${j*.6}s`}/></circle>)}
        </g>)}
      </g>
      <g transform="translate(50,24)" opacity=".18"><polygon points="0,-8 2,-3 8,-3 3,1 5,7 0,4 -5,7 -3,1 -8,-3 -2,-3" fill="none" stroke="#ff3300" strokeWidth=".6"/></g>
    </svg>),
    FRANKLIN:(<svg viewBox="0 0 400 120" style={{width:'100%',display:'block'}}>
      <rect width="400" height="120" fill="#0a0406"/><defs><radialGradient id="rf" cx="50%" cy="50%"><stop offset="0%" stopColor="#ff4444" stopOpacity=".07"/><stop offset="100%" stopColor="#0a0406"/></radialGradient></defs><rect width="400" height="120" fill="url(#rf)"/>
      <g transform="translate(200,46)"><rect x="-55" y="-8" width="110" height="22" rx="1" fill="#ff444405" stroke="#ff4444" strokeWidth=".7"/><text x="0" y="5" textAnchor="middle" fontSize="11" fontFamily="monospace" fill="#ff4444" opacity=".65" letterSpacing="4">FRANKLIN</text><text x="0" y="12" textAnchor="middle" fontSize="4.5" fontFamily="monospace" fill="#ff4444" opacity=".3" letterSpacing="5">BARBECUE</text><text x="0" y="25" textAnchor="middle" fontSize="4.5" fontFamily="monospace" fill="#ff444455" opacity=".35">AUSTIN · JAMES BEARD 2015</text>
        {[-30,-15,0,15,30].map((x,i)=><circle key={i} cx={x} r={1} fill="#ff4444" opacity="0"><animate attributeName="cy" values="-14;-38" dur={`${3+i*.3}s`} repeatCount="indefinite"/><animate attributeName="opacity" values="0;.25;0" dur={`${3+i*.3}s`} repeatCount="indefinite"/></circle>)}
      </g>
      <circle cx="200" cy="46" r="35" fill="none" stroke="#ff4444" strokeWidth=".25" opacity=".06" strokeDasharray="2 4"><animateTransform attributeName="transform" type="rotate" values="0 200 46;360 200 46" dur="20s" repeatCount="indefinite"/></circle>
    </svg>),
    FRONTIER:(<svg viewBox="0 0 400 120" style={{width:'100%',display:'block'}}>
      <rect width="400" height="120" fill="#06040c"/><defs><radialGradient id="rfr" cx="50%" cy="50%"><stop offset="0%" stopColor="#aa44ff" stopOpacity=".08"/><stop offset="100%" stopColor="#06040c"/></radialGradient></defs><rect width="400" height="120" fill="url(#rfr)"/>
      {Array.from({length:30}).map((_,i)=><circle key={i} cx={Math.sin(i*7.3)*200+200} cy={Math.cos(i*5.1)*60+60} r={Math.random()*1+.2} fill="#fff" opacity={Math.random()*.2+.04}/>)}
      <g transform="translate(200,52)"><path d="M0,-26 L9,-7 L6,3 L15,10 L6,10 L3,19 L-3,19 L-6,10 L-15,10 L-6,3 L-9,-7Z" fill="#aa44ff05" stroke="#aa44ff" strokeWidth=".7" opacity=".45"/><circle cx="0" cy="-2" r="3.5" fill="none" stroke="#aa44ff" strokeWidth=".5" opacity=".25"/><circle cx="0" cy="-2" r="1.2" fill="#aa44ff" opacity=".2"/>
        {[-2,2].map((x,i)=><ellipse key={i} cx={x} cy={21} rx={2} ry={3.5} fill="#ff6600" opacity=".12"><animate attributeName="ry" values="3.5;6;3.5" dur={`${1.5+i*.3}s`} repeatCount="indefinite"/></ellipse>)}
      </g>
      <circle cx="315" cy="32" r="12" fill="#aa44ff05" stroke="#aa44ff1a" strokeWidth=".4"/><text x="315" y="52" textAnchor="middle" fontSize="4.5" fontFamily="monospace" fill="#aa44ff" opacity=".18">MARS</text>
      <ellipse cx="200" cy="55" rx="90" ry="14" fill="none" stroke="#aa44ff" strokeWidth=".18" opacity=".05" strokeDasharray="2 5"><animateTransform attributeName="transform" type="rotate" values="0 200 55;360 200 55" dur="30s" repeatCount="indefinite"/></ellipse>
    </svg>),
    NOW:(<svg viewBox="0 0 400 120" style={{width:'100%',display:'block'}}>
      <rect width="400" height="120" fill="#040808"/><defs><radialGradient id="rn" cx="50%" cy="50%"><stop offset="0%" stopColor="#00ffcc" stopOpacity=".05"/><stop offset="100%" stopColor="#040808"/></radialGradient></defs><rect width="400" height="120" fill="url(#rn)"/>
      <g transform="translate(200,48)"><rect x="-23" y="-14" width="46" height="34" rx="2" fill="#00ffcc04" stroke="#00ffcc" strokeWidth=".6" opacity=".45"/><rect x="-18" y="-9" width="36" height="18" rx="1" fill="#040808" stroke="#00ffcc28" strokeWidth=".3"/>
        {[9,14,20].map((r,i)=><path key={i} d={`M${-r/2},-19 Q0,${-19-r/2} ${r/2},-19`} fill="none" stroke="#00ffcc" strokeWidth=".5" opacity={.25-i*.06}><animate attributeName="opacity" values={`${.25-i*.06};.06;${.25-i*.06}`} dur={`${1.5+i*.3}s`} repeatCount="indefinite"/></path>)}
        <text x="0" y="1" textAnchor="middle" fontSize="6.5" fontFamily="monospace" fill="#00ffcc" opacity=".45">225°F</text>
        <text x="0" y="7" textAnchor="middle" fontSize="3.5" fontFamily="monospace" fill="#00ffcc" opacity=".2">AI·WiFi·IoT</text>
      </g>
    </svg>)
  };
  return <div style={{overflow:'hidden'}}>{custom[era]||base}</div>;
}

function HUDFrame({children,era,code,pwr}){
  const c=ac[era]||'#00ffcc';
  return(<div style={{position:'relative',background:'#040608',border:`1px solid ${c}1a`,overflow:'hidden'}}>
    {[[0,0,'top','left'],[0,0,'top','right'],[0,0,'bottom','left'],[0,0,'bottom','right']].map(([,,v,h],i)=>(
      <div key={i} style={{position:'absolute',[v]:0,[h]:0,width:12,height:12,[`border${v==='top'?'Top':'Bottom'}`]:`2px solid ${c}`,[`border${h==='left'?'Left':'Right'}`]:`2px solid ${c}`,opacity:.5}}/>
    ))}
    <div style={{position:'absolute',inset:0,background:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.005) 2px,rgba(255,255,255,0.005) 3px)',pointerEvents:'none',zIndex:2}}/>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 12px',borderBottom:`1px solid ${c}10`,background:`linear-gradient(90deg,${c}06,transparent,${c}06)`}}>
      <span style={{fontSize:'clamp(10px, 1.6vw, 12px)',fontFamily:'monospace',color:c,letterSpacing:2,opacity:.55}}>{code}</span>
      <div style={{display:'flex',alignItems:'center',gap:5}}><div style={{width:4,height:4,borderRadius:'50%',background:c,animation:'blink 2s infinite'}}/><span style={{fontSize:'clamp(10px, 1.4vw, 12px)',fontFamily:'monospace',color:c+'66',letterSpacing:1}}>PWR:{pwr}%</span></div>
    </div>{children}
  </div>);
}

function NewsCard({item,i}){
  return(<div style={{background:'#040608',border:'1px solid #00ffcc14',padding:'11px 13px',marginBottom:5,position:'relative',overflow:'hidden'}}>
    <div style={{position:'absolute',top:0,left:0,width:2,height:'100%',background:'#00ffcc',opacity:.2}}/>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
      <span style={{fontSize:'clamp(10px, 1.4vw, 12px)',fontFamily:'monospace',color:'#00ffcc',letterSpacing:3}}>FEED-{String(i+1).padStart(3,'0')}</span>
      <span style={{fontSize:'clamp(10px, 1.4vw, 12px)',fontFamily:'monospace',color:'#00ffcc33'}}>{item.date||''}</span></div>
    <div style={{fontSize:'clamp(15px, 2.5vw, 18px)',color:'#c8e0dc',marginBottom:3,lineHeight:1.4,fontFamily:"Georgia,serif"}}>{item.title}</div>
    <p style={{fontSize:'clamp(14px, 2.3vw, 16px)',color:'#4a6e68',lineHeight:1.6,margin:0,fontFamily:"Georgia,serif"}}>{item.summary}</p>
    {item.url&&<a href={item.url} target="_blank" rel="noopener noreferrer" style={{fontSize:'clamp(11px, 1.8vw, 13px)',fontFamily:'monospace',color:'#00ffcc',textDecoration:'none',marginTop:4,display:'inline-block',opacity:.35}}>OPEN →</a>}
  </div>);
}

// ─── PILOT LOG ───
function PilotLog(){
  const videoStyle:React.CSSProperties={
    width:'100%',height:'100%',objectFit:'cover',display:'block',borderRadius:'50%',
  };
  const bubbleWrap:React.CSSProperties={
    width:'clamp(180px,38vw,260px)',height:'clamp(180px,38vw,260px)',borderRadius:'50%',
    overflow:'hidden',position:'relative',flexShrink:0,
    border:'1px solid #00ffcc22',
    boxShadow:'0 0 28px #00ffcc0a, inset 0 0 18px #00000088',
  };
  const bubbleRing:React.CSSProperties={
    position:'absolute',inset:-3,borderRadius:'50%',
    background:'conic-gradient(from 0deg,#00ffcc08,#ff440008,#00ffcc08)',
    animation:'spin 12s linear infinite',zIndex:0,pointerEvents:'none',
  };
  return(
    <div style={{position:'relative',zIndex:2,maxWidth:680,margin:'0 auto',padding:'24px clamp(16px,5vw,50px) 60px',animation:'si .4s ease-out'}}>

      {/* ── header ── */}
      <div style={{textAlign:'center',marginBottom:32}}>
        <div style={{fontSize:'clamp(10px,1.6vw,12px)',fontFamily:'monospace',letterSpacing:5,color:'#00ffcc33',marginBottom:10}}>◈ FIELD NOTES FROM THE PIT ◈</div>
        <h2 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'clamp(26px,5.5vw,44px)',fontWeight:700,color:'#c8e0dc',letterSpacing:2,lineHeight:1.15,marginBottom:8}}>
          The Pilot's Story
        </h2>
        <div style={{width:60,height:1,background:'linear-gradient(90deg,transparent,#00ffcc38,transparent)',margin:'0 auto'}}/>
      </div>

      {/* ── bio paragraphs ── */}
      <div style={{fontFamily:"'IM Fell English',Georgia,serif",color:'#8aaea8',lineHeight:1.9,marginBottom:36,borderLeft:'2px solid #00ffcc12',paddingLeft:'clamp(14px,3vw,28px)'}}>
        <p style={{fontSize:'clamp(15px,2.6vw,19px)',marginBottom:18,color:'#b0cac4'}}>
          <em>Born in 1990. Smoking since 2002.</em> Some men find the flame — I was <em>born</em> into it.
          Twenty-two years at the pit, and every cook still teaches me something new.
        </p>
        <p style={{fontSize:'clamp(14px,2.4vw,17px)',marginBottom:18}}>
          It started on a humble Kettle Grill. Nothing fancy. Just charcoal, patience, and curiosity.
          That kettle became my proving ground — I ran everything through it. Burgers and links on
          weeknights, thick-cut steaks on Saturdays, shrimp and tilapia when the mood called for
          something lighter, salmon with a cedar plank, and whole trays of vegetables kissed by
          the fire until they caramelized into something unrecognizable from what went in.
        </p>
        <p style={{fontSize:'clamp(14px,2.4vw,17px)',marginBottom:18}}>
          The kettle taught me fire management — real fire management. No dial to turn, no
          digital readout to trust. Just vents, airflow, and the sound of the coals talking back
          to you. By the time I graduated to a proper smoker, I already understood the language.
        </p>
        <p style={{fontSize:'clamp(14px,2.4vw,17px)',marginBottom:0}}>
          Brisket is where the obsession crystallized. Low and slow, post oak smoke, a salt-and-pepper
          bark that bends before it breaks — that <em>bend bark test</em> never gets old.
          Every flat I pull off the smoker is a conversation between patience, temperature, and time.
          This site is my log of that conversation.
        </p>
      </div>

      {/* ── before / after ── */}
      <div style={{marginBottom:40}}>
        <div style={{fontSize:'clamp(10px,1.6vw,12px)',fontFamily:'monospace',letterSpacing:4,color:'#00ffcc44',textAlign:'center',marginBottom:16}}>◈ THE COOK ◈</div>
        <div style={{display:'flex',gap:'clamp(10px,3vw,20px)',flexWrap:'wrap',justifyContent:'center'}}>
          {[
            {src:'/assets/before.jpg',label:'PRE-COOK',sub:'Kettle & Gauge'},
            {src:'/assets/after.jpg', label:'POST-COOK',sub:'The Finished Product'},
          ].map(({src,label,sub})=>(
            <div key={label} style={{flex:'1 1 clamp(140px,40%,280px)',maxWidth:320}}>
              <div style={{border:'1px solid #00ffcc14',overflow:'hidden',position:'relative',background:'#040608'}}>
                <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:2,
                  background:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,204,0.012) 2px,rgba(0,255,204,0.012) 3px)'}}/>
                {[['top','left'],['top','right'],['bottom','left'],['bottom','right']].map(([v,h],i)=>(
                  <div key={i} style={{position:'absolute',[v]:0,[h]:0,width:10,height:10,
                    [`border${v==='top'?'Top':'Bottom'}`]:'2px solid #00ffcc44',
                    [`border${h==='left'?'Left':'Right'}`]:'2px solid #00ffcc44',zIndex:3}}/>
                ))}
                <img src={src} alt={sub} style={{width:'100%',display:'block',objectFit:'cover',maxHeight:220,filter:'brightness(.92) contrast(1.05)'}}
                  onError={(e)=>{(e.target as HTMLImageElement).style.display='none';}}/>
                <div style={{padding:'7px 10px',background:'#040608',borderTop:'1px solid #00ffcc0d',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:'clamp(10px,1.4vw,12px)',fontFamily:'monospace',color:'#00ffcc',letterSpacing:3,opacity:.55}}>{label}</span>
                  <span style={{fontSize:'clamp(10px,1.4vw,11px)',fontFamily:"'IM Fell English',serif",color:'#3a5450',fontStyle:'italic'}}>{sub}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── video bubbles ── */}
      <div style={{marginBottom:16}}>
        <div style={{fontSize:'clamp(10px,1.6vw,12px)',fontFamily:'monospace',letterSpacing:4,color:'#00ffcc44',textAlign:'center',marginBottom:24}}>◈ FROM THE PIT ◈</div>
        <div style={{display:'flex',gap:'clamp(20px,5vw,48px)',justifyContent:'center',flexWrap:'wrap',alignItems:'flex-start'}}>
          {[
            {src:'/assets/smokesetup.mp4',  label:'THE SETUP',   sub:'Post Oak · 225°F · Low & Slow'},
            {src:'/assets/bendbarktest.mp4', label:'BARK TEST',   sub:'The bend that tells all'},
          ].map(({src,label,sub})=>(
            <div key={label} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
              <div style={bubbleWrap}>
                <div style={bubbleRing}/>
                <video src={src} autoPlay loop muted playsInline style={videoStyle}
                  onError={(e)=>{(e.target as HTMLVideoElement).style.opacity='.15';}}/>
                <div style={{position:'absolute',inset:0,borderRadius:'50%',
                  boxShadow:'inset 0 0 24px #00000066, inset 0 0 6px #00ffcc08',pointerEvents:'none',zIndex:2}}/>
              </div>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:'clamp(10px,1.4vw,12px)',fontFamily:'monospace',color:'#00ffcc88',letterSpacing:3,marginBottom:2}}>{label}</div>
                <div style={{fontSize:'clamp(12px,2vw,14px)',fontFamily:"'IM Fell English',serif",color:'#3a5450',fontStyle:'italic'}}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── closing rule ── */}
      <div style={{textAlign:'center',marginTop:40}}>
        <div style={{width:60,height:1,background:'linear-gradient(90deg,transparent,#00ffcc18,transparent)',margin:'0 auto 12px'}}/>
        <p style={{fontFamily:"'IM Fell English',serif",fontSize:'clamp(13px,2.2vw,15px)',color:'#1e3230',fontStyle:'italic',letterSpacing:1}}>
          — Salt. Pepper. Time. —
        </p>
      </div>

    </div>
  );
}

// ─── MAIN ───
export default function App(){
  const [booted,setBooted]=useState(false);
  const [sel,setSel]=useState(null);
  const [stars,setStars]=useState([]);
  const [tab,setTab]=useState('history');
  const [muted,setMuted]=useState(false);
  const detRef=useRef(null);

  useEffect(()=>{setStars(Array.from({length:70},(_,i)=>({id:i,x:Math.random()*100,y:Math.random()*100,s:Math.random()*1.3+.3,o:Math.random()*.2+.03,d:Math.random()*6})));},[]);
  useEffect(()=>{if(sel!==null&&detRef.current){detRef.current.scrollIntoView({behavior:'smooth',block:'center'});}},[sel]);

  const handleSelect=useCallback((i)=>{
    setSel(prev=>{
      if(prev===i){playDeselect();playWhoosh();return null;}
      playSelect(i);playWhoosh();return i;
    });
  },[]);

  const handleTab=useCallback((k)=>{
    if(k===tab)return;
    playTabSwitch();playClick();
    setTab(k);
  },[tab]);


  // Cleanup audio on unmount
  useEffect(()=>()=>{stopCrackle();try{Tone.Transport.stop();}catch(e){}},[]);

  const ev=sel!==null?evts[sel]:null;
  const color=ev?ac[ev.era]:'#00ffcc';

  if(!booted)return <BootSequence onDone={()=>setBooted(true)}/>;

  return(
    <div style={{minHeight:'100vh',background:'#030508',color:'#b8ccc8',fontFamily:"Georgia,serif",position:'relative',overflow:'hidden'}}>
      {stars.map(s=><div key={s.id} style={{position:'fixed',left:`${s.x}%`,top:`${s.y}%`,width:s.s,height:s.s,borderRadius:'50%',background:'#fff',opacity:s.o,animation:`tw ${4+s.d}s ease-in-out infinite`,animationDelay:`${s.d}s`,pointerEvents:'none'}}/>)}
      <style>{`
        @keyframes tw{0%,100%{opacity:.03}50%{opacity:.3}}
        @keyframes blink{0%,100%{opacity:.2}50%{opacity:.6}}
        @keyframes scan{0%{top:-2px}100%{top:100%}}
        @keyframes si{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{box-shadow:0 0 3px #00ffcc44}50%{box-shadow:0 0 12px #00ffcc44}}
        .mc{transition:all .25s}.mc:hover{background:#080c12!important;border-color:#00ffcc28!important}
        @media(max-width:580px){
          .bb-card{width:100%!important;margin-left:0!important;margin-right:0!important;border-left:2px solid var(--bb-c,#00ffcc28)!important;border-right:none!important;}
          .bb-centerline,.bb-dot,.bb-scan{display:none!important;}
        }
      `}</style>

      <CockpitHUD sel={sel} tab={tab} muted={muted} setMuted={setMuted}/>

      <div style={{position:'relative',zIndex:2,padding:'40px clamp(16px,5vw,50px) 0',maxWidth:680,margin:'0 auto',textAlign:'center'}}>
        <div style={{fontSize:'clamp(10px, 1.6vw, 12px)',fontFamily:'monospace',letterSpacing:6,color:'#00ffcc33',marginBottom:6}}>★ GALACTIC BBQ INTELLIGENCE NETWORK ★</div>
        <h1 style={{fontSize:'clamp(22px, 5vw, 38px)',fontWeight:400,margin:'0 0 3px',color:'#c8e0dc',letterSpacing:5,fontFamily:'monospace',textShadow:'0 0 25px rgba(0,255,204,0.06)'}}>BRISKETBOWLS</h1>
        <div style={{width:45,height:1,background:'linear-gradient(90deg,transparent,#00ffcc28,transparent)',margin:'8px auto'}}/>
        <p style={{fontSize:'clamp(12px, 2vw, 14px)',color:'#3a5450',fontFamily:'monospace',letterSpacing:2,margin:'0 auto 12px'}}>SMOKE · FIRE · PATIENCE</p>
        <div style={{display:'flex',justifyContent:'center',gap:4}}>
          {[['history','◈ ARCHIVE'],['log','◈ PILOT LOG'],['news','◈ UPLINK']].map(([k,l])=>(
            <button key={k} onClick={()=>{handleTab(k);}}
              style={{padding:'8px 20px',fontSize:'clamp(12px, 2vw, 14px)',fontFamily:'monospace',letterSpacing:2,background:tab===k?'#00ffcc08':'transparent',border:`1px solid ${tab===k?'#00ffcc28':'#0c1412'}`,color:tab===k?'#00ffcc':'#1e3230',cursor:'pointer',transition:'all .3s'}}>{l}</button>
          ))}
        </div>
      </div>

      {tab==='history'&&(<div style={{position:'relative',zIndex:2,maxWidth:680,margin:'18px auto 0',padding:'0 clamp(16px,5vw,50px)'}}>
        <div className="bb-centerline" style={{position:'absolute',left:'50%',top:0,bottom:0,width:1,background:'linear-gradient(180deg,transparent,#00ffcc10 10%,#00ffcc10 90%,transparent)',transform:'translateX(-.5px)'}}/>
        <div className="bb-scan" style={{position:'absolute',left:'calc(50% - 2px)',top:0,width:5,height:1.5,background:'#00ffcc',borderRadius:1,opacity:.35,animation:'scan 6s linear infinite'}}/>
        {evts.map((e,i)=>{const isL=i%2===0,isS=sel===i,c=ac[e.era]||'#00ffcc';
          return(<div key={i} style={{position:'relative',marginBottom:3}}>
            <div className="bb-dot" style={{position:'absolute',left:'50%',top:14,transform:'translate(-50%,0) rotate(45deg)',zIndex:3,
              width:isS?10:5,height:isS?10:5,background:isS?c:'#060c0a',border:`1px solid ${isS?c:c+'28'}`,
              transition:'all .3s',animation:isS?'pulse 2s ease-in-out infinite':'none'}}/>
            <div className={`mc bb-card`} onClick={()=>handleSelect(i)} style={{
              '--bb-c':isS?c+'38':'#080e0c',
              width:'calc(50% - 24px)',marginLeft:isL?0:'auto',marginRight:isL?'auto':0,
              padding:'10px 12px',background:isS?'#080c12':'#040608',
              border:`1px solid ${isS?c+'38':'#080e0c'}`,cursor:'pointer',
              borderLeft:isL?`2px solid ${isS?c:c+'14'}`:'none',
              borderRight:!isL?`2px solid ${isS?c:c+'14'}`:'none'} as any}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:2}}>
                <span style={{fontSize:'clamp(10px, 1.4vw, 12px)',fontFamily:'monospace',color:c,letterSpacing:2,opacity:.5}}>{e.code}</span>
                <span style={{fontSize:'clamp(9px, 1.2vw, 11px)',fontFamily:'monospace',color:c+'55'}}>{e.era}</span></div>
              <div style={{fontSize:'clamp(10px, 1.6vw, 12px)',fontFamily:'monospace',color:'#304a46',marginBottom:2}}>{e.year}</div>
              <div style={{fontSize:'clamp(14px, 2.4vw, 17px)',color:'#a8beba'}}>{e.title}</div>
            </div>
          </div>);
        })}
      </div>)}

      {tab==='history'&&ev&&(
        <div ref={detRef} style={{position:'relative',zIndex:2,maxWidth:540,margin:'18px auto',padding:'0 clamp(16px,5vw,50px)',animation:'si .4s ease-out'}}>
          <HUDFrame era={ev.era} code={ev.code} pwr={ev.pwr}>
            <MechaScene era={ev.era}/>
            <div style={{padding:'14px 16px 16px'}}>
              <div style={{fontSize:'clamp(10px, 1.6vw, 12px)',fontFamily:'monospace',color,letterSpacing:3,opacity:.45,marginBottom:3}}>{ev.era} · {ev.year}</div>
              <div style={{fontSize:'clamp(18px, 3.5vw, 24px)',color:'#c8e0dc',marginBottom:8,letterSpacing:1}}>{ev.title}</div>
              <div style={{width:'100%',height:1,marginBottom:10,background:`linear-gradient(90deg,${color}22,transparent)`}}/>
              <p style={{fontSize:'clamp(14px, 2.5vw, 17px)',color:'#6a8e88',lineHeight:1.8,margin:'0 0 10px'}}>{ev.detail}</p>
              {ev.url?<a href={ev.url} target="_blank" rel="noopener noreferrer" style={{fontSize:'clamp(11px, 1.8vw, 13px)',fontFamily:'monospace',color,textDecoration:'none',opacity:.4}}>◈ {ev.src} →</a>:<span style={{fontSize:'clamp(11px, 1.8vw, 13px)',fontFamily:'monospace',color:'#1e3230'}}>◈ {ev.src}</span>}
            </div>
          </HUDFrame>
        </div>
      )}

      {tab==='log'&&<PilotLog/>}

      {tab==='news'&&(<div style={{position:'relative',zIndex:2,maxWidth:540,margin:'18px auto 0',padding:'0 clamp(16px,5vw,50px)'}}>
        <div style={{textAlign:'center',padding:'40px 24px'}}>
          <div style={{width:32,height:32,border:'1px solid #00ffcc18',borderTop:'1px solid #00ffcc44',borderRadius:'50%',margin:'0 auto 18px',opacity:.4}}/>
          <div style={{fontSize:'clamp(12px, 2vw, 14px)',fontFamily:'monospace',color:'#00ffcc',letterSpacing:4,marginBottom:8,opacity:.4}}>UPLINK OFFLINE</div>
          <div style={{fontSize:'clamp(14px, 2.4vw, 17px)',color:'#3a5450',fontFamily:'monospace',letterSpacing:2,marginBottom:4}}>LIVE BBQ INTEL</div>
          <div style={{fontSize:'clamp(12px, 2vw, 14px)',fontFamily:'monospace',color:'#1e3230',letterSpacing:3}}>COMING SOON, PILOT</div>
          <div style={{width:36,height:1,background:'linear-gradient(90deg,transparent,#00ffcc14,transparent)',margin:'18px auto 0'}}/>
        </div>
      </div>)}

      <div style={{position:'relative',zIndex:2,textAlign:'center',padding:'32px 24px',maxWidth:440,margin:'0 auto'}}>
        <div style={{width:36,height:1,background:'linear-gradient(90deg,transparent,#00ffcc14,transparent)',margin:'0 auto 12px'}}/>
        <p style={{fontSize:'clamp(10px, 1.6vw, 12px)',fontFamily:'monospace',color:'#102220',letterSpacing:3}}>LESS IS MORE · FIRE IS FOREVER</p>
        <p style={{fontSize:'clamp(10px, 1.4vw, 12px)',fontFamily:'monospace',color:'#080e0c',letterSpacing:3,marginTop:3}}>★ BRISKETBOWLS.COM ★</p>
      </div>
    </div>
  );
}
