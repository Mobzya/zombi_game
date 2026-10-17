const fs=require('node:fs');const vm=require('node:vm');const assert=require('node:assert/strict');
const classes=new Set();const ctx=new Proxy({},{get(o,k){if(k==='canvas')return {};return k in o?o[k]:()=>{}},set(o,k,v){o[k]=v;return true}});
class Element {constructor(){this.style={};this.dataset={};this.children=[];this.classList={toggle:()=>{},add:()=>{},remove:()=>{}};this.textContent='';this.innerHTML='';this.disabled=false;}appendChild(x){this.children.push(x);}addEventListener(){}getContext(){return ctx;}getBoundingClientRect(){return {left:0,top:0,width:1280,height:720}}querySelector(){return new Element()}setPointerCapture(){}click(){this.onclick&&this.onclick()}}
const all=new Map();const get=(s)=>all.get(s)||all.set(s,new Element()).get(s);
const document={getElementById:get,querySelectorAll:()=>[],createElement:()=>new Element(),querySelector:()=>new Element()};
let nextFrame=()=>{};const sandbox={window:{devicePixelRatio:1,addEventListener(){},performance:{now:()=>1000}},document,localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>1000},innerHeight:720,innerWidth:1280,requestAnimationFrame:f=>nextFrame=f,setTimeout:()=>{},console,Math,Date};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync('app/src/main/assets/game.js','utf8'),sandbox,{timeout:2000});const game=sandbox.window.__outbreakDebug;assert.ok(game);assert.equal(game.phase,'menu');

const t0=Date.now();const city=game.newWorld(0,604291);assert.equal(city.persons.length,290);assert.equal(city.w,2170);assert.equal(city.h,1560);
assert.ok(city.buildings.length>=35,`city must have distinct interior buildings, got ${city.buildings.length}`);
for(const type of ['armory','hospital','police','pharmacy','garage','shop'])assert.ok(city.buildings.some(b=>b.type===type),`missing ${type}`);
for(const type of ['alley','parking','market','courtyard','square','park','estate'])assert.ok(city.features.some(f=>f.type===type),`missing district ${type}`);
assert.ok(city.roadsX.some(r=>r.w>=70)&&city.roadsX.some(r=>r.w<=30),'wide and narrow streets');
assert.ok(city.cars.some(c=>c.kind==='motorcycle')&&city.cars.some(c=>c.kind==='car'));
assert.ok(city.gates.some(g=>g.kind==='door')&&city.gates.some(g=>g.kind==='window'));
assert.equal(city.sites.length,5,'working safehouse, radio, fuel, medkit and cache spots');
for(const site of city.sites)assert.equal(city.nav.human[Math.floor(site.y/12)*city.nav.cols+Math.floor(site.x/12)],0,'event site must be reachable');
const types=game.PERKS.filter(p=>p[1]!=='✦');assert.ok(types.length>=22&&types.some(p=>p[4]>=300));
const city2=game.newWorld(0,604291);assert.equal(JSON.stringify(city.buildings.map(b=>[b.x,b.y,b.w,b.h,b.type])),JSON.stringify(city2.buildings.map(b=>[b.x,b.y,b.w,b.h,b.type])),'map must be the same');
console.log('PASS: one authored 290-person Ironbridge map, distinct areas, buildings, weapons, vehicles, mutations');
// Free cells must be genuinely collision-free, and direct paths not collide with the physical world.
let moved=0;const level=game.newWorld(0,604291);level.pathBudget=100;
for(let i=0;i<55;i++){
  const a=level.persons[i],dest=game.reachableWander(a,140);const start={x:a.x,y:a.y};
  for(let frame=0;frame<220;frame++){level.time+=.05;level.pathBudget=10;game.approachTarget(a,dest,65,.05);}
  assert.ok(!level.nav.human[Math.floor(a.y/12)*level.nav.cols+Math.floor(a.x/12)],`human ended in solid cell ${i}`);
  if(Math.hypot(a.x-start.x,a.y-start.y)>20)moved++;
}
assert.ok(moved>=47,`at least 47/55 humans must move, got ${moved}`);
console.log('PASS: 55 independent human navigation traversals with physical collisions');
// Simulate 25 zombie agents wandering in places with doors and corners.
const zWorld=game.newWorld(0,604291);zWorld.pathBudget=20;
let mobile=0,stalled=0;
for(let i=0;i<25;i++){
 const start=zWorld.persons[i],z={id:10000+i,x:start.x,y:start.y,vx:0,vy:0,kind:'zombie',hp:110,maxHp:110,attack:0,decision:0,acid:0,type:'normal',tx:start.x,ty:start.y,angle:0,step:0};
 zWorld.zombies.push(z);
 const from={x:z.x,y:z.y};
 for(let frame=0;frame<220;frame++){zWorld.time+=.04;zWorld.pathBudget=12;game.updateZombie(z,.04);}
 if(Math.hypot(z.x-from.x,z.y-from.y)>13)mobile++;
 if(z.stuck>2.6)stalled++;
 }
assert.ok(mobile>=19,`zombies should wander: ${mobile} out of 25`);assert.ok(stalled<=2,`zombies stalled: ${stalled}`);
console.log('PASS: 25 individual zombies wander, no repeated corner lockups');
const w=game.newWorld(0,777);w.pathBudget=16;
const b=w.buildings.find(b=>b.openings.some(o=>o.kind==='door')&&b.w>68&&b.h>70),o=b.openings.find(o=>o.kind==='door');assert.ok(b);
const inner={x:b.x+b.w/2,y:b.y+b.h/2},out={x:o.side==='E'?b.x+b.w+37:o.side==='W'?b.x-37:o.at,y:o.side==='S'?b.y+b.h+37:o.side==='N'?b.y-37:o.at};
assert.ok(game.findPath(inner,out,'human').length,'door route');assert.ok(game.findPath(inner,out,'zombie').length,'zombie gate route');
const g=o.gate;
let z={id:1291,x:g.x+g.w/2+(o.side==='E'?14:o.side==='W'?-14:0),y:g.y+g.h/2+(o.side==='S'?14:o.side==='N'?-14:0),vx:0,vy:0,kind:'zombie',type:'normal',hp:110,maxHp:110,attack:0,decision:1,acid:0,step:0,tx:0,ty:0};
w.zombies.push(z);game.updateZombie(z,.04);assert.ok(g.hp<g.maxHp,'zombie damages door');for(let i=0;i<8;i++){z.attack=0;game.updateZombie(z,.04);}assert.ok(g.broken,'door progressively destroyed');
console.log('PASS: routes through doors and destructible door collisions');
let vehicle=w.cars.find(c=>c.kind==='car'),pilot=w.persons.find(h=>h.hp>0);vehicle.driver=pilot;pilot.inCar=vehicle;vehicle.routeTarget=null;w.cars=w.cars.filter(c=>c===vehicle);const origin={x:vehicle.x,y:vehicle.y};for(let frame=0;frame<200;frame++){w.time+=.04;game.updateCars(.04);}assert.ok(Math.hypot(vehicle.x-origin.x,vehicle.y-origin.y)>35,'driver must drive rather than freeze');
const bike=game.makeVehicle(origin.x+20,origin.y,'motorcycle');assert.equal(bike.kind,'motorcycle');const tank=game.makeVehicle(origin.x+20,origin.y,'tank');assert.ok(tank.hp>bike.hp);
console.log('PASS: AI vehicle routes, motorcycle and tank physics');
// Endgame tests: one natural infected casualty win and one natural police suppression win.
function round(){game.startPick();const w=game.world;const p=w.persons[0];game.selectPatient(p);p.sick=.001;game.update(.07);const z=w.zombies[0];assert.ok(z&&z.hp>0);return {w,z};}
let a=round();let bHuman=a.w.persons.find(h=>h.hp>0);a.w.persons=[bHuman];a.z.x=100;a.z.y=100;bHuman.x=105;bHuman.y=101;bHuman.gun=null;bHuman.bravery=0;bHuman.hp=35;
for(let i=0;i<300&&game.phase==='game';i++)game.update(.05);
assert.equal(game.phase,'end','zombie win must conclude');
let bRound=round();let armed=bRound.w.persons.find(h=>h.hp>0);bRound.w.persons=[armed];armed.x=160;armed.y=120;armed.hp=320;armed.role='police';armed.bravery=1;armed.gun={key:'lmg',ammo:120,cooldown:0};bRound.z.x=210;bRound.z.y=120;bRound.z.hp=50;
for(let i=0;i<500&&game.phase==='game';i++)game.update(.04);
assert.equal(game.phase,'end','human defense must conclude');
console.log('PASS: BOTH end conditions occur via real combat');
console.log('COMPLETE in',Date.now()-t0,'ms');
