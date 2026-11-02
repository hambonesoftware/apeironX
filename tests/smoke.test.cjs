"use strict";
/* Dependency-free smoke/regression tests for the GitHub Pages browser build. */
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const assert=require("node:assert/strict");
const root=path.join(__dirname,"..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const bonuses=fs.readFileSync(path.join(root,"apeiron-bonuses.js"),"utf8");
const art=fs.readFileSync(path.join(root,"art.js"),"utf8");
const living=fs.readFileSync(path.join(root,"living-patch.js"),"utf8");
const director=fs.readFileSync(path.join(root,"arcade-director.js"),"utf8");
const scores=fs.readFileSync(path.join(root,"arcade-scores.js"),"utf8");
assert.match(html,/living-patch\.js\?v=/);
assert.match(html,/apeiron-bonuses\.js\?v=/);
assert.match(html,/\.life-row\{[^}]*height:21px/);
assert.match(html,/overscroll-behavior:none/);
const inline=html.match(/<script>\s*([\s\S]*?)<\/script>/);
assert.ok(inline,"Game code must be present");
const init="living.reset(1);seedMushrooms();createPentipede();syncHud();requestAnimationFrame(loop);";
assert.ok(inline[1].includes(init),"Game startup not found");
const instrumented=inline[1].replace(init,init+
 "\nwindow.__test={resetGame,nextWave,update,render,shoot,applyPickup,addMushroom,hitMushroom,enemyHit,updateGroups,updateShots,updatePickups,loseLife,spawnCritter,addPickup,inspect:()=>({mode,wave,score,groups,mushrooms,player,shots,pickups,critters,lives,bonus,multiplier}),living};");
const gradient={addColorStop(){}};
const data={};
const g=new Proxy(data,{get(obj,key){
 if(key==="createRadialGradient"||key==="createLinearGradient")return ()=>gradient;
 if(typeof key==="symbol")return undefined;
 return obj[key]||(obj[key]=()=>{});
},set(obj,key,value){obj[key]=value;return true;}});
const canvas={width:720,height:760,getContext:()=>g,addEventListener(){},
 getBoundingClientRect(){return {left:0,top:0,width:720,height:760};},
 setPointerCapture(){}};
const nodes={};
const getNode=id=>nodes[id]||(nodes[id]={
 style:{},textContent:"",innerHTML:"",offsetWidth:100,
 classList:{add(){},remove(){}},addEventListener(){}
});
const document={createElement(tag){return tag==="canvas"?canvas:getNode(tag);},
 getElementById(id){return id==="game"?canvas:getNode(id);},
 addEventListener(){}};
const window={addEventListener(){}};
const localStorage={getItem(){return null;},setItem(){}};
const sandbox=vm.createContext({window,document,localStorage,console,Math,Date,
 requestAnimationFrame(){},performance:{now(){return 0;}}});
for(const [filename,source] of [["apeiron-bonuses.js",bonuses],["art.js",art],["living-patch.js",living],["arcade-director.js",director],["arcade-scores.js",scores],["index-inline.js",instrumented]]){
 vm.runInContext(source,sandbox,{filename,timeout:15000});
}
const t=window.__test;
assert.ok(t);
t.resetGame();
let st=t.inspect();
assert.equal(st.mode,"playing");
assert.equal(st.lives,3);
assert.equal(st.groups.length,1);
assert.ok(st.mushrooms.length>60);
assert.ok(st.mushrooms.some(m=>m.kind==="reflector"));
t.applyPickup({type:"guided",x:350,y:680});
t.shoot();
st=t.inspect();
assert.ok(st.player.guided>0);
assert.ok(st.shots.some(shot=>shot.guided));
const shot={x:200,y:200,vx:0,vy:-600,life:1,reflectWait:0,bounces:0};
assert.equal(t.living.reflectShot(shot,{kind:"reflector",x:200,y:200}),true);
assert.equal(shot.bounces,1);
t.applyPickup({type:"ricochet",x:350,y:680});
assert.ok(t.inspect().player.ricochet>0);
for(let i=0;i<20;i++)t.applyPickup({type:"life",x:350,y:680});
assert.equal(t.inspect().lives,8,"Life cap must match the original eight");
let m=t.inspect().mushrooms[0];
m.hp=1;
t.hitMushroom(0);
assert.ok(t.living.metrics().falling>0);
const flying={x:m.x,y:m.y,vx:0,vy:-700,life:1};
t.living.update(.2);
const falling=t.living.metrics().falling;
assert.ok(falling>0);
const magic={x:350,y:250,kind:"magic",variant:0,hp:1};
st=t.inspect();
st.mushrooms.push(magic);
t.hitMushroom(st.mushrooms.length-1);
assert.ok(t.inspect().player.frenzy>0);
st=t.inspect();
const poison={kind:"toxic",x:170,y:330};
assert.equal(t.living.poisonTurn(st.groups[0],poison),true);
assert.equal(st.groups[0].dive,true);
// Official Ambrosia-inspired yummies: coil shots, diamond, rapid fire, lock and coins.
t.resetGame();
let yummy=t.inspect();
t.applyPickup({type:"rapid",x:350,y:680});
t.applyPickup({type:"guided",x:350,y:680});
t.applyPickup({type:"ghost",x:350,y:680});
assert.equal(yummy.player.rapid,Infinity);
assert.equal(yummy.player.guided,Infinity);
assert.equal(yummy.player.ghost,Infinity);
yummy.player.inv=0;
t.loseLife();
assert.equal(t.inspect().player.rapid,0,"Unprotected yummy should be lost on death");
assert.equal(t.inspect().player.ghost,0);
t.resetGame();yummy=t.inspect();
for(const type of ["rapid","guided","ghost","lock"])t.applyPickup({type,x:350,y:680});
assert.equal(yummy.player.lock,true);
yummy.player.inv=0;
t.loseLife();
assert.ok(yummy.player.rapid>0&&yummy.player.guided>0&&yummy.player.ghost>0,"Yummy Lock must preserve weapon and diamond powers");
assert.equal(t.inspect().lives,2);
t.resetGame();yummy=t.inspect();
t.applyPickup({type:"shield",x:350,y:680});
yummy.player.inv=0;
t.loseLife();
assert.equal(t.inspect().lives,3,"Sprinkly shield must grant invulnerability");
assert.ok(yummy.player.shield>0,"Shield should remain active after deflecting a hit");
t.resetGame();yummy=t.inspect();
yummy.mushrooms.splice(0);
yummy.mushrooms.push({kind:"normal",x:230,y:707,hp:2,variant:0});
yummy.player.x=200;yummy.player.y=700;
yummy.player.tx=230;yummy.player.ty=700;
t.update(.05);
assert.ok(yummy.player.x<220,"Mushrooms should obstruct the unpowered crystal");
t.applyPickup({type:"ghost",x:350,y:680});
t.update(.05);
assert.ok(yummy.player.x>=229,"Diamond yummy must let crystal pass through mushrooms");
t.resetGame();yummy=t.inspect();
yummy.mushrooms.splice(0);
t.addPickup(350,500,"guided");
const coin=yummy.pickups[0];
coin.vx=0;coin.vy=0;
yummy.shots.push({x:350,y:519,vx:0,vy:-880,life:1,bounces:0,reflectWait:0});
t.updateShots(.03);
assert.equal(yummy.pickups.length,1,"Shooting a yummy coin must NOT collect it");
assert.ok(coin.vy<0,"Shot yummy coin must bounce away");
assert.equal(yummy.player.guided,0);
t.resetGame();yummy=t.inspect();
t.applyPickup({type:"multiplier",x:350,y:500});
assert.equal(yummy.multiplier,2);
t.render();
assert.equal(yummy.player.lock,false,"Lock should clear between new runs");

t.resetGame();
t.enemyHit(0,4);
assert.equal(t.inspect().groups.length,2,"Segment shot must split the Pentipede");
st=t.inspect();
st.groups[0].segments[0].y=st.groups[0].segments[0].prevY=730;
st.groups[0].lower=true;
const before=st.groups.length;
t.living.checkTouchdowns(.016);
assert.ok(t.inspect().groups.length>before,"Touchdown should create a side attacker");
st=t.inspect();
const old=st.mushrooms.length;
st.mushrooms.push({kind:"normal",x:200,y:710,hp:2,variant:0});
t.living.pickup("cleanse",200,710);
assert.ok(st.mushrooms.length<=old);
for(let i=0;i<1200;i++)t.update(1/60);
t.render();
st=t.inspect();
assert.ok(st.groups.every(group=>group.segments.every(s=>Number.isFinite(s.x)&&Number.isFinite(s.y))));
assert.ok(st.mushrooms.length<=265);
assert.ok(st.lives>=0&&st.lives<=8);
console.log("PASS Apeiron X v0.4: sprites, guided/ricochet, life cap, falling mushrooms, magic, poison, splitting, touchdown, cleanup and 1,200-frame render.");
