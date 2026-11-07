"use strict";
/* Deterministic standalone tests for independently-authored 1995 Apeiron yummies. */
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const assert=require("node:assert/strict");
const source=fs.readFileSync(path.join(__dirname,"..","apeiron-bonuses.js"),"utf8");
const window={};
vm.runInNewContext(source,{window,Math});
const Y=window.ApeironBonuses;
assert.ok(Y);
const expected=["guided","ghost","rapid","shield","lock","cleanse","life"];
assert.deepEqual(Array.from(Y.COINS,x=>x.type),expected);
assert.ok(!Y.COINS.some(x=>["nuke","magnet","laser","spread","ricochet","multiplier"].includes(x.type)),
 "Only documented original coin powers belong in the regular coin pool");
const c=Y.COINS.map(x=>x.weight);
const total=c.reduce((x,y)=>x+y,0);
assert.equal(total,100);
let sum=0;
for(let i=0;i<c.length;i++){
 assert.equal(Y.select(()=>sum/total),expected[i]);sum+=c[i];
}
assert.equal(Y.select(()=>1),"life","Random upper boundary stays valid");
const coin={x:230,y:280,vx:2,vy:0,bounces:0};
Y.shotCoin(coin,{x:230,vx:0,vy:-750});
assert.ok(coin.vy < -200&&coin.shotCooldown>0&&coin.bounces===1);
assert.ok(!Y.blocker(200,701,[],580));
assert.ok(Y.blocker(230,700,[{x:230,y:707}],580));
assert.ok(!Y.blocker(230,700,[{x:230,y:300}],580));
const player={rapid:Infinity,guided:Infinity,ghost:Infinity,spread:0,ricochet:0,shield:12,frenzy:8,lock:false};
Y.keepOnDeath(player);
assert.equal(player.rapid,0);
assert.equal(player.guided,0);
assert.equal(player.ghost,0);
player.lock=true;player.rapid=Infinity;player.guided=Infinity;player.ghost=Infinity;player.shield=6;
assert.equal(Y.keepOnDeath(player),true);
assert.equal(player.rapid,Infinity);
assert.equal(player.guided,Infinity);
assert.equal(player.ghost,Infinity);
assert.equal(player.shield,0);
player.lockTime=10;
assert.ok(Y.powerText(player).some(text=>text.startsWith("LOCKED 10s")));
let counts=Object.fromEntries(expected.map(x=>[x,0]));
let state=18444;
for(let k=0;k<10000;k++){
 state=(Math.imul(state,1664525)+1013904223)>>>0;
 counts[Y.select(()=>state/4294967296)]++;
}
assert.equal(Object.values(counts).reduce((a,b)=>a+b,0),10000);
assert.ok(Object.values(counts).every(x=>x>600),"every yummy remains attainable");
console.log("PASS Ambrosia yummies: 7 original coin types, ballistics, diamond, lock, shield and 10,000 deterministic reward draws.");
