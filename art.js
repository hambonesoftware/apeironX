/* Apeiron X browser tribute: independent procedural 16-bit-style art.
   Artwork is drawn in Canvas. No assets from Ambrosia Software are embedded. */
(function () {
  "use strict";
  const TAU = Math.PI * 2;
  const imageCache = { mushrooms: {}, pentipedes: {}, enemies: {}, crystal: null };
  function seeded(value) {
    let state = value >>> 0;
    return function () {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }
  function sprite(w, h, paint) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const g = canvas.getContext("2d");
    paint(g, w, h);
    return canvas;
  }
  function ellipse(g, x, y, rx, ry, color, angle) {
    g.fillStyle = color;
    g.beginPath();
    g.ellipse(x, y, rx, ry, angle || 0, 0, TAU);
    g.fill();
  }
  function path(g, color, points) {
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2) g.lineTo(points[i], points[i + 1]);
    g.closePath();
    g.fill();
  }
  function shade(g, x, y, radius, stops) {
    const grd = g.createRadialGradient(x - radius * .38, y - radius * .42, 1, x, y, radius);
    for (const stop of stops) grd.addColorStop(stop[0], stop[1]);
    return grd;
  }
  function renderGround(g, w, h, wave) {
    const themes = [
      { top: "#819c50", bottom: "#5c8d51", haze: "#d3d87c", soil: "#3a693e", crack: "#d2d995" },
      { top: "#b4a36d", bottom: "#8c9860", haze: "#e5d896", soil: "#746a4e", crack: "#efe2b5" },
      { top: "#689c58", bottom: "#3f754a", haze: "#c3cb75", soil: "#345839", crack: "#b7d995" },
      { top: "#a1c960", bottom: "#81b963", haze: "#dbe98d", soil: "#599650", crack: "#e7f5ad" }
    ];
    const theme = themes[Math.floor((wave - 1) / 5) % themes.length];
    const rng = seeded(14692 + Math.floor(wave / 5) * 948);
    const grad = g.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, theme.top);
    grad.addColorStop(.52, theme.top);
    grad.addColorStop(1, theme.bottom);
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    // Broad irregular patches resemble layered, sunlit turf rather than a flat fill.
    for (let i = 0; i < 530; i++) {
      const x = rng() * w, y = rng() * h;
      const rad = 8 + rng() * 42;
      g.fillStyle = rng() > .57 ? "rgba(16,43,24,.045)" : "rgba(242,238,162,.055)";
      g.beginPath();
      g.ellipse(x, y, rad * (1.2 + rng()), rad * (.3 + rng()), rng() * 3, 0, TAU);
      g.fill();
    }
    // Pale interconnected cracks and soil edges are a prominent X-era field detail.
    const spacing = 53;
    const sites = [], cols = Math.ceil(w / spacing) + 3, rows = Math.ceil(h / spacing) + 3;
    for (let row = 0; row < rows; row++) {
      const line = [];
      for (let col = 0; col < cols; col++) {
        line.push({
          x: (col - 1 + (row % 2) * .5) * spacing + (rng() - .5) * 25,
          y: (row - 1) * spacing + (rng() - .5) * 25
        });
      }
      sites.push(line);
    }
    // Irregular Voronoi borders produce natural dried-earth cells, without a grid.
    // Every polygon is clipped against nearby sites along perpendicular bisectors.
    function clipHalfPlane(poly, origin, other) {
      if (!poly.length) return poly;
      const dx = other.x - origin.x, dy = other.y - origin.y;
      const limit = ((other.x * other.x + other.y * other.y) -
        (origin.x * origin.x + origin.y * origin.y)) / 2;
      const inside = p => p.x * dx + p.y * dy <= limit;
      const intersection = (p, q) => {
        const start = p.x * dx + p.y * dy - limit;
        const end = q.x * dx + q.y * dy - limit;
        const t = Math.abs(start - end) < 1e-8 ? 0 : start / (start - end);
        return { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t };
      };
      const out = [];
      for (let i = 0; i < poly.length; i++) {
        const cur = poly[i], next = poly[(i + 1) % poly.length];
        const good = inside(cur), nextGood = inside(next);
        if (good) out.push(cur);
        if (good !== nextGood) out.push(intersection(cur, next));
      }
      return out;
    }
    g.lineJoin = "round";
    for (let row = 1; row < rows - 1; row++) {
      for (let col = 1; col < cols - 1; col++) {
        const site = sites[row][col];
        let poly = [{x:0,y:0},{x:w,y:0},{x:w,y:h},{x:0,y:h}];
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            if (!dr && !dc) continue;
            const r = row + dr, c = col + dc;
            if (r < 0 || c < 0 || r >= rows || c >= cols) continue;
            poly = clipHalfPlane(poly, site, sites[r][c]);
            if (!poly.length) break;
          }
          if (!poly.length) break;
        }
        if (poly.length < 3) continue;
        const lower = Math.max(0, (site.y / h - .25) / .75);
        const brightness = (wave > 10 ? .28 : .19) * lower;
        if (brightness < .008) continue;
        g.beginPath();g.moveTo(poly[0].x,poly[0].y);
        for (let i = 1; i < poly.length; i++) g.lineTo(poly[i].x,poly[i].y);
        g.closePath();
        g.strokeStyle = "rgba(239,246,169," + brightness + ")";
        g.lineWidth = .8 + rng() * .48;g.stroke();
      }
    }
    // Multi-tone grains, grass filaments and pebble flecks form the 16-bit texture.
    for (let i = 0; i < 58000; i++) {
      const x = rng() * w, y = rng() * h;
      const light = rng() > .50;
      g.fillStyle = light ? "rgba(244,241,170," + (.024 + rng() * .12) + ")" :
        "rgba(19,57,27," + (.025 + rng() * .15) + ")";
      const size = .38 + rng() * 1.4;
      g.fillRect(x, y, size, size);
    }
    for (let i = 0; i < 5200; i++) {
      const x = rng() * w, y = rng() * h;
      const length = 2 + rng() * 7;
      g.lineWidth = .4 + rng() * .65;
      g.strokeStyle = rng() > .45 ? "rgba(221,231,153,.17)" : "rgba(28,68,33,.16)";
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x - 2, y - length * .4, x + (rng() - .5) * 5, y - length);
      g.stroke();
    }
    const light = g.createRadialGradient(w * .25, h * .08, 1, w * .55, h * .46, w * .84);
    light.addColorStop(0, "rgba(250,252,191,.13)");
    light.addColorStop(1, "rgba(23,35,20,.08)");
    g.fillStyle = light;
    g.fillRect(0, 0, w, h);
  }

  function drawMushroom(g, variant, kind) {
    const rng = seeded(8612 + variant * 179 + (kind === "toxic" ? 121 : kind === "magic" ? 513 : 0));
    const capStops = kind === "toxic" ? ["#fa8c3d", "#d3372b", "#541c20"] :
      kind === "magic" ? ["#f7b7ff", "#9b43c4", "#422455"] :
      ["#e8aa62", "#9a482c", "#31241c"];
    g.save();
    g.translate(48, 47);
    g.rotate((variant - 2.5) * .036);
    // Root/stalk with uneven edges and dark gill fringe.
    const stem = g.createLinearGradient(-14, 0, 13, 0);
    stem.addColorStop(0, "#514431");
    stem.addColorStop(.25, "#c1a572");
    stem.addColorStop(.56, "#e3c89c");
    stem.addColorStop(1, "#55402c");
    g.fillStyle = stem;
    g.beginPath();
    g.moveTo(-12, -4);
    g.bezierCurveTo(-9, 8, -10, 20, -12, 25);
    g.quadraticCurveTo(0, 32, 13, 25);
    g.bezierCurveTo(9, 13, 11, 3, 14, -4);
    g.closePath();
    g.fill();
    g.strokeStyle = "#403629";
    g.lineWidth = 2;
    g.stroke();
    g.strokeStyle = "#ffdfad77";
    g.lineWidth = 2;
    g.beginPath(); g.moveTo(-4, 4); g.quadraticCurveTo(-7, 15, -4, 24); g.stroke();
    const cap = g.createRadialGradient(-9, -19, 3, 2, -7, 37);
    cap.addColorStop(0, capStops[0]);
    cap.addColorStop(.39, capStops[1]);
    cap.addColorStop(.88, capStops[2]);
    cap.addColorStop(1, "#241b17");
    g.fillStyle = cap;
    g.beginPath();
    g.moveTo(-32, -2);
    g.bezierCurveTo(-28, -24, -20, -35, -3, -36);
    g.bezierCurveTo(19, -39, 33, -25, 35, -2);
    g.bezierCurveTo(14, 8, -12, 9, -32, -2);
    g.fill();
    g.lineWidth = 2.8;
    g.strokeStyle = "#241c19";
    g.stroke();
    // Curved underside, fluted gills and black edge create dimensionality.
    g.strokeStyle = "#edc699";
    g.lineWidth = 2;
    g.beginPath(); g.moveTo(-25, 1); g.quadraticCurveTo(0, 12, 28, 1); g.stroke();
    g.strokeStyle = "#442c2480";
    g.lineWidth = 1.1;
    for (let i = -21; i <= 22; i += 7) {
      g.beginPath(); g.moveTo(i, 3); g.lineTo(i * .72, 9); g.stroke();
    }
    // Gloss, speckles and individual variation.
    g.strokeStyle = "#ffe9b8a0";
    g.lineWidth = 2.1;
    g.beginPath(); g.ellipse(-7, -19, 21, 11, -.2, 3.5, 5.25); g.stroke();
    for (let i = 0; i < 15; i++) {
      const x = -24 + rng() * 48, y = -27 + rng() * 23;
      const r = .7 + rng() * 2.6;
      ellipse(g, x, y, r * 1.1, r * .58, rng() > .27 ? "#ffdf9bb8" : "#241b1755", -.2);
    }
    for (let i = 0; i < 18; i++) {
      const x = -24 + rng() * 47, y = -22 + rng() * 20;
      ellipse(g, x, y, .4 + rng() * .65, .3 + rng() * .65, "#fff6d96b");
    }
    if (kind === "magic") {
      g.shadowColor = "#e78aff";
      g.shadowBlur = 15;
      g.strokeStyle = "#e8acffba";
      g.lineWidth = 2;
      g.beginPath(); g.arc(0, -9, 31, 3.5, 5.75); g.stroke();
    }
    g.restore();
  }
  function mushroom(kind, variant) {
    const key = kind + ":" + variant;
    if (!imageCache.mushrooms[key]) {
      imageCache.mushrooms[key] = sprite(96, 96, g => drawMushroom(g, variant, kind));
    }
    return imageCache.mushrooms[key];
  }

  function pentipedeSprite(isHead, phase) {
    return sprite(100, 100, g => {
      const rng = seeded(9108 + (isHead ? 901 : 103) + phase * 19);
      g.save(); g.translate(50, 52);
      // Three pairs of sneaker-like feet, swinging opposite ways.
      const swing = [0, 4, -3, 2][phase];
      for (let pair = -1; pair <= 1; pair++) {
        for (const side of [-1, 1]) {
          const lx = pair * 15 + (pair === 0 ? swing : -swing) * .7;
          const ly = side * 23;
          g.strokeStyle = "#3b4523";
          g.lineWidth = 4.4;
          g.beginPath(); g.moveTo(lx * .65, side * 11); g.quadraticCurveTo(lx, side * 18, lx, ly); g.stroke();
          ellipse(g, lx + 4, ly + side * 2, 8, 5, "#d5b652", side * -.26);
          g.strokeStyle = "#fff4bd";
          g.lineWidth = 1.5;
          g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx + 7, ly); g.stroke();
        }
      }
      // Lower segmentation and brilliant chartreuse carapace.
      ellipse(g, 1, 6, 32, 23, "#25582a");
      const shell = shade(g, 0, 0, 38, [
        [0, "#f4f692"], [.23, isHead ? "#c2ef41" : "#abea51"],
        [.55, "#67cb38"], [.81, "#258b2e"], [1, "#164b25"]
      ]);
      g.fillStyle = shell;
      g.beginPath();
      g.moveTo(-30, 2);
      g.bezierCurveTo(-31, -25, -18, -32, 5, -34);
      g.bezierCurveTo(26, -31, 34, -13, 32, 6);
      g.bezierCurveTo(27, 26, 8, 30, -13, 22);
      g.bezierCurveTo(-23, 18, -30, 12, -30, 2);
      g.fill();
      g.strokeStyle = "#246529"; g.lineWidth = 2.5; g.stroke();
      // Painted shell highlights, fine dapple and dark seam.
      g.lineWidth = 3.5; g.strokeStyle = "#e1f7959c";
      g.beginPath(); g.ellipse(-7, -12, 19, 12, -.23, 3.4, 5.2); g.stroke();
      for (let i = 0; i < 20; i++) {
        const x = -22 + rng() * 49, y = -18 + rng() * 34;
        ellipse(g, x, y, .8 + rng() * 1.8, .6 + rng() * 1.4,
          rng() > .5 ? "#d5f17a80" : "#27682c55");
      }
      g.strokeStyle = "#225e2dd9"; g.lineWidth = 2.8;
      g.beginPath(); g.moveTo(-19, 14); g.quadraticCurveTo(3, 24, 23, 10); g.stroke();
      if (isHead) {
        // Long antennae, large bright eyes and slightly mischievous expression.
        g.strokeStyle = "#387725"; g.lineWidth = 3.2;
        g.beginPath(); g.moveTo(-13, -27); g.quadraticCurveTo(-20, -41, -28, -45);
        g.moveTo(13, -29); g.quadraticCurveTo(21, -47, 29, -47); g.stroke();
        ellipse(g, -28, -45, 4, 4, "#f0d456");
        ellipse(g, 29, -47, 4, 4, "#f0d456");
        ellipse(g, -11, -8, 11, 13, "#f6efb6");
        ellipse(g, 16, -9, 11, 13, "#f6efb6");
        ellipse(g, -8, -6, 5, 7, "#163d1e");
        ellipse(g, 18, -7, 5, 7, "#163d1e");
        ellipse(g, -9, -10, 2.4, 2.6, "#ffffff");
        ellipse(g, 17, -11, 2.4, 2.6, "#ffffff");
        g.strokeStyle = "#1f6328"; g.lineWidth = 3;
        g.beginPath(); g.moveTo(-9, 17); g.quadraticCurveTo(4, 27, 18, 15); g.stroke();
      }
      g.restore();
    });
  }
  function drawPentipedes(g, groups, t) {
    for (const group of groups) {
      for (let i = group.segments.length - 1; i >= 0; i--) {
        const s = group.segments[i], isHead = i === 0;
        const phase = (Math.floor(t * 13) + i) & 3;
        const key = (isHead ? "head" : "body") + phase;
        if (!imageCache.pentipedes[key]) imageCache.pentipedes[key] = pentipedeSprite(isHead, phase);
        g.fillStyle = "rgba(16,35,13,.47)";
        g.beginPath(); g.ellipse(s.x + 3, s.y + 12, 15.2, 5.6, 0, 0, TAU); g.fill();
        g.save();
        g.translate(s.x, s.y);
        if (group.dir < 0) g.scale(-1, 1);
        g.rotate(Math.sin(t * 10 + i) * .025);
        g.drawImage(imageCache.pentipedes[key], -19, -20, 38, 38);
        g.restore();
      }
    }
  }

  function makeEnemy(type, phase) {
    return sprite(type === "gecko" ? 180 : 128, 100, (g, w, h) => {
      g.save(); g.translate(w / 2, h / 2);
      const rng = seeded(10654 + phase * 71 + type.length * 117);
      if (type === "gecko") {
        const motion = phase ? 7 : -7;
        g.strokeStyle = "#3d6728"; g.lineWidth = 13; g.lineCap = "round";
        g.beginPath(); g.moveTo(-33, -2); g.bezierCurveTo(-69, -19 + motion, -71, 35, -91, 11); g.stroke();
        const back = shade(g, 0, 0, 42, [[0,"#d5e99a"], [.34,"#9cce64"], [.75,"#539245"], [1,"#284f30"]]);
        ellipse(g, 0, 0, 46, 16, back);
        for (const leg of [-1,1]) {
          g.strokeStyle = "#5d873c"; g.lineWidth = 6; g.lineCap = "round";
          g.beginPath(); g.moveTo(-22, leg * 9); g.lineTo(-29, leg * (24+motion*.2));
          g.moveTo(22, leg * 8); g.lineTo(28, leg * (23-motion*.2)); g.stroke();
        }
        for(let i=0;i<11;i++) ellipse(g,-36+rng()*74,-10+rng()*18,2+rng()*2,1.5+rng()*1.5,"#d9e1a277");
        ellipse(g, 38, -5, 20, 12, "#a3d668");
        ellipse(g, 47, -11, 7, 8, "#fff9dc");
        ellipse(g, 49, -12, 3, 4, "#172d20");
        g.strokeStyle="#446b36";g.lineWidth=2;
        g.beginPath();g.moveTo(45,3);g.lineTo(60,0);g.stroke();
      } else if (type === "scobster") {
        g.strokeStyle = "#7b2928";g.lineWidth=10;g.lineCap="round";
        g.beginPath();g.moveTo(-27,0);g.bezierCurveTo(-43,-15,-39,-35,-17,-38);g.stroke();
        ellipse(g,-17,-38,9,7,"#e9a654");
        const shell=shade(g,0,1,37,[[0,"#ffd592"],[.37,"#d77b40"],[.76,"#9c3432"],[1,"#461c24"]]);
        ellipse(g,0,2,36,25,shell);
        g.strokeStyle="#6e2723";g.lineWidth=8;
        for(const side of [-1,1]) {
          g.beginPath();g.moveTo(13,side*10);g.lineTo(34,side*26);g.lineTo(49,side*17);g.stroke();
          ellipse(g,49,side*17,12,9,"#dc733d");
        }
        ellipse(g,21,-11,8,8,"#f5e8ae");ellipse(g,23,-12,3.5,4.2,"#1f1b22");
        g.strokeStyle="#e5a46b91";g.lineWidth=2.5;
        for(let i=-1;i<=1;i++){g.beginPath();g.moveTo(-15+i*13,-18);g.lineTo(-10+i*13,-14);g.stroke()}
      } else if (type === "flea") {
        const shell=shade(g,0,0,31,[[0,"#b4a6f8"],[.34,"#575ab7"],[.8,"#303a70"],[1,"#151d3a"]]);
        ellipse(g,0,0,24,31,shell);
        for(const side of [-1,1]){
          g.strokeStyle="#6756af";g.lineWidth=4;g.beginPath();
          g.moveTo(side*12,-7);g.lineTo(side*28,-19 + phase*5);
          g.moveTo(side*15,8);g.lineTo(side*30,19-phase*5);g.stroke();
        }
        ellipse(g,-9,-5,10,11,"#ece6ff");
        ellipse(g,10,-5,10,11,"#ece6ff");
        ellipse(g,-8,-3,4,5,"#151e4a");ellipse(g,10,-3,4,5,"#151e4a");
        g.strokeStyle="#c9baec";g.lineWidth=2;
        g.beginPath();g.moveTo(-12,18);g.quadraticCurveTo(0,23,11,17);g.stroke();
      } else {
        const body=g.createLinearGradient(0,-20,0,24);
        body.addColorStop(0,"#eeeaca");body.addColorStop(.45,"#739b9d");body.addColorStop(1,"#313a60");
        ellipse(g,0,6,44,18,body);
        const dome=shade(g,0,-10,29,[[0,"#ecfff0"],[.45,"#96c0b5"],[1,"#31575d"]]);
        ellipse(g,0,-8,24,22,dome);
        ellipse(g,0,-14,9,12,"#f6fcde");
        ellipse(g,0,-13,4,6,"#a24e75");
        g.strokeStyle="#c9e1c2";g.lineWidth=2;
        g.beginPath();g.ellipse(0,6,44,18,0,Math.PI,TAU);g.stroke();
        for(const x of [-30,-16,0,16,30])ellipse(g,x,13,3.5,2.7,"#e0e9a2");
      }
      g.restore();
    });
  }
  function drawCritters(g, critters, time) {
    for (const c of critters) {
      const phase = Math.floor(time * 7) % 2;
      const key = c.type + phase;
      if (!imageCache.enemies[key]) imageCache.enemies[key] = makeEnemy(c.type, phase);
      const picture = imageCache.enemies[key];
      const width = c.type === "gecko" ? 75 : c.type === "ufo" ? 54 : 48;
      const height = c.type === "gecko" ? 44 : 44;
      g.fillStyle = "rgba(5,24,14,.26)";
      g.beginPath();g.ellipse(c.x+4,c.y+12,width*.37,5.5,0,0,TAU);g.fill();
      g.save();g.translate(c.x,c.y);if(c.dir<0)g.scale(-1,1);
      g.rotate(Math.sin(c.phase)*.10);
      g.drawImage(picture,-width/2,-height/2,width,height);g.restore();
    }
  }
  function makeCrystal() {
    return sprite(112, 144, g => {
      g.save();g.translate(56,71);
      const glow=g.createRadialGradient(0,0,2,0,0,46);
      glow.addColorStop(0,"#a8eeff94");glow.addColorStop(1,"#0e9ef800");
      ellipse(g,0,0,46,53,glow);
      // Faceted jewel silhouette with translucent edges and asymmetric reflection.
      path(g,"#103c7d", [0,-60,39,-23,31,28,0,60,-35,30,-42,-23]);
      path(g,"#6de0ff", [0,-60,-42,-23,-12,10]);
      path(g,"#bdf6ff", [0,-60,-30,-25,-12,10,-4,-22]);
      path(g,"#2079d7", [0,-60,-4,-22,15,1,-12,10]);
      path(g,"#168fe0", [0,-60,39,-23,15,1,-4,-22]);
      path(g,"#07499b", [39,-23,31,28,15,1]);
      path(g,"#3caaf4", [-42,-23,-35,30,-12,10]);
      path(g,"#225bad", [-35,30,0,60,-12,10]);
      path(g,"#05458e", [-12,10,15,1,31,28,0,60]);
      g.strokeStyle="#d5f7ffbd";g.lineWidth=2.1;g.beginPath();
      g.moveTo(0,-60);g.lineTo(-12,10);g.lineTo(0,60);g.moveTo(-12,10);g.lineTo(15,1);g.stroke();
      g.strokeStyle="#ffffffc8";g.lineWidth=3;g.beginPath();g.moveTo(-29,-27);g.lineTo(-6,-47);g.stroke();
      const core=shade(g,0,-7,18,[[0,"#efffff"],[.35,"#8cedffb8"],[1,"#91dfff00"]]);
      ellipse(g,0,-7,18,26,core);
      ellipse(g,-3,-20,4.4,8,"#ecffffc4");
      g.restore();
    });
  }
  function drawCrystal(g, player, time) {
    if (player.inv > 0 && Math.sin(time * 26) < -.25) return;
    if (!imageCache.crystal) imageCache.crystal = makeCrystal();
    const x=player.x,y=player.y;
    g.fillStyle="rgba(4,21,24,.54)";
    g.beginPath();g.ellipse(x+5,y+17,19,5,0,0,TAU);g.fill();
    g.save();g.translate(x,y);
    if(player.shield>0){
      g.strokeStyle="#b8fcfd";g.lineWidth=2;
      g.shadowColor="#53cbfc";g.shadowBlur=14;
      g.beginPath();g.arc(0,0,32+Math.sin(time*6)*1.8,0,TAU);g.stroke();g.shadowBlur=0;
    }
    g.shadowColor="#4bb6fa";g.shadowBlur=13;
    g.drawImage(imageCache.crystal,-21,-28,42,56);
    g.restore();
  }

  window.ApeironArt = {
    renderGround,
    mushroom,
    drawPentipedes,
    drawCritters,
    drawCrystal
  };
})();
