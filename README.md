# OUTBREAK: Zero Patient · v0.2.0

Offline pixel-art Android outbreak simulation, built with Canvas and a fullscreen WebView.

## v0.2
- Varied, uneven city geometry: narrow alleys, broad roads, parks, squares, yards, marketplaces, parking and mixed-use buildings.
- Grid-based A* navigation plus steering, broadphase wall collision index, path caching and pathfinding budget.
- Destructible doors and windows, with damage stages, splinters / glass particles; civilians open doors while zombies bash through them. Barricades block movement and can be destroyed.
- More realistic pursuit: civilians differ in stamina, most are slower than normal zombies; sprinting is rare.
- Separate active and passive evolution branches, escalating costs and game-changing passive mutations, new active breach ability.
- Automated smoke and navigation tests and 1000-agent performance probe.

## Build
Run `node test/smoke.cjs` and `gradle :app:assembleDebug`. CI builds debug and test-signed optimized APKs. Test signatures are disposable and not intended for Play Store releases.

## Controls
Choose map and difficulty, upgrade genome, select patient zero. Drag / pinch to navigate; tap unlocked active skills at the bottom. Progression saves locally.
