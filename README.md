# OUTBREAK: Zero Patient · v0.1.0

An offline pixel-style top-down zombie outbreak simulator for Android, packaged in a fullscreen landscape WebView; procedural Canvas rendering, no remote assets or backend.

## Current features
- 3 procedurally populated city sizes: 100 / 500 / 1,000 citizens; 3 difficulty levels.
- Choose patient zero; 10–15 second incubation followed by visible symptoms and transformation.
- Autonomous civilians, police, medics, fighters, team-oriented survivors, opportunistic weapon pickup, fleeing and shelter behavior.
- Multiple zombie mutations (runner, brute, spitter), swarm rally, temporary rage and spore ability.
- Hospitals, police stations, gun shops, pharmacies, stores and garages with stored finite supplies.
- Finite guns/ammo: pistols, shotguns, SMGs, rifles and grenades; dropped weapons are recoverable.
- Cars with drivers and passengers, collisions, explosions, fires and particle effects.
- Panic escalation, police reinforcements, riot response, barricades, armed convoys and endgame bombardment.
- 14 branching, persistent mutation upgrades purchased with coins awarded at the end of a round.
- Touch dragging, pinch zoom, minimap, up to ×3 simulation speed, pause, pixel-art drawing.

## Limitations
This is a **first-playable prototype**, not a production game. AI uses local steering around walls, not complete A* navigation. Physics is arcade collision/knockback, not a rigid-body solver; audio is synthesized. Large map performance depends on device. Optimized release APK is signed with an **ephemeral test key** for sideload evaluation only; publish with your own secure release key.

## Build
On GitHub Actions, `.github/workflows/build-apk.yml` installs Java 17, SDK 35 and Gradle 8.10.2; runs `node --check`, `node test/smoke.cjs`, assembles debug and minified release, signs the latter with an ephemeral key and uploads both APKs.

For local builds: Java 17, Android SDK platform 35, Android Gradle Plugin 8.7.3, Gradle 8.10.2; run `gradle :app:assembleDebug`.

## Gameplay
Select a map and difficulty, buy upgrades, press **ВЫБРАТЬ НОСИТЕЛЯ**, and tap one inhabitant. Initial incubation is 10–15s. Wait for infection to expand. Buy more mutations after the round. On the game screen use the three abilities when unlocked; drag/pinch the city, adjust pause and ×1/×2/×3 speed.
