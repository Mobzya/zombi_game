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
