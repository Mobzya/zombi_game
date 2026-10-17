const fs=require('node:fs');const vm=require('node:vm');const assert=require('node:assert/strict');
const classes=new Set();const ctx=new Proxy({},{get(o,k){if(k==='canvas')return {};return k in o?o[k]:()=>{}},set(o,k,v){o[k]=v;return true}});
class Element {constructor(){this.style={};this.dataset={};this.children=[];this.classList={toggle:()=>{},add:()=>{},remove:()=>{}};this.textContent='';this.innerHTML='';this.disabled=false;}appendChild(x){this.children.push(x);}addEventListener(){}getContext(){return ctx;}getBoundingClientRect(){return {left:0,top:0,width:1280,height:720}}querySelector(){return new Element()}setPointerCapture(){}click(){this.onclick&&this.onclick()}}
const all=new Map();const get=(s)=>all.get(s)||all.set(s,new Element()).get(s);
const document={getElementById:get,querySelectorAll:()=>[],createElement:()=>new Element(),querySelector:()=>new Element()};
let nextFrame=()=>{};const sandbox={window:{devicePixelRatio:1,addEventListener(){},performance:{now:()=>1000}},document,localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>1000},innerHeight:720,innerWidth:1280,requestAnimationFrame:f=>nextFrame=f,setTimeout:()=>{},console,Math,Date};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync('app/src/main/assets/game.js','utf8'),sandbox,{timeout:2000});const game=sandbox.window.__outbreakDebug;assert.ok(game);assert.equal(game.phase,'menu');
for(let size=0;size<3;size++){let w=game.newWorld(size,1234);assert.equal(w.persons.length,[100,500,1000][size]);assert.ok(w.buildings.length>0);assert.ok(w.guns.length>0);assert.ok(w.cars.length>0);}
game.startPick();assert.equal(game.phase,'select');const p=game.world.persons[0];game.selectPatient(p);assert.equal(game.phase,'game');for(let i=0;i<350;i++)game.update(.05);assert.ok(game.world.infections>=1,'patient zero must convert');assert.ok(game.world.infections>0,'first zombie was created');
console.log('PASS: three maps, resources, selection, incubation, conversion and game simulation');
// Navigation must guide agents through legitimate openings and around solid walls.
const city=game.newWorld(0,888);assert.ok(city.roadsX.some(r=>r.w!==city.roadsX[0].w),'roads have varied widths');
assert.ok(new Set(city.features.map(f=>f.type)).size>=4,'multiple landscape and district types');
assert.ok(city.gates.some(g=>g.kind==='door')&&city.gates.some(g=>g.kind==='window'),'destructible doors and windows exist');
let building=city.buildings.find(b=>b.openings.some(o=>o.kind==='door')&&b.w>68&&b.h>70);assert.ok(building);
const inner={x:building.x+building.w/2,y:building.y+building.h/2};const outer={x:Math.max(10,building.x-52),y:Math.max(10,building.y-46)};
let route=game.findPath(inner,outer,'human');assert.ok(route.length,'path exits a building');
let zroute=game.findPath(inner,outer,'zombie');assert.ok(zroute.length,'zombies can route toward openings');
// Chasing zombie breaks an intact aperture in several hits instead of teleporting through.
const gate=city.gates.find(g=>g.kind==='door'&&g.building===building);assert.ok(gate);
const cx=gate.x+gate.w/2,cy=gate.y+gate.h/2;
let z={id:987654,x:cx+(gate.side==='W'?-13:gate.side==='E'?13:0),y:cy+(gate.side==='N'?-13:gate.side==='S'?13:0),kind:'zombie',type:'normal',hp:105,attack:0,decision:1,acid:0,tx:cx,ty:cy,vx:0,vy:0,step:0};
city.zombies.push(z);game.updateZombie(z,.8);assert.ok(gate.hp<gate.maxHp&&gate.hp>0,'door absorbs progressive damage');
for(let i=0;i<8;i++){z.x=cx+(gate.side==='W'?-13:gate.side==='E'?13:0);z.y=cy+(gate.side==='N'?-13:gate.side==='S'?13:0);z.attack=0;game.updateZombie(z,.1);}assert.ok(gate.broken,'zombies break the door');
assert.ok(game.PERKS.filter(p=>p[1]!=='✦').some(p=>p[4]>=140),'unique, expensive passive upgrades');
console.log('PASS: varied districts, A* paths, progressively destructible doors, progression tiers');
