# Apeiron X — Unofficial Browser Tribute

A playable, original-code browser homage to Ambrosia Software's *Apeiron* (1995) and *Apeiron X* (2004). Built as a self-contained HTML5 game with Canvas 2D rendering, procedural 16-bit-inspired sprite artwork, painted-looking shadows, several textured field palettes, animated particles, and custom synthesized Web Audio effects. No dependencies, tracking, or third-party game assets.

## Play

**[Play Apeiron X — latest GitHub Pages build](https://hambonesoftware.github.io/apeironX/)**

If the link gives a 404, open [Settings → Pages](https://github.com/hambonesoftware/apeironX/settings/pages) and set:
- **Source:** Deploy from a branch
- **Branch:** main
- **Folder:** / (root)
- Press **Save**. GitHub normally publishes the page within a few minutes.

## Controls

| Platform | Move | Fire | Pause |
| --- | --- | --- | --- |
| Desktop | Direct, responsive mouse positioning; arrows or WASD | Mouse press or Space fires instantly; hold for repeat | P, Escape, or Pause button |
| iPhone / iPad | **Trackpad (default):** touch and drag to move by your finger’s movement, without jumping to the touch location. **Direct:** crystal follows your finger; switch under ☰ options. | Touch and hold to fire; shots start immediately | Pause button |

Audio starts after pressing **Enter the Patch** (browser autoplay policy). **Sound On/Off** in the top bar.

## Psychedelic Mushroom World Shift (November 2026)

Destroying a **psychedelic mushroom** activates the existing eight-second ×10 scoring frenzy and now transforms the whole on-screen experience. The world retains exact collision geometry and controls; the change is purely visual.

- The entire 720×760 playing field cycles gradually through saturated hues, including grass, enemies, mushrooms, crystal, and collectible coins.
- Soft radial color waves drift across the terrain; mushroom halos, Pentipede segment halos, and glowing rings around every creature family add motion without requiring large shader textures.
- Plasma shots turn rainbow-colored and retain the corrected forward-moving projectile streaks. The crystal, enemies, and coins have independently colored aura outlines.
- Concentric psychedelic patterns animate over the playfield; the Classic Arcade scorebug, status label, and controls receive gently changing neon borders.
- Effects fade in and out rather than abruptly popping; pausing freezes their simulation, and a new game resets everything. There are no fast strobe flashes or changes to hitboxes.
- If the OS requests **Reduce Motion**, the world shifts to a static softer palette and fewer light pools; pulsing and animated color cycling are disabled.
- The effect is independent, dependency-free code in `psychedelic-fx.js`, with a dedicated `tests/psychedelic.test.cjs` covering lifetime, pausing, colors, reduced motion, and reset behavior.

## Arcade Control Fidelity update (Nov 2026)

A targeted gameplay-feel revision based on original Macintosh descriptions of precise mouse control and automatic repeated shots.

- **Zero-easing control:** mouse and finger movement directly control the crystal, rather than interpolating toward a delayed target. Mushroom collision is still enforced along the movement path; Diamond/pass-through remains effective.
- **Thumb-friendly touch:** the default touch mode uses relative trackpad movement: placing a finger on the field starts firing but does not teleport the crystal underneath the finger. Moving that finger moves the crystal by the same on-screen amount. Direct touch positioning remains selectable in the in-game ☰ arcade options; the choice is stored locally.
- **Immediate trigger:** mouse press, finger-down, and first Space press create a plasma shot without waiting for the next simulation frame. Release/re-press resets the initial shot delay. Sustained fire is tuned at about 7.6 shots per second, versus roughly 14.5 with machine-gun power.
- **Visible plasma:** glowing bolts now draw with the correct tail-to-tip direction, instead of an almost zero-length line. A brief muzzle flash reinforces each shot.
- **Fair reaction order:** shots resolve before enemy contact damage in the same frame, so a last-instant hit can save the player rather than register as an unavoidable death.
- **Input regression tests:** `tests/arcade-feel.test.cjs` exercises pointer event handling, default trackpad drag, direct mode, immediate firing, visible shot direction, and shots beating simultaneous contact. Browser tests also exercise the touch-mode options on emulated phone and tablet.
- This is a feel-focused refinement, **not an assertion of exact original shot frequency or input filtering**; physical-device play remains the best validation of the subjective controls.

## Arcade Perfection v0.5

This release focuses on how the game plays, rather than another sprite replacement.

- **Wave director:** `arcade-director.js` orchestrates per-wave encounter budgets, wave-specific enemy combinations, simultaneous-enemy caps, danger-aware delays, and recovery time after a lost life. The first two waves introduce enemies gently; later waves increase variety and pressure without requiring endless enemy spam.
- **Precision plasma:** projectile collisions use swept segment-to-circle checks between frames instead of single-point checks, reducing missed targets when an iPhone renders at a lower frame rate. The first object along the bullet path wins.
- **Arcade sound mix:** synthesized effects have small pitch variations, a dynamics limiter, and shared noise-buffer synthesis to avoid needless memory allocations during frantic shooting.
- **Local top ten:** `arcade-scores.js` stores up to ten entries on this device, with validated three-character initials and an in-game Top 10 button. Scores are not uploaded.
- **Mobile arcade mode:** fixed-height scoreboard and toolbar, stable three-button controls, safe viewport rules, and standalone home-screen metadata. Web pages cannot override all system-level gestures; full native iOS testing is still needed.
- **Balance regression tests:** `tests/director-balance.test.cjs` simulates 3,000 deterministic scripted encounter scenarios and asserts enemy and budget caps. `tests/bot-play.test.cjs` runs 36 seeded headless game-loop sessions through three AI strategies. `tests/scores.test.cjs` verifies local-score persistence, ranking, and initials sanitization. These are automated checks, not a substitute for real-player balancing or performance testing on physical phones.

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
- `arcade-director.js` — seeded and budgeted wave pacing with recovery periods and threat caps.
- `arcade-scores.js` — local top-ten score table with initials validation.
- `tests/smoke.test.cjs` — dependency-free Node regression tests of key mechanics, mobile HUD safeguards, and 1,200 simulated frames.
- `tests/director-balance.test.cjs`, `tests/bot-play.test.cjs`, `tests/scores.test.cjs` — seeded balancing, headless gameplay and persistent leaderboard tests.
- `.github/workflows/arcade-tests.yml` — automatically runs the regression tests on gameplay updates.

The original published Apple/Mac game is a reference for atmosphere, not a source of copied assets. This browser version includes some newly designed bonuses and effects, so it is **not an exact or licensed recreation**. Matching the exact original sound effects, animation timing, and wave balancing will require further side-by-side testing against original gameplay footage. Native iPhone touch and performance testing is still advisable.

## Acknowledgment

*Apeiron* and *Apeiron X*, the original artwork, audio, characters, and trademarks are the work of their respective rights holders, including Ambrosia Software. This non-commercial fan project is not affiliated with or endorsed by Ambrosia Software; it uses independently drawn graphics, synthesized sounds, and original source code.

## Ambrosia-original "Yummies" fidelity pass (November 2026)

The collectible bonus system now follows the **Apeiron 1995 official FAQ**, rather than borrowing Barrack's power-ups. Apeiron X kept the original game's core mechanics. This remains an independently coded and independently illustrated tribute, not a licensed reconstruction.

- **Squiggly-line coin:** Guided plasma that curves toward the Pentipede.
- **Diamond coin:** Pass through mushrooms in the lower player area; ordinary movement is obstructed by those mushrooms.
- **Orange vertical dashes:** Rapid-fire machine gun.
- **Sprinkly Shield:** Timed invulnerability, not a one-hit shield.
- **Yummy Lock:** The acquired persistent weapon and diamond powers survive death; without the lock, death clears them.
- **House Cleaning:** Clears mushrooms out of the player's lower area.
- **Extra Man:** One additional crystal, capped at eight lives.
- **Bonus Multiplier:** Special ×2 bonus multiplier target, **shot** to collect, which multiplies the end-of-wave bonus. Ordinary enemy scores are not multiplied by it.
- **Psychedelic mushroom:** Triggered by shooting the glowing mushroom, awarding ×10 scoring temporarily and distinct synthesized feedback.

Regular coins bounce away when struck by plasma shots; collecting them requires catching them with the crystal instead. Shoot a multiplier target to activate it. Coins expire if ignored, and can be knocked out of reach. Seven original types are the normal drop pool, with original-inspired sprite symbols. The existing custom triple-plasma/ricochet code is retained for compatibility, but those powers no longer drop as ordinary coins.

Weapon/diamond powers last until death (or beyond with Yummy Lock). Timed shield/frenzy effects expire normally. Exact random odds, shot physics and art have been tuned for this browser homage rather than asserted to match proprietary internals.

**Sources:** [Ambrosia Apeiron FAQ (1995)](https://groups.google.com/g/comp.sys.mac.games/c/89G3QB08HYI) and [Macworld on Apeiron X retaining original gameplay (2004)](https://www.macworld.com/article/173441/apeironx.html).

**Verification:** `tests/yummies.test.cjs` checks 10,000 seeded drop draws, coin recoil, blocker, lock and life behavior; `tests/smoke.test.cjs` checks the integrated game interactions; the existing 36-run bot and 3,000-encounter director checks still run. A Chromium browser check tests phone/tablet/desktop viewports and touch. These do not substitute for real-device iOS Safari testing.


## Hambone PLAY Classic Arcade HUD

The original 720×760 canvas and arcade simulation now appear in a clean, portrait-friendly cabinet display. Hambone PLAY v1 is vendored in vendor/hambone-play to avoid runtime cross-site dependencies. The top in-world scorebug displays live score, wave and lives. The original Pause, Sound and Local Top 10 controls keep their event handlers; Sound and Top 10 move into the contextual options tray.

The source graphics, pentipede movement, power-ups, score multipliers, pointer-to-crystal movement, and shooting code remain unchanged. The fixed canvas aspect ratio is preserved instead of stretching or cropping the gameplay area to fill arbitrary phone screens.

The GitHub Pages workflow now includes a Classic Arcade HUD browser test on phone portrait and landscape layouts in addition to the existing physics, bonuses and score tests. Chromium mobile emulation checks interaction and layout; real Safari testing is still useful.
