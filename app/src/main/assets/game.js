'use strict';
(()=>{
const $=id=>document.getElementById(id), canvas=$('world'), ctx=canvas.getContext('2d',{alpha:false});
let CW=850,CH=480,last=0,clock=0,phase='menu',world=null,mapChoice=0,difficulty=1,menuSeed=31,paused=false,speed=1;
let coins=0,owned={},cam={x:0,y:0,z:1},pointers=new Map(),dragDistance=0,pressX=0,pressY=0,prevPinch=0;
const COLORS={ground:'#45504a',asphalt:'#333e45',grass:'#465b48',sidewalk:'#6c756d',roadline:'#adae80',human:'#ead6b1',zombie:'#9cc877',blood:'#aa493f'};
const PERKS=[
 ['echo','◆','ХИМИЯ СТРАХА','Паника распространяется дальше и быстрее.',12,null],
 ['scent','◆','ТЁПЛАЯ КРОВЬ','Зомби выслеживают людей через стены с большего расстояния.',16,null],
 ['howl','✦','МЁРТВЫЙ ЗОВ','Активный вой собирает заражённых в одну охотничью стаю.',22,'echo'],
 ['fast','⬡','СОРВАННЫЕ ЦЕПИ','Открывает быстрых зомби, которые перепрыгивают преграды.',32,'scent'],
 ['siege','◆','ХРУСТ КОСТЕЙ','Зомби быстрее разрушают баррикады и автомобили.',28,'scent'],
 ['fog','✦','СПОРОВОЕ ОБЛАКО','Активная заразная зона ослабляет людей и сеет панику.',35,'echo'],
 ['brute','⬡','КОСТЯНОЙ ТИТАН','Шанс появления тяжёлого зомби, пробивающего оборону.',44,'siege'],
 ['fury','✦','ГОЛОД СТАИ','Активная ярость ускоряет ближайших заражённых.',32,'howl'],
 ['spitter','⬡','ЧЁРНАЯ ЖЕЛЧЬ','Шанс мутации плевуна с дальним заражающим ударом.',48,'fog'],
 ['chain','◆','ЦЕПНАЯ РЕАКЦИЯ','Первые 3 обращения вызывают вой и зовут стаю.',40,'howl'],
 ['corpse','◆','ПОСЛЕДНИЙ ВЗДОХ','Убитые зомби оставляют ядовитое облако.',52,'fog'],
 ['hive','⬡','РОЙ','Зомби-одиночки временно образуют охотничьи группы.',70,'brute'],
 ['patient','◆','ТИХАЯ ЛИХОРАДКА','Носитель выглядит здоровым до самой трансформации.',24,'echo'],
 ['ambush','◆','ОСАДНАЯ ПАМЯТЬ','Зомби ведут других к дверям занятых зданий.',38,'siege']
];
const MAPS=[{n:100,w:1150,h:920},{n:500,w:2280,h:1550},{n:1000,w:3300,h:2300}];
const GUNS={pistol:{name:'ПИСТОЛЕТ',range:152,dmg:27,rate:.48,ammo:13,bullets:1,speed:430,color:'#f6e39b'},smg:{name:'ПП',range:148,dmg:13,rate:.11,ammo:35,bullets:1,speed:475,color:'#f2d575'},shotgun:{name:'ДРОБОВИК',range:108,dmg:14,rate:.86,ammo:8,bullets:5,speed:380,color:'#ffc17b'},rifle:{name:'ВИНТОВКА',range:220,dmg:37,rate:.62,ammo:20,bullets:1,speed:610,color:'#fff4be'},grenade:{name:'ГРАНАТЫ',range:172,dmg:64,rate:2.6,ammo:4,bullets:1,speed:200,color:'#bde6a4'}};
function r(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;}}
let rand=r(17),uid=1; const rnd=(a,b)=>a+rand()*(b-a), irnd=n=>Math.floor(rand()*n),clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),dst=(x,y,X,Y)=>Math.hypot(x-X,y-Y);
function save(){try{localStorage.setItem('outbreak_v01',JSON.stringify({coins,owned}));}catch(e){}}
try{const s=JSON.parse(localStorage.getItem('outbreak_v01')||'{}');coins=Math.max(0,s.coins|0);owned=s.owned||{};}catch(e){}
function S(id,txt){$(id).textContent=txt}function show(id,yes){$(id).classList.toggle('hidden',!yes)}
function perk(id){return !!owned[id]}
function renderMenu(){S('coins','◈ '+coins);S('wallet','◈ '+coins);const node=$('perks');node.innerHTML='';PERKS.forEach(([id,symbol,title,desc,price,req])=>{const have=perk(id),locked=req&&!perk(req),afford=coins>=price,b=document.createElement('button');b.className='perk '+(have?'owned':afford&&!locked?'ready':'');b.disabled=have||locked||!afford;b.innerHTML='<div class="perkhead"><span>'+symbol+' '+title+'</span><span class="price '+(have?'owned':'')+'">'+(have?'✓': '◈ '+price)+'</span></div><div class="perkbody">'+desc+(locked?' · Нужна: '+PERKS.find(x=>x[0]===req)[2]:'')+'</div>';b.onclick=()=>{if(coins<price||have||locked)return;coins-=price;owned[id]=1;save();renderMenu()};node.appendChild(b)});}
function resize(){const dpr=Math.min(2,window.devicePixelRatio||1);CW=720;CH=Math.round(CW*innerHeight/innerWidth);if(CH>550){CH=550;CW=Math.round(CH*innerWidth/innerHeight)}canvas.width=CW;canvas.height=CH;ctx.imageSmoothingEnabled=false;ctx.font='12px monospace';}
window.addEventListener('resize',resize);resize();
function newWorld(index,seed=Date.now()%100000){const info=MAPS[index],w={w:info.w,h:info.h,count:info.n,persons:[],zombies:[],buildings:[],cars:[],barriers:[],guns:[],bullets:[],particles:[],fires:[],clouds:[],events:[],tree:[],time:0,alarm:0,infections:0,zLost:0,popStart:info.n,round:false,first:null,stage:0,riotIn:0,patrolIn:0,finishWait:0,skills:{howl:0,fury:0,spore:0},buffs:{fury:0,howl:0},focus:null};world=w;rand=r(seed);uid=1;
const roadGap=205,roadW=44;
for(let gx=0;gx<w.w;gx+=roadGap){for(let gy=0;gy<w.h;gy+=roadGap){if(gx<40||gy<40)continue;const bx=gx+roadW+13,by=gy+roadW+12,bw=Math.min(110,w.w-bx-16),bh=Math.min(104,w.h-by-16);if(bw<70||bh<70||rand()<.1)continue;let type='house';let chance=rand();if(chance<.085)type='police';else if(chance<.155)type='hospital';else if(chance<.215)type='armory';else if(chance<.275)type='pharmacy';else if(chance<.35)type='shop';else if(chance<.40)type='garage';const b={x:bx,y:by,w:bw,h:bh,type,doorX:bx+bw*(.28+rand()*.45),doorW:18,seed:irnd(1e7),supplies:type==='armory'?4:type==='police'?3:0,meds:type==='hospital'?6:type==='pharmacy'?3:0,glass:1,desks:[],visited:0};for(let j=0;j<irnd(4)+2;j++)b.desks.push({x:bx+13+rnd(0,bw-32),y:by+15+rnd(0,bh-35),w:rnd(8,16),h:rnd(5,11)});w.buildings.push(b);}}
const streetPoint=()=>({x:clamp(irnd(Math.max(1,Math.floor((w.w-20)/roadGap)))*roadGap+24+rnd(-8,8),16,w.w-16),y:clamp(rnd(16,w.h-16),16,w.h-16)});
for(let i=0;i<info.n;i++){const role=i<Math.max(3,Math.floor(info.n*.035))?'police':rand()<.025?'medic':rand()<.045?'fighter':rand()<.055?'driver':rand()<.075?'organizer':'civilian';let p=streetPoint();if(rand()<.28&&w.buildings.length){let b=w.buildings[irnd(w.buildings.length)];p={x:b.x+rnd(16,b.w-16),y:b.y+rnd(16,b.h-16)};}const a={id:uid++,x:p.x,y:p.y,vx:0,vy:0,role,kind:'human',hp:role==='police'?88:role==='fighter'?74:57,panic:0,bravery:role==='police'?.85:role==='fighter'?.67:rnd(.08,.68),group:i%9===0?i:Math.floor(i/9)*9,mode:'wander',tx:p.x,ty:p.y,decision:rnd(.1,2),attack:0,gun:null,inCar:null,infecting:false,sick:0,escaped:false,shade:irnd(5),angle:rnd(0,6.28),step:rnd(0,6),harvest:false};if(role==='police')a.gun=weapon('pistol');else if(role==='fighter'&&rand()<.23)a.gun=weapon('shotgun');w.persons.push(a);}
// All ammunition is supplied by existing police, gun racks, vehicles or dropped weapons.
for(const b of w.buildings){if(b.supplies){for(let q=0;q<b.supplies;q++){let kind=b.type==='police'?(q%2?'smg':'pistol'):(['shotgun','smg','rifle','grenade'][q%4]);w.guns.push({x:b.x+19+(q%3)*13,y:b.y+24+Math.floor(q/3)*11,gun:weapon(kind),owner:null});}}}
for(let i=0;i<Math.max(3,Math.floor(info.n/35));i++){const p=streetPoint();w.cars.push({x:p.x,y:p.y,vx:0,vy:0,hp:140,driver:null,passengers:[],angle:rnd(0,6.28),fuel:rnd(60,130),t:rnd(2,7),color:['#557b83','#b9a37c','#a66b63','#73917c'][irnd(4)],dead:false});}
for(let i=0;i<Math.floor(info.n/18);i++){let p=streetPoint();w.tree.push({x:p.x+rnd(24,56),y:p.y+rnd(-30,30),s:rnd(9,18)});}
cam.x=w.w*.5;cam.y=w.h*.5;cam.z=index===0?.95:index===1?.77:.69;return w;}
function weapon(key){return {key,ammo:GUNS[key].ammo,cooldown:0}}
function pickHumanScreen(x,y){let p=null,best=28;for(const a of world.persons){if(a.hp<=0)continue;const q=worldScreen(a.x,a.y),d=dst(x,y,q.x,q.y);if(d<best){best=d;p=a}}return p;}
function startPick(){newWorld(mapChoice);phase='select';cam.x=world.w/2;cam.y=world.h/2;show('menu',false);show('result',false);show('selection',true);show('hud',false)}
function selectPatient(a){if(!a)return;world.first=a;a.sick=10+rnd(0,5);a.mode='sick';a.infecting=true;phase='game';world.round=true;show('selection',false);show('hud',true);announce('ПАЦИЕНТ НОЛЬ ВЫБРАН',2.5);cam.x=a.x;cam.y=a.y;updateHud(true);}
function announce(msg,t=3){if(!world)return;world.events.push({text:msg,until:world.time+t});if(world.events.length>8)world.events.shift();}
let lastSound=0;function sound(freq=220,t=.05,kind='sawtooth'){if(performance.now()-lastSound<45)return;lastSound=performance.now();try{if(!window.ac)window.ac=new(window.AudioContext||window.webkitAudioContext)();if(window.ac.state==='suspended')window.ac.resume();const o=window.ac.createOscillator(),g=window.ac.createGain();o.type=kind;o.frequency.value=freq;g.gain.setValueAtTime(.032,window.ac.currentTime);g.gain.exponentialRampToValueAtTime(.001,window.ac.currentTime+t);o.connect(g);g.connect(window.ac.destination);o.start();o.stop(window.ac.currentTime+t);}catch(e){}}
function blood(x,y,n=8,col='#993e3c'){for(let i=0;i<n;i++)world.particles.push({x,y,vx:rnd(-45,45),vy:rnd(-55,30),life:rnd(.35,.9),max:.9,size:rnd(1,3),color:col,gravity:45});}
function cloud(x,y,radius,life,kind='spore'){world.clouds.push({x,y,r:radius,life,max:life,kind});}
function fire(x,y,n=18){world.fires.push({x,y,life:rnd(7,16),r:rnd(14,25)});for(let i=0;i<n;i++)world.particles.push({x,y,vx:rnd(-60,60),vy:rnd(-90,20),life:rnd(.4,1.8),max:1.8,size:rnd(2,6),color:rand()<.6?'#faae4b':'#d85441',gravity:-35});}
function toZombie(h,primary=false){if(!world||h.dead)return;h.dead=true;h.hp=0;h.infecting=false;if(h.gun){world.guns.push({x:h.x,y:h.y,gun:h.gun});h.gun=null;}let type='normal',v=rand();if(perk('brute')&&v<.07)type='brute';else if(perk('fast')&&v<.19)type='runner';else if(perk('spitter')&&v<.29)type='spitter';const z={id:uid++,x:h.x,y:h.y,vx:0,vy:0,kind:'zombie',type,hp:type==='brute'?225:type==='runner'?63:105,attack:rnd(.2,.8),tx:h.x+rnd(-70,70),ty:h.y+rnd(-70,70),decision:rnd(.5,2),angle:rnd(0,6.28),step:rnd(0,6),target:null,acid:0};world.zombies.push(z);world.infections++;blood(h.x,h.y,12,'#a7504c');sound(75,.23,'triangle');if(perk('chain')&&world.infections<=3){world.buffs.howl=world.time+5;cloud(h.x,h.y,65,3,'scent');}if(primary)announce('ВСПЫШКА НАЧАЛАСЬ',4);}
function killHuman(h,byZombie){if(h.dead)return;if(byZombie){toZombie(h);}else{h.dead=true;h.hp=0;world.zLost+=0;if(h.gun){world.guns.push({x:h.x,y:h.y,gun:h.gun});h.gun=null;}blood(h.x,h.y,9);} }
function killZombie(z){if(z.dead)return;z.dead=true;z.hp=0;blood(z.x,z.y,10,'#6e864b');world.zLost++;if(perk('corpse'))cloud(z.x,z.y,40,5,'spore');}
function nearest(from,arr,rad,pred){let found=null,dd=rad*rad;for(const o of arr){if(o.hp<=0||pred&&!pred(o))continue;const x=o.x-from.x,y=o.y-from.y,s=x*x+y*y;if(s<dd){dd=s;found=o;}}return found;}
function collisionPoint(x,y,ox,oy,rad,ignoreWalls=false){const w=world,margin=rad||4;x=clamp(x,margin,w.w-margin);y=clamp(y,margin,w.h-margin);if(!ignoreWalls)for(const b of w.buildings){if(x<b.x-12||x>b.x+b.w+12||y<b.y-12||y>b.y+b.h+12)continue;const left=b.x,right=b.x+b.w,top=b.y,bottom=b.y+b.h;let oldInside=ox>left+4&&ox<right-4&&oy>top+4&&oy<bottom-4;
let gap=x>b.doorX-b.doorW/2+rad*.4&&x<b.doorX+b.doorW/2-rad*.4;
let touching=(Math.abs(x-left)<rad+4&&y>top&&y<bottom)||(Math.abs(x-right)<rad+4&&y>top&&y<bottom)||(Math.abs(y-top)<rad+4&&x>left&&x<right)||(Math.abs(y-bottom)<rad+4&&x>left&&x<right&&!gap);
const crossing=((ox<left&&x>=left)||(ox>right&&x<=right)||(oy<top&&y>=top)||(oy>bottom&&y<=bottom));
if(touching||crossing&&!oldInside&&x>left&&x<right&&y>top&&y<bottom){if(Math.abs(ox-x)>Math.abs(oy-y)){x=ox;y=clamp(y,margin,w.h-margin)}else{y=oy;x=clamp(x,margin,w.w-margin)}}
if(oldInside){for(const f of b.desks){if(x>f.x-rad&&x<f.x+f.w+rad&&y>f.y-rad&&y<f.y+f.h+rad){x=ox;y=oy;break;}}}
}return {x,y};}
function move(entity,tx,ty,sp,dt,wall=true){let dx=tx-entity.x,dy=ty-entity.y,dd=Math.hypot(dx,dy);if(dd<1)return;entity.angle=Math.atan2(dy,dx);let vx=dx/dd*sp,vy=dy/dd*sp;entity.vx+=(vx-entity.vx)*Math.min(1,dt*6);entity.vy+=(vy-entity.vy)*Math.min(1,dt*6);let p=collisionPoint(entity.x+entity.vx*dt,entity.y+entity.vy*dt,entity.x,entity.y,5,!wall);if(p.x===entity.x&&p.y===entity.y){entity.decision=0; // choose a doorway when a building separates target
let b=world.buildings.find(b=>entity.x>=b.x-22&&entity.x<=b.x+b.w+22&&entity.y>=b.y-22&&entity.y<=b.y+b.h+22);
if(b){entity.tx=b.doorX;entity.ty=b.y+b.h+((entity.y<b.y+b.h/2)?15:-17);}else{entity.tx=entity.x+rnd(-55,55);entity.ty=entity.y+rnd(-55,55);}}
entity.x=p.x;entity.y=p.y;entity.step+=dt*sp*.20;}
function approachTarget(e,goal,sp,dt){if(!goal)return;let tx=goal.x,ty=goal.y;const b=world.buildings.find(b=>tx>b.x+5&&tx<b.x+b.w-5&&ty>b.y+5&&ty<b.y+b.h-5);const inside=b&&e.x>b.x+5&&e.x<b.x+b.w-5&&e.y>b.y+5&&e.y<b.y+b.h-5;if(b&&!inside){if(dst(e.x,e.y,b.doorX,b.y+b.h+7)>12){tx=b.doorX;ty=b.y+b.h+7;}else{tx=b.doorX;ty=b.y+b.h-12;}}move(e,tx,ty,sp,dt);}
function updateHuman(h,dt){if(h.hp<=0)return;h.attack=Math.max(0,h.attack-dt);if(h.gun)h.gun.cooldown=Math.max(0,h.gun.cooldown-dt);
if(h.sick>0){h.sick-=dt;h.vx*=.94;h.vy*=.94;h.step+=dt*1.2;if(h.sick<3.3&&!perk('patient')){h.mode='sick';h.panic=1;}if(h.sick<=0){toZombie(h,h===world.first);return;}if(difficulty===2&&h.sick<4)for(const n of nearby(h,80,'human')){if(n!==h&&n.sick<=0)n.panic=Math.min(2,n.panic+.14*dt);}return;}
if(h.inCar)return;
const enemy=nearby(h,190,'zombie').filter(z=>z.hp>0).sort((a,b)=>distance(h,a)-distance(h,b))[0];const danger=enemy?distance(h,enemy):999;
if(enemy){h.panic=clamp(h.panic+dt*(danger<60?2:1),0,2.5);for(const n of nearby(h,55,'human')){if(perk('echo'))n.panic=Math.max(n.panic,h.panic*.8);}}
else h.panic=Math.max(0,h.panic-dt*.14);
// Nearby dropped weapons have physical ammo and remain in the city after death.
if(!h.gun&&(h.role==='police'||h.role==='fighter'||h.bravery>.52||world.alarm>40)){
const item=world.guns.find(g=>dst(h.x,h.y,g.x,g.y)<10);if(item){h.gun=item.gun;world.guns.splice(world.guns.indexOf(item),1);h.mode='armed';}}
if(h.gun&&h.gun.ammo<=0){h.gun=null;}
let fight=enemy&&h.gun&&h.gun.ammo>0&&(h.role==='police'||h.role==='fighter'||(h.bravery>.58&&h.panic<1.5)||difficulty===2&&h.bravery>.40);
if(fight){h.mode='fight';const gun=GUNS[h.gun.key];if(danger<gun.range&&h.gun.cooldown<=0){shoot(h,enemy);h.gun.cooldown=gun.rate*(difficulty===2?.75:difficulty===0?1.5:1);}
if(danger<gun.range*.65){move(h,h.x+(h.x-enemy.x),h.y+(h.y-enemy.y),difficulty===2?60:52,dt);}else if(danger>gun.range*.85)approachTarget(h,enemy,34,dt);else h.step+=dt*2;return;}
if(enemy&&danger<155){h.mode='flee';const allies=nearby(h,100,'human').filter(a=>a!==h&&a.hp>0&&a.sick<=0);let fx=h.x+(h.x-enemy.x)*2,fy=h.y+(h.y-enemy.y)*2;
if((h.role==='organizer'||h.group%3===0)&&allies.length){const n=allies[0];fx=fx*.75+n.x*.25;fy=fy*.75+n.y*.25;}
move(h,fx,fy,92*(difficulty===0?.9:1),dt);return;}
h.decision-=dt;if(h.decision<=0){h.decision=rnd(1.6,5);h.mode='wander';const ar=world.buildings.filter(b=>dst(h.x,h.y,b.doorX,b.y+b.h)<180);if(world.alarm>24&&rand()<.36&&ar.length){const b=ar[irnd(ar.length)];h.tx=b.doorX;h.ty=b.y+b.h+8;h.mode='hide';}else if(!h.gun&&world.alarm>17&&rand()<.36){const g=world.guns.find(g=>dst(h.x,h.y,g.x,g.y)<125);if(g){h.tx=g.x;h.ty=g.y;h.mode='loot';}else{h.tx=h.x+rnd(-140,140);h.ty=h.y+rnd(-130,130);}}else{h.tx=h.x+rnd(-125,125);h.ty=h.y+rnd(-110,110);}}
if(h.role==='driver'&&world.alarm>22&&!h.inCar){let c=world.cars.find(c=>!c.dead&&!c.driver&&dst(h.x,h.y,c.x,c.y)<15);if(c){c.driver=h;h.inCar=c;h.x=c.x;h.y=c.y;return;}else{c=world.cars.find(c=>!c.dead&&!c.driver&&dst(h.x,h.y,c.x,c.y)<150);if(c){h.tx=c.x;h.ty=c.y;}}}
approachTarget(h,{x:h.tx,y:h.ty},h.mode==='hide'?58:32,dt);
// Hospitals heal living humans from finite reserves.
if(h.hp<46){const b=world.buildings.find(b=>b.meds>0&&b.type==='hospital'&&h.x>b.x&&h.x<b.x+b.w&&h.y>b.y&&h.y<b.y+b.h);if(b&&rand()<dt*.7){h.hp=Math.min(65,h.hp+30);b.meds--;}}
}
function nearby(e,rad,kind){const arr=kind==='human'?world.persons:world.zombies,cell=world.gridCell,grid=kind==='human'?world.humanGrid:world.zombieGrid;if(!grid)return [];const ix=Math.floor(e.x/cell),iy=Math.floor(e.y/cell),s=Math.ceil(rad/cell),out=[];for(let x=ix-s;x<=ix+s;x++)for(let y=iy-s;y<=iy+s;y++){const bucket=grid.get(x+','+y);if(bucket)for(const a of bucket){if(Math.abs(a.x-e.x)<rad&&Math.abs(a.y-e.y)<rad)out.push(a);}}return out;}
function makeGrid(){world.gridCell=85;const h=new Map(),z=new Map();for(const [arr,grid] of [[world.persons,h],[world.zombies,z]])for(const a of arr){if(a.hp<=0)continue;const key=Math.floor(a.x/85)+','+Math.floor(a.y/85);if(!grid.has(key))grid.set(key,[]);grid.get(key).push(a);}world.humanGrid=h;world.zombieGrid=z;}
function updateZombie(z,dt){if(z.hp<=0)return;z.attack=Math.max(0,z.attack-dt);z.decision-=dt;z.acid-=dt;let senses=perk('scent')?238:165;if(world.buffs.howl>world.time)senses*=2.15;if(z.type==='spitter')senses+=55;const target=nearby(z,senses,'human').filter(h=>h.hp>0&&h.sick<=0).sort((a,b)=>distance(z,a)-distance(z,b))[0];let speed=z.type==='runner'?100:z.type==='brute'?30:z.type==='spitter'?39:51;if(world.buffs.fury>world.time)speed*=1.8;if(perk('hive')&&world.infections>=12)speed*=1.14;
if(target){z.target=target;let dd=distance(z,target);if(z.type==='spitter'&&dd<135&&dd>42&&z.acid<=0){world.bullets.push({x:z.x,y:z.y,vx:(target.x-z.x)/dd*195,vy:(target.y-z.y)/dd*195,life:.85,damage:21,owner:'acid',r:3});z.acid=2.5;}
if(dd<12+((z.type==='brute')?5:0)&&z.attack<=0){target.hp-=(z.type==='brute'?60:28)*(world.buffs.fury>world.time?1.6:1);z.attack=z.type==='runner'?.47:.77;blood(target.x,target.y,4);if(target.hp<=0)killHuman(target,true);}else if(z.type!=='spitter'||dd>80)approachTarget(z,target,speed,dt);else z.step+=dt*4;
}else{z.target=null;if(z.decision<=0||dst(z.x,z.y,z.tx,z.ty)<12){z.decision=rnd(1,4);z.tx=clamp(z.x+rnd(-140,140),5,world.w-5);z.ty=clamp(z.y+rnd(-140,140),5,world.h-5);}approachTarget(z,{x:z.tx,y:z.ty},speed*.58,dt);}
// Destructible, physical barricades block the horde.
for(const b of world.barriers){if(b.hp<=0)continue;if(dst(z.x,z.y,b.x,b.y)<18){z.hp-=dt*(b.barbed?13:0);if(z.hp<=0)killZombie(z);if(z.attack<=0){b.hp-=z.type==='brute'?68:perk('siege')?35:19;z.attack=.57;blood(b.x,b.y,5,'#a68a69');}break;}}
for(const c of world.cars){if(c.dead||!c.driver)continue;if(dst(z.x,z.y,c.x,c.y)<24&&z.attack<=0){c.hp-=z.type==='brute'?35:perk('siege')?25:11;z.attack=.8;}}
}
function shoot(h,z){if(!h.gun||!z)return;const def=GUNS[h.gun.key];if(h.gun.ammo<=0)return;h.gun.ammo--;let dir=Math.atan2(z.y-h.y,z.x-h.x),spread=h.gun.key==='shotgun'?.44:h.gun.key==='smg'?.12:.055;
for(let i=0;i<def.bullets;i++){let a=dir+rnd(-spread,spread),v=def.speed;world.bullets.push({x:h.x+Math.cos(a)*9,y:h.y+Math.sin(a)*9,vx:Math.cos(a)*v,vy:Math.sin(a)*v,damage:def.dmg,life:def.range/v,owner:'human',r:2,grenade:h.gun.key==='grenade'});}h.angle=dir;world.particles.push({x:h.x+Math.cos(dir)*10,y:h.y+Math.sin(dir)*10,vx:0,vy:0,life:.09,max:.09,size:5,color:'#fff9b6',gravity:0});sound(h.gun.key==='shotgun'?90:330,.04);}
function explode(x,y,r=49,damage=80){fire(x,y,26);cloud(x,y,r*.8,2.6,'smoke');sound(47,.38);for(const z of world.zombies){if(z.hp<=0)continue;const d=dst(x,y,z.x,z.y);if(d<r){z.hp-=damage*(1-d/r*.5);if(z.hp<=0)killZombie(z);}}for(const h of world.persons){if(h.hp<=0)continue;const d=dst(x,y,h.x,h.y);if(d<r){h.hp-=damage*(1-d/r*.5);if(h.hp<=0)killHuman(h,false);}}for(const c of world.cars){if(!c.dead&&dst(x,y,c.x,c.y)<r){c.hp-=damage*1.4;}}for(const b of world.barriers){if(dst(x,y,b.x,b.y)<r)b.hp-=damage;}}
function updateProjectiles(dt){for(let i=world.bullets.length-1;i>=0;i--){const b=world.bullets[i];b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;let hit=false;if(b.owner==='human'){for(const z of nearby(b,11,'zombie'))if(z.hp>0&&dst(z.x,z.y,b.x,b.y)<8){z.hp-=b.damage;blood(z.x,z.y,3,'#829b57');if(z.hp<=0)killZombie(z);hit=true;break;}}else{for(const h of nearby(b,12,'human'))if(h.hp>0&&dst(h.x,h.y,b.x,b.y)<9){h.hp-=b.damage;h.panic=2;blood(h.x,h.y,4);if(h.hp<=0)killHuman(h,false);hit=true;break;}}
if(hit||b.life<=0||b.x<0||b.y<0||b.x>world.w||b.y>world.h){if(b.grenade)explode(b.x,b.y,50,90);if(b.owner==='acid')cloud(b.x,b.y,28,3,'spore');world.bullets.splice(i,1);}}
}
function updateCars(dt){for(const c of world.cars){if(c.dead)continue;if(c.hp<=0){c.dead=true;c.driver&&(c.driver.inCar=null,c.driver.hp-=35);for(const h of c.passengers){h.inCar=null;h.hp-=35;}explode(c.x,c.y,55,70);continue;}if(c.driver&&c.driver.hp>0){c.fuel-=dt;c.t-=dt;if(c.fuel<=0){c.driver.inCar=null;c.driver=null;continue;}if(c.t<=0){c.angle=irnd(4)*Math.PI/2;c.t=rnd(1.5,4);}const xx=c.x+Math.cos(c.angle)*105*dt,yy=c.y+Math.sin(c.angle)*105*dt;if(xx<12||yy<12||xx>world.w-12||yy>world.h-12){c.angle+=Math.PI;c.t=2;}else{c.x=xx;c.y=yy;}
c.driver.x=c.x;c.driver.y=c.y;for(const h of c.passengers){h.x=c.x;h.y=c.y;}
for(const z of nearby(c,15,'zombie')){if(z.hp>0&&dst(c.x,c.y,z.x,z.y)<13){z.hp-=110;blood(z.x,z.y,10,'#6e8a52');if(z.hp<=0)killZombie(z);c.hp-=4;}}
if(c.passengers.length<2&&rand()<dt*.4){const h=nearby(c,13,'human').find(h=>h.hp>0&&!h.inCar&&h!==c.driver&&h.panic>1);if(h){c.passengers.push(h);h.inCar=c;}}
}}
}
function updateGovernment(dt){const w=world,n=w.persons.filter(a=>a.hp>0).length;let dead=1-n/w.popStart,activity=w.zombies.filter(z=>z.hp>0).length/w.popStart;let desired=clamp(dead*95+Math.min(28,activity*80)+Math.min(15,w.time/50)+(difficulty===2?16:difficulty===0?-15:0),0,100);
if(w.first&&w.first.sick>0)desired=difficulty===2&&w.first.sick<4?8:0;
w.alarm+=(desired-w.alarm)*Math.min(1,dt*.40);const stages=[23,47,69,88];while(w.stage<4&&w.alarm>=stages[w.stage]){w.stage++;const label=['ПОЛИЦИЯ ПОДНЯТА ПО ТРЕВОГЕ','ОМОН ЗАНИМАЕТ ПОЗИЦИИ','ВОЕННЫЕ БЛОКПОСТЫ','ПРОТОКОЛ ЗАЧИСТКИ'][w.stage-1];announce(label,5);if(w.stage>=2)deploy(w.stage);}
w.riotIn-=dt;if(w.stage>=2&&w.riotIn<=0){deploy(w.stage);w.riotIn=(difficulty===2?21:difficulty===0?65:38);}
// Patrols respond to real alert level; no early SWAT swarms.
w.patrolIn-=dt;if(w.stage>=1&&w.patrolIn<=0){const b=w.buildings.find(b=>b.type==='police');if(b){const h=makeReinforcement(b.x+b.w/2,b.y+b.h+12,1);w.persons.push(h);}w.patrolIn=36;}
if(w.stage===4&&rand()<dt*.09&&w.zombies.some(z=>z.hp>0)){const z=w.zombies[irnd(w.zombies.length)];if(z&&z.hp>0){world.particles.push({x:z.x,y:z.y-60,vx:0,vy:60,life:1,max:1,size:5,color:'#ffdfb5',gravity:40});setTimeout(()=>{if(world===w&&phase==='game')explode(z.x,z.y,65,115);},650);}}
}
function makeReinforcement(x,y,level){return {id:uid++,x,y,vx:0,vy:0,role:'police',kind:'human',hp:level===2?130:90,panic:0,bravery:1,group:0,mode:'fight',tx:x,ty:y,decision:.2,attack:0,gun:weapon(level===2?'rifle':'smg'),inCar:null,infecting:false,sick:0,shade:2,angle:0,step:0};}
function deploy(stage){const w=world;let x=rnd(65,w.w-70),y=rnd(65,w.h-70);for(let i=0;i<(stage>=3?5:3);i++)w.persons.push(makeReinforcement(x+rnd(-25,25),y+rnd(-25,25),stage>=3?2:1));if(stage>=2){for(let i=0;i<3;i++){const b={x:x+rnd(-55,55),y:y+rnd(-55,55),hp:stage>=3?220:140,barbed:stage>=3};w.barriers.push(b);}}
if(stage>=3){w.cars.push({x:x,y:y,vx:0,vy:0,hp:300,driver:null,passengers:[],angle:0,fuel:150,t:0,color:'#6b7a59',dead:false,armored:true});}
}
function updateClouds(dt){for(let i=world.clouds.length-1;i>=0;i--){const c=world.clouds[i];c.life-=dt;if(c.kind==='spore'){for(const h of nearby(c,c.r,'human')){if(h.hp<=0)continue;if(dst(h.x,h.y,c.x,c.y)<c.r){h.hp-=dt*(perk('spitter')?11:7);h.panic+=dt*.8;if(h.hp<=0)killHuman(h,true);}}}if(c.life<=0)world.clouds.splice(i,1);}for(let i=world.fires.length-1;i>=0;i--){let f=world.fires[i];f.life-=dt;for(const z of nearby(f,f.r,'zombie'))if(dst(z.x,z.y,f.x,f.y)<f.r&&z.hp>0){z.hp-=dt*8;if(z.hp<=0)killZombie(z);}for(const h of nearby(f,f.r,'human'))if(dst(h.x,h.y,f.x,f.y)<f.r&&h.hp>0){h.hp-=dt*7;if(h.hp<=0)killHuman(h,false);}if(f.life<=0)world.fires.splice(i,1);}}
function useSkill(id){if(!world||phase!=='game'||paused)return;if(world.skills[id]>0)return;const center={x:cam.x,y:cam.y};if(id==='howl'&&perk('howl')){world.skills.howl=28;world.buffs.howl=world.time+9;cloud(center.x,center.y,180,2,'scent');announce('МЁРТВЫЙ ЗОВ: СТАЯ СОБИРАЕТСЯ');sound(90,.4);}
else if(id==='fury'&&perk('fury')){world.skills.fury=42;world.buffs.fury=world.time+9;announce('ГОЛОД СТАИ: ЯРОСТЬ');sound(135,.3);}
else if(id==='spore'&&perk('fog')){world.skills.spore=38;cloud(center.x,center.y,116,12,'spore');announce('СПОРОВОЕ ОБЛАКО');sound(190,.3);}}
function update(dt){if(!world||phase!=='game'||paused)return;dt*=speed;world.time+=dt;world.gridTime=(world.gridTime||0)-dt;if(world.gridTime<=0){makeGrid();world.gridTime=.13;}
for(const a of world.persons)updateHuman(a,dt);
for(const z of world.zombies)updateZombie(z,dt);
updateProjectiles(dt);updateCars(dt);updateClouds(dt);updateGovernment(dt);
for(let i=world.barriers.length-1;i>=0;i--)if(world.barriers[i].hp<=0)world.barriers.splice(i,1);
for(let i=world.particles.length-1;i>=0;i--){const p=world.particles[i];p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.gravity*dt;if(p.life<=0)world.particles.splice(i,1);}
if(world.particles.length>950)world.particles.splice(0,world.particles.length-950);
for(const key in world.skills)world.skills[key]=Math.max(0,world.skills[key]-dt);
world.persons=world.persons.filter(h=>h.hp>0);world.zombies=world.zombies.filter(z=>z.hp>0);
let live=world.persons.length,z=world.zombies.length;if(world.first&&world.first.sick>0)z=1;
if((live===0&&z>0)||(z===0&&live>0&&world.infections>0))finish(live===0);if(world.time>900)finish(false);
clock+=dt;if(clock>.24){updateHud();clock=0;}}
function finish(won){if(!world||phase!=='game')return;phase='end';world.round=false;const earned=Math.floor(world.infections*(won?2.2:1.1)*(difficulty===2?1.55:difficulty===0?.8:1)+Math.min(20,world.zLost*.2));coins+=earned;save();S('resultTitle',won?'ГОРОД ПАЛ':'ЗАРАЗА ПОДАВЛЕНА');S('resultSubtitle',won?'Город больше не принадлежит живым.':'Последний заражённый уничтожен. Эпидемия остановлена.');S('scoreInfected',world.infections);S('scoreKills',world.zLost);S('scoreTime',fmtTime(world.time));S('scoreEarned','◈ '+earned);show('hud',false);show('result',true);sound(won?82:190,.4);}
function fmtTime(t){return Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0')}
function updateHud(force=false){if(!world)return;S('living',world.persons.length);S('undead',world.zombies.length);S('fallen',world.infections);S('alarm',Math.round(world.alarm)+'%');$('alertbar').style.width=world.alarm+'%';let now=world.events.filter(e=>e.until>world.time).slice(-1)[0];S('notice',now?now.text:'');if(world.first&&world.first.sick>0)S('tip',world.first.sick>3?'Первые симптомы через '+Math.max(0,Math.ceil(world.first.sick-3))+' сек.':'Пациент ноль превращается...');else S('tip','Перетаскивай карту • масштаб двумя пальцами • способности действуют в центре экрана');for(const key of ['howl','fury','spore']){const b=document.querySelector('[data-skill="'+key+'"]');b.style.display=(key==='howl'&&!perk('howl')||key==='fury'&&!perk('fury')||key==='spore'&&!perk('fog'))?'none':'';b.disabled=world.skills[key]>0;b.querySelector('em').style.height=clamp(world.skills[key]/(key==='howl'?28:key==='fury'?42:38),0,1)*100+'%';}}
function worldScreen(x,y){return {x:(x-cam.x)*cam.z+CW/2,y:(y-cam.y)*cam.z+CH/2}}
function screenWorld(x,y){return {x:(x-CW/2)/cam.z+cam.x,y:(y-CH/2)/cam.z+cam.y}}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));}
function line(x,y,X,Y,c,w=1){ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(Math.round(x)+.5,Math.round(y)+.5);ctx.lineTo(Math.round(X)+.5,Math.round(Y)+.5);ctx.stroke();}
function circle(x,y,rad,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(Math.round(x),Math.round(y),Math.max(.5,rad),0,Math.PI*2);ctx.fill();}
function visible(x,y,pad=60){const p=worldScreen(x,y);return p.x>-pad&&p.x<CW+pad&&p.y>-pad&&p.y<CH+pad;}
function worldRender(){if(!world)return;ctx.save();ctx.translate(Math.round(CW/2-cam.x*cam.z),Math.round(CH/2-cam.y*cam.z));ctx.scale(cam.z,cam.z);const z=cam.z;const left=cam.x-CW/(z*2)-60,top=cam.y-CH/(z*2)-60,right=cam.x+CW/(z*2)+60,bottom=cam.y+CH/(z*2)+60;
rect(0,0,world.w,world.h,'#536a55');
// Asphalt grid, road markings, junctions, sidewalks and crosswalks.
for(let x=0;x<world.w;x+=205){if(x+54<left||x>right)continue;rect(x,0,45,world.h,'#67716a');rect(x+5,0,34,world.h,'#343e43');rect(x+20,0,2,world.h,'#858479');for(let y=0;y<world.h;y+=44){if(y<top-50||y>bottom+50)continue;rect(x+20,y,2,17,'#b5ad75');}}
for(let y=0;y<world.h;y+=205){if(y+54<top||y>bottom)continue;rect(0,y,world.w,46,'#67716a');rect(0,y+5,world.w,35,'#394246');for(let x=0;x<world.w;x+=35){if(x<left-30||x>right+30)continue;rect(x,y+22,14,2,'#a29d77');}}
for(const t of world.tree){if(t.x<left||t.x>right||t.y<top||t.y>bottom)continue;rect(t.x-2,t.y,5,10,'#453f33');circle(t.x-4,t.y-5,t.s,'#304f43');circle(t.x+5,t.y-8,t.s*.68,'#426c52');rect(t.x+1,t.y-12,3,3,'#63926b');}
for(const b of world.buildings){if(b.x+b.w<left||b.x>right||b.y+b.h<top||b.y>bottom)continue;drawBuilding(b);}
for(const g of world.guns){if(g.x<left||g.x>right||g.y<top||g.y>bottom)continue;rect(g.x-5,g.y-3,11,8,'#151e20');rect(g.x-4,g.y-2,9,2,'#d8cc90');rect(g.x,g.y,2,5,'#e2bb82');}
for(const c of world.cars){if(c.x<left||c.x>right||c.y<top||c.y>bottom)continue;drawCar(c);}
for(const b of world.barriers){if(b.x<left||b.x>right||b.y<top||b.y>bottom)continue;rect(b.x-11,b.y-3,23,9,'#2b2929');rect(b.x-10,b.y-4,21,7,b.barbed?'#636965':'#b09a6b');for(let j=0;j<3;j++)line(b.x-8+j*7,b.y-4,b.x-8+j*7,b.y+2,'#443e32',2);if(b.barbed)for(let j=0;j<4;j++)line(b.x-12+j*7,b.y-9,b.x-8+j*7,b.y-3,'#b8c3c3');}
for(const f of world.fires){if(f.x<left||f.x>right||f.y<top||f.y>bottom)continue;circle(f.x,f.y,f.r*.68,'#d6542880');for(let i=0;i<6;i++){let a=i*1.05+world.time*2, rr=4+Math.sin(a*2+f.life)*5;rect(f.x+Math.cos(a)*rr,f.y+Math.sin(a)*rr-5,4,7,i%2?'#e58e2e':'#ffcb55');}}
for(const c of world.clouds){if(c.x<left-c.r||c.x>right+c.r||c.y<top-c.r||c.y>bottom+c.r)continue;circle(c.x,c.y,c.r*(.85+.08*Math.sin(world.time*2)),c.kind==='spore'?'#a5c76f40':c.kind==='scent'?'#d7e8a529':'#4547488a');}
for(const h of world.persons){if(h.x<left-8||h.x>right+8||h.y<top-8||h.y>bottom+8||h.hp<=0||h.inCar)continue;drawAgent(h);}
for(const z of world.zombies){if(z.x<left-9||z.x>right+9||z.y<top-9||z.y>bottom+9||z.hp<=0)continue;drawAgent(z);}
for(const b of world.bullets){rect(b.x-1,b.y-1,b.r*2,b.r*2,b.owner==='acid'?'#a5ee6b':'#fff1ac');}
for(const p of world.particles){if(p.x<left-12||p.x>right+12||p.y<top-12||p.y>bottom+12)continue;ctx.globalAlpha=clamp(p.life/p.max,0,1);rect(p.x,p.y,p.size,p.size,p.color);ctx.globalAlpha=1;}
if(world.first&&world.first.hp>0&&phase==='game'){const a=world.first,t=world.time;circle(a.x,a.y,13+Math.sin(t*6)*3,'#bdcf6847');}
ctx.restore();drawMini();}
function drawBuilding(b){let x=b.x,y=b.y,w=b.w,h=b.h,shade=b.type==='hospital'?'#92918a':b.type==='police'?'#737f89':b.type==='armory'?'#696866':b.type==='pharmacy'?'#aaa58e':b.type==='shop'?'#a49380':'#8a8775';rect(x+3,y+4,w,h,'#172327');rect(x,y,w,h,'#4d5149');rect(x+5,y+5,w-10,h-10,shade);
for(let j=8;j<w-10;j+=14)for(let k=8;k<h-10;k+=14){if((Math.round(j*13+k*5+b.seed)%7)===0)rect(x+j,y+k,8,1,'#5e695e35');}
// Roofless walls: gaps in the southern wall are traversable doors.
rect(x-2,y-3,w+4,6,'#252e32');rect(x-1,y, w,2,'#ced0a9');rect(x-3,y,6,h,'#25353a');rect(x+w-3,y,6,h,'#2b3336');rect(x-2,y+h-3,b.doorX-x-b.doorW/2+2,6,'#333b3d');rect(b.doorX+b.doorW/2,y+h-3,x+w-(b.doorX+b.doorW/2)+3,6,'#333b3d');rect(b.doorX-b.doorW/2,y+h, b.doorW,5,'#957a61');
for(let ix=x+17;ix<x+w-13;ix+=27){rect(ix,y-2,12,3,'#87b1b4');rect(ix,y,12,2,'#dae1cd');}
for(let iy=y+18;iy<y+h-12;iy+=28){rect(x-2,iy,3,12,'#98c5c6');rect(x+w-1,iy,3,12,'#98c5c6');}
for(const f of b.desks){rect(f.x+2,f.y+3,f.w,f.h,'#3c392e');rect(f.x,f.y,f.w,f.h,b.type==='hospital'?'#cfddda':b.type==='police'?'#657882':b.type==='shop'?'#8a6e50':'#79664e');rect(f.x+1,f.y+2,2,2,'#c9b391');}
const labels={police:['POLICE','#a2c9f6'],armory:['ARMORY','#d5bf81'],hospital:['HOSP +','#eea9a7'],pharmacy:['MEDS +','#c8f0a9'],shop:['SHOP','#e7c392'],garage:['GARAGE','#c8d2cb'],house:['',shade]};const l=labels[b.type];if(l[0]){ctx.fillStyle='#18252a';ctx.fillRect(x+7,y+7,Math.min(w-14,l[0].length*6+8),13);ctx.fillStyle=l[1];ctx.font='9px monospace';ctx.fillText(l[0],x+10,y+16);}
if(b.supplies>0){rect(x+w-18,y+14,12,8,'#373e31');rect(x+w-16,y+15,8,2,'#ded097');}if(b.meds>0){rect(x+w-20,y+17,8,10,'#e4ece9');rect(x+w-17,y+19,2,6,'#c96468');rect(x+w-19,y+21,6,2,'#c96468');}}
function drawCar(c){ctx.save();ctx.translate(Math.round(c.x),Math.round(c.y));ctx.rotate(c.angle);rect(-13,-8,27,17,'#18252a');rect(-11,-7,23,14,c.dead?'#3c3129':c.color);rect(-5,-6,9,12,c.dead?'#302e2e':'#b0c7c1');rect(7,-5,3,10,'#474e4d');rect(-11,-9,5,3,'#1b252c');rect(5,-9,5,3,'#1b252c');rect(-11,7,5,3,'#1b252c');rect(5,7,5,3,'#1b252c');if(c.driver)rect(12,-4,2,3,'#eadd92');if(c.armored)rect(-9,-9,4,18,'#4f5944');ctx.restore();}
function drawAgent(a){const bob=Math.sin(a.step)*1.15;let col=a.kind==='zombie'?a.type==='runner'?'#bddb64':a.type==='brute'?'#5b987c':a.type==='spitter'?'#ad79b7':'#8ab967':a.role==='police'?'#4e83b1':a.role==='medic'?'#e0e7d1':a.role==='fighter'?'#c88c61':a.role==='organizer'?'#a7bed2':['#e0a188','#d0ac7f','#9dada6','#b1a1b6','#d6b8a1'][a.shade||0];const radius=a.type==='brute'?9:a.type==='runner'?5:6;
ctx.fillStyle='#10191b77';ctx.beginPath();ctx.ellipse(a.x+2,a.y+4,radius+2,3,0,0,Math.PI*2);ctx.fill();circle(a.x,a.y+bob,radius+1,'#233135');circle(a.x,a.y+bob,radius,col);
if(a.kind==='zombie'){rect(a.x-3,a.y-2+bob,2,2,'#e5484d');rect(a.x+2,a.y-2+bob,2,2,'#e5484d');if(a.type==='brute')rect(a.x-11,a.y-2+bob,4,7,'#6da185');if(a.type==='spitter')rect(a.x-2,a.y+3+bob,5,2,'#edc2f3');}
else{rect(a.x-2,a.y-3+bob,4,3,'#f0dbc1');if(a.role==='police')rect(a.x-4,a.y-5+bob,8,2,'#283947');if(a.gun){const ax=a.angle;line(a.x+Math.cos(ax)*4,a.y+Math.sin(ax)*4+bob,a.x+Math.cos(ax)*13,a.y+Math.sin(ax)*13+bob,'#1e2527',3);line(a.x+Math.cos(ax)*7,a.y+Math.sin(ax)*7+bob,a.x+Math.cos(ax)*13,a.y+Math.sin(ax)*13+bob,'#c2b6a2',1);}if(a.panic>1)rect(a.x-2,a.y-12+bob,4,4,'#f8cc6b');if(a.infecting&&a.sick<4)circle(a.x,a.y-13+bob,3,'#9ea853');}
}
function drawMini(){const ww=100,hh=70,x=CW-ww-11,y=CH-hh-13;if(phase==='menu'||phase==='end')return;rect(x-2,y-2,ww+4,hh+4,'#0b141add');rect(x,y,ww,hh,'#3e4e48');for(const b of world.buildings)rect(x+b.x/world.w*ww,y+b.y/world.h*hh,Math.max(1,b.w/world.w*ww),Math.max(1,b.h/world.h*hh),'#68716a');for(const z of world.zombies){if(z.hp>0)rect(x+z.x/world.w*ww,y+z.y/world.h*hh,2,2,'#c9f16b');}for(const h of world.persons){if(h.hp>0&&h.role==='police')rect(x+h.x/world.w*ww,y+h.y/world.h*hh,1,1,'#9ecee8');}rect(x+cam.x/world.w*ww,y+cam.y/world.h*hh,3,3,'#ffeded');}
function loop(now){let dt=last?clamp((now-last)/1000,0,.05):.016;last=now;if(world&&(phase==='game'||phase==='select')){if(phase==='game')update(dt);render();}else if(phase==='end'){render();}else{if(!world)newWorld(0,menuSeed);render();}requestAnimationFrame(loop);}
function render(){ctx.clearRect(0,0,CW,CH);ctx.fillStyle='#425b4c';ctx.fillRect(0,0,CW,CH);worldRender();}
function pointFromEvent(e){const box=canvas.getBoundingClientRect();return {x:(e.clientX-box.left)/box.width*CW,y:(e.clientY-box.top)/box.height*CH};}
canvas.addEventListener('pointerdown',e=>{if(phase!=='game'&&phase!=='select')return;canvas.setPointerCapture(e.pointerId);const p=pointFromEvent(e);pointers.set(e.pointerId,p);dragDistance=0;pressX=p.x;pressY=p.y;prevPinch=0;});
canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;const p=pointFromEvent(e),old=pointers.get(e.pointerId);pointers.set(e.pointerId,p);if(pointers.size===1){const d=dst(p.x,p.y,old.x,old.y);dragDistance+=d;if(dragDistance>3){cam.x=clamp(cam.x-(p.x-old.x)/cam.z,0,world.w);cam.y=clamp(cam.y-(p.y-old.y)/cam.z,0,world.h);}}
else if(pointers.size>=2){const a=Array.from(pointers.values()),d=dst(a[0].x,a[0].y,a[1].x,a[1].y);if(prevPinch)cam.z=clamp(cam.z*d/prevPinch,.45,2.55);prevPinch=d;}});
canvas.addEventListener('pointerup',e=>{const p=pointFromEvent(e);if(pointers.size===1&&dragDistance<10&&phase==='select'){const h=pickHumanScreen(p.x,p.y);if(h)selectPatient(h);}pointers.delete(e.pointerId);prevPinch=0;});
canvas.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);prevPinch=0;});
canvas.addEventListener('wheel',e=>{if(!world)return;e.preventDefault();cam.z=clamp(cam.z*(e.deltaY>0?.9:1.1),.45,2.55);},{passive:false});
for(const b of document.querySelectorAll('#maps button'))b.onclick=()=>{mapChoice=Number(b.dataset.map);document.querySelectorAll('#maps button').forEach(x=>x.classList.toggle('chosen',x===b));newWorld(mapChoice);};
for(const b of document.querySelectorAll('#diffs button'))b.onclick=()=>{difficulty=Number(b.dataset.diff);document.querySelectorAll('#diffs button').forEach(x=>x.classList.toggle('chosen',x===b));};
$('launch').onclick=startPick;$('backSelect').onclick=()=>{phase='menu';world=null;show('menu',true);show('selection',false);renderMenu();};
$('again').onclick=()=>{phase='menu';world=null;show('result',false);show('menu',true);renderMenu();};
$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'▶':'Ⅱ';};
$('speed').onclick=()=>{speed=speed===1?2:speed===2?3:1;S('speed','×'+speed);};
for(const b of document.querySelectorAll('[data-skill]'))b.onclick=()=>useSkill(b.dataset.skill);
window.handleBack=()=>{if(phase==='select'){$('backSelect').click();}else if(phase==='game'){paused=!paused;$('pause').textContent=paused?'▶':'Ⅱ';}else if(phase==='end'){$('again').click();}};
window.__outbreakDebug={get phase(){return phase},get world(){return world},get coins(){return coins},startPick,selectPatient,update,finish,newWorld,renderMenu};
renderMenu();requestAnimationFrame(loop);
})();
