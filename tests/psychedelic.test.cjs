"use strict";
/* Psychedelic frenzy unit tests: visual-only, paused/reduced-motion safe. */
const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path"),assert=require("node:assert/strict");
const file=fs.readFileSync(path.join(__dirname,"..","psychedelic-fx.js"),"utf8");
const window={};
vm.runInNewContext(file,{window,Math}, {filename:"psychedelic-fx.js"});
assert.ok(window.ApeironPsychedelic,"FX library must export create()");
const classes=new Set();
const field={classList:{
 toggle(name,on){if(on)classes.add(name);else classes.delete(name);}
}};
let prefersReduced=false,strokeCount=0,fillCount=0;
const ctx=new Proxy({
 save(){},restore(){},beginPath(){},arc(){},ellipse(){},
 stroke(){strokeCount++;},fill(){fillCount++;},
 createRadialGradient(){return {addColorStop(){}}}
},{
 get(obj,key){if(typeof key==="symbol")return undefined;return key in obj?obj[key]:undefined;},
 set(obj,key,value){obj[key]=value;return true;}
});
const fx=window.ApeironPsychedelic.create({
 field,width:720,height:760,
 reduceMotion:()=>prefersReduced,
 position:(group,index)=>group.segments[index]
});
let snap=fx.state();
assert.equal(snap.active,false);
assert.equal(snap.amount,0);
fx.fieldLayer(ctx);
assert.equal(fillCount,0,"Inactive FX may not draw");
fx.update(1/60,8,true);
snap=fx.state();
assert.equal(snap.active,true);
assert.equal(snap.pulses,1);
assert.ok(classes.has("is-psychedelic"));
assert.ok(snap.amount>0);
for(let i=0;i<20;i++)fx.update(1/60,8-i/60,true);
assert.ok(fx.state().amount>.99);
const fullTime=fx.state().elapsed;
const state={
 mushrooms:Array.from({length:120},(_,i)=>({x:i*5%700,y:60+i*5})),
 groups:[{segments:[{x:50,y:100},{x:80,y:100}]}],
 critters:[{x:200,y:300}],
 pickups:[{x:600,y:400}],
 player:{x:360,y:701}
};
fx.fieldLayer(ctx);
fx.mushroomAuras(ctx,state.mushrooms);
fx.highlight(ctx,state);
fx.finale(ctx);
assert.ok(fillCount>=6,"Animated field should render spectral light pools");
assert.ok(strokeCount>15,"Auras and mandalas should be visible");
const colored=fx.shotColor({x:350},2);
assert.match(colored,/^hsla\(/);
fx.update(1/60,8,true);
assert.equal(fx.state().pulses,1,"Continuous frenzy must not retrigger");
fx.update(1/30,8,false);
assert.ok(classes.has("psy-paused"));
assert.equal(fx.state().elapsed,fullTime+1/60,"Paused mode must freeze effect clock");
fx.update(1/30,8,true);
assert.ok(!classes.has("psy-paused"));
prefersReduced=true;
fx.update(1/60,8,true);
assert.ok(classes.has("psy-reduced"));
const oldFills=fillCount;
fx.fieldLayer(ctx);
assert.equal(fillCount-oldFills,3,"Reduced-motion palette uses only three static field lights");
for(let i=0;i<24;i++)fx.update(1/60,0,true);
assert.equal(fx.state().amount,0);
assert.equal(fx.state().active,false);
assert.ok(!classes.has("is-psychedelic"));
assert.equal(fx.shotColor({x:350}),null);
fx.update(1/60,6,true);
assert.equal(fx.state().pulses,2,"Second mushroom must retrigger a fresh frenzy");
fx.reset();
snap=fx.state();
assert.equal(snap.active,false);
assert.equal(snap.pulses,0);
assert.ok(!classes.has("is-psychedelic"));
const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
assert.ok(html.includes("psychedelic-fx.js?v="));
assert.ok(html.includes("psy.fieldLayer(ctx)"));
assert.ok(html.includes("psy.mushroomAuras(ctx,mushrooms)"));
assert.ok(html.includes("psy.highlight(ctx,"));
assert.ok(html.includes("psy.shotColor(s,i)"));
console.log("PASS psychedelic field and entity auras, rainbow plasma, fade-out, retrigger, reduced motion, pause and reset.");
