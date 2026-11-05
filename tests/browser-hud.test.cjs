"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {createServer}=require("node:http");
const {readFile,mkdir}=require("node:fs/promises");
const path=require("node:path");
const {chromium}=require("playwright");
const ROOT=path.resolve(__dirname,"..");
const types={".html":"text/html",".js":"application/javascript",".css":"text/css",".png":"image/png",".svg":"image/svg+xml"};
function serve(){
  return createServer(async(req,res)=>{
    const name=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
    const file=path.resolve(ROOT,"."+(name==="/"?"/index.html":name));
    if(!file.startsWith(ROOT+path.sep)||!types[path.extname(file)]){
      res.writeHead(404);res.end("Not found");return;
    }
    try{
      const bytes=await readFile(file);
      res.writeHead(200,{"Content-Type":types[path.extname(file)]});res.end(bytes);
    }catch{res.writeHead(404);res.end("Not found");}
  });
}
test("Classic Arcade HUD preserves actual Apeiron X input on phones",{timeout:150000},async()=>{
  const server=serve();
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  let browser;
  try{
    browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
    await mkdir(path.join(ROOT,"test-artifacts"),{recursive:true});
    for(const device of [
      {name:"iphone",width:390,height:844},
      {name:"landscape",width:844,height:390}
    ]){
      const context=await browser.newContext({
        viewport:{width:device.width,height:device.height},
        deviceScaleFactor:2,isMobile:true,hasTouch:true
      });
      const page=await context.newPage(),errors=[];
      page.on("pageerror",e=>errors.push(e.message));
      await page.goto("http://127.0.0.1:"+server.address().port+"/",{waitUntil:"networkidle"});
      await page.locator("#primaryBtn").click();
      await page.locator(".hb-play--arcade").waitFor({state:"visible",timeout:30000});
      assert.equal(await page.locator(".hb-play__readout").count(),3);
      assert.equal(await page.locator(".site-header").isVisible(),false);
      const canvas=await page.locator("#game").boundingBox();
      assert.ok(canvas&&canvas.width>230&&canvas.width<=device.width+2,"Canvas fits "+device.name);
      await page.locator("#hb-arcade-options").click();
      assert.equal(await page.locator("#scoresBtn").isVisible(),true);
      assert.equal(await page.locator("#soundBtn").isVisible(),true);
      await page.locator("#soundBtn").click();
      assert.ok((await page.locator("#soundBtn").textContent()).includes("OFF"));
      await page.locator(".hb-play__tray-close").click();
      assert.equal(await page.locator(".hb-play__tray").isVisible(),false);
      await page.locator("#pauseBtn").click();
      assert.equal(await page.locator("#overlay").isVisible(),true);
      await page.locator("#primaryBtn").click();
      await page.locator(".hb-play--arcade").waitFor({state:"visible",timeout:20000});
      assert.deepEqual(errors,[],"No browser exceptions on "+device.name);
      await page.screenshot({path:path.join(ROOT,"test-artifacts",device.name+"-apeiron-play.png")});
      await context.close();
    }
  }finally{
    await browser?.close();
    await new Promise(resolve=>server.close(resolve));
  }
});
