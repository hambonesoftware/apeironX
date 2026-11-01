/* Apeiron X v0.5 — local-only, privacy-preserving arcade leaderboard. */
(function(global) {
 "use strict";
 const KEY="apeiron-x-scores-v05";
 const LIMIT=10;
 function cleanInitials(raw) {
  const value=String(raw||"ACE").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,3);
  return value||"ACE";
 }
 function sanitize(record) {
  if(!record||!Number.isFinite(Number(record.score)))return null;
  const score=Math.max(0,Math.min(999999999,Math.floor(Number(record.score))));
  const wave=Math.max(1,Math.min(999,Math.floor(Number(record.wave)||1)));
  const initials=cleanInitials(record.initials);
  const date=/^\d{4}-\d\d-\d\d$/.test(String(record.date||""))?record.date:"";
  return {initials,score,wave,date};
 }
 function parse(raw) {
  let data=[];
  try {data=JSON.parse(raw||"[]");} catch(e){return [];}
  if(!Array.isArray(data))return [];
  return data.map(sanitize).filter(Boolean)
   .sort((a,b)=>b.score-a.score||b.wave-a.wave)
   .slice(0,LIMIT);
 }
 function create(store) {
  const storage=store||global.localStorage||null;
  let rows=[];
  try{rows=parse(storage&&storage.getItem(KEY));}catch(e){rows=[];}
  function save() {
   try{if(storage)storage.setItem(KEY,JSON.stringify(rows));}catch(e){}
  }
  function read(){return rows.map(r=>({...r}));}
  function qualifies(score) {
   const n=Math.floor(Number(score)||0);
   return n>0 && (rows.length<LIMIT || n>rows[rows.length-1].score);
  }
  function record(initials,score,wave,date) {
   const safe=sanitize({initials,score,wave,date:date||new Date().toISOString().slice(0,10)});
   if(!safe||!qualifies(safe.score))return false;
   rows.push(safe);
   rows.sort((a,b)=>b.score-a.score||b.wave-a.wave);
   rows=rows.slice(0,LIMIT);save();return true;
  }
  function best(){return rows[0]||null;}
  function format() {
   const list=read();
   if(!list.length)return "No scores yet — be the first!";
   return list.map((r,i)=>String(i+1).padStart(2,"0")+"  "+
    r.initials.padEnd(3," ")+"   "+String(r.score).padStart(7,"0")+
    "   W"+String(r.wave).padStart(2,"0")).join("\n");
  }
  return {read,record,qualifies,best,format,cleanInitials};
 }
 global.ApeironScores={create,parse,cleanInitials};
})(window);
