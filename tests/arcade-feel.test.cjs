"use strict";
/* Arcade-feel regression tests: real pointer event callbacks, immediate aim,
   thumb-relative mobile movement, first-frame firing and shot/contact priority. */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.join(__dirname,"..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const code=html.match(/<script>\s*([\s\S]*?)<\/script>/);
assert.ok(code,"Inline game engine missing");
const boot="living.reset(1);seedMushrooms();createPentipede();syncHud();requestAnimationFrame(loop);";
assert.ok(code[1].includes(boot));
const injected=code[1].replace(boot,boot+
 "\nwindow.__feel={resetGame,update,shoot,drawShots,inspect:()=>({mode,player,shots,critters,mushrooms,groups,lives,shotTimer,firing})};");
const gradients={addColorStop(){}};
const strokes=[];
const canvasCtx=new Proxy({
 beginPath(){this.lastA=null;this.lastB=null;},
 moveTo(x,y){this.lastA={x,y};},
 lineTo(x,y){this.lastB={x,y};},
 stroke(){
  if(this.lastA&&this.lastB)strokes.push({a:this.lastA,b:this.lastB,color:this.strokeStyle});
 }
},{
 get(obj,k){
  if(k==="createRadialGradient"||k==="createLinearGradient")return ()=>gradients;
  if(typeof k==="symbol")return undefined;
  return k in obj?obj[k]:(obj[k]=()=>{});
 },
 set(obj,k,v){obj[k]=v;return true}
});
const canvasEvents={},windowEvents={},docEvents={};
const canvas={
 width:720,height:760,getContext(){return canvasCtx;},
 addEventListener(type,fn){canvasEvents[type]=fn;},
 getBoundingClientRect(){return {left:0,top:0,width:720,height:760}},
 setPointerCapture(){}
};
const els={};
function element(id){return els[id]||(els[id]={
 style:{},textContent:"",innerHTML:"",value:"ACE",offsetWidth:10,
 classList:{add(){},remove(){}},addEventListener(){},appendChild(){}
});}
const document={
 createElement(tag){return tag==="canvas"?canvas:element(tag);},
 getElementById(id){return id==="game"?canvas:element(id);},
 addEventListener(type,fn){docEvents[type]=fn;}
};
const window={addEventListener(type,fn){windowEvents[type]=fn;}};
const store=new Map();
const localStorage={getItem(k){return store.get(k)||null},setItem(k,v){store.set(k,v)}};
const sandbox=vm.createContext({window,document,localStorage,Date,Math,console,
 requestAnimationFrame(){},performance:{now(){return 0}}});
for(const name of ["apeiron-bonuses.js","art.js","living-patch.js","psychedelic-fx.js","arcade-director.js","arcade-scores.js"]){
 vm.runInContext(fs.readFileSync(path.join(root,name),"utf8"),sandbox,{filename:name,timeout:15000});
}
vm.runInContext(injected,sandbox,{filename:"index.js",timeout:15000});
const game=window.__feel;
const finger=(id,x,y,type="touch")=>({pointerId:id,pointerType:type,clientX:x,clientY:y,preventDefault(){}});
assert.ok(game);
game.resetGame();
assert.equal(window.ApeironControls.getMode(),"trackpad");
const original=game.inspect().player.x;
canvasEvents.pointerdown(finger(7,100,290));
let s=game.inspect();
assert.equal(s.player.x,original,"Touch-down should NOT teleport the crystal");
assert.ok(s.shots.length>0,"First shot must fire on touch-down, not one frame later");
canvasEvents.pointermove(finger(7,142,314));
s=game.inspect();
assert.ok(s.player.x>original+37 && s.player.x<original+47,"Relative X should follow finger delta");
assert.ok(s.player.y>710,"Relative Y should follow finger delta");
canvasEvents.pointerup(finger(7,142,314));
assert.equal(game.inspect().firing,false);
game.resetGame();
window.ApeironControls.setMode("direct");
assert.equal(localStorage.getItem("apeiron-touch-mode"),"direct");
canvasEvents.pointerdown(finger(8,410,687));
s=game.inspect();
assert.ok(s.player.x>=407&&s.player.x<=413,"Direct touch must follow finger without lag");
canvasEvents.pointerup(finger(8,410,687));
window.ApeironControls.setMode("trackpad");
game.resetGame();
canvasEvents.pointermove(finger(11,435,700,"mouse"));
s=game.inspect();
assert.ok(s.player.x>=432&&s.player.x<=438,"Mouse should track precisely");
assert.ok(s.player.y>=697&&s.player.y<=703);
game.resetGame();
game.shoot();
s=game.inspect();
assert.ok(s.shots.length>=1);
strokes.length=0;
game.drawShots();
const plasma=strokes.find(st=>st.color==="#b8faff");
assert.ok(plasma,"Standard bolt not drawn");
assert.ok(plasma.a.y-plasma.b.y>15,"Upward projectile must show an upward streak");
game.resetGame();
s=game.inspect();
s.mushrooms.splice(0);
s.player.inv=0;
s.critters.push({type:"scobster",x:360,y:690,dir:1,phase:0,age:1,
 hp:1,drop:0});
game.shoot();
game.update(1/60);
assert.equal(game.inspect().lives,3,"A lethal immediate shot should win over simultaneous contact");
assert.equal(game.inspect().critters.length,0);
console.log("PASS input feel: relative touch, direct touch option, direct mouse, first-frame fire, plasma direction and shot-before-contact.");
