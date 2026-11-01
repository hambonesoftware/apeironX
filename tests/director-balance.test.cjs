"use strict";
/* Deterministic wave-director balance simulation. No dependencies.
   The simulated threat strategies are models, not claims of real human play. */
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const assert=require("node:assert/strict");
const source=fs.readFileSync(path.join(__dirname,"..","arcade-director.js"),"utf8");
const sandbox=vm.createContext({window:{}});
vm.runInContext(source,sandbox);
const {create}=sandbox.window.ArcadeDirector;
const d=create({seed:1});
assert.equal(d.profile(1).cap,1);
assert.ok(d.profile(10).cap>d.profile(1).cap);
assert.ok(d.profile(10).budget>d.profile(1).budget);
d.start(1);
assert.equal(d.tick(1,{lives:3,critters:[],groups:[],PLAY_TOP:580}),null);
d.onDeath();
const safe=d.snapshot().respite;
assert.ok(safe>=4.5);
let early=0;
for(let i=0;i<12;i++) if(d.tick(.25,{lives:2,critters:[],groups:[],PLAY_TOP:580}))early++;
assert.equal(early,0,"Death must produce a recovery window");
function rng(seed) {
 let state=seed>>>0;
 return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;
  return state/4294967296;};
}
const runsPerStyle=1000, dt=.25, duration=135;
const profiles={
 calm:{killRate:1.55,lowerChance:.015,deathRisk:.007},
 average:{killRate:2.7,lowerChance:.03,deathRisk:.013},
 struggling:{killRate:4.3,lowerChance:.065,deathRisk:.024}
};
const report={};
for(const [name,p] of Object.entries(profiles)){
 let totalSpawns=0,totalDeaths=0,minutes=0,peak=0,capViolations=0,budgetViolations=0;
 let wave1=0,wave8=0,wave1Runs=0,wave8Runs=0,overlap=0;
 for(let match=0;match<runsPerStyle;match++){
  const wave=1+(match%10),rand=rng(match*19+name.length*1009);
  const director=create({seed:match*479+wave});
  director.start(wave);
  let active=[],lives=3,deaths=0,spawns=0,maxConcurrent=0,clock=0;
  const budget=director.profile(wave).budget,cap=director.profile(wave).cap;
  for(let i=0;i<duration/dt&&lives>0;i++){
   clock+=dt;
   active=active.filter(x=>(x.life-=dt)>0);
   // Higher waves create simulated lower-field pressure.
   const lower=rand()<p.lowerChance*wave/3?Math.ceil(rand()*3):0;
   const groups=[{segments:Array.from({length:lower},()=>({x:0,y:680}))}];
   const event=director.tick(dt,{lives,critters:active,groups,PLAY_TOP:580});
   if(event){
    spawns++;
    active.push({type:event.type,life:p.killRate+rand()*p.killRate});
    if(active.length>cap)capViolations++;
    if(spawns>budget)budgetViolations++;
   }
   maxConcurrent=Math.max(active.length,maxConcurrent);
   if(active.length>1)overlap+=dt;
   if(active.length+lower>=3 && rand()<p.deathRisk*dt*.5){
    lives--;deaths++;director.onDeath();
   }
  }
  totalSpawns+=spawns;totalDeaths+=deaths;minutes+=clock/60;
  peak=Math.max(peak,maxConcurrent);
  if(wave===1){wave1+=spawns;wave1Runs++}
  if(wave===8){wave8+=spawns;wave8Runs++}
 }
 report[name]={
  matches:runsPerStyle,
  spawnsPerMatch:Number((totalSpawns/runsPerStyle).toFixed(2)),
  deathsPerMatch:Number((totalDeaths/runsPerStyle).toFixed(2)),
  survivalMinutes:Number((minutes/runsPerStyle).toFixed(2)),
  wave1Spawns:Number((wave1/wave1Runs).toFixed(2)),
  wave8Spawns:Number((wave8/wave8Runs).toFixed(2)),
  peakSimultaneous:peak,capViolations,budgetViolations
 };
 assert.equal(capViolations,0);
 assert.equal(budgetViolations,0);
 assert.ok(peak<=5);
 assert.ok(wave8/wave8Runs>wave1/wave1Runs,
  "Late-wave pressure should rise over introductory waves");
}
console.log("PASS 3,000 deterministic encounter simulations with distinct bot strategies.");
console.log(JSON.stringify(report,null,2));
