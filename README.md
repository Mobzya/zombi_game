# OUTBREAK: Zero Patient — v0.3 Ironbridge

**Android first-playable prototype**: fully offline Canvas pixel-art outbreak strategy, Java Android WebView wrapper, no backend or art asset downloads.

## Ironbridge — one authored city

A **single fixed 2170 × 1560 city with 290 residents** and three independently adjustable difficulties. Curated arterial roads, service alleys, large plazas, market stalls, residential courts, industry, parks, parking lots, pharmacies, police posts, clinics, garages and armories. Building footprints and dedicated entry doors/windows are consistent across rounds. Dynamic radio, fuel, shelter, medic and cache event locations vary between sessions in walkable locations, and have real effects and finite resources.

## AI / navigation

- A* grid search with corner constraints, physical circle-versus-rectangle collision, spatial wall indexing, diagonal-swept visibility, steering on slide collisions, waypoint invalidation and stuck recovery.
- When no humans are detectable, zombies pick traversable local waypoints and patrol rather than push into walls.
- Zombies damage doors/windows through multiple attacks. Humans can open doors and seek shelter.
- Distinct resident personalities: police, brave fighters, medics, organizers, drivers, fleeing civilians. Select threatened residents reserve and run toward a real free vehicle, board and drive.
- 25 initial cars, motorcycles and one armored vehicle; road intersection navigation, collision, fuel consumption, ramming and picking up passengers. Police support may deploy armored vehicles and rarely a tank after an escalated alert.

## Combat & progression

- **10 physical weapon variants**, including revolver, carbine, light machine gun, sniper rifle, molotov, grenade, pistol, SMG, shotgun and assault rifle. Ammunition is finite and weapons drop on death. Emergency caches draw from physical armory reserves.
- Regular, runner, brute, spitter, leaper, howler and armored infected. Rare mutations can occur without upgrades; passive mutation purchases increase odds and add tactical effects.
- **26 evolution upgrades** separated into active skills and passive mutational milestones: coordinated packs, body adaptation, breaking windows, volatile death, elite outbreak and others.
- 3 difficulties change threat response, raids and citizen aggression. Both epidemic victory (no living residents) and military victory (last infected destroyed, including awaiting reanimations) are supported.

## Verification and caveats

Automated Node smoke/integration tests validate fixed city geometry, 55 human navigation traversals, 25 zombie patrols, progressive gate destruction, vehicle routing, motorcycles/tanks and both end conditions through live combat. CI installs SDK 35, Gradle 8.10.2 and Java 17, then builds Debug and test-signed optimized APKs.

This is an **experimental alpha**: the collision/steering and transport model are arcade approximations; not a full rigid-body engine. Tests verify sampled scenarios but cannot guarantee every possible arrangement is free of stalls. Performance may vary by phone and game speed. GitHub Actions signs with disposable test keystore, not a production signing certificate. Installing over a previous APK can require uninstall, which may clear local saves.

## Install/build

The GitHub Actions workflow publishes a zipped `.apk` artifact. For manual builds with Android SDK 35 and JDK 17: `gradle :app:assembleDebug`. Open APK on an Android 7+ phone and allow sideload if asked. This app does not request network permissions.
