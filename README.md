# Apeiron X — Unofficial Browser Tribute

A playable, original-code browser homage to Ambrosia Software's *Apeiron* (1995) and *Apeiron X* (2004). Built as a self-contained HTML5 game with Canvas 2D rendering, procedural 16-bit-inspired sprite artwork, painted-looking shadows, several textured field palettes, animated particles, and custom synthesized Web Audio effects. No dependencies, tracking, or third-party game assets.

## Play

**[Play Apeiron X v0.4 on GitHub Pages](https://hambonesoftware.github.io/apeironX/)**

If the link gives a 404, open [Settings → Pages](https://github.com/hambonesoftware/apeironX/settings/pages) and set:
- **Source:** Deploy from a branch
- **Branch:** main
- **Folder:** / (root)
- Press **Save**. GitHub normally publishes the page within a few minutes.

## Controls

| Platform | Move | Fire | Pause |
| --- | --- | --- | --- |
| Desktop | Mouse, arrows, or WASD | Hold mouse button or Space | P, Escape, or Pause button |
| iPhone / iPad | Drag your finger in the game field | Auto-fire while touching | Pause button |

Audio starts after pressing **Enter the Patch** (browser autoplay policy). **Sound On/Off** in the top bar.

## Living Mushroom Patch v0.4

The mushroom field now changes in response to the player and its inhabitants.

- **Cheech the Pentipede:** smooth inter-cell interpolation and gait animation remain; body segments split into independent groups when hit. Poison mushrooms trigger descending attacks. A Pentipede reaching the bottom calls in extra single-segment attackers from the sides, within a per-wave spawn limit.
- **The mushrooms:** normal, poisonous red, psychedelic bonus, and reflective silver-highlighted varieties. Destroyed mushrooms can tumble, bounce, and be shot in midair for substantial bonus points (3,000 standard or 6,000 poison). The playfield's mushrooms act as obstacles, rewards, and shifting tactical cover.
- **The supporting cast:** Groucho (flea) contaminates nearby mushrooms, Gordon (gecko) plants poison mushrooms, Larry (Scobster) eats through obstacles, and saucers clear mushrooms from above.
- **Bonus frenzy:** guided plasma homes toward the nearest Pentipede, ricochet plasma can reflect from mushroom surfaces, machine-gun and triple shots return, shield and timed ×10 psychedelic frenzy are available, and cleanup coins clear the player's zone.
- **More satisfying impacts:** independent retro-synth sounds for reflected shots, poison, mushroom tumbling, enemy deaths, bonus acquisition, and wave pressure. Expanding impact rings, score pop-ups, camera nudges, and animated coin sprites reinforce the action.
- **Arcade pacing:** gentler early-wave enemy spawning followed by increasing pressure, without adding mandatory achievements or interrupting the main play area.
- **Mobile controls:** touch-to-move-and-fire, no automatic pause on browser focus changes, locked touch scrolling in the game, and a fixed-height lives indicator (up to 8 lives) that cannot push the playfield down.

## Code architecture and tests

- `index.html` — game simulation, rendering, sound synthesis, keyboard/touch controls and responsive layout.
- `art.js` — separately cached, independently drawn sprite sheets, terrain and animated power-up coin artwork.
- `living-patch.js` — environmental interactions, falling-mushroom physics, homing guidance, reflected plasma, extra attacker spawning and visual effects.
- `tests/smoke.test.cjs` — dependency-free Node regression tests of key mechanics, mobile HUD safeguards, and 1,200 simulated frames.
- `.github/workflows/arcade-tests.yml` — automatically runs the regression tests on gameplay updates.

The original published Apple/Mac game is a reference for atmosphere, not a source of copied assets. This browser version includes some newly designed bonuses and effects, so it is **not an exact or licensed recreation**. Matching the exact original sound effects, animation timing, and wave balancing will require further side-by-side testing against original gameplay footage. Native iPhone touch and performance testing is still advisable.

## Acknowledgment

*Apeiron* and *Apeiron X*, the original artwork, audio, characters, and trademarks are the work of their respective rights holders, including Ambrosia Software. This non-commercial fan project is not affiliated with or endorsed by Ambrosia Software; it uses independently drawn graphics, synthesized sounds, and original source code.
