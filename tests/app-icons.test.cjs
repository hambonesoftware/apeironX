"use strict";
// Validates the chosen Arcade Classic app icon and GitHub Pages install paths.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=filename=>fs.readFileSync(path.join(root,filename));
function checkPng(filename,width,height){
 const data=read(filename);
 assert.ok(data.length>8000,filename+" should contain real icon artwork");
 assert.equal(data.subarray(0,8).toString("hex"),"89504e470d0a1a0a",filename+" PNG signature");
 assert.equal(data.toString("ascii",12,16),"IHDR",filename+" PNG IHDR chunk");
 assert.equal(data.readUInt32BE(16),width,filename+" width");
 assert.equal(data.readUInt32BE(20),height,filename+" height");
}
checkPng("apple-touch-icon.png",180,180);
checkPng("icons/icon-192.png",192,192);
checkPng("icons/icon-512.png",512,512);
const manifest=JSON.parse(read("manifest.webmanifest").toString("utf8"));
assert.equal(manifest.display,"standalone");
assert.equal(manifest.scope,"./");
assert.equal(manifest.start_url,"./");
assert.ok(manifest.short_name==="Apeiron X");
assert.ok(manifest.icons.some(icon=>icon.sizes==="192x192"&&icon.src==="./icons/icon-192.png"));
assert.ok(manifest.icons.some(icon=>icon.sizes==="512x512"&&icon.src==="./icons/icon-512.png"));
const html=read("index.html").toString("utf8");
assert.match(html,/rel="apple-touch-icon"[^>]+apple-touch-icon\.png/);
assert.match(html,/rel="manifest"[^>]+manifest\.webmanifest/);
assert.match(html,/rel="icon"[^>]+icons\/icon-192\.png/);
console.log("PASS Home Screen icon assets, PNG dimensions, manifest and iOS Safari metadata");
