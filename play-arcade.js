import {createPlayHUD} from "./vendor/hambone-play/hambone-play.js";

// Minimal Classic Arcade integration. The original engine owns all drawing,
// scoring, collision, wave transitions, rewards, pointer input and audio.
const field=document.querySelector(".field-wrap");
const overlay=document.querySelector("#overlay");
const score=document.querySelector("#score");
const wave=document.querySelector("#wave");
const lives=document.querySelector("#lives");
const power=document.querySelector("#powerLabel");
const pause=document.querySelector("#pauseBtn");
const sound=document.querySelector("#soundBtn");
const scores=document.querySelector("#scoresBtn");

if(field && score && wave && lives && pause && sound && scores){
  const hud=createPlayHUD({
    root:field,viewport:field,style:"arcade",title:"APEIRON X",
    metrics:[
      {id:"score",label:"SCORE",value:"000000"},
      {id:"wave",label:"WAVE",value:"01"},
      {id:"lives",label:"LIVES",value:"3"}
    ]
  });
  hud.bindReadout(score,"score");
  hud.bindReadout(wave,"wave");
  hud.bindReadout(lives,"lives",text=>{
    const match=text.match(/×\s*(\d+)/);
    return match?match[1]:"—";
  });
  hud.placeControl(pause,"utilities");
  pause.setAttribute("aria-label","Pause or resume game");

  // Keep original sound/scores controls mounted when the tray is closed.
  // The existing game uses document.getElementById to access them.
  const stash=document.createElement("div");
  stash.hidden=true;
  stash.className="hb-arcade-stash";
  document.body.appendChild(stash);
  const trayContent=document.createElement("div");
  trayContent.className="hb-arcade-controls";
  trayContent.append(sound,scores);
  const touchControl=document.createElement("button");
  touchControl.type="button";
  touchControl.id="touchModeBtn";
  function syncTouchControl(){
    const mode=window.ApeironControls?.getMode?.()||"trackpad";
    touchControl.textContent=mode==="trackpad"?"TOUCH: TRACKPAD":"TOUCH: DIRECT";
    touchControl.setAttribute("aria-label","Change touch aiming between relative drag and direct positioning");
    touchControl.title=mode==="trackpad"
      ?"Drag moves the crystal relative to your finger. Tap and hold to fire."
      :"Crystal follows your finger position. Tap and hold to fire.";
  }
  touchControl.addEventListener("click",()=>{
    const current=window.ApeironControls?.getMode?.()||"trackpad";
    window.ApeironControls?.setMode?.(current==="trackpad"?"direct":"trackpad");
    syncTouchControl();
  });
  syncTouchControl();
  trayContent.append(touchControl);
  stash.appendChild(trayContent);
  let trayOpen=false;
  const options=hud.addAction({
    label:"☰",location:"utilities",id:"hb-arcade-options",
    onClick:()=>{
      trayOpen=!trayOpen;
      if(trayOpen)hud.openTray({title:"ARCADE OPTIONS",content:trayContent});
      else hud.closeTray();
    }
  });
  options.setAttribute("aria-label","Open sound and high score options");
  options.setAttribute("aria-expanded","false");
  options.title="Sound and high scores";
  const trayObserver=new MutationObserver(()=>{
    trayOpen=!hud.nodes.tray.hidden;
    options.setAttribute("aria-expanded",String(trayOpen));
    if(!trayOpen && trayContent.parentNode!==stash)stash.appendChild(trayContent);
  });
  trayObserver.observe(hud.nodes.tray,{attributes:true,attributeFilter:["hidden"]});
  scores.addEventListener("click",()=>hud.closeTray());

  const statusObserver=new MutationObserver(()=>{
    const value=power?.textContent?.trim()||"";
    const active=value && value!=="NORMAL PLASMA";
    hud.setStatus(active?value:"",active?"positive":"neutral");
  });
  if(power)statusObserver.observe(power,{characterData:true,childList:true,subtree:true});
  hud.setStatus("");

  const overlayObserver=new MutationObserver(()=>{
    const visible=overlay && !overlay.classList.contains("hidden");
    hud.element.hidden=Boolean(visible);
    hud.setPhase(visible?"paused":(pause.textContent.includes("RESUME")?"paused":"playing"));
  });
  if(overlay)overlayObserver.observe(overlay,{attributes:true,attributeFilter:["class"]});
  const pauseObserver=new MutationObserver(()=>{
    if(hud.element.hidden)return;
    hud.setPhase(pause.textContent.includes("RESUME")?"paused":"playing");
  });
  pauseObserver.observe(pause,{characterData:true,childList:true,subtree:true});
  overlayObserver.takeRecords();
  hud.element.hidden=Boolean(overlay && !overlay.classList.contains("hidden"));
  if(!hud.element.hidden)hud.setPhase("playing");

  window.addEventListener("pagehide",()=>{
    trayObserver.disconnect();statusObserver.disconnect();
    overlayObserver.disconnect();pauseObserver.disconnect();
    hud.destroy();stash.remove();
  },{once:true});
}
