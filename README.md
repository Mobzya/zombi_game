# OUTBREAK Zero Patient · 0.4.0 — Ironbridge

Fully offline pixel-art city simulation for Android, with a Java WebView wrapper and Canvas game loop. This is an experimental prototype, not a production game.

## Fixed city, navigation and population accounting
- One permanent, varied city: 2170 × 1560 and 290 original inhabitants, with roads, courtyards, alleys, warehouses, medical sites and police stations. Only event sites vary.
- Dynamic A* routing and collision-aware wandering; late-game citywide zombie sweeps distribute hunters among the last ~55 human targets. Survivors are revealed as orange pips on the minimap when fewer than 46 remain.
- Explicit finite government manpower budget (5/14/24 by difficulty); unlimited police reinforcements cannot prevent completion. HUD separates original citizens, surviving responders and remaining reserves. Counts are derived from living entities, not guessed.
- Region flood-fill checks initial human placement against the road-connected navigation graph, with reachable-cell repair. Zombie routes can consider and destroy locked doors, windows and barricades.
- Human and zombie combat end in faction victories only when the actual conditions hold; no forced human victory at time 900s.

## 20 alert-gated random events
One-shot director cards (minor, important, severe, catastrophic): rumors, neighborhood mutual aid, volunteer care, radio dispatch, traffic panic, armory looting, road accident, blackout, mobile medics, sirens, militia, checkpoints, sniper watch, toxic leak, vehicle evacuation, supply drop, quarantine, recon drone, artillery and air strike. Each is gated by alarm level, once per round, and executes gameplay effects. Bombardment is queued in game time instead of non-deterministic browser timers. Not all events necessarily occur in a single round.

## Interactions, mutations, weapons
- Medics consume finite kits to heal nearby humans; organizers lower panic, rally groups and construct barriers with material; armed characters share limited ammunition. AI characters collect dropped guns, run for cars/motorcycles, drive or ram infected, seek shelter, or fight. Government transport, including rare tanks, uses a finite supply budget.
- 18 weapon classes: pistols, SMG, assault rifle, revolver, shotgun, carbine, LMG, rifle, sniper, grenades, molotov, hunting rifle, crossbow, double barrel, machine pistol, flamethrower, flare launcher and taser; speed, damage, rate, magazines and special effects vary. Real drop/stock/arrival locations.
- Regular, runner, armored, brute, spitter, leaper and howler zombies; passive genome adds upgrades for citywide hunt, siege, pack feeding, heavy-unit assault and high-alert surge.

## Verification
GitHub Actions runs syntax checking, smoke tests for navigation, doors, vehicles and victory of both factions, and regression scenarios for all 20 events, connected initial spawns, finite reinforcements, and a distributed group of 30 surviving humans hunted down by a horde. Builds both a debug APK and an optimized APK with a **disposable test signing key**. CI is not physical-device performance/compatibility testing. In particular, gameplay is approximate and edge cases are possible.

> Android target SDK 35, minimum 24, Java 17, Gradle 8.10.2. Run `gradle :app:assembleDebug`. Test-signed releases can require uninstalling old versions before installing; uninstallation deletes local progress.
