import { createGalleryRenderer } from './gallery.js';
import { WIDTH, HEIGHT, OBJECTS, initialState, restoreState, canEnter, nearbyObject, atVaultDoor } from './engine.js';
import * as landscapeStation from './minigames/landscape.js';
import { createStoryHost } from './story/host.js';
import { journalModel, renderJournal } from './story/journal.js';
import { movementDuration, advancePlayer } from './motion.js';
import { chooseGuardAction } from './guard.js';

const TILE = 32;
const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
ctx.setTransform(2,0,0,2,0,0);
function viewportForGame(){const r=canvas.getBoundingClientRect();const scale=Math.min(r.width/896,r.height/576);return {width:896*scale,height:576*scale};}
const dialog = document.querySelector('#dialog');
const storeKey = 'museum-mystery-walk-v1';         // player position and steps
const oldLandscapeKey = 'museum-nocturne-landscape-v1'; // from the prototype, no longer used

// The story (stations, safe, endings) is run by web/story/host.js inside our dialog.
const story = createStoryHost({
  openPanel(title) {
    showDialog(title, '', []);
    document.querySelector('.dialog-card').classList.add('story-dark-card');
    return document.querySelector('#dialog-body');
  },
  closePanel: closeDialog,
  onChange() { state = { ...state, doorOpen: story.state.safe.open }; savePosition(); draw(); },
  onReset: resetWorld,
  stations: { landscape: landscapeStation }, // stations 2–4: add teammates' modules here
  storageKey: 'museum-nocturne-story-v1',
});

let state;
try { state = restoreState(JSON.parse(localStorage.getItem(storeKey)), story.state.safe.open); }
catch { state = restoreState(null, story.state.safe.open); }
// Older saves may place the player inside the newly solid picture wall.
if (state.player.x < 8.5 && state.player.y < 3.5) state = { ...state, player: { ...state.player, y: 4 } };
let metArtwork = null;
const hallPaintings = [436121, 436535, 12127].map(id => {
  const image = new Image(); image.onload = () => draw(); image.src = `./assets/met-${id}.jpg`; return image;
});
const drawGallery = createGalleryRenderer();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const hallBackdrop = new Image();
hallBackdrop.onload = () => draw();
hallBackdrop.src = './assets/great-hall-gallery-door.png';
const wallArtwork = new Image();
let artworkReady = false;
wallArtwork.onload = () => { artworkReady = true; draw(); };
let displayPlayer = { ...state.player };
let movementAnimation = null;
let facing = 'down';
let animationTime = 0;
// Old saves may start near the guard; choose a safe starting tile without moving the player.
const guardStarts=[{x:5,y:5},{x:7,y:8},{x:2,y:12}];
let guardPosition = guardStarts.find(p=>Math.abs(p.x-state.player.x)>=0.45 || Math.abs(p.y-state.player.y)>=2.4) || guardStarts[0];
let guardMotion = null;
let guardDelay = 1200;
let guardLastFacing = 'down';
let lastFrame = 0;
let roomTransition = null;
function currentGuard(){return guardDisplay();}
function guardDisplay(){
  if (!guardMotion) return guardPosition;
  const t=Math.min(1,guardMotion.elapsed/guardMotion.duration);
  return {x:guardMotion.from.x+(guardMotion.to.x-guardMotion.from.x)*t, y:guardMotion.from.y+(guardMotion.to.y-guardMotion.from.y)*t};
}
let metStatus = 'loading';

fetch('https://collectionapi.metmuseum.org/public/collection/v1/objects/436535')
  .then(response => { if (!response.ok) throw new Error('API unavailable'); return response.json(); })
  .then(data => { if (!data.isPublicDomain || !data.primaryImageSmall) throw new Error('Image is not public'); metArtwork = data; metStatus = 'ready'; wallArtwork.src = data.primaryImageSmall; })
  .catch(() => { metStatus = 'offline'; });

function save() { savePosition(); draw(); }
function updateSidebar() {
  document.body.dataset.room = state.player.x < 9 ? 'hall' : state.player.x < 18 ? 'gallery' : 'storage';
  document.querySelector('#room').textContent = state.player.x < 9 ? 'Great Hall' : state.player.x < 18 ? 'Gallery & Conservation' : 'Storage';
  const model = journalModel(story.state);
  document.querySelector('#progress').textContent = `${model.slots.filter(slot => slot.solved).length} / 4 letters`;
  document.querySelector('#pass').textContent = `${model.score.total} / ${model.score.max} points`;
  document.querySelector('#steps').textContent = `${state.steps} steps`;
  renderJournal(document.querySelector('#journal'), model);
}

function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
function tile(x,y,color){rect(x*TILE,y*TILE,TILE,TILE,color);}
function hallPosition(x,y){ return {x: (x + 0.5) * 896 / 9, y: 345 + (y - 2) * 14}; }
function drawPerson(x,y,kind,direction='down',time=0,moving=false){
  ctx.save(); ctx.translate(x,y);
  const sway = kind === 'guard' ? Math.sin(time / 800) * 1.5 : moving ? Math.sin(time / 100) * 2 : 0;
  ctx.translate(0,sway);
  if(direction==='left'||direction==='right')ctx.scale(.78,1);
  ctx.lineWidth=1.5;ctx.strokeStyle='#263036';
  ctx.fillStyle='rgba(25,20,15,.24)';ctx.beginPath();ctx.ellipse(0,2,17,5,0,0,Math.PI*2);ctx.fill();
  if(kind==='rick'){
    // An expressive, larger character with a white coat and blue spiky hair.
    const stride=moving ? Math.sin(time/100)*5 : 0;
    ctx.strokeStyle='#74552c';ctx.lineWidth=5;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(-6,-17);ctx.lineTo(-7-stride,-1);ctx.moveTo(6,-17);ctx.lineTo(7+stride,-1);ctx.stroke();
    ctx.strokeStyle='#5b3b2a';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-10-stride,0);ctx.lineTo(-4-stride,0);ctx.moveTo(4+stride,0);ctx.lineTo(10+stride,0);ctx.stroke();
    ctx.fillStyle='#473927';ctx.fillRect(-9,-14,18,7);
    ctx.fillStyle='#faf9eb';ctx.beginPath();ctx.moveTo(-14,-34);ctx.lineTo(14,-34);ctx.lineTo(17,-13);ctx.lineTo(-17,-13);ctx.closePath();ctx.fill();ctx.strokeStyle='#394648';ctx.lineWidth=1.2;ctx.stroke();
    if(direction!=='up'){ctx.fillStyle='#9bd9d5';ctx.fillRect(-6,-32,12,21);}
    if(direction!=='up'){ctx.fillStyle='#fffdf4';ctx.beginPath();ctx.moveTo(-12,-34);ctx.lineTo(-4,-31);ctx.lineTo(-8,-24);ctx.lineTo(-5,-20);ctx.lineTo(-10,-15);ctx.lineTo(-15,-14);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(12,-34);ctx.lineTo(4,-31);ctx.lineTo(8,-24);ctx.lineTo(5,-20);ctx.lineTo(10,-15);ctx.lineTo(15,-14);ctx.closePath();ctx.fill();ctx.stroke();}
    const armSwing=moving?Math.sin(time/100)*4:0;
    ctx.strokeStyle='#4b5552';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-13,-31);ctx.lineTo(-19+armSwing,-14);ctx.moveTo(13,-31);ctx.lineTo(19-armSwing,-14);ctx.stroke();
    ctx.strokeStyle='#faf9eb';ctx.lineWidth=3;ctx.stroke();
    ctx.fillStyle='#e8c4a9';ctx.beginPath();ctx.ellipse(0,-41,10,11,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#a8e7f1';ctx.strokeStyle='#34464a';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-10,-45);ctx.lineTo(-21,-49);ctx.lineTo(-12,-52);ctx.lineTo(-18,-61);ctx.lineTo(-8,-56);ctx.lineTo(-7,-65);ctx.lineTo(-2,-58);ctx.lineTo(3,-67);ctx.lineTo(6,-58);ctx.lineTo(16,-64);ctx.lineTo(12,-54);ctx.lineTo(21,-52);ctx.lineTo(10,-44);ctx.closePath();ctx.fill();ctx.stroke();
    if(direction!=='up'){
      const offset = direction==='left' ? -3 : direction==='right' ? 3 : 0;
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-4+offset,-42,3.7,0,Math.PI*2);ctx.arc(4+offset,-42,3.7,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.fillStyle='#293037';ctx.fillRect(-4+offset,-43,1.5,3);ctx.fillRect(4+offset,-43,1.5,3);
      ctx.strokeStyle='#53665e';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-7+offset,-47);ctx.lineTo(-1+offset,-46);ctx.moveTo(2+offset,-46);ctx.lineTo(8+offset,-47);ctx.moveTo(-3+offset,-36);ctx.lineTo(4+offset,-36);ctx.stroke();
    }
    ctx.strokeStyle='#53635d';ctx.beginPath();ctx.moveTo(-13,-32);ctx.lineTo(-16,-13);ctx.lineTo(16,-13);ctx.lineTo(13,-32);ctx.stroke();
  } else {
    const stride=moving ? Math.sin(time/210)*5 : 0;
    ctx.strokeStyle='#263743';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-6,-12);ctx.lineTo(-7-stride,0);ctx.moveTo(6,-12);ctx.lineTo(7+stride,0);ctx.stroke();
    ctx.fillStyle='#263743';ctx.fillRect(-11-stride,-2,7,4);ctx.fillRect(4+stride,-2,7,4);
    ctx.fillStyle=kind==='restorer'?'#765777':'#355568';ctx.beginPath();ctx.roundRect(-13,-34,26,26,4);ctx.fill();
    const guardArm=moving?Math.sin(time/210)*3:0;ctx.strokeStyle='#263743';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-11,-30);ctx.lineTo(-16+guardArm,-13);ctx.moveTo(11,-30);ctx.lineTo(16-guardArm,-13);ctx.stroke();
    ctx.fillStyle='#d4a888';ctx.beginPath();ctx.ellipse(Math.sin(time/2200)*2,-40,9,10,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=kind==='restorer'?'#543d32':'#223440';ctx.fillRect(-10,-50,20,6);ctx.fillRect(-12,-46,24,3);
    if(direction!=='up'){
      const look=(direction==='left'?-3:direction==='right'?3:0)+Math.sin(time/2200);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-3+look,-41,2.6,0,Math.PI*2);ctx.arc(4+look,-41,2.6,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#243038';ctx.fillRect(-3+look,-42,1.3,2.5);ctx.fillRect(4+look,-42,1.3,2.5);ctx.strokeStyle='#6c4237';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-2+look,-35);ctx.lineTo(3+look,-35);ctx.stroke();
    }
    ctx.fillStyle='#d5bd80';ctx.fillRect(-2,-28,4,5);
  }
  ctx.restore();
}
function drawHall(){
  if(hallBackdrop.complete && hallBackdrop.naturalWidth){
    // Crop the sides to the game aspect ratio instead of stretching the room.
    const cropWidth=hallBackdrop.naturalHeight*896/576;
    const cropLeft=Math.min(hallBackdrop.naturalWidth-cropWidth,(hallBackdrop.naturalWidth-cropWidth)/2+65);
    ctx.drawImage(hallBackdrop,cropLeft,0,cropWidth,hallBackdrop.naturalHeight,0,0,896,576);
  }
  else {ctx.fillStyle='#c8bba3';ctx.fillRect(0,0,896,576);}
  // Public-domain Met works are stored locally so every frame works offline.
  for (const [index, x, y, width, height] of [[0,78,247,40,59],[1,365,244,88,55],[2,647,247,40,59]]) {
    const image = hallPaintings[index];
    if(image.complete && image.naturalWidth) ctx.drawImage(image,x,y,width,height);
    else {ctx.fillStyle='#394e46';ctx.fillRect(x,y,width,height);}
  }
  const ledger=OBJECTS.find(o=>o.id==='ledger');
  const desk=hallPosition(ledger.x,ledger.y);ctx.fillStyle='#5b4633';ctx.beginPath();ctx.ellipse(desk.x,desk.y+3,45,12,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#b79c71';ctx.fillRect(desk.x-28,desk.y-14,56,16);ctx.fillStyle='#f0e2bc';ctx.fillRect(desk.x-10,desk.y-17,20,12);
  const guard=guardDisplay();const person=hallPosition(guard.x,guard.y);
  const guardFacing=guardMotion ? (guardMotion.to.x<guardMotion.from.x?'left':guardMotion.to.x>guardMotion.from.x?'right':guardMotion.to.y<guardMotion.from.y?'up':'down') : guardLastFacing;
  drawPerson(person.x,person.y,'guard',guardFacing,animationTime,Boolean(guardMotion));
  // Brass-edged barriers mark the walkable floor; leave a gap at the gallery doorway.
  ctx.lineWidth=3;ctx.strokeStyle='rgba(89,69,42,.75)';ctx.beginPath();
  ctx.moveTo(86,362);ctx.lineTo(86,554);ctx.moveTo(86,554);ctx.lineTo(864,554);
  ctx.moveTo(864,422);ctx.lineTo(864,554);ctx.stroke();
  ctx.lineWidth=1;ctx.strokeStyle='rgba(255,222,139,.8)';ctx.stroke();
  // A plaque above the visible arch, rather than a label lying on the floor.
  ctx.fillStyle='#342e25';ctx.fillRect(800,166,86,20);ctx.strokeStyle='#c8a46b';ctx.lineWidth=1;ctx.strokeRect(800,166,86,20);
  ctx.fillStyle='#f4ddb0';ctx.font='bold 10px Georgia';ctx.fillText('GALLERY',817,180);
  const player=hallPosition(displayPlayer.x,displayPlayer.y);drawPerson(player.x,player.y,'rick',facing,animationTime,heldKeys.size > 0);
  const target=nearbyObject(state,currentGuard()); if(target){ctx.font='bold 15px sans-serif';const text=`E  ${target.label}`;const width=ctx.measureText(text).width+22;ctx.fillStyle='rgba(30,37,38,.92)';ctx.beginPath();ctx.roundRect(player.x-width/2,player.y-93,width,28,6);ctx.fill();ctx.fillStyle='#fff5dd';ctx.fillText(text,player.x-width/2+11,player.y-74);}
}
function draw() {
  canvas.style.objectPosition='50% 50%';
  ctx.clearRect(0,0,896,576);
  if(state.player.x < 9){drawHall();return;}
  if(state.player.x < 18){
    drawGallery(ctx, { time: animationTime, state, player: displayPlayer, objects: OBJECTS,
      target: nearbyObject(state,currentGuard()), facing, moving: heldKeys.size > 0, drawPerson,
      vaultNearby: atVaultDoor(state), reducedMotion: reducedMotion.matches });
    return;
  }
  for(let y=0;y<HEIGHT;y++) for(let x=0;x<WIDTH;x++) {
    const base=x<9?'#d1c5ad':x<18?'#7e7768':'#596b6e';
    tile(x,y,(x+y)%2===0?base:(x<9?'#c5baa3':x<18?'#797363':'#56676a'));
    if(x<9){ctx.strokeStyle='#b2a486';ctx.lineWidth=1;ctx.strokeRect(x*TILE+.5,y*TILE+.5,TILE-1,TILE-1);}else rect(x*TILE+2,y*TILE+2,2,2,'#ffffff12');
  }
  // Rugs, plants and display furniture make the rooms distinct.
  // Great Hall inspired marble floor with a gold border.
  rect(2*TILE,8*TILE,5*TILE,3*TILE,'#ae9772');rect(2*TILE+4,8*TILE+4,5*TILE-8,3*TILE-8,'#dfd4bb');
  rect(3*TILE,9*TILE,3*TILE,TILE,'#d0c0a2');
  rect(11*TILE,5*TILE,6*TILE,3*TILE,'#855d57');rect(11*TILE+6,5*TILE+6,6*TILE-12,3*TILE-12,'#966e62');
  for(const [px,py] of [[2,3],[7,3],[20,3],[25,14]]) {tile(px,py,'#5b4535');rect(px*TILE+8,py*TILE+8,16,16,'#4d765a');rect(px*TILE+12,py*TILE+4,8,10,'#77a77a');}
  for(let x=0;x<WIDTH;x++){tile(x,0,'#273943');tile(x,HEIGHT-1,'#273943');}
  for(let y=0;y<HEIGHT;y++){tile(0,y,'#273943');tile(WIDTH-1,y,'#273943');if(y!==9){tile(9,y,'#2a3c45');tile(18,y,'#2a3c45');}}
  // The visible stone wall and arcade echo the Met's Great Hall.
  rect(0,0,9*TILE,64,'#b7a789');rect(0,0,9*TILE,7,'#eee4d1');
  rect(0,56,9*TILE,8,'#8f8067');rect(0,52,9*TILE,4,'#e9ddc3');
  for(const x of [10,101,192]){
    rect(x,22,76,30,'#91836e');ctx.fillStyle='#e2d5bc';ctx.beginPath();ctx.arc(x+38,27,31,Math.PI,0);ctx.fill();
    rect(x+7,24,62,28,'#d1c2a6');rect(x,18,8,37,'#eee4d1');rect(x+68,18,8,37,'#eee4d1');
    rect(x-2,50,12,5,'#f1e5cd');rect(x+66,50,12,5,'#f1e5cd');
  }
  // A framed Met artwork hangs in the central arch.
  rect(122,21,34,27,'#876b3a');rect(125,23,28,23,'#344d48');
  if(artworkReady)ctx.drawImage(wallArtwork,125,23,28,23);
  tile(9,9,'#b1986c');tile(18,9,state.doorOpen?'#ab956d':'#ad683b');
  if(!state.doorOpen){rect(18*TILE+12,9*TILE+10,8,13,'#f6c56e');}
  for(const object of OBJECTS){
    const x=object.x*TILE,y=object.y*TILE;
    ctx.save();
    const isPerson=['guard','restorer','curator'].includes(object.id);
    if(isPerson) ctx.translate(Math.sin(animationTime/1600 + object.x)*2,Math.sin(animationTime/800 + object.y));
    if(isPerson){
      rect(x+8,y+5,16,22,{guard:'#294d68',restorer:'#694f71',curator:'#8a3f3a'}[object.id]);rect(x+10,y+2,12,10,'#e3b88b');rect(x+8,y+26,6,5,'#26343c');rect(x+18,y+26,6,5,'#26343c');
    }else if(object.id==='painting'){rect(x+3,y+3,26,26,'#d2a350');rect(x+6,y+6,20,20,'#648e86');rect(x+15,y+8,3,18,'#294e44');}
    else if(object.id==='frames'){for(const dx of [3,10,17]){rect(x+dx,y+2,12,27,'#c99a45');rect(x+dx+3,y+5,6,21,'#3b2c1f');}}
    else if(object.id==='monitors'){rect(x+2,y+4,28,22,'#1d252a');for(const [mx,my] of [[4,6],[13,6],[22,6],[4,15],[13,15],[22,15]])rect(x+mx,y+my,7,7,Math.sin(animationTime/300+mx+my)>0?'#7fb6d8':'#4c6f84');}
    else if(object.id==='roster'){rect(x+3,y+3,26,24,'#5a4630');rect(x+6,y+6,9,12,'#e7dcc5');rect(x+17,y+8,9,10,'#e7dcc5');rect(x+9,y+20,14,5,'#e7dcc5');}
    else if(object.id==='vault'){rect(x+3,y+3,26,27,'#bb8e46');rect(x+6,y+6,20,21,'#547b7a');rect(x+14,y+9,3,16,'#2e5245');}
    else {rect(x+4,y+7,24,18,'#73543d');rect(x+8,y+3,16,16,'#e6d5a9');rect(x+10,y+7,12,2,'#947d5b');}
    ctx.restore();
    if(Math.abs(object.x-state.player.x)+Math.abs(object.y-state.player.y)===1){ctx.strokeStyle='#ffda79';ctx.lineWidth=3;ctx.strokeRect(x+1,y+1,30,30);}
  }
  const p=state.player;const px=displayPlayer.x*TILE,py=displayPlayer.y*TILE;
  // Blue spiky hair, pale face and white coat: Rick-inspired pixel character.
  rect(px+7,py+12,18,15,'#eee9dc');rect(px+14,py+13,4,13,'#9fcbd2');
  rect(px+10,py+4,12,10,'#ead0b7');rect(px+8,py+2,16,5,'#8bd6e6');
  for(const [hx,hy] of [[7,3],[10,0],[14,-2],[18,0],[22,3]]) rect(px+hx,py+hy,4,6,'#8bd6e6');
  if(facing !== 'up'){const eyeShift=facing==='left'?-2:facing==='right'?2:0;rect(px+10+eyeShift,py+8,3,2,'#33424a');rect(px+18+eyeShift,py+8,3,2,'#33424a');}
  rect(px+8,py+26,6,5,'#654836');rect(px+18,py+26,6,5,'#654836');
  ctx.fillStyle='#f7e5b4';ctx.font='bold 13px sans-serif';
  ctx.fillText('ENTRANCE',50,85);ctx.fillText('GALLERY',360,54);ctx.fillText('STORAGE',665,54);
  const target=nearbyObject(state,currentGuard());if(target || atVaultDoor(state)){
    const text=`E  ${target?.label??(state.doorOpen?'Vault door (open)':'Vault door · safe')}`;
    rect(px-14,py-29,ctx.measureText(text).width+16,24,'#1c303a');ctx.fillStyle='#fff0cc';ctx.fillText(text,px-8,py-12);
  }
}

function showDialog(title,text,options=[{label:'Continue (E)',action:closeDialog}]){
  stopMovement();
  document.querySelector('.dialog-card').classList.remove('story-dark-card');
  document.querySelector('#dialog-title').textContent=title;
  const body=document.querySelector('#dialog-body');body.replaceChildren();
  const p=document.createElement('p');p.textContent=text;body.append(p);
  const actions=document.querySelector('#dialog-actions');actions.replaceChildren();
  for(const option of options){const b=document.createElement('button');b.textContent=option.label;if(option.secondary)b.className='secondary';b.addEventListener('click',option.action);actions.append(b);}
  dialog.classList.remove('hidden');
}
function closeDialog(){dialog.classList.add('hidden');}
function handleInteract(){
  if(!dialog.classList.contains('hidden'))return;
  if(atVaultDoor(state)){
    if(state.doorOpen) showDialog('Vault door','The door is open. The original painting waits inside.');
    else story.openVault();
    return;
  }
  const object=nearbyObject(state,currentGuard());
  if(!object){showDialog('Nothing nearby','Move closer to a marked object or a person.');return;}
  runStoryAction(object.story);
}
// Each map object says in engine.js what it does in the story.
function runStoryAction(action){
  if(action.station) story.openStation(action.station);
  else if(action.talk) story.talkTo(action.talk);
  else if(action.examine) story.examine(action.examine);
  else if(action.vault) story.openVault();
}
// Called by the story host when the player confirms "New game".
function resetWorld(){
  state=initialState();displayPlayer={...state.player};movementAnimation=null;roomTransition=null;guardPosition={x:5,y:5};guardMotion=null;guardDelay=1200;guardLastFacing='down';heldKeys.clear();
  try{localStorage.removeItem(oldLandscapeKey);}catch{}
  savePosition();
}
const directions = {arrowup:[0,-1],w:[0,-1],arrowdown:[0,1],s:[0,1],arrowleft:[-1,0],a:[-1,0],arrowright:[1,0],d:[1,0]};
const heldKeys = new Map();
let lastSavedAt=0;
function savePosition(){try{localStorage.setItem(storeKey,JSON.stringify(state));}catch{}updateSidebar();}
function stopMovement(){heldKeys.clear();savePosition();}
function animate(now){
  const delta=lastFrame ? Math.min(100,now-lastFrame) : 0;lastFrame=now;
  animationTime = now;
  if(!roomTransition && state.player.x < 9 && dialog.classList.contains('hidden')) {
    if(guardMotion) {
      const nextElapsed=Math.min(guardMotion.duration,guardMotion.elapsed+delta);
      const t=nextElapsed/guardMotion.duration;
      const future={x:guardMotion.from.x+(guardMotion.to.x-guardMotion.from.x)*t,y:guardMotion.from.y+(guardMotion.to.y-guardMotion.from.y)*t};
      if(Math.abs(future.x-state.player.x)>=0.45 || Math.abs(future.y-state.player.y)>=2.4)guardMotion.elapsed=nextElapsed;
      if(guardMotion.elapsed>=guardMotion.duration){guardLastFacing=guardMotion.to.x<guardMotion.from.x?'left':guardMotion.to.x>guardMotion.from.x?'right':guardMotion.to.y<guardMotion.from.y?'up':'down';guardPosition=guardMotion.to;guardDelay=guardMotion.pause;guardMotion=null;}
    } else {
      guardDelay-=delta;
      if(guardDelay<=0){
        const action=chooseGuardAction(state,guardPosition);
        if(action.kind==='wait')guardDelay=action.duration;
        else guardMotion={from:{...guardPosition},to:action.target,elapsed:0,duration:Math.max(250,movementDuration(guardPosition,action.target,viewportForGame(),'hall')*4.4),pause:action.pause};
      }
    }
  }

  if(roomTransition){
    const progress=Math.min(1,(now-roomTransition.start)/320);
    if(progress>=0.5 && !roomTransition.switched){
      state=roomTransition.destination;displayPlayer={...state.player};
      roomTransition.switched=true;savePosition();
    }
    if(progress>=1)roomTransition=null;
  } else if(heldKeys.size && dialog.classList.contains('hidden')){
    const direction=[...heldKeys.values()].at(-1);
    facing=direction[0]<0?'left':direction[0]>0?'right':direction[1]<0?'up':'down';
    const guards=[guardDisplay()];
    const next=advancePlayer(state,direction,delta,viewportForGame(),guards,canEnter);
    if(next!==state){
      if((state.player.x<9)!==(next.player.x<9)) roomTransition={start:now,destination:next,switched:false};
      else {state=next;displayPlayer={...state.player};if(now-lastSavedAt>250){savePosition();lastSavedAt=now;}}
    }
  }
  draw(); // Animate NPCs even while the player is idle.
  if(roomTransition){
    const progress=Math.min(1,(now-roomTransition.start)/320);
    ctx.save();ctx.fillStyle=`rgba(5,12,16,${progress<0.5?progress*2:(1-progress)*2})`;ctx.fillRect(0,0,896,576);ctx.restore();
  }
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
document.addEventListener('keydown',event=>{
  if (!dialog.classList.contains('hidden')) {
    const editing = event.target instanceof HTMLElement &&
      (event.target.matches('textarea, input:not([inputmode="numeric"]):not([type="number"])') || event.target.isContentEditable);
    if (event.key === 'Escape' || (!editing && !event.repeat && event.key.toLowerCase() === 'e')) {
      event.preventDefault();
      closeDialog();
    }
    return;
  }
  const key=event.key.toLowerCase();
  if(directions[key]){ event.preventDefault(); heldKeys.set(key,directions[key]); }
  else if((key==='e'||key==='enter') && !event.repeat){event.preventDefault();handleInteract();}
});
document.addEventListener('keyup',event=>{heldKeys.delete(event.key.toLowerCase());if(!heldKeys.size)savePosition();});
window.addEventListener('blur',stopMovement);
document.addEventListener('visibilitychange',()=>{if(document.hidden) stopMovement();});
document.querySelectorAll('[data-move]').forEach(button=>{
  const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}, key='pointer-'+button.dataset.move;
  button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);heldKeys.set(key,d[button.dataset.move]);});
  for(const eventName of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(eventName,()=>{heldKeys.delete(key);if(!heldKeys.size)savePosition();});
  button.addEventListener('keydown',event=>{if(event.key===' '||event.key==='Enter'){event.preventDefault();event.stopPropagation();heldKeys.set(key,d[button.dataset.move]);}});
  button.addEventListener('keyup',event=>{if(event.key===' '||event.key==='Enter'){event.preventDefault();event.stopPropagation();heldKeys.delete(key);if(!heldKeys.size)savePosition();}});
});
document.querySelector('#touch-interact').addEventListener('click',handleInteract);
document.querySelector('#journal-toggle').addEventListener('click', event=>{const sidebar=document.querySelector('#sidebar');sidebar.hidden=!sidebar.hidden;event.currentTarget.setAttribute('aria-expanded',String(!sidebar.hidden));});
document.querySelector('#reset').addEventListener('click',()=>story.confirmNewGame());
document.querySelector('#hint').addEventListener('click',()=>story.showHint());
document.querySelector('#mission').addEventListener('click',()=>story.showMission());
save();
story.start(); // M's message on the very first visit
