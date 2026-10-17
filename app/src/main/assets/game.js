'use strict';
(()=>{
const $=id=>document.getElementById(id), canvas=$('world'), ctx=canvas.getContext('2d',{alpha:false});
let CW=850,CH=480,last=0,clock=0,phase='menu',world=null,mapChoice=0,difficulty=1,menuSeed=31,paused=false,speed=1;
let coins=0,owned={},perkTab='passive',cam={x:0,y:0,z:1},pointers=new Map(),dragDistance=0,pressX=0,pressY=0,prevPinch=0;
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
 ['ambush','◆','ОСАДНАЯ ПАМЯТЬ','Зомби узнают короткие маршруты к входам и разбитым окнам.',55,'siege'],
 ['pursuit','◆','НЕУТОМИМАЯ ОХОТА','В погоне обычные зомби ускоряются и не теряют след после поворота.',65,'fast'],
 ['glass','◆','СТЕКЛЯННАЯ БУРЯ','Разбивая окна, заражённые поднимают шум, привлекающий ближайшую стаю.',78,'ambush'],
 ['stalker','⬡','СУМЕРЕЧНЫЕ ОХОТНИКИ','Зомби присоединяются к преследованию, если союзник видит добычу.',110,'pursuit'],
 ['revival','◆','ВТОРОЙ ГОЛОД','Каждый пятый убитый зомби разово восстаёт ослабленным после паузы.',145,'corpse'],
 ['conduit','⬡','СЕРДЦЕ УЛЬЯ','Когда собрано 20 зомби, обычные заражённые ломают двери сообща.',190,'stalker'],
 ['breach','✦','УДАРНАЯ ВОЛНА','Активная способность разбивает двери, окна и баррикады в области.',65,'siege']
];
const MAPS=[{n:100,w:1150,h:920},{n:500,w:2280,h:1550},{n:1000,w:3300,h:2300}];
const GUNS={pistol:{name:'ПИСТОЛЕТ',range:152,dmg:27,rate:.48,ammo:13,bullets:1,speed:430,color:'#f6e39b'},smg:{name:'ПП',range:148,dmg:13,rate:.11,ammo:35,bullets:1,speed:475,color:'#f2d575'},shotgun:{name:'ДРОБОВИК',range:108,dmg:14,rate:.86,ammo:8,bullets:5,speed:380,color:'#ffc17b'},rifle:{name:'ВИНТОВКА',range:220,dmg:37,rate:.62,ammo:20,bullets:1,speed:610,color:'#fff4be'},grenade:{name:'ГРАНАТЫ',range:172,dmg:64,rate:2.6,ammo:4,bullets:1,speed:200,color:'#bde6a4'}};
function r(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;}}
let rand=r(17),uid=1; const rnd=(a,b)=>a+rand()*(b-a), irnd=n=>Math.floor(rand()*n),clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),dst=(x,y,X,Y)=>Math.hypot(x-X,y-Y);
function save(){try{localStorage.setItem('outbreak_v01',JSON.stringify({coins,owned}));}catch(e){}}
try{const s=JSON.parse(localStorage.getItem('outbreak_v01')||'{}');coins=Math.max(0,s.coins|0);owned=s.owned||{};}catch(e){}
function S(id,txt){$(id).textContent=txt}function show(id,yes){$(id).classList.toggle('hidden',!yes)}
function perk(id){return !!owned[id]}
function renderMenu(){S('coins','◈ '+coins);S('wallet','◈ '+coins);
for(const b of document.querySelectorAll('[data-perk-tab]'))b.classList.toggle('chosen',b.dataset.perkTab===perkTab);
const node=$('perks');node.innerHTML='';let shown=0;
PERKS.slice().sort((a,b)=>a[4]-b[4]).forEach(([id,symbol,title,desc,price,req])=>{const active=symbol==='✦';if((perkTab==='active')!==active)return;
const have=perk(id),locked=req&&!perk(req),afford=coins>=price,b=document.createElement('button');
const tier=price<30?'I · НАЧАЛЬНАЯ':price<60?'II · ЭВОЛЮЦИЯ':price<105?'III · МУТАЦИЯ':price<150?'IV · ДОМИНИРОВАНИЕ':'V · КАТАСТРОФА';
b.className='perk '+(have?'owned':afford&&!locked?'ready':'')+' tier'+(price>=105?' legendary':'');
b.disabled=have||locked||!afford;
b.innerHTML='<div class="tierlabel">'+tier+'</div><div class="perkhead"><span>'+symbol+' '+title+'</span><span class="price '+(have?'owned':'')+'">'+(have?'✓':'◈ '+price)+'</span></div><div class="perkbody">'+desc+(locked?' · Требуется: '+PERKS.find(x=>x[0]===req)[2]:'')+'</div>';
b.onclick=()=>{if(coins<price||have||locked)return;coins-=price;owned[id]=1;save();renderMenu();};node.appendChild(b);shown++;});
S('perksHint',perkTab==='passive'?'ПОСТОЯННЫЕ МУТАЦИИ · более дорогие узлы меняют правила охоты.':'УПРАВЛЯЕМЫЕ СПОСОБНОСТИ · доступны в бою после покупки.');}

function resize(){const dpr=Math.min(2,window.devicePixelRatio||1);CW=720;CH=Math.round(CW*innerHeight/innerWidth);if(CH>550){CH=550;CW=Math.round(CH*innerWidth/innerHeight)}canvas.width=CW;canvas.height=CH;ctx.imageSmoothingEnabled=false;ctx.font='12px monospace';}
window.addEventListener('resize',resize);resize();
function newWorld(index,seed=Date.now()%100000){const info=MAPS[index],w={w:info.w,h:info.h,count:info.n,persons:[],zombies:[],buildings:[],cars:[],barriers:[],guns:[],bullets:[],particles:[],fires:[],clouds:[],events:[],tree:[],features:[],roadsX:[],roadsY:[],solids:[],gates:[],nav:null,navVersion:0,wallBuckets:new Map(),time:0,alarm:0,infections:0,zLost:0,popStart:info.n,round:false,first:null,stage:0,riotIn:0,patrolIn:0,finishWait:0,skills:{howl:0,fury:0,spore:0,breach:0},buffs:{fury:0,howl:0},focus:null};world=w;rand=r(seed);uid=1;
// District generator: uneven roads, pocket parks, courtyards, shops and narrow passageways.
const makeRoads=limit=>{const arr=[{at:0,w:49}];let at=0;while(at<limit){at+=Math.round(rnd(170,265));arr.push({at,w:Math.round(rnd(30,68))});}return arr;};
w.roadsX=makeRoads(w.w);w.roadsY=makeRoads(w.h);
let blockIndex=0;
for(let ix=0;ix<w.roadsX.length-1;ix++)for(let iy=0;iy<w.roadsY.length-1;iy++){
 const rx=w.roadsX[ix],nx=w.roadsX[ix+1],ry=w.roadsY[iy],ny=w.roadsY[iy+1];
 const x=rx.at+rx.w+8,y=ry.at+ry.w+8,bw=Math.min(w.w-8,nx.at-9)-x,bh=Math.min(w.h-8,ny.at-9)-y;
 if(bw<64||bh<67)continue;
 let district=rand(),layout=district<.11?'park':district<.19?'square':district<.26?'parking':district<.34?'market':district<.53?'alley':district<.72?'courtyard':district<.86?'estate':'commercial';
 if(blockIndex===0)layout='commercial';
 w.features.push({x,y,w:bw,h:bh,type:layout,seed:irnd(999999)});
 const houseType=()=>{const v=rand();return v<.07?'police':v<.15?'hospital':v<.22?'armory':v<.29?'pharmacy':v<.46?'shop':v<.58?'garage':'house';};
 function place(px,py,pw,ph,type){if(pw<38||ph<39)return;
 const wallStyle=irnd(4),entranceSide=['S','N','E','W'][irnd(4)];
 const b={x:Math.round(px),y:Math.round(py),w:Math.round(pw),h:Math.round(ph),type,wallStyle,entranceSide,seed:irnd(1e7),supplies:type==='armory'?4:type==='police'?3:0,meds:type==='hospital'?6:type==='pharmacy'?3:0,desks:[],visited:0,openings:[]};
 if(blockIndex<6){b.type=['police','hospital','armory','pharmacy','shop','garage'][blockIndex];b.supplies=b.type==='armory'?4:b.type==='police'?3:0;b.meds=b.type==='hospital'?6:b.type==='pharmacy'?3:0;}
 const doorAt=entranceSide==='N'||entranceSide==='S'?b.x+b.w*(.32+rand()*.36):b.y+b.h*(.32+rand()*.36);
 b.doorX=entranceSide==='N'||entranceSide==='S'?doorAt:b.x+b.w*.5;b.doorW=29;
 b.openings.push({side:entranceSide,at:doorAt,width:29,kind:'door'});
 const extraSide=entranceSide==='S'?'N':entranceSide==='N'?'S':entranceSide==='E'?'W':'E';
 if(rand()<.64)b.openings.push({side:extraSide,at:(extraSide==='S'||extraSide==='N')?b.x+b.w*.5:b.y+b.h*.5,width:18,kind:'window'});
 if(rand()<.45){const side=rand()<.5?'E':'W';if(side!==entranceSide&&side!==extraSide)b.openings.push({side,at:b.y+b.h*.45,width:18,kind:'window'});}
 for(let j=0;j<irnd(3)+1;j++)b.desks.push({x:b.x+12+rnd(0,Math.max(0,b.w-36)),y:b.y+14+rnd(0,Math.max(0,b.h-35)),w:rnd(8,15),h:rnd(6,11)});
 w.buildings.push(b);
 }
 if(layout==='park'||layout==='square'||layout==='parking'){
  if(layout==='park')for(let k=0;k<5;k++)w.tree.push({x:x+rnd(15,bw-15),y:y+rnd(14,bh-14),s:rnd(8,16)});
  if(layout==='parking'&&rand()<.4)place(x+bw*.57,y+bh*.12,bw*.35,bh*.35,'garage');
 }else if(layout==='alley'&&bw>118){const gap=Math.round(rnd(20,31)),left=(bw-gap)*rnd(.41,.56);place(x,y,left,bh,'house');place(x+left+gap,y,bw-left-gap,bh,houseType());}
 else if(layout==='courtyard'&&bw>117&&bh>115){const gap=Math.round(rnd(33,50));place(x,y,bw*.48,(bh-gap)*.52,houseType());place(x+bw*.55,y,bw*.45,(bh-gap)*.57,'house');place(x+9,y+bh-gap,bw*.64,gap*.78,'shop');}
 else if(layout==='estate'&&bh>103){const gap=rnd(23,36);place(x,y,bw,bh*.46,houseType());place(x+8,y+bh*.46+gap,bw-16,bh*.54-gap,'house');}
 else if(layout==='market'&&bw>120){place(x+4,y+4,bw*.43,bh*.60,'shop');place(x+bw*.58,y+bh*.18,bw*.40,bh*.78,'shop');}
 else {place(x+7,y+7,bw-14,bh-14,houseType());}
 blockIndex++;
}
// Convert roofless building footprints into solid walls and interactive doors/windows.
for(const b of w.buildings){const sides=[['N',b.x,b.y,b.x+b.w,b.y],['S',b.x,b.y+b.h,b.x+b.w,b.y+b.h],['W',b.x,b.y,b.x,b.y+b.h],['E',b.x+b.w,b.y,b.x+b.w,b.y+b.h]];
 for(const [side,x1,y1,x2,y2] of sides){const horizontal=side==='N'||side==='S',openings=b.openings.filter(o=>o.side===side).sort((a,c)=>a.at-c.at);let start=horizontal?x1:y1,end=horizontal?x2:y2;
  for(const o of openings){const lo=clamp(o.at-o.width/2,start,end),hi=clamp(o.at+o.width/2,start,end);if(lo>start+1)w.solids.push(rectWall(side,horizontal,start,lo,x1,y1,b));
   const gate=rectWall(side,horizontal,lo,hi,x1,y1,b);gate.kind=o.kind;gate.hp=o.kind==='window'?50:94;gate.maxHp=gate.hp;gate.openUntil=0;gate.broken=false;gate.building=b;w.gates.push(gate);o.gate=gate;start=hi;
  }if(start<end-1)w.solids.push(rectWall(side,horizontal,start,end,x1,y1,b));
 }
 for(const f of b.desks)w.solids.push({x:f.x,y:f.y,w:f.w,h:f.h,kind:'furniture'});
}
function rectWall(side,horizontal,a,b,x,y,building){return horizontal?{x:a,y:y-3,w:b-a,h:6,kind:'wall',side,building}:{x:x-3,y:a,w:6,h:b-a,kind:'wall',side,building};}

const streetPoint=()=>{const vertical=rand()<.5,roads=vertical?w.roadsX:w.roadsY,road=roads[irnd(Math.max(1,roads.length-1))];return vertical?{x:clamp(road.at+road.w*.5+rnd(-road.w*.2,road.w*.2),15,w.w-15),y:rnd(15,w.h-15)}:{x:rnd(15,w.w-15),y:clamp(road.at+road.w*.5+rnd(-road.w*.2,road.w*.2),15,w.h-15)};};

for(let i=0;i<info.n;i++){const role=i<Math.max(3,Math.floor(info.n*.035))?'police':rand()<.025?'medic':rand()<.045?'fighter':rand()<.055?'driver':rand()<.075?'organizer':'civilian';let p=streetPoint();if(rand()<.25&&w.buildings.length){let b=w.buildings[irnd(w.buildings.length)];p={x:b.x+rnd(15,Math.max(16,b.w-15)),y:b.y+rnd(15,Math.max(16,b.h-15))};}if(w.solids.some(o=>overlapCircle(p.x,p.y,6,o)))p=streetPoint();const a={id:uid++,x:p.x,y:p.y,vx:0,vy:0,role,kind:'human',hp:role==='police'?88:role==='fighter'?74:57,panic:0,bravery:role==='police'?.85:role==='fighter'?.67:rnd(.08,.68),group:i%9===0?i:Math.floor(i/9)*9,mode:'wander',tx:p.x,ty:p.y,decision:rnd(.1,2),attack:0,fitness:rand(),gun:null,inCar:null,infecting:false,sick:0,escaped:false,shade:irnd(5),angle:rnd(0,6.28),step:rnd(0,6),harvest:false};if(role==='police')a.gun=weapon('pistol');else if(role==='fighter'&&rand()<.23)a.gun=weapon('shotgun');w.persons.push(a);}
// All ammunition is supplied by existing police, gun racks, vehicles or dropped weapons.
for(const b of w.buildings){if(b.supplies){for(let q=0;q<b.supplies;q++){let kind=b.type==='police'?(q%2?'smg':'pistol'):(['shotgun','smg','rifle','grenade'][q%4]);w.guns.push({x:b.x+19+(q%3)*13,y:b.y+24+Math.floor(q/3)*11,gun:weapon(kind),owner:null});}}}
for(let i=0;i<Math.max(3,Math.floor(info.n/35));i++){const p=streetPoint();w.cars.push({x:p.x,y:p.y,vx:0,vy:0,hp:140,driver:null,passengers:[],angle:rnd(0,6.28),fuel:rnd(60,130),t:rnd(2,7),color:['#557b83','#b9a37c','#a66b63','#73917c'][irnd(4)],dead:false});}
for(let i=0;i<Math.floor(info.n/26);i++){let p=streetPoint();w.tree.push({x:p.x+rnd(14,40),y:p.y+rnd(-23,23),s:rnd(9,18)});}
indexWalls();rebuildNav();cam.x=w.w*.5;cam.y=w.h*.5;cam.z=index===0?.95:index===1?.77:.69;return w;}
function buildingEntrance(b){const o=b.openings.find(o=>o.kind==='door');return o.side==='N'?{x:o.at,y:b.y-12}:o.side==='S'?{x:o.at,y:b.y+b.h+12}:o.side==='W'?{x:b.x-12,y:o.at}:{x:b.x+b.w+12,y:o.at};}
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
function killZombie(z){if(z.dead)return;z.dead=true;z.hp=0;if(perk('revival')&&world.zLost%5===4&&!z.reborn){world.reanimate=world.reanimate||[];world.reanimate.push({x:z.x,y:z.y,t:world.time+2.4});}blood(z.x,z.y,10,'#6e864b');world.zLost++;if(perk('corpse'))cloud(z.x,z.y,40,5,'spore');}
function nearest(from,arr,rad,pred){let found=null,dd=rad*rad;for(const o of arr){if(o.hp<=0||pred&&!pred(o))continue;const x=o.x-from.x,y=o.y-from.y,s=x*x+y*y;if(s<dd){dd=s;found=o;}}return found;}
// Nav-grid A*: doors are legal passages for humans (they open them);
// zombies route to doors or windows, then must break closed fittings before entering.
function overlapCircle(x,y,r,o){const xx=clamp(x,o.x,o.x+o.w),yy=clamp(y,o.y,o.y+o.h);return dst(x,y,xx,yy)<r;}
function indexWalls(){const w=world,size=72;w.wallBuckets=new Map();for(const o of [...w.solids,...w.gates]){
 const lx=Math.floor((o.x-7)/size),hx=Math.floor((o.x+o.w+7)/size),ly=Math.floor((o.y-7)/size),hy=Math.floor((o.y+o.h+7)/size);
 for(let ix=lx;ix<=hx;ix++)for(let iy=ly;iy<=hy;iy++){const key=ix+','+iy;if(!w.wallBuckets.has(key))w.wallBuckets.set(key,[]);w.wallBuckets.get(key).push(o);}}
}
function spatialWalls(x,y){const bucket=world.wallBuckets.get(Math.floor(x/72)+','+Math.floor(y/72));return bucket||[];}
function gateWalkable(g,e){return g.broken||g.openUntil>world.time||(e&&e.kind==='human'&&g.kind==='door');}
function rebuildNav(){const n=world.nav={cell:12,cols:Math.ceil(world.w/12),rows:Math.ceil(world.h/12),human:null,zombie:null,cost:null};const size=n.cols*n.rows;n.human=new Uint8Array(size);n.zombie=new Uint8Array(size);n.cost=new Uint8Array(size);
 const mark=(o,mode,cost)=>{const margin=4.5,loX=Math.max(0,Math.floor((o.x-margin)/n.cell)),hiX=Math.min(n.cols-1,Math.ceil((o.x+o.w+margin)/n.cell)),loY=Math.max(0,Math.floor((o.y-margin)/n.cell)),hiY=Math.min(n.rows-1,Math.ceil((o.y+o.h+margin)/n.cell));
 for(let iy=loY;iy<=hiY;iy++)for(let ix=loX;ix<=hiX;ix++){const px=ix*n.cell+n.cell/2,py=iy*n.cell+n.cell/2;if(!overlapCircle(px,py,4.5,o))continue;const j=iy*n.cols+ix;if(mode==='solid'){n.human[j]=1;n.zombie[j]=1;}else if(mode==='window'){n.human[j]=1;n.cost[j]=Math.max(9,n.cost[j]);}else if(mode==='door')n.cost[j]=Math.max(3,n.cost[j]);}}
 for(const o of world.solids)mark(o,'solid');for(const g of world.gates)mark(g,g.broken?'door':g.kind);for(const b of world.barriers)if(b.hp>0)mark({x:b.x-12,y:b.y-5,w:24,h:10},'solid');
 world.navVersion++;
}
function navIndex(x,y){const n=world.nav;return clamp(Math.floor(y/n.cell),0,n.rows-1)*n.cols+clamp(Math.floor(x/n.cell),0,n.cols-1);}
function navClear(a,b,kind){const n=world.nav,map=kind==='human'?n.human:n.zombie;const d=dst(a.x,a.y,b.x,b.y),steps=Math.ceil(d/(n.cell*.54));for(let i=1;i<=steps;i++){const k=i/steps;if(map[navIndex(a.x+(b.x-a.x)*k,a.y+(b.y-a.y)*k)])return false;}return true;}
function findPath(a,b,kind){const n=world.nav,width=n.cols,block=kind==='human'?n.human:n.zombie,start=navIndex(a.x,a.y),end=navIndex(b.x,b.y);if(start===end)return [];
 let target=end;if(block[target]){let best=Infinity;const gx=end%width,gy=Math.floor(end/width);for(let yy=Math.max(1,gy-6);yy<=Math.min(n.rows-2,gy+6);yy++)for(let xx=Math.max(1,gx-6);xx<=Math.min(n.cols-2,gx+6);xx++){const id=yy*width+xx,v=(xx-gx)**2+(yy-gy)**2;if(!block[id]&&v<best){best=v;target=id;}}}
 const heap=[],g=new Map([[start,0]]),parent=new Map(),closed=new Set();
 const heur=id=>Math.hypot(id%width-target%width,Math.floor(id/width)-Math.floor(target/width));
 const push=(id,f)=>{let k=heap.length;heap.push({id,f});while(k>0){const par=(k-1)>>1;if(heap[par].f<=f)break;heap[k]=heap[par];k=par;}heap[k]={id,f};};
 const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){let k=0;while(2*k+1<heap.length){let m=2*k+1;if(m+1<heap.length&&heap[m+1].f<heap[m].f)m++;if(last.f<=heap[m].f)break;heap[k]=heap[m];k=m;}heap[k]=last;}return top.id;};
 push(start,heur(start));let best=start,bestH=heur(start),steps=0;
 while(heap.length&&steps++<950){const id=pop();if(closed.has(id))continue;closed.add(id);let h=heur(id);if(h<bestH){best=id;bestH=h;}if(id===target){best=target;break;}
 const x=id%width,y=Math.floor(id/width);for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0],[1,-1],[-1,-1],[1,1],[-1,1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=n.cols||ny>=n.rows)continue;const nid=ny*width+nx;if(block[nid]||closed.has(nid))continue;
 if(dx&&dy&&(block[id+dx]||block[id+dy*width]))continue;
 const penalty=kind==='zombie'?n.cost[nid]*.5:n.cost[nid]*.10,ng=g.get(id)+(dx&&dy?1.414:1)+penalty;if(ng<(g.get(nid)??Infinity)){g.set(nid,ng);parent.set(nid,id);push(nid,ng+heur(nid));}}
 }
 if(best===start)return [];const nodes=[];let cur=best;while(cur!==start&&nodes.length<180){nodes.push({x:(cur%width+.5)*n.cell,y:(Math.floor(cur/width)+.5)*n.cell});cur=parent.get(cur);if(cur===undefined)return [];}
 nodes.reverse();if(best===target&&!block[end])nodes.push({x:b.x,y:b.y});
 // Remove redundant nodes while retaining segment visibility around corners.
 const path=[];let anchor={x:a.x,y:a.y};for(let i=0;i<nodes.length;){let furthest=i;for(let j=i+1;j<nodes.length&&j<i+12;j++){if(navClear(anchor,nodes[j],kind))furthest=j;else break;}path.push(nodes[furthest]);anchor=nodes[furthest];i=furthest+1;}return path;
}
function collisionPoint(x,y,ox,oy,rad,entity){const w=world,margin=rad||5;x=clamp(x,margin,w.w-margin);y=clamp(y,margin,w.h-margin);
 function hits(xx,yy){for(const o of spatialWalls(xx,yy)){if((o.kind==='door'||o.kind==='window')&&gateWalkable(o,entity))continue;if(overlapCircle(xx,yy,margin,o)){const midX=o.x+o.w/2,midY=o.y+o.h/2;if(overlapCircle(ox,oy,margin,o)&&dst(xx,yy,midX,midY)>dst(ox,oy,midX,midY))continue;return o;}}
 for(const b of w.barriers)if(b.hp>0&&Math.abs(xx-b.x)<12+margin&&Math.abs(yy-b.y)<5+margin)return b;
 for(const c of w.cars)if(!c.dead&&c!==entity?.inCar&&dst(xx,yy,c.x,c.y)<15+margin)return c;return null;}
 let hit=hits(x,y);if(!hit)return {x,y,hit:null};let X=x,Y=oy;if(hits(X,Y)){X=ox;Y=y;if(hits(X,Y)){X=ox;Y=oy;}}return {x:X,y:Y,hit};}
function move(entity,tx,ty,sp,dt,wall=true){const dx=tx-entity.x,dy=ty-entity.y,dd=Math.hypot(dx,dy);if(dd<.65)return;
 entity.angle=Math.atan2(dy,dx);const vx=dx/dd*sp,vy=dy/dd*sp;entity.vx+=(vx-entity.vx)*Math.min(1,dt*9);entity.vy+=(vy-entity.vy)*Math.min(1,dt*9);
 const p=wall?collisionPoint(entity.x+entity.vx*dt,entity.y+entity.vy*dt,entity.x,entity.y,5,entity):{x:entity.x+entity.vx*dt,y:entity.y+entity.vy*dt};
 if(dst(entity.x,entity.y,p.x,p.y)<.16){entity.stuck=(entity.stuck||0)+dt;if(entity.stuck>.3){entity.navUntil=0;entity.vx=0;entity.vy=0;}}else entity.stuck=0;
 entity.x=p.x;entity.y=p.y;entity.step+=dt*sp*.20;}
function approachTarget(e,goal,sp,dt){if(!goal)return;const n=world.nav;if(!n){move(e,goal.x,goal.y,sp,dt);return;}
 if(e.kind==='human')for(const gate of world.gates){if(gate.kind==='door'&&!gate.broken&&dst(e.x,e.y,gate.x+gate.w/2,gate.y+gate.h/2)<19)gate.openUntil=world.time+2.6;}
 const goalKey=navIndex(goal.x,goal.y),kind=e.kind;
 if(navClear(e,goal,kind)){e.navPath=null;move(e,goal.x,goal.y,sp,dt);return;}
 if(!e.navPath||e.navVersion!==world.navVersion||e.navGoal!==goalKey||world.time>(e.navUntil||0)){
 if(world.pathBudget<=0){if(e.navPath&&e.navPath.length){const tail=e.navPath[Math.min(e.navStep||0,e.navPath.length-1)];move(e,tail.x,tail.y,sp,dt);}return;}
 world.pathBudget--;e.navPath=findPath(e,goal,kind);e.navVersion=world.navVersion;e.navGoal=goalKey;e.navUntil=world.time+rnd(1.3,2.5);e.navStep=0;}
 const route=e.navPath;if(!route||!route.length){ // Fallback local avoidance, never repeatedly aim at a wall.
  const a=Math.atan2(goal.y-e.y,goal.x-e.x);for(const turn of [.58,-.58,1.2,-1.2,2.3]){const x=e.x+Math.cos(a+turn)*26,y=e.y+Math.sin(a+turn)*26;if(!world.nav[kind][navIndex(x,y)]){move(e,x,y,sp,dt);return;}}return;}
 while(e.navStep<route.length-1&&dst(e.x,e.y,route[e.navStep].x,route[e.navStep].y)<10)e.navStep++;
 const step=route[Math.min(e.navStep,route.length-1)];move(e,step.x,step.y,sp,dt);
}

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
if(danger<gun.range*.65){move(h,h.x+(h.x-enemy.x),h.y+(h.y-enemy.y),42+h.fitness*13,dt);}else if(danger>gun.range*.85)approachTarget(h,enemy,34,dt);else h.step+=dt*2;return;}
if(enemy&&danger<155){h.mode='flee';const allies=nearby(h,100,'human').filter(a=>a!==h&&a.hp>0&&a.sick<=0);let fx=h.x+(h.x-enemy.x)*2,fy=h.y+(h.y-enemy.y)*2;
if((h.role==='organizer'||h.group%3===0)&&allies.length){const n=allies[0];fx=fx*.75+n.x*.25;fy=fy*.75+n.y*.25;}
move(h,fx,fy,(47+h.fitness*22+(h.fitness>.92?13:0))*(difficulty===0?.94:1),dt);return;}
h.decision-=dt;if(h.decision<=0){h.decision=rnd(1.6,5);h.mode='wander';const ar=world.buildings.filter(b=>dst(h.x,h.y,buildingEntrance(b).x,buildingEntrance(b).y)<180);if(world.alarm>24&&rand()<.36&&ar.length){const b=ar[irnd(ar.length)];const enter=buildingEntrance(b);h.tx=enter.x;h.ty=enter.y;h.mode='hide';}else if(!h.gun&&world.alarm>17&&rand()<.36){const g=world.guns.find(g=>dst(h.x,h.y,g.x,g.y)<125);if(g){h.tx=g.x;h.ty=g.y;h.mode='loot';}else{h.tx=h.x+rnd(-140,140);h.ty=h.y+rnd(-130,130);}}else{h.tx=h.x+rnd(-125,125);h.ty=h.y+rnd(-110,110);}}
if(h.role==='driver'&&world.alarm>22&&!h.inCar){let c=world.cars.find(c=>!c.dead&&!c.driver&&dst(h.x,h.y,c.x,c.y)<15);if(c){c.driver=h;h.inCar=c;h.x=c.x;h.y=c.y;return;}else{c=world.cars.find(c=>!c.dead&&!c.driver&&dst(h.x,h.y,c.x,c.y)<150);if(c){h.tx=c.x;h.ty=c.y;}}}
approachTarget(h,{x:h.tx,y:h.ty},h.mode==='hide'?45:27+h.fitness*6,dt);
// Hospitals heal living humans from finite reserves.
if(h.hp<46){const b=world.buildings.find(b=>b.meds>0&&b.type==='hospital'&&h.x>b.x&&h.x<b.x+b.w&&h.y>b.y&&h.y<b.y+b.h);if(b&&rand()<dt*.7){h.hp=Math.min(65,h.hp+30);b.meds--;}}
}
function nearby(e,rad,kind){const arr=kind==='human'?world.persons:world.zombies,cell=world.gridCell,grid=kind==='human'?world.humanGrid:world.zombieGrid;if(!grid)return [];const ix=Math.floor(e.x/cell),iy=Math.floor(e.y/cell),s=Math.ceil(rad/cell),out=[];for(let x=ix-s;x<=ix+s;x++)for(let y=iy-s;y<=iy+s;y++){const bucket=grid.get(x+','+y);if(bucket)for(const a of bucket){if(Math.abs(a.x-e.x)<rad&&Math.abs(a.y-e.y)<rad)out.push(a);}}return out;}
function makeGrid(){world.gridCell=85;const h=new Map(),z=new Map();for(const [arr,grid] of [[world.persons,h],[world.zombies,z]])for(const a of arr){if(a.hp<=0)continue;const key=Math.floor(a.x/85)+','+Math.floor(a.y/85);if(!grid.has(key))grid.set(key,[]);grid.get(key).push(a);}world.humanGrid=h;world.zombieGrid=z;}
function updateZombie(z,dt){if(z.hp<=0)return;z.attack=Math.max(0,z.attack-dt);z.decision-=dt;z.acid-=dt;let senses=perk('scent')?238:165;if(world.buffs.howl>world.time)senses*=2.15;if(z.type==='spitter')senses+=55;const target=nearby(z,senses,'human').filter(h=>h.hp>0&&h.sick<=0).sort((a,b)=>distance(z,a)-distance(z,b))[0];let speed=z.type==='runner'?98:z.type==='brute'?39:z.type==='spitter'?53:66;if(perk('pursuit')&&target)speed*=1.18;if(world.buffs.fury>world.time)speed*=1.8;if(perk('hive')&&world.infections>=12)speed*=1.14;if(perk('conduit')&&world.zombies.length>=20)speed*=1.09;
if(target){z.target=target;let dd=distance(z,target);if(z.type==='spitter'&&dd<135&&dd>42&&z.acid<=0){world.bullets.push({x:z.x,y:z.y,vx:(target.x-z.x)/dd*195,vy:(target.y-z.y)/dd*195,life:.85,damage:21,owner:'acid',r:3});z.acid=2.5;}
if(dd<12+((z.type==='brute')?5:0)&&z.attack<=0){target.hp-=(z.type==='brute'?60:28)*(world.buffs.fury>world.time?1.6:1);z.attack=z.type==='runner'?.47:.77;blood(target.x,target.y,4);if(target.hp<=0)killHuman(target,true);}else if(z.type!=='spitter'||dd>80)approachTarget(z,target,speed,dt);else z.step+=dt*4;
}else{z.target=null;if(z.decision<=0||dst(z.x,z.y,z.tx,z.ty)<12){z.decision=rnd(1,4);z.tx=clamp(z.x+rnd(-140,140),5,world.w-5);z.ty=clamp(z.y+rnd(-140,140),5,world.h-5);}approachTarget(z,{x:z.tx,y:z.ty},speed*.58,dt);}
// Destroy doors and window glass a few blows at a time; hunt toward real openings.
if(z.attack<=0){let gate=spatialWalls(z.x,z.y).find(g=>(g.kind==='door'||g.kind==='window')&&!g.broken&&g.openUntil<=world.time&&dst(z.x,z.y,g.x+g.w/2,g.y+g.h/2)<21);
if(gate){const power=(z.type==='brute'?56:22)*(perk('siege')?1.75:1)*(perk('conduit')&&world.zombies.length>=20?1.55:1);
gate.hp-=power;z.attack=z.type==='brute'?.50:.64;blood(gate.x+gate.w/2,gate.y+gate.h/2,gate.kind==='window'?9:5,gate.kind==='window'?'#8cb7cb':'#9a8264');sound(gate.kind==='window'?530:108,.10);
if(gate.hp<=0){gate.broken=true;rebuildNav();if(perk('glass')&&gate.kind==='window')world.buffs.howl=world.time+2;announce(gate.kind==='window'?'СТЕКЛО РАЗБИТО':'ДВЕРЬ ВЫБИТА',1.2);}}}
// Destructible, physical barricades block the horde.
for(const b of world.barriers){if(b.hp<=0)continue;if(dst(z.x,z.y,b.x,b.y)<27){z.hp-=dt*(b.barbed?13:0);if(z.hp<=0)killZombie(z);if(z.attack<=0){b.hp-=z.type==='brute'?68:perk('siege')?35:19;z.attack=.57;blood(b.x,b.y,5,'#a68a69');}break;}}
for(const c of world.cars){if(c.dead||!c.driver)continue;if(dst(z.x,z.y,c.x,c.y)<24&&z.attack<=0){c.hp-=z.type==='brute'?35:perk('siege')?25:11;z.attack=.8;}}
}
function shoot(h,z){if(!h.gun||!z)return;const def=GUNS[h.gun.key];if(h.gun.ammo<=0)return;h.gun.ammo--;let dir=Math.atan2(z.y-h.y,z.x-h.x),spread=h.gun.key==='shotgun'?.44:h.gun.key==='smg'?.12:.055;
for(let i=0;i<def.bullets;i++){let a=dir+rnd(-spread,spread),v=def.speed;world.bullets.push({x:h.x+Math.cos(a)*9,y:h.y+Math.sin(a)*9,vx:Math.cos(a)*v,vy:Math.sin(a)*v,damage:def.dmg,life:def.range/v,owner:'human',r:2,grenade:h.gun.key==='grenade'});}h.angle=dir;world.particles.push({x:h.x+Math.cos(dir)*10,y:h.y+Math.sin(dir)*10,vx:0,vy:0,life:.09,max:.09,size:5,color:'#fff9b6',gravity:0});sound(h.gun.key==='shotgun'?90:330,.04);}
function explode(x,y,r=49,damage=80){fire(x,y,26);cloud(x,y,r*.8,2.6,'smoke');sound(47,.38);for(const z of world.zombies){if(z.hp<=0)continue;const d=dst(x,y,z.x,z.y);if(d<r){z.hp-=damage*(1-d/r*.5);if(z.hp<=0)killZombie(z);}}for(const h of world.persons){if(h.hp<=0)continue;const d=dst(x,y,h.x,h.y);if(d<r){h.hp-=damage*(1-d/r*.5);if(h.hp<=0)killHuman(h,false);}}for(const c of world.cars){if(!c.dead&&dst(x,y,c.x,c.y)<r){c.hp-=damage*1.4;}}for(const b of world.barriers){if(dst(x,y,b.x,b.y)<r)b.hp-=damage;}}
function updateProjectiles(dt){for(let i=world.bullets.length-1;i>=0;i--){const b=world.bullets[i];b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;let hit=false;if(b.owner==='human'){for(const z of nearby(b,11,'zombie'))if(z.hp>0&&dst(z.x,z.y,b.x,b.y)<8){z.hp-=b.damage;blood(z.x,z.y,3,'#829b57');if(z.hp<=0)killZombie(z);hit=true;break;}}else{for(const h of nearby(b,12,'human'))if(h.hp>0&&dst(h.x,h.y,b.x,b.y)<9){h.hp-=b.damage;h.panic=2;blood(h.x,h.y,4);if(h.hp<=0)killHuman(h,false);hit=true;break;}}
if(hit||b.life<=0||b.x<0||b.y<0||b.x>world.w||b.y>world.h){if(b.grenade)explode(b.x,b.y,50,90);if(b.owner==='acid')cloud(b.x,b.y,28,3,'spore');world.bullets.splice(i,1);}}
}
function updateCars(dt){for(const c of world.cars){if(c.dead)continue;if(c.hp<=0){c.dead=true;c.driver&&(c.driver.inCar=null,c.driver.hp-=35);for(const h of c.passengers){h.inCar=null;h.hp-=35;}explode(c.x,c.y,55,70);continue;}if(c.driver&&c.driver.hp>0){c.fuel-=dt;c.t-=dt;if(c.fuel<=0){c.driver.inCar=null;c.driver=null;continue;}if(c.t<=0){c.angle=irnd(4)*Math.PI/2;c.t=rnd(1.5,4);}const xx=c.x+Math.cos(c.angle)*105*dt,yy=c.y+Math.sin(c.angle)*105*dt;if(xx<12||yy<12||xx>world.w-12||yy>world.h-12){c.angle+=Math.PI;c.t=2;}else{const blocked=world.buildings.some(b=>xx>b.x-12&&xx<b.x+b.w+12&&yy>b.y-12&&yy<b.y+b.h+12)||world.barriers.some(b=>b.hp>0&&dst(xx,yy,b.x,b.y)<24);if(blocked){c.angle+=Math.PI/2;c.t=1.5;}else{c.x=xx;c.y=yy;}}
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
function deploy(stage){const w=world;let x=rnd(65,w.w-70),y=rnd(65,w.h-70);for(let i=0;i<(stage>=3?5:3);i++)w.persons.push(makeReinforcement(x+rnd(-25,25),y+rnd(-25,25),stage>=3?2:1));if(stage>=2){for(let i=0;i<3;i++){const b={x:x+rnd(-55,55),y:y+rnd(-55,55),hp:stage>=3?220:140,barbed:stage>=3};w.barriers.push(b);}rebuildNav();}
if(stage>=3){w.cars.push({x:x,y:y,vx:0,vy:0,hp:300,driver:null,passengers:[],angle:0,fuel:150,t:0,color:'#6b7a59',dead:false,armored:true});}
}
function updateClouds(dt){for(let i=world.clouds.length-1;i>=0;i--){const c=world.clouds[i];c.life-=dt;if(c.kind==='spore'){for(const h of nearby(c,c.r,'human')){if(h.hp<=0)continue;if(dst(h.x,h.y,c.x,c.y)<c.r){h.hp-=dt*(perk('spitter')?11:7);h.panic+=dt*.8;if(h.hp<=0)killHuman(h,true);}}}if(c.life<=0)world.clouds.splice(i,1);}for(let i=world.fires.length-1;i>=0;i--){let f=world.fires[i];f.life-=dt;for(const z of nearby(f,f.r,'zombie'))if(dst(z.x,z.y,f.x,f.y)<f.r&&z.hp>0){z.hp-=dt*8;if(z.hp<=0)killZombie(z);}for(const h of nearby(f,f.r,'human'))if(dst(h.x,h.y,f.x,f.y)<f.r&&h.hp>0){h.hp-=dt*7;if(h.hp<=0)killHuman(h,false);}if(f.life<=0)world.fires.splice(i,1);}}
function useSkill(id){if(!world||phase!=='game'||paused)return;if(world.skills[id]>0)return;const center={x:cam.x,y:cam.y};if(id==='howl'&&perk('howl')){world.skills.howl=28;world.buffs.howl=world.time+9;cloud(center.x,center.y,180,2,'scent');announce('МЁРТВЫЙ ЗОВ: СТАЯ СОБИРАЕТСЯ');sound(90,.4);}
else if(id==='fury'&&perk('fury')){world.skills.fury=42;world.buffs.fury=world.time+9;announce('ГОЛОД СТАИ: ЯРОСТЬ');sound(135,.3);}
else if(id==='spore'&&perk('fog')){world.skills.spore=38;cloud(center.x,center.y,116,12,'spore');announce('СПОРОВОЕ ОБЛАКО');sound(190,.3);}
else if(id==='breach'&&perk('breach')){world.skills.breach=55;for(const g of world.gates)if(!g.broken&&dst(center.x,center.y,g.x+g.w/2,g.y+g.h/2)<135){g.hp-=150;g.broken=g.hp<=0;}for(const b of world.barriers)if(dst(center.x,center.y,b.x,b.y)<135)b.hp-=90;rebuildNav();cloud(center.x,center.y,135,1.7,'smoke');announce('ПРОБОЙ ОБОРОНЫ');sound(64,.3);}}
function update(dt){if(!world||phase!=='game'||paused)return;dt*=speed;world.time+=dt;world.pathBudget=world.persons.length+world.zombies.length>600?6:16;world.gridTime=(world.gridTime||0)-dt;if(world.gridTime<=0){makeGrid();world.gridTime=.13;}
for(const a of world.persons)updateHuman(a,dt);
for(const z of world.zombies)updateZombie(z,dt);
updateProjectiles(dt);updateCars(dt);updateClouds(dt);updateGovernment(dt);
if(world.reanimate){for(let i=world.reanimate.length-1;i>=0;i--){const c=world.reanimate[i];if(world.time<c.t)continue;world.reanimate.splice(i,1);const z={id:uid++,x:c.x,y:c.y,vx:0,vy:0,kind:'zombie',type:'normal',hp:46,attack:.7,tx:c.x+9,ty:c.y+9,decision:1,angle:0,step:0,acid:0,reborn:true};world.zombies.push(z);blood(c.x,c.y,7,'#99bc78');}}
let destroyedBarrier=false;for(let i=world.barriers.length-1;i>=0;i--)if(world.barriers[i].hp<=0){world.barriers.splice(i,1);destroyedBarrier=true;}if(destroyedBarrier)rebuildNav();
for(let i=world.particles.length-1;i>=0;i--){const p=world.particles[i];p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.gravity*dt;if(p.life<=0)world.particles.splice(i,1);}
if(world.particles.length>950)world.particles.splice(0,world.particles.length-950);
for(const key in world.skills)world.skills[key]=Math.max(0,world.skills[key]-dt);
world.persons=world.persons.filter(h=>h.hp>0);world.zombies=world.zombies.filter(z=>z.hp>0);
let live=world.persons.length,z=world.zombies.length;if(world.first&&world.first.sick>0)z=1;
if((live===0&&z>0)||(z===0&&live>0&&world.infections>0))finish(live===0);if(world.time>900)finish(false);
clock+=dt;if(clock>.24){updateHud();clock=0;}}
function finish(won){if(!world||phase!=='game')return;phase='end';world.round=false;const earned=Math.floor(world.infections*(won?2.2:1.1)*(difficulty===2?1.55:difficulty===0?.8:1)+Math.min(20,world.zLost*.2));coins+=earned;save();S('resultTitle',won?'ГОРОД ПАЛ':'ЗАРАЗА ПОДАВЛЕНА');S('resultSubtitle',won?'Город больше не принадлежит живым.':'Последний заражённый уничтожен. Эпидемия остановлена.');S('scoreInfected',world.infections);S('scoreKills',world.zLost);S('scoreTime',fmtTime(world.time));S('scoreEarned','◈ '+earned);show('hud',false);show('result',true);sound(won?82:190,.4);}
function fmtTime(t){return Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0')}
function updateHud(force=false){if(!world)return;S('living',world.persons.length);S('undead',world.zombies.length);S('fallen',world.infections);S('alarm',Math.round(world.alarm)+'%');$('alertbar').style.width=world.alarm+'%';let now=world.events.filter(e=>e.until>world.time).slice(-1)[0];S('notice',now?now.text:'');if(world.first&&world.first.sick>0)S('tip',world.first.sick>3?'Первые симптомы через '+Math.max(0,Math.ceil(world.first.sick-3))+' сек.':'Пациент ноль превращается...');else S('tip','Перетаскивай карту • масштаб двумя пальцами • способности действуют в центре экрана');for(const key of ['howl','fury','spore','breach']){const b=document.querySelector('[data-skill="'+key+'"]');b.style.display=(key==='howl'&&!perk('howl')||key==='fury'&&!perk('fury')||key==='spore'&&!perk('fog')||key==='breach'&&!perk('breach'))?'none':'';b.disabled=world.skills[key]>0;b.querySelector('em').style.height=clamp(world.skills[key]/(key==='howl'?28:key==='fury'?42:key==='breach'?55:38),0,1)*100+'%';}}
function worldScreen(x,y){return {x:(x-cam.x)*cam.z+CW/2,y:(y-cam.y)*cam.z+CH/2}}
function screenWorld(x,y){return {x:(x-CW/2)/cam.z+cam.x,y:(y-CH/2)/cam.z+cam.y}}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));}
function line(x,y,X,Y,c,w=1){ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(Math.round(x)+.5,Math.round(y)+.5);ctx.lineTo(Math.round(X)+.5,Math.round(Y)+.5);ctx.stroke();}
function circle(x,y,rad,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(Math.round(x),Math.round(y),Math.max(.5,rad),0,Math.PI*2);ctx.fill();}
function visible(x,y,pad=60){const p=worldScreen(x,y);return p.x>-pad&&p.x<CW+pad&&p.y>-pad&&p.y<CH+pad;}
function worldRender(){if(!world)return;ctx.save();ctx.translate(Math.round(CW/2-cam.x*cam.z),Math.round(CH/2-cam.y*cam.z));ctx.scale(cam.z,cam.z);const z=cam.z;const left=cam.x-CW/(z*2)-60,top=cam.y-CH/(z*2)-60,right=cam.x+CW/(z*2)+60,bottom=cam.y+CH/(z*2)+60;
rect(0,0,world.w,world.h,'#536a55');
// Uneven city plan: alleys, arterial roads, cobblestone squares and green courtyards.
for(const f of world.features){if(f.x+f.w<left||f.x>right||f.y+f.h<top||f.y>bottom)continue;drawDistrict(f);}
for(const road of world.roadsX){const x=road.at,w=road.w;if(x+w<left||x>right)continue;rect(x,0,w,world.h,'#67706a');rect(x+3,0,w-6,world.h,road.w>47?'#343d43':'#3d4446');if(w>40){for(let y=12;y<world.h;y+=37){if(y>top-38&&y<bottom+38)rect(x+w/2-1,y,2,14,'#b7b080');}}}
for(const road of world.roadsY){const y=road.at,h=road.w;if(y+h<top||y>bottom)continue;rect(0,y,world.w,h,'#66716b');rect(0,y+3,world.w,h-6,road.w>47?'#323d42':'#44494a');if(h>40){for(let x=12;x<world.w;x+=37){if(x>left-38&&x<right+38)rect(x,y+h/2-1,14,2,'#afa97a');}}}
for(const ax of world.roadsX)for(const by of world.roadsY){if(ax.at>right||ax.at+ax.w<left||by.at>bottom||by.at+by.w<top)continue;
 rect(ax.at+3,by.at+3,ax.w-6,by.w-6,'#3b4448');if(ax.w>42&&by.w>42){for(let k=0;k<4;k++){rect(ax.at+7+k*6,by.at+by.w-9,3,7,'#b1b7a5');rect(ax.at+ax.w-9,by.at+7+k*6,7,3,'#b1b7a5');}}}

for(const t of world.tree){if(t.x<left||t.x>right||t.y<top||t.y>bottom)continue;rect(t.x-2,t.y,5,10,'#453f33');circle(t.x-4,t.y-5,t.s,'#304f43');circle(t.x+5,t.y-8,t.s*.68,'#426c52');rect(t.x+1,t.y-12,3,3,'#63926b');}
for(const b of world.buildings){if(b.x+b.w<left||b.x>right||b.y+b.h<top||b.y>bottom)continue;drawBuilding(b);}
for(const o of world.solids){if(o.kind!=='wall')continue;if(o.x+o.w<left||o.x>right||o.y+o.h<top||o.y>bottom)continue;rect(o.x+1,o.y+1,o.w,o.h,'#172025');rect(o.x,o.y,o.w,o.h,o.building?.wallStyle===1?'#4e5752':o.building?.wallStyle===2?'#54505a':'#343e40');rect(o.x,o.y,Math.max(1,o.w-1),1,'#9b9d8d');}
for(const g of world.gates){if(g.x+g.w<left||g.x>right||g.y+g.h<top||g.y>bottom)continue;drawGate(g);}
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
function drawDistrict(f){const {x,y,w,h,type,seed}=f;
if(type==='park'){rect(x,y,w,h,'#42654d');for(let k=0;k<w;k+=10){rect(x+k,y+(k*31+seed)%Math.max(8,h-7),4,3,k%4?'#527e5a':'#617747');}
 rect(x+w*.48,y+3,9,h-7,'#aca891');rect(x+4,y+h*.47,w-8,8,'#aca891');circle(x+w*.5,y+h*.5,5,'#6f9584');}
else if(type==='square'){rect(x,y,w,h,'#909087');for(let i=0;i<w;i+=18)for(let j=0;j<h;j+=18)rect(x+i,y+j,16,16,(i+j)%36?'#7e847d':'#a4a597');circle(x+w*.5,y+h*.5,14,'#5d9695');circle(x+w*.5,y+h*.5,9,'#86bdc0');rect(x+w*.5-2,y+h*.5-9,4,18,'#ccd6b5');}
else if(type==='parking'){rect(x,y,w,h,'#555e5e');for(let i=10;i<w-10;i+=24){rect(x+i,y+7,2,21,'#acafa4');rect(x+i,y+h-28,2,21,'#acafa4');}}
else if(type==='market'){rect(x,y,w,h,'#777967');for(let i=10;i<w-10;i+=22){rect(x+i,y+h*.7,15,10,i%3?'#867e69':'#b6ab86');rect(x+i+2,y+h*.7-3,11,4,'#c48d60');}}
else if(type==='alley'){rect(x,y,w,h,'#6e7469');for(let i=0;i<Math.floor(h/12);i++){rect(x+w*.5-4,y+i*12,9,5,i%2?'#646a60':'#717569');}}
else if(type==='courtyard'){rect(x,y,w,h,'#7d856d');rect(x+w*.32,y+h*.54,18,12,'#4b745f');for(let i=0;i<4;i++)rect(x+w*.29+i*6,y+h*.73,3,7,'#a8a68c');}
else if(type==='estate'){rect(x,y,w,h,'#687560');rect(x+w*.15,y+h*.52,w*.7,3,'#a5a78d');}
else rect(x,y,w,h,'#78766c');
for(let i=0;i<Math.max(1,Math.floor(w*h/3000));i++){const a=(seed+i*241)%Math.max(1,w-10),b=(seed*7+i*389)%Math.max(1,h-10);rect(x+a,y+b,3,2,'#a6b49b55');}
}
function drawGate(g){const x=g.x,y=g.y,w=g.w,h=g.h,centerX=x+w/2,centerY=y+h/2;
if(g.broken){rect(x,y,w,h,'#29302b');for(let k=0;k<3;k++)rect(x+(k*7)%Math.max(w,1),y+(k*3)%Math.max(h,1),2,2,g.kind==='window'?'#82c4c6':'#c3a06d');return;}
if(g.kind==='door'&&g.openUntil>world.time){rect(x,y,w,h,'#1c2829');rect(x,y,Math.max(2,w*.19),Math.max(2,h*.19),'#bb9566');return;}
const health=g.hp/g.maxHp;
rect(x+1,y+1,w,h,g.kind==='window'?'#33575f':'#5b4837');rect(x,y,w,h,g.kind==='window'?'#7ab7c3':'#b39161');
if(g.kind==='window'){for(let k=1;k<4;k++)line(x+w*k/4,y,x+w*(4-k)/4,y+h,'#b7ecdb',1);}
else{if(w>h){line(x+4,centerY,x+w-4,centerY,'#654a34',2);rect(centerX-1,centerY-2,3,3,'#dbc591');}else{line(centerX,y+4,centerX,y+h-4,'#654a34',2);rect(centerX-2,centerY,3,3,'#dbc591');}}
if(health<.75){line(x,y,x+w,y+h,'#43372f',2);if(health<.38)line(x+w,y,x,y+h,'#28363d',2);}
}
function drawBuilding(b){const {x,y,w,h}=b;const shades={house:'#8d8a7c',hospital:'#adb5a9',police:'#778b9a',armory:'#777b76',pharmacy:'#bbb49c',shop:'#a78c74',garage:'#797f75'};
const shade=shades[b.type]||'#8b887e';rect(x+3,y+4,w,h,'#1a2426');rect(x,y,w,h,'#454942');rect(x+5,y+5,w-10,h-10,shade);
for(let j=6;j<w-7;j+=12)for(let k=6;k<h-7;k+=12){if(((Math.floor(j)*13+Math.floor(k)*7+b.seed)%11)<2)rect(x+j,y+k,6,1,'#3f524b35');}
// Interior partitions, industrial stock, hospital beds, residential furniture.
for(const f of b.desks){const c=b.type==='hospital'?'#d4d8d0':b.type==='police'?'#607683':b.type==='armory'?'#565a4e':b.type==='shop'?'#b68f60':b.type==='garage'?'#596367':'#86694f';rect(f.x+2,f.y+2,f.w,f.h,'#38403a');rect(f.x,f.y,f.w,f.h,c);rect(f.x+2,f.y+2,3,2,b.type==='hospital'?'#ffffff':'#ceb794');}
if(w>77&&h>75){rect(x+w*.48,y+6,3,h*.30,'#545955');if(b.type==='hospital'){rect(x+w*.67,y+h*.6,15,8,'#edf0e8');rect(x+w*.69,y+h*.6,7,3,'#c3cdd3');}}
if(b.type==='garage'){rect(x+w*.42,y+h*.48,20,11,'#3d535b');rect(x+w*.47,y+h*.50,9,6,'#b8c9cb');}
const labels={police:['POLICE','#a2c9f6'],armory:['ARMORY','#d5bf81'],hospital:['HOSP +','#eea9a7'],pharmacy:['MEDS +','#c8f0a9'],shop:['SHOP','#e7c392'],garage:['GARAGE','#c8d2cb'],house:['',shade]};const l=labels[b.type];if(l[0]){ctx.fillStyle='#18252a';ctx.fillRect(x+8,y+7,Math.min(w-16,l[0].length*6+8),13);ctx.fillStyle=l[1];ctx.font='9px monospace';ctx.fillText(l[0],x+11,y+16);}
if(b.supplies>0){rect(x+w-18,y+14,12,8,'#373e31');rect(x+w-16,y+15,8,2,'#ded097');}
if(b.meds>0){rect(x+w-20,y+17,8,10,'#e4ece9');rect(x+w-17,y+19,2,6,'#c96468');rect(x+w-19,y+21,6,2,'#c96468');}
}

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
for(const b of document.querySelectorAll('[data-perk-tab]'))b.onclick=()=>{perkTab=b.dataset.perkTab;renderMenu();};
for(const b of document.querySelectorAll('#maps button'))b.onclick=()=>{mapChoice=Number(b.dataset.map);document.querySelectorAll('#maps button').forEach(x=>x.classList.toggle('chosen',x===b));newWorld(mapChoice);};
for(const b of document.querySelectorAll('#diffs button'))b.onclick=()=>{difficulty=Number(b.dataset.diff);document.querySelectorAll('#diffs button').forEach(x=>x.classList.toggle('chosen',x===b));};
$('launch').onclick=startPick;$('backSelect').onclick=()=>{phase='menu';world=null;show('menu',true);show('selection',false);renderMenu();};
$('again').onclick=()=>{phase='menu';world=null;show('result',false);show('menu',true);renderMenu();};
$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'▶':'Ⅱ';};
$('speed').onclick=()=>{speed=speed===1?2:speed===2?3:1;S('speed','×'+speed);};
for(const b of document.querySelectorAll('[data-skill]'))b.onclick=()=>useSkill(b.dataset.skill);
window.handleBack=()=>{if(phase==='select'){$('backSelect').click();}else if(phase==='game'){paused=!paused;$('pause').textContent=paused?'▶':'Ⅱ';}else if(phase==='end'){$('again').click();}};
window.__outbreakDebug={get nav(){return world?.nav},findPath,collisionPoint,approachTarget,updateZombie,PERKS,get phase(){return phase},get world(){return world},get coins(){return coins},startPick,selectPatient,update,finish,newWorld,renderMenu};
renderMenu();requestAnimationFrame(loop);
})();
