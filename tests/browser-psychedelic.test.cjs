"use strict";
/* End-to-end psychedelic mushroom visuals in an instrumented test-only page.
   The shipping HTML is never modified by this test. */
const test=require("node:test");
const assert=require("node:assert/strict");
const {createServer}=require("node:http");
const {readFile,mkdir}=require("node:fs/promises");
const path=require("node:path");
const {chromium}=require("playwright");
const ROOT=path.resolve(__dirname,"..");
const mime={".html":"text/html",".js":"application/javascript",".css":"text/css",".svg":"image/svg+xml"};
function serve(){
 return createServer(async(req,res)=>{
  const url=new URL(req.url,"http://localhost");
  const pathname=decodeURIComponent(url.pathname);
  const filename=path.resolve(ROOT,"."+(pathname==="/"?"/index.html":pathname));
  if(!filename.startsWith(ROOT+path.sep)||!(path.extname(filename) in mime)){
   res.writeHead(404);res.end();return;
  }
  try{
   let bytes=await readFile(filename);
   if(path.basename(filename)==="index.html"){
    const boot="living.reset(1);seedMushrooms();createPentipede();syncHud();requestAnimationFrame(loop);";
    const html=bytes.toString("utf8");
    assert.ok(html.includes(boot),"Test-only injection point was removed");
    bytes=Buffer.from(html.replace(boot,boot+
     "\nwindow.__psyTest={trigger:()=>{player.frenzy=8},end:()=>{player.frenzy=0},state:()=>psy.state()};"));
   }
   res.writeHead(200,{"Content-Type":mime[path.extname(filename)]});res.end(bytes);
  }catch(error){res.writeHead(500);res.end(String(error))}
 });
}
test("Psychedelic power visually transforms the game without moving the field",{timeout:180000},async()=>{
 const server=serve();
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
  await mkdir(path.join(ROOT,"test-artifacts"),{recursive:true});
  const url="http://127.0.0.1:"+server.address().port+"/";
  for(const size of [
   {name:"iphone",width:390,height:844},
   {name:"desktop",width:1350,height:900}
  ]){
   const context=await browser.newContext({viewport:{width:size.width,height:size.height},
    isMobile:size.name==="iphone",hasTouch:size.name==="iphone",
    deviceScaleFactor:size.name==="iphone"?2:1});
   const page=await context.newPage(),errors=[];
   page.on("pageerror",error=>errors.push(error.message));
   await page.goto(url,{waitUntil:"networkidle"});
   await page.locator("#primaryBtn").click();
   const bounds=await page.locator("#game").boundingBox();
   assert.ok(bounds&&bounds.width>200);
   await page.evaluate(()=>window.__psyTest.trigger());
   await page.waitForFunction(()=>document.querySelector(".field-wrap").classList.contains("is-psychedelic"));
   const active=await page.evaluate(()=>({
    state:window.__psyTest.state(),
    animation:getComputedStyle(document.querySelector("#game")).animationName,
    hudAnimation:getComputedStyle(document.querySelector(".hb-play__scorebug")).animationName
   }));
   assert.equal(active.state.active,true);
   assert.match(active.animation,/apeiron-psy-spectrum/);
   assert.match(active.hudAnimation,/apeiron-psy-border/);
   const changed=await page.locator("#game").boundingBox();
   assert.ok(Math.abs(bounds.width-changed.width)<.1&&Math.abs(bounds.height-changed.height)<.1,
    "Psychedelic mode must not resize the game or alter touch mapping");
   await page.screenshot({path:path.join(ROOT,"test-artifacts",size.name+"-psychedelic.png")});
   await page.emulateMedia({reducedMotion:"reduce"});
   await page.waitForFunction(()=>getComputedStyle(document.querySelector("#game")).animationName==="none");
   assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector("#game")).animationName),"none");
   await page.evaluate(()=>window.__psyTest.end());
   await page.waitForFunction(()=>!document.querySelector(".field-wrap").classList.contains("is-psychedelic"));
   assert.deepEqual(errors,[],"No browser errors on "+size.name);
   await context.close();
  }
 }finally{
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
 }
});
