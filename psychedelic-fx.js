/* Apeiron X — Psychedelic Patch: all-original visual frenzy effects.
   Render-only. No gameplay positions, physics, timers, collisions or score mutations. */
(function (global) {
  "use strict";
  const TAU=Math.PI*2;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const rainbow=(time,offset=0,light=64,alpha=1)=>
    "hsla("+((time*58+offset)%360+360)%360+",100%,"+light+"%,"+alpha+")";
  function create(options={}) {
    const field=options.field||null;
    const canvas=options.canvas||null;
    const reduce=typeof options.reduceMotion==="function"?options.reduceMotion:()=>false;
    let amount=0,elapsed=0,remaining=0,wasActive=false;
    let pulses=0,active=false;
    const transition=5.5; // intensity units/second (short fade in/out)
    const w=Number(options.width)||720,h=Number(options.height)||760;
    function setClasses(running) {
      if(field&&field.classList&&typeof field.classList.toggle==="function"){
        field.classList.toggle("is-psychedelic",amount>.025);
        field.classList.toggle("psy-reduced",Boolean(reduce()));
        field.classList.toggle("psy-paused",!running);
      }
    }
    function update(dt,seconds,playing=true) {
      const step=clamp(Number(dt)||0,0,.08);
      const power=Number(seconds);
      remaining=Number.isFinite(power)?Math.max(0,power):0;
      const next=remaining>0;
      if(next&&!wasActive)pulses++;
      wasActive=next;
      // Do not advance the visual time or fade while gameplay is paused.
      if(playing){
        elapsed+=step;
        const target=next?1:0;
        amount=clamp(amount+Math.sign(target-amount)*Math.min(Math.abs(target-amount),transition*step),0,1);
      }
      active=next||amount>.025;
      setClasses(playing);
      return amount;
    }
    function reset() {
      remaining=0;amount=0;elapsed=0;pulses=0;wasActive=false;active=false;
      setClasses(true);
    }
    function fieldLayer(ctx) {
      if(amount<=.01)return;
      const quiet=Boolean(reduce()),t=elapsed;
      ctx.save();
      ctx.globalAlpha=amount*(quiet?.14:.22);
      ctx.globalCompositeOperation="screen";
      // Underlying terraforming color waves: soft, wide patches rather than strobing flashes.
      const count=quiet?3:7;
      for(let i=0;i<count;i++){
        const cx=w*(.1+i*.16)+Math.sin(t*(quiet?.15:.41)+i*2.1)*w*.075;
        const cy=h*(.2+(i%3)*.28)+Math.cos(t*(quiet?.12:.35)+i*1.7)*h*.055;
        const radius=118+48*Math.sin(t*.53+i);
        const gradient=ctx.createRadialGradient(cx,cy,6,cx,cy,Math.max(40,radius));
        gradient.addColorStop(0,rainbow(t,i*57,60,.55));
        gradient.addColorStop(.48,rainbow(t,i*57+80,60,.17));
        gradient.addColorStop(1,rainbow(t,i*57+150,55,0));
        ctx.fillStyle=gradient;
        ctx.beginPath();ctx.arc(cx,cy,Math.max(40,radius),0,TAU);ctx.fill();
      }
      ctx.restore();
    }
    function mushroomAuras(ctx,mushrooms) {
      if(amount<=.03||!Array.isArray(mushrooms))return;
      const quiet=Boolean(reduce()),t=elapsed;
      ctx.save();
      ctx.globalCompositeOperation="screen";
      ctx.lineWidth=1.25;ctx.globalAlpha=amount*(quiet?.34:.57);
      // Render every 4th mushroom; capped to avoid filling the frame with effects.
      for(let i=0,shown=0;i<mushrooms.length&&shown<43;i+=4,shown++){
        const m=mushrooms[i];
        if(!m||!Number.isFinite(m.x)||!Number.isFinite(m.y))continue;
        const ripple=quiet?0:Math.sin(t*4.3+i*.7)*3;
        ctx.strokeStyle=rainbow(t,m.x*.36+i*21,73,.84);
        ctx.beginPath();ctx.ellipse(m.x,m.y-8,12+ripple,6+ripple*.2,-.11,0,TAU);ctx.stroke();
      }
      ctx.restore();
    }
    function highlight(ctx,state={}) {
      if(amount<=.02)return;
      const quiet=Boolean(reduce()),t=elapsed;
      const groups=state.groups||[],critters=state.critters||[],pickups=state.pickups||[];
      const player=state.player;
      ctx.save();
      ctx.globalCompositeOperation="screen";
      ctx.lineWidth=quiet?1.4:2.2;
      ctx.globalAlpha=amount*(quiet?.32:.74);
      const glow=(x,y,r,offset)=>{
        if(!Number.isFinite(x)||!Number.isFinite(y))return;
        const wobble=quiet?0:Math.sin(t*5.2+offset)*3.5;
        ctx.strokeStyle=rainbow(t,offset*41,70,.75);
        ctx.beginPath();ctx.arc(x,y,r+wobble,0,TAU);ctx.stroke();
      };
      if(player)glow(player.x,player.y,26,1.2);
      let seen=0;
      for(const g of groups){
        if(!Array.isArray(g.segments))continue;
        for(let j=0;j<g.segments.length&&seen<27;j++,seen++){
          const s=g.segments[j];
          const p=typeof options.position==="function"?options.position(g,j):s;
          if(p)glow(p.x,p.y,13,j+seen*.6);
        }
      }
      for(let i=0;i<critters.length&&i<5;i++)glow(critters[i].x,critters[i].y,26,7+i);
      for(let i=0;i<pickups.length&&i<10;i++)glow(pickups[i].x,pickups[i].y,21,16+i);
      ctx.restore();
    }
    function finale(ctx) {
      if(amount<=.02)return;
      const quiet=Boolean(reduce()),t=elapsed;
      ctx.save();
      ctx.globalCompositeOperation="screen";
      ctx.globalAlpha=amount*(quiet?.21:.43);
      // Moving spectral edge bands frame the play space while preserving visibility.
      const layers=quiet?1:4;
      for(let i=0;i<layers;i++){
        const phase=t*(quiet?0:.72)+i*1.8;
        const x=w*.5+Math.sin(phase)*w*.13;
        const y=h*.52+Math.cos(phase*.77)*h*.13;
        const r=160+i*78;
        ctx.strokeStyle=rainbow(t,i*91,72,.8);
        ctx.lineWidth=i===0?2.4:1.5;
        ctx.beginPath();ctx.ellipse(x,y,r,r*.73,phase*.08,0,TAU);ctx.stroke();
      }
      ctx.restore();
    }
    function shotColor(shot,index=0) {
      if(amount<=.02)return null;
      return rainbow(elapsed,index*63+((shot?.x||0)*.17),72,.96);
    }
    function state() {
      return {active,amount,elapsed,remaining,pulses,reducedMotion:Boolean(reduce())};
    }
    return {update,reset,fieldLayer,mushroomAuras,highlight,finale,shotColor,state};
  }
  global.ApeironPsychedelic={create};
})(window);
