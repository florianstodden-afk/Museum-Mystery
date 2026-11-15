import { createSecurityRenderer } from './security-room.js';
import { createGalleryRenderer } from './gallery.js';
import { createStorageRenderer } from './storage-room.js';
import { OBJECTS, initialState, restoreState, canEnter, nearbyObject, atVaultDoor } from './engine.js';
import * as landscapeStation from './minigames/landscape.js';
import * as portraitStation from './minigames/portrait-timeline.js';
import { createStoryHost } from './story/host.js';
import { journalModel, renderJournal } from './story/journal.js';
import { movementDuration, advancePlayer } from './motion.js';
import { chooseGuardAction } from './guard.js';

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
  stations: { landscape: landscapeStation, portraits: portraitStation }, // stations 2–4: add teammates' modules here
  storageKey: 'museum-nocturne-story-v1',
});

let state;
try { state = restoreState(JSON.parse(localStorage.getItem(storeKey)), story.state.safe.open); }
catch { state = restoreState(null, story.state.safe.open); }
// Older saves may place the player inside the newly solid picture wall.
if (state.player.x < 8.5 && state.player.y < 3.5) state = { ...state, player: { ...state.player, y: 4 } };
const hallPaintings = [436121, 436535, 12127].map(id => {
  const image = new Image(); image.onload = () => draw(); image.src = `./assets/met-${id}.jpg`; return image;
});
const drawGallery = createGalleryRenderer();
const drawSecurityRoom = createSecurityRenderer();
const drawStorage = createStorageRenderer();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const hallBackdrop = new Image();
hallBackdrop.onload = () => draw();
hallBackdrop.src = './assets/great-hall-security-door.jpg';
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

let renderedStory = null; // the story state the journal currently shows
function save() { savePosition(); draw(); }
function updateSidebar() {
  document.body.dataset.room = state.room==='security' ? 'security' : state.player.x < 9 ? 'hall' : state.player.x < 18 ? 'gallery' : 'storage';
  document.querySelector('#room').textContent = state.room==='security' ? 'Security Room' : state.player.x < 9 ? 'Great Hall' : state.player.x < 18 ? 'Gallery & Conservation' : 'Storage';
  document.querySelector('#steps').textContent = `${state.steps} steps`;
  // Walking saves the position several times a second. The journal only changes with the story,
  // so it is rebuilt only when the story state is a new object (every story action creates one).
  if (story.state === renderedStory) return;
  renderedStory = story.state;
  const model = journalModel(story.state);
  document.querySelector('#progress').textContent = `${model.slots.filter(slot => slot.solved).length} / 4 letters`;
  document.querySelector('#pass').textContent = `${model.score.total} / ${model.score.max} points`;
  renderJournal(document.querySelector('#journal'), model);
}

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
    ctx.fillStyle=kind==='restorer'?'#765777':kind==='curator'?'#8a3f3a':'#355568';ctx.beginPath();ctx.roundRect(-13,-34,26,26,4);ctx.fill();
    const guardArm=moving?Math.sin(time/210)*3:0;ctx.strokeStyle='#263743';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-11,-30);ctx.lineTo(-16+guardArm,-13);ctx.moveTo(11,-30);ctx.lineTo(16-guardArm,-13);ctx.stroke();
    ctx.fillStyle='#d4a888';ctx.beginPath();ctx.ellipse(Math.sin(time/2200)*2,-40,9,10,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=kind==='restorer'?'#543d32':kind==='curator'?'#3b2a24':'#223440';ctx.fillRect(-10,-50,20,6);ctx.fillRect(-12,-46,24,3);
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
    // Show both entrances without cropping or distorting the hall.
    const height=896*hallBackdrop.naturalHeight/hallBackdrop.naturalWidth;
    const top=(576-height)/2;
    ctx.fillStyle='#1b2729';ctx.fillRect(0,0,896,576);
    ctx.drawImage(hallBackdrop,0,top,896,height);
  }
  else {ctx.fillStyle='#c8bba3';ctx.fillRect(0,0,896,576);}
  // Public-domain Met works are stored locally so every frame works offline.
  for (const [index, x, y, width, height] of [[1,405,244,88,55],[2,650,247,40,59]]) {
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
  // Use the hall's own stone texture so the inscriptions belong to the masonry.
  function stonePlaque(text,x,y,width){
    const left=x-width/2, height=19;
    ctx.save();
    if(hallBackdrop.complete && hallBackdrop.naturalWidth){
      ctx.drawImage(hallBackdrop, 500,440,100,30, left,y,width,height);
    } else { ctx.fillStyle='#b99870';ctx.fillRect(left,y,width,height); }
    // A translucent wash and soft bevel make the stone read as an inset block.
    ctx.fillStyle='rgba(199,165,121,.38)';ctx.fillRect(left,y,width,height);
    ctx.strokeStyle='rgba(105,70,40,.38)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(left,y+height-.5);ctx.lineTo(left,y+.5);ctx.lineTo(left+width,y+.5);ctx.stroke();
    ctx.strokeStyle='rgba(244,215,170,.48)';
    ctx.beginPath();ctx.moveTo(left+width,y);ctx.lineTo(left+width,y+height);ctx.lineTo(left,y+height);ctx.stroke();
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 12px Georgia, serif';
    ctx.fillStyle='rgba(255,226,183,.72)';ctx.fillText(text,x+.4,y+height/2+1);
    ctx.fillStyle='rgba(83,52,30,.88)';ctx.fillText(text,x,y+height/2);
    ctx.restore();
  }
  stonePlaque('SECURITY',176,225,100);
  stonePlaque('GALLERY',800,201,100);
  const player=hallPosition(displayPlayer.x,displayPlayer.y);drawPerson(player.x,player.y,'rick',facing,animationTime,heldKeys.size > 0);
  const target=nearbyObject(state,currentGuard()); if(target){ctx.font='bold 15px sans-serif';const text=`E  ${target.label}`;const width=ctx.measureText(text).width+22;ctx.fillStyle='rgba(30,37,38,.92)';ctx.beginPath();ctx.roundRect(player.x-width/2,player.y-93,width,28,6);ctx.fill();ctx.fillStyle='#fff5dd';ctx.fillText(text,player.x-width/2+11,player.y-74);}
}
function draw() {
  canvas.style.objectPosition='50% 50%';
  ctx.clearRect(0,0,896,576);
  if(state.room==='security'){
    drawSecurityRoom(ctx,{time:animationTime,player:displayPlayer,target:nearbyObject(state),facing,moving:heldKeys.size>0,drawPerson});return;
  }
  if(state.player.x < 9){drawHall();return;}
  if(state.player.x < 18){
    drawGallery(ctx, { time: animationTime, state, player: displayPlayer, objects: OBJECTS,
      target: nearbyObject(state,currentGuard()), facing, moving: heldKeys.size > 0, drawPerson,
      vaultNearby: atVaultDoor(state), reducedMotion: reducedMotion.matches });
    return;
  }
  drawStorage(ctx, { time: animationTime, state, player: displayPlayer, objects: OBJECTS,
    target: nearbyObject(state, currentGuard()), facing, moving: heldKeys.size > 0, drawPerson });
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
  if(!roomTransition && state.room!=='security' && state.player.x < 9 && dialog.classList.contains('hidden')) {
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
      if((state.room==='security')!==(next.room==='security') || ((state.player.x<9)!==(next.player.x<9))) roomTransition={start:now,destination:next,switched:false};
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
