/* Living Mushroom Patch v0.4 — original-code arcade interaction layer.
   No third-party game audio or artwork. */
(function (global) {
  "use strict";
  const TAU = Math.PI * 2;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const dist = (a, b, x, y) => Math.hypot(a - x, b - y);
  function create(env) {
    const falling = [], rings = [], scores = [];
    let touchdownCount = 0, touchdownCooldown = 0, shake = 0, currentWave = 1;
    let eventCount = 0;
    const state = () => env.state();
    function reset(wave) {
      falling.length = 0; rings.length = 0; scores.length = 0;
      touchdownCount = 0; touchdownCooldown = 0; shake = 0;
      currentWave = wave || 1; eventCount = 0;
    }
    function ring(x, y, color, radius, life) {
      if (rings.length >= 48) rings.shift();
      rings.push({x, y, color: color || "#fff0a0", radius: radius || 8,
        life: life || .48, max: life || .48});
    }
    function points(x, y, value, color) {
      if (scores.length >= 16) scores.shift();
      scores.push({x, y, value: "+" + value.toLocaleString(),
        life: 1.15, max: 1.15, color: color || "#f5e7a4"});
      env.score(value);
    }
    function mushroomDislodged(m) {
      if (falling.length >= 32) falling.shift();
      falling.push({x:m.x, y:m.y, kind:m.kind, variant:m.variant || 0,
        vx:(Math.random()-.5)*155, vy:-85-Math.random()*125,
        angle:0, spin:(Math.random()-.5)*9, life:3.6, bounce:0,
        vulnerable:.13});
      ring(m.x, m.y, m.kind === "toxic" ? "#fb765b" : "#e9c27a", 10, .44);
      shake=Math.max(shake,1.5);
      env.audio("tumble");
    }
    function fallingShot(shot) {
      for (let i=falling.length-1; i>=0; i--) {
        const f=falling[i];
        if (f.vulnerable>0 || dist(shot.x,shot.y,f.x,f.y)>17) continue;
        falling.splice(i,1);
        const reward=f.kind==="toxic" ? 6000 : 3000;
        points(f.x,f.y,reward,"#ffeda5");
        env.burst(f.x,f.y,"#ffe091",24,170);
        ring(f.x,f.y,"#f4e37e",12,.6);
        env.audio("falling");
        shake=Math.max(shake,3.3);
        return true;
      }
      return false;
    }
    function reflectShot(shot, mushroom) {
      if (mushroom.kind!=="reflector" && !shot.ricochet) return false;
      if ((shot.bounces || 0) >= 2 || (shot.reflectWait || 0)>0) return false;
      shot.bounces=(shot.bounces || 0)+1;
      shot.reflectWait=.10;
      const direction = (shot.x < mushroom.x ? -1 : 1);
      shot.vx=(direction*220 + shot.vx*.2);
      shot.vy=-Math.max(390,Math.abs(shot.vy)*.85);
      shot.life=Math.max(shot.life,.7);
      ring(mushroom.x,mushroom.y,"#a5f7ff",12,.38);
      env.burst(mushroom.x,mushroom.y,"#b5faff",7,100);
      env.audio("reflect");
      return true;
    }
    function poisonTurn(group, mushroom) {
      if (!mushroom || mushroom.kind!=="toxic" || (group.poisonCooldown||0)>0) return false;
      // Toxic mushroom grants a single forced turn/step-down. It must NEVER
      // change the lower-field flag at high altitude or initiate a long dive.
      group.dive=true;
      group.poisonCooldown=6;
      ring(mushroom.x,mushroom.y,"#ff5c42",9,.8);
      env.burst(mushroom.x,mushroom.y,"#e35434",18,150);
      env.audio("poison");
      return true;
    }
    function specialMushroom(m) {
      if (m.kind !== "magic") return;
      const st=state();
      ring(m.x,m.y,"#ef92ff",18,1.1);
      env.burst(m.x,m.y,"#e9a0ff",32,220);
      points(m.x,m.y,500,"#f9baff");
      st.player.frenzy=10;
      env.show("PSYCHEDELIC ×10", "#ffb1ff");
      env.audio("magic");
      shake=Math.max(shake,4);
    }
    function pickup(type, x, y) {
      if (type==="cleanse") {
        const st=state(), removed=[];
        for (let i=st.mushrooms.length-1; i>=0; i--) {
          const m=st.mushrooms[i];
          if (m.y < st.PLAY_TOP - 15) continue;
          removed.push(m);
          st.mushrooms.splice(i,1);
        }
        for (const m of removed.slice(0,22)) {
          env.burst(m.x,m.y,"#d9d99d",5,100);
          ring(m.x,m.y,"#d5efac",8,.4);
        }
        if (removed.length) points(x,y,removed.length*30);
        env.audio("cleanse");
      }
      if (type==="guided" || type==="ricochet") {
        ring(x,y,type==="guided"?"#adf6aa":"#9ddaff",16,.7);
        env.audio("guided");
      }
    }
    function hitCritter(c) {
      ring(c.x,c.y,c.type==="ufo"?"#d3a5ff":"#ffa97c",15,.52);
      shake=Math.max(shake,2.7);
      env.audio(c.type==="ufo"?"saucer":"critter");
    }
    function critterBehavior(c, dt) {
      const st=state();
      // Groucho contaminates existing mushrooms instead of creating new ones.
      if(c.type==="flea" && c.drop>.33) {
        let closest=null, best=26*26;
        for (const m of st.mushrooms) {
          const dd=(m.x-c.x)**2+(m.y-c.y)**2;
          if(m.kind==="normal" && dd<best){closest=m;best=dd;}
        }
        if(closest) {
          closest.kind="toxic";
          ring(closest.x,closest.y,"#fb6a49",10,.55);
          c.drop=0;
        }
      }
      // Larry charges lower when he sees the player, but never teleports.
      if(c.type==="scobster" && c.age>1.3 && c.age<2.9 && c.y<st.PLAY_TOP+45) {
        c.y+=65*dt;
      }
      if(c.type==="ufo" && c.drop>.5) {
        ring(c.x,c.y,"#ec9bf7",11,.26);
      }
    }
    function checkTouchdowns(dt) {
      touchdownCooldown=Math.max(0,touchdownCooldown-dt);
      const st=state();
      if (touchdownCooldown>0 || touchdownCount >= Math.min(5,2+Math.floor(currentWave/6))) return;
      for (const group of st.groups) {
        const head=group.segments[0];
        if(!head || head.y<st.H-63 || group.didTouchdown) continue;
        group.didTouchdown=true;
        touchdownCount++;
        touchdownCooldown=3.4;
        // Two separate attackers enter the lower play area, as in the classic.
        const count = currentWave < 4 ? 1 : 2;
        for(let i=0;i<count;i++) {
          const fromLeft=(i%2===0);
          const x=fromLeft ? 25 : st.W-25;
          const y=st.PLAY_TOP+30+((touchdownCount+i)%3)*30;
          env.spawnSegment(x,y,fromLeft?1:-1);
          ring(x,y,"#fff0a5",13,.62);
        }
        env.show("PENTIPEDE TOUCHDOWN!", "#ffdf8e");
        env.audio("alert");
        shake=Math.max(shake,3.2);
        break;
      }
    }
    function steerGuided(dt) {
      const st=state();
      for (const shot of st.shots) {
        shot.reflectWait=Math.max(0,(shot.reflectWait||0)-dt);
        if(!shot.guided)continue;
        let closest=null, best=300*300;
        for(const g of st.groups) for(let i=0;i<g.segments.length;i++){
          const s=env.position(g,i), dx=s.x-shot.x, dy=s.y-shot.y;
          const d=dx*dx+dy*dy;
          if(d<best){best=d;closest=s;}
        }
        if(!closest) continue;
        const dx=closest.x-shot.x,dy=closest.y-shot.y;
        const mag=Math.hypot(dx,dy)||1, speed=Math.hypot(shot.vx,shot.vy)||750;
        const tx=dx/mag*speed,ty=dy/mag*speed;
        const mix=clamp(dt*5.7,0,.24);
        shot.vx+=(tx-shot.vx)*mix;
        shot.vy+=(ty-shot.vy)*mix;
        const newSpeed=Math.hypot(shot.vx,shot.vy)||1;
        shot.vx=shot.vx/newSpeed*speed;shot.vy=shot.vy/newSpeed*speed;
      }
    }
    function update(dt) {
      const st=state();
      shake=Math.max(0,shake-16*dt);
      for (let i=falling.length-1;i>=0;i--) {
        const f=falling[i];
        f.life-=dt;f.vulnerable=Math.max(0,f.vulnerable-dt);
        f.vy+=350*dt;
        f.x+=f.vx*dt;f.y+=f.vy*dt;f.angle+=f.spin*dt;
        if(f.x<14||f.x>st.W-14){f.x=clamp(f.x,14,st.W-14);f.vx*=-.55;}
        if(f.y>st.H-36) {
          f.y=st.H-36;
          if(f.bounce===0){f.vy=-Math.abs(f.vy)*.26;f.vx*=.6;f.bounce=1;
            ring(f.x,f.y,"#e7d3a0",6,.35);}
          else{f.life=Math.min(f.life,.18);f.vy=0;}
        }
        if(f.life<=0) falling.splice(i,1);
      }
      for(let i=rings.length-1;i>=0;i--){rings[i].life-=dt;if(rings[i].life<=0)rings.splice(i,1);}
      for(let i=scores.length-1;i>=0;i--){scores[i].life-=dt;scores[i].y-=dt*34;if(scores[i].life<=0)scores.splice(i,1);}
      steerGuided(dt);
      checkTouchdowns(dt);
    }
    function render(g, art) {
      const t=state().elapsed;
      for(const f of falling){
        g.save();
        g.globalAlpha=clamp(f.life*2,0,1);
        g.translate(f.x,f.y);
        g.rotate(f.angle);
        g.drawImage(art.mushroom(f.kind==="reflector"?"magic":f.kind,f.variant),-16,-19,32,32);
        g.restore();
      }
      for(const r of rings){
        const progress=1-r.life/r.max;
        g.save();g.strokeStyle=r.color;g.globalAlpha=(1-progress)*.85;
        g.lineWidth=2.3*(1-progress)+.4;
        g.beginPath();g.ellipse(r.x,r.y,r.radius*(1+progress*2.7),r.radius*(.45+progress),0,0,TAU);g.stroke();
        g.restore();
      }
      for(const tag of scores){
        g.save();g.globalAlpha=clamp(tag.life/.4,0,1);
        g.font="bold 19px Georgia,serif";g.textAlign="center";
        g.lineWidth=4;g.strokeStyle="#16280e";
        g.strokeText(tag.value,tag.x,tag.y);
        g.fillStyle=tag.color;g.fillText(tag.value,tag.x,tag.y);
        g.restore();
      }
      if(t>0 && currentWave>=4 && Math.sin(t*.67)> .99){
        g.fillStyle="#f5e78c14";g.fillRect(0,0,state().W,state().H);
      }
    }
    function cameraShake() {
      return {x:(Math.random()-.5)*shake, y:(Math.random()-.5)*shake};
    }
    function metrics(){
      return {falling:falling.length,rings:rings.length,scores:scores.length,
        touchdowns:touchdownCount,events:eventCount};
    }
    return {reset,update,render,ring,points,mushroomDislodged,fallingShot,
      reflectShot,poisonTurn,specialMushroom,pickup,hitCritter,critterBehavior,
      cameraShake,metrics,checkTouchdowns};
  }
  global.LivingPatch={create};
})(window);
