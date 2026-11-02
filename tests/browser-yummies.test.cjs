"use strict";
/* Chromium browser check of the deployable root-page build. */
const test=require("node:test");
const assert=require("node:assert/strict");
const {createServer}=require("node:http");
const {readFile,mkdir}=require("node:fs/promises");
const path=require("node:path");
const {chromium}=require("playwright");
const ROOT=path.resolve(__dirname,"..");
const types={".html":"text/html",".js":"application/javascript",".svg":"image/svg+xml",".css":"text/css",".png":"image/png"};
function serve(){
 return createServer(async(req,res)=>{
  const name=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  const file=path.resolve(ROOT,"."+ (name==="/"?"/index.html":name));
  if(!file.startsWith(ROOT+path.sep)||!(path.extname(file) in types)){
   res.writeHead(404);res.end("Not found");return;
  }
  try{
   const bytes=await readFile(file);
   res.writeHead(200,{"Content-Type":types[path.extname(file)]});
   res.end(bytes);
  }catch{res.writeHead(404);res.end("Not found");}
 });
}
test("Apeiron original-yummies browser smoke on iPhone, tablet and desktop", {timeout:180000},async()=>{
 const server=serve();
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
  await mkdir(path.join(ROOT,"test-artifacts"),{recursive:true});
  const url="http://127.0.0.1:"+server.address().port+"/";
  for(const device of [
   {name:"iphone",width:390,height:844,touch:true},
   {name:"ipad",width:768,height:1024,touch:true},
   {name:"desktop",width:1365,height:900,touch:false}
  ]){
   const ctx=await browser.newContext({viewport:{width:device.width,height:device.height},
    deviceScaleFactor:device.touch?2:1,isMobile:device.touch,hasTouch:device.touch});
   const page=await ctx.newPage(),errors=[];
   page.on("pageerror",e=>errors.push(e.message));
   await page.goto(url,{waitUntil:"networkidle"});
   assert.equal(await page.evaluate(()=>window.ApeironBonuses.COINS.length),7);
   await page.locator("#primaryBtn").click();
   const canvas=page.locator("#game");
   await canvas.waitFor({state:"visible"});
   const box=await canvas.boundingBox();
   assert.ok(box && box.width>200 && box.width<=device.width+2,"Canvas fits viewport: "+device.name);
   if(device.touch){
    await canvas.tap({position:{x:box.width*.5,y:box.height*.86}});
   }else{
    await canvas.click({position:{x:box.width*.5,y:box.height*.86}});
   }
   await page.waitForTimeout(650);
   assert.ok(await page.locator("#powerLabel").isVisible());
   await page.screenshot({path:path.join(ROOT,"test-artifacts",device.name+"-apeiron-yummies.png"),fullPage:true});
   assert.deepEqual(errors,[],"No uncaught script errors for "+device.name);
   await ctx.close();
  }
 }finally{
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
 }
});