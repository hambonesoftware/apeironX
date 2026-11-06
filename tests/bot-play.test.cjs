"use strict";
/* Headless game-loop playtesting, not a substitute for actual human/iPhone testing. */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.join(__dirname,"..");
const files=["apeiron-bonuses.js","art.js","living-patch.js","psychedelic-fx.js","arcade-director.js","arcade-scores.js"];
const code=files.map(file=>[file,fs.readFileSync(path.join(root,file),"utf8")]);
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const inline=html.match(/<script>\s*([\s\S]*?)<\/script>/);
assert.ok(inline);
const start="living.reset(1);seedMushrooms();createPentipede();syncHud();requestAnimationFrame(loop);";
assert.ok(inline[1].includes(start));
const script=inline[1].replace(start,start+ "\nwindow.__playTest={resetGame,update,tickBetween,shoot,render,inspect:()=>({mode,score,lives,wave,player,groups,critters,pickups,mushrooms,shots,elapsed})};");
const context=new Proxy({},{
 get(obj,key){
  if(key==="createLinearGradient"||key==="createRadialGradient")return ()=>({addColorStop(){}});
  if(typeof key==="symbol")return undefined;
  return obj[key]||(obj[key]=()=>{});
 },
 set(obj,key,value){obj[key]=value;return true;}
});
const canvas={width:720,height:760,getContext:()=>context,addEventListener(){},
 getBoundingClientRect(){return {left:0,top:0,width:720,height:760}},setPointerCapture(){}};
const nodes={};
const makeNode=id=>nodes[id]||(nodes[id]={style:{},textContent:"",innerHTML:"",value:"ACE",
 offsetWidth:10, classList:{add(){},remove(){}},addEventListener(){},appendChild(){}});
const document={createElement(tag){return tag==="canvas"?canvas:makeNode(tag)},
 getElementById(id){return id==="game"?canvas:makeNode(id)},addEventListener(){}};
const window={addEventListener(){}};
const storage=new Map();
const localStorage={getItem(k){return storage.get(k)||null},setItem(k,v){storage.set(k,v)}};
function seeded(seed){
 let a=seed>>>0;const m=Object.create(Math);
 m.random=()=>{a=(Math.imul(a,1664525)+1013904223)>>>0;return a/4294967296};
 return m;
}
const report={guard:[],sweep:[],stationary:[]};
for(let n=0;n<36;n++){
 const style=["guard","sweep","stationary"][n%3];
 const windowThis={...window,addEventListener(){}};
 const sandbox=vm.createContext({window:windowThis,document,localStorage,
   Math:seeded(0x200041+n*17),Date,console,performance:{now(){return 0}},requestAnimationFrame(){}});
 for(const [file,src] of code)vm.runInContext(src,sandbox,{filename:file,timeout:30000});
 vm.runInContext(script,sandbox,{filename:"game-inline",timeout:30000});
 const game=windowThis.__playTest;
 assert.ok(game);
 game.resetGame();
 let highest=1,maxShots=0,maxCritters=0,frames=0,score=0;
 const dt=1/30;
 for(let i=0;i<3000;i++){
  const s=game.inspect();
  if(s.mode==="over")break;
  if(s.mode==="between"){game.tickBetween(dt);continue}
  assert.equal(s.mode,"playing");
  const p=s.player;
  if(style==="guard"){
   const low=s.groups.flatMap(g=>g.segments).sort((a,b)=>b.y-a.y);
   p.tx=low.length?low[0].x:360;
   p.ty=699;
  }else if(style==="sweep"){
   p.tx=360+Math.sin(i*dt*1.55)*280;
   p.ty=700;
  }else {p.tx=360;p.ty=700}
  if(style!=="stationary")game.shoot();
  game.update(dt);
  frames++;
  const next=game.inspect();
  assert.ok(Number.isFinite(next.score)&&Number.isFinite(next.player.x)&&Number.isFinite(next.player.y));
  assert.ok(next.groups.every(g=>g.segments.every(a=>Number.isFinite(a.x)&&Number.isFinite(a.y))));
  assert.ok(next.lives>=0&&next.lives<=8);
  maxShots=Math.max(maxShots,next.shots.length);
  maxCritters=Math.max(maxCritters,next.critters.length);
  highest=Math.max(highest,next.wave);score=next.score;
 }
 report[style].push({seconds:Number((frames*dt).toFixed(1)),
  highest,score,maxShots,maxCritters});
}
const summary={};
for(const [style,rows] of Object.entries(report)){
 summary[style]={games:rows.length,
  meanSeconds:Number((rows.reduce((n,r)=>n+r.seconds,0)/rows.length).toFixed(1)),
  meanScore:Math.round(rows.reduce((n,r)=>n+r.score,0)/rows.length),
  bestWave:Math.max(...rows.map(r=>r.highest)),
  peakCritters:Math.max(...rows.map(r=>r.maxCritters))};
 assert.equal(rows.length,12);
 assert.ok(summary[style].peakCritters<=5);
}
console.log("PASS 36 seeded headless game-loop playtests across three strategies, 30 Hz, 100-second maximum.");
console.log(JSON.stringify(summary,null,2));
