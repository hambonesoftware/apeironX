"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const source=fs.readFileSync(path.join(__dirname,"..","arcade-scores.js"),"utf8");
const state=new Map(),storage={
 getItem(k){return state.get(k)||null;},
 setItem(k,v){state.set(k,v);}
};
const window={localStorage:storage};
vm.runInNewContext(source,{window,Date});
const {create,cleanInitials,parse}=window.ApeironScores;
assert.equal(cleanInitials("<script>BOB"),"SCR");
assert.equal(cleanInitials("a@!"),"A");
const table=create(storage);
assert.equal(table.read().length,0);
assert.equal(table.qualifies(0),false);
assert.equal(table.qualifies(1000),true);
for(let i=0;i<14;i++)assert.ok(table.record("p"+i,1000+i*500,i+1));
assert.equal(table.read().length,10);
assert.equal(table.read()[0].score,7500);
assert.equal(table.read()[0].wave,14);
assert.equal(table.read()[0].initials,"P13");
assert.equal(table.qualifies(1000),false);
assert.equal(table.qualifies(9000),true);
assert.equal(table.record("AAA",9000,20),true);
assert.equal(table.best().score,9000);
const again=create(storage);
assert.equal(again.read().length,10,"Leaderboard should survive restart");
assert.equal(again.best().initials,"AAA");
assert.equal(JSON.parse(state.values().next().value).length,10);
assert.equal(parse("{malformed").length,0);
assert.equal(parse('{"bad":1}').length,0);
const scoreText=again.format();
assert.match(scoreText,/AAA/);
assert.match(scoreText,/W20/);
assert.ok(!scoreText.includes("<"));
console.log("PASS local-only score persistence, ten-entry sorting, initials sanitization, corruption recovery and high-score qualification.");
