/* Ambrosia Apeiron "yummies" homage.
 * Independent implementation based on the public 1995 official Apeiron FAQ.
 * Yummies: guided squiggle, diamond/pass-through, rapid orange bars,
 * sprinkly shield, yummy lock, housekeeping, extra man.
 * Multiplier targets and psychedelic mushrooms are separate from the coin pool.
 * All source, sprites and audio are independently authored.
 */
(function(global) {
  "use strict";
  const COINS = Object.freeze([
    {type:"guided", label:"GUIDED SHOTS", weight:19},
    {type:"ghost", label:"DIAMOND / PASS THROUGH", weight:13},
    {type:"rapid", label:"MACHINE GUN", weight:20},
    {type:"shield", label:"SPRINKLY SHIELD", weight:17},
    {type:"lock", label:"YUMMY LOCK", weight:10},
    {type:"cleanse", label:"HOUSE CLEANING", weight:12},
    {type:"life", label:"EXTRA CRYSTAL", weight:9}
  ]);
  const LABELS = Object.freeze({
    rapid:"MACHINE GUN",guided:"GUIDED SHOTS",ghost:"DIAMOND / PASS THROUGH",
    shield:"SPRINKLY SHIELD",lock:"YUMMY LOCK",cleanse:"HOUSE CLEANING",
    life:"EXTRA CRYSTAL",multiplier:"BONUS MULTIPLIER",
    spread:"TRIPLE PLASMA",ricochet:"RICOCHET PLASMA",multi:"BONUS MULTIPLIER"
  });
  function select(random=Math.random) {
    const total=COINS.reduce((n,c)=>n+c.weight,0);
    let n=Math.max(0,Math.min(.9999999999,random()))*total;
    for(const c of COINS){n-=c.weight;if(n<0)return c.type;}
    return COINS[COINS.length-1].type;
  }
  function shotCoin(coin,shot) {
    // A shot knocks a power coin away. It does not award the power.
    // At high speed the coin can leave the field before reaching the shooter.
    coin.vx=Math.max(-370,Math.min(370,(coin.vx||0)+(shot.vx||0)*.32+(shot.x<coin.x?85:-85)));
    coin.vy=Math.max(-420,Math.min(220,(coin.vy||0)+(shot.vy||-750)*.38-60));
    coin.bounces=(coin.bounces||0)+1;
    coin.shotCooldown=.13;
  }
  function blocker(x,y,mushrooms,top,radius=16) {
    for(const mushroom of mushrooms) {
      if(mushroom.y<top-22 || mushroom.y>top+200)continue;
      if(Math.hypot(mushroom.x-x,mushroom.y-7-y)<radius+11)return mushroom;
    }
    return null;
  }
  function keepOnDeath(player) {
    const locked=!!player.lock;
    // A yummy lock protects collected weapon/navigation yummies through death.
    if(!locked) {
      player.rapid=0;player.guided=0;player.ghost=0;
      player.spread=0;player.ricochet=0;
    }
    player.shield=0;
    player.frenzy=0;
    return locked;
  }
  function powerText(player) {
    const active=[];
    if(player.rapid>0)active.push("MACHINE GUN "+Math.ceil(player.rapid)+"s");
    if(player.guided>0)active.push("GUIDED "+Math.ceil(player.guided)+"s");
    if(player.ghost>0)active.push("DIAMOND "+Math.ceil(player.ghost)+"s");
    if(player.lock)active.push("LOCKED "+Math.ceil(player.lockTime||0)+"s");
    if(player.shield>0)active.push("SHIELD "+Math.ceil(player.shield)+"s");
    if(player.frenzy>0)active.push("PSYCHEDELIC ×10 "+Math.ceil(player.frenzy)+"s");
    return active;
  }
  global.ApeironBonuses={COINS,LABELS,select,shotCoin,blocker,keepOnDeath,powerText};
})(window);