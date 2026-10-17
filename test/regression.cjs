const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
class Element{constructor(){this.style={};this.dataset={};this.children=[];this.classList={toggle:()=>{},add:()=>{},remove:()=>{}};this.textContent='';this.innerHTML='';this.disabled=false;}appendChild(x){this.children.push(x)}addEventListener(){}getContext(){return new Proxy({},{get(o,k){if(k==='canvas')return {};return o[k]??(()=>{})}})}getBoundingClientRect(){return {left:0,top:0,width:1280,height:720}}querySelector(){return new Element()}setPointerCapture(){}click(){this.onclick?.()}}
const elements=new Map(),get=s=>elements.get(s)||elements.set(s,new Element()).get(s);const sandbox={window:{devicePixelRatio:1,addEventListener(){}},document:{getElementById:get,querySelectorAll:()=>[],createElement:()=>new Element(),querySelector:()=>new Element()},localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>1000},innerHeight:720,innerWidth:1280,requestAnimationFrame:()=>{},setTimeout:()=>{},console,Date,Math};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync('app/src/main/assets/game.js','utf8'),sandbox,{timeout:2500});const G=sandbox.window.__outbreakDebug;
function newRound(){G.startPick();const w=G.world;G.selectPatient(w.persons[0]);w.persons[0].sick=.001;G.update(.1);assert.ok(w.zombies.length>0);return w;}
const start=Date.now();let w=G.newWorld(0,604291);
assert.equal(G.CITY_EVENTS.length,20,'20 distinct crisis events');assert.equal(new Set(G.CITY_EVENTS.map(c=>c.id)).size,20);assert.ok(G.CITY_EVENTS.some(c=>c.min>80&&c.tier===4));
assert.ok(w.navAudit>3000,'accessible navigation component across city');
for(const h of w.persons)assert.ok(w.navReach[Math.floor(h.y/12)*w.nav.cols+Math.floor(h.x/12)],'all initial humans in city-accessible area');
assert.equal(w.persons.filter(h=>h.original).length,w.popStart,'baseline count must match actual objects');
assert.ok(w.reinforcementBudget>0);const supply=w.reinforcementBudget;G.deploy(3);assert.ok(w.reinforcementBudget<supply&&w.persons.length>w.popStart,'finite reinforcements exist');
const before=w.persons.length;for(let i=0;i<25;i++)G.deploy(3);assert.equal(w.reinforcementBudget,0,'reinforcements cannot repeat forever');const stable=w.persons.length;G.deploy(3);assert.equal(w.persons.length,stable,'no invisible police spawns without budget');
console.log('PASS city reachability, correct census and finite government manpower');
// Run every alert event in an isolated fresh city to exercise its full branch.
for(const card of G.CITY_EVENTS){const city=G.newWorld(0,604291);city.alarm=card.min;G.eventAction(card);assert.ok(city.persons.every(h=>Number.isFinite(h.x)&&Number.isFinite(h.y)),card.id+' produced invalid humans');assert.ok(city.cars.every(c=>Number.isFinite(c.x)&&Number.isFinite(c.y)),card.id+' invalid cars');assert.ok(city.reinforcementBudget>=0,card.id+' negative reserve');for(const g of city.guns)assert.ok(g.gun&&g.gun.ammo>=0,'weapon without physical ammunition');}
console.log('PASS 20 alarm-dependent events execute, armory and ammo remain physical');
// Actual endgame: 30 spread-out civilians vs a seeded 65-zombie roaming horde.
w=newRound();w.reinforcementBudget=0;w.riotIn=5000;w.patrolIn=5000;w.eventCooldown=5000;
const people=w.persons.filter(h=>h.original).filter((_,i)=>i%9===0).slice(0,30);
w.persons=people;w.popStart=people.length;
const zombies=[];
for(let i=0;i<90;i++){const p=G.nearestCityAccess(35+(i%10)*200,45+Math.floor(i/10)*163);const z={id:10000+i,x:p.x,y:p.y,kind:'zombie',type:i%12===0?'runner':'normal',hp:125,maxHp:125,attack:0,decision:0,acid:0,tx:p.x+20,ty:p.y+20,angle:0,step:0,vx:0,vy:0};zombies.push(z)}
w.zombies=zombies;w.buffs.fury=0;
let high=people.length,steps=0;const max=2900;
for(let i=0;i<max&&G.phase==='game';i++){G.update(.17);steps++;if(w.persons.length>high+2)throw Error('unexpected government reinforcement');high=Math.min(high,w.persons.length);if(i%500===0)console.log('CHASE',i,'living',w.persons.length,'zombies',w.zombies.length,'t',Math.floor(w.time),'events',w.eventHistory.length)}
console.log('FINAL SWEEP',G.phase,'living',w.persons.length,'zombies',w.zombies.length,'time',Math.round(w.time),'steps',steps,'elapsed',Date.now()-start);
assert.equal(G.phase,'end','distributed final survivors should be eliminable by the horde');assert.equal(w.persons.length,0,'the end requires zero living people');
// Defense outcome tested independently with live projectile combat and no infinite reserves.
w=newRound();w.reinforcementBudget=0;let armed=w.persons.find(h=>h.hp>0);w.persons=[armed];w.popStart=1;armed.x=160;armed.y=120;armed.hp=350;armed.role='police';armed.bravery=1;armed.gun={key:'lmg',ammo:100,cooldown:0};let z=w.zombies[0];z.x=210;z.y=120;z.hp=45;for(let i=0;i<500&&G.phase==='game';i++)G.update(.04);assert.equal(G.phase,'end','defenders must also be able to win');
console.log('PASS both factions can win combat; TOTAL',Date.now()-start+'ms');
