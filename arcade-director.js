/* Apeiron X v0.5 — deterministic, budgeted arcade wave director.
   Handles composition and pacing; does not own game physics or rendering. */
(function (global) {
  "use strict";
  const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
  function create(options={}) {
    let seed=(Number(options.seed)||0x5A17C0DE)>>>0;
    const random=()=>{
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;
      return seed/4294967296;
    };
    let wave=1,elapsed=0,nextAt=6.4,spawns=0,deaths=0,kills=0;
    let respite=0,pressure=0,lastType="",lastSpawnAt=-100;
    let gapSum=0,peakThreat=0,rejected=0,phase="opening";
    const roles=["flea","gecko","scobster","ufo"];
    function profile(w) {
      const level=Math.max(1,Math.floor(w));
      return {
        level,
        title:level<=2?"The Opening":level<=4?"The Swarm":level<=7?"Poison Garden":level<=10?"Frenzy":"Survival",
        budget:Math.min(15,2+Math.floor(level*.84)),
        cap:Math.min(5,level<=2?1:level<=4?2:2+Math.floor(level/4)),
        opening:Math.max(2.4,6.5-Math.min(3,level*.38)),
        interval:Math.max(3.15,9.7-level*.46),
        difficulty:clamp((level-1)/15,0,1)
      };
    }
    function start(w=1, carry={}) {
      wave=Math.max(1,Math.floor(w));elapsed=0;spawns=0;deaths=0;kills=0;
      pressure=0;peakThreat=0;gapSum=0;rejected=0;phase="opening";
      lastType="";lastSpawnAt=-100;respite=0;
      nextAt=profile(wave).opening;
      if(carry.deaths)respite=Math.min(6,Number(carry.deaths)*.8);
    }
    function onDeath() {
      deaths++;respite=Math.max(respite,4.5);
      pressure=Math.max(0,pressure-.26);
      nextAt=Math.max(nextAt,elapsed+3.2);
    }
    function onKill() {
      kills++;
      pressure=clamp(pressure+.012,0,1);
    }
    function onPower() {
      respite=Math.max(respite,1.1);
    }
    function sampleThreat(state) {
      const critters=state.critters||[];
      const groups=state.groups||[];
      const bottom=Number(state.PLAY_TOP)||580;
      let lower=0,segments=0;
      for(const group of groups){
        segments+=group.segments.length;
        for(const seg of group.segments) if(seg.y>=bottom-12)lower++;
      }
      return {
        lower,
        segments,
        count:critters.length,
        // Normalized pressure tracks danger, not total graphic objects.
        value:critters.length*.48+lower*.37+Math.min(segments,18)*.035
      };
    }
    function chooseType() {
      const p=profile(wave);
      let choices;
      if(wave===1)choices=["flea","flea","gecko"];
      else if(wave===2)choices=["flea","gecko","gecko","scobster"];
      else if(wave<=4)choices=["gecko","flea","scobster","gecko","ufo"];
      else if(wave<=7)choices=["scobster","gecko","ufo","flea","scobster"];
      else choices=roles.concat(["ufo","scobster"]);
      let index=Math.floor(random()*choices.length);
      if(choices[index]===lastType && choices.length>2)
        index=(index+1+Math.floor(random()*(choices.length-1)))%choices.length;
      const choice=choices[index];lastType=choice;
      return choice;
    }
    function tick(dt,state={}) {
      if(!Number.isFinite(dt)||dt<=0)return null;
      const step=clamp(dt,0,.1);
      elapsed+=step;
      respite=Math.max(0,respite-step);
      const cfg=profile(wave), threat=sampleThreat(state);
      peakThreat=Math.max(peakThreat,threat.value);
      if(spawns>=cfg.budget) {
        phase="cleanup";
        return null;
      }
      if(elapsed<nextAt) {
        phase=elapsed<cfg.opening?"opening":respite>0?"recovery":"combat";
        return null;
      }
      if(respite>0||threat.count>=cfg.cap||threat.value>2.8+cfg.difficulty*1.2||
        (Number(state.lives)||3)<=1 && threat.lower>=3){
        rejected++;
        // No random rerolls every frame: postpone deliberately until fair.
        nextAt=elapsed+.58;
        phase="recovery";
        return null;
      }
      const type=chooseType();
      const safeGap=cfg.interval*(1+Math.min(.85,threat.value*.21))*(state.lives<=1?1.2:1);
      const variance=.83+random()*.37;
      gapSum+=elapsed-lastSpawnAt;
      lastSpawnAt=elapsed;
      spawns++;
      phase="combat";
      nextAt=elapsed+safeGap*variance;
      return {type,wave,number:spawns,total:cfg.budget,title:cfg.title};
    }
    function snapshot() {
      const cfg=profile(wave);
      return {
        wave,elapsed,phase,spawns,budget:cfg.budget,cap:cfg.cap,
        deaths,kills,peakThreat,rejected,nextAt,respite,
        remaining:Math.max(0,cfg.budget-spawns),
        averageGap:spawns>1?(gapSum-cfg.opening)/(spawns-1):0,
        title:cfg.title
      };
    }
    start(1);
    return {start,tick,profile,snapshot,onDeath,onKill,onPower,sampleThreat};
  }
  global.ArcadeDirector={create};
})(window);
