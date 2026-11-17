import { newGame, readMission, solveStation } from './story/engine.js';
import { STATION_IDS } from './story/case-1.js';
import { drawCameraLights, VAULT_CAMERAS } from './camera-lights.js';
import { vaultPosition } from './vault-layout.js';
import { galleryPosition } from './gallery-layout.js';
import { createSecurityRenderer } from './security-room.js?v=live-people-3';
import { createGalleryRenderer } from './gallery.js?v=gallery-plants-6';
import { WIDTH, HEIGHT, OBJECTS, initialState, restoreState, canEnter, nearbyObject, atVaultDoor } from './engine.js?v=gallery-route-8';
import * as landscapeStation from './minigames/landscape.js';
import * as pictureStation from './minigames/picture-puzzle.js';
import * as portraitStation from './minigames/portrait-timeline.js';
import { createStoryHost } from './story/host.js?v=speech-box-1';
import { journalModel, renderJournal } from './story/journal.js';
import { createSoundPlayer, STEP_INTERVAL_MS } from './story/sound.js?v=vault-wheel-7';
import { movementDuration, advancePlayer } from './motion.js?v=gallery-route-8';
import { chooseGuardAction } from './guard.js';
import { createSpeechBox } from './story/speech-box.js';
import { shouldOpenTalk, shouldCloseTalk, distanceBetween } from './story/proximity.js';

const TILE = 32;
const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
ctx.setTransform(2,0,0,2,0,0);
function viewportForGame(){const r=canvas.getBoundingClientRect();const scale=Math.min(r.width/896,r.height/576);return {width:896*scale,height:576*scale};}
const dialog = document.querySelector('#dialog');
let dialogOpener = null;
const vaultPreview = new URLSearchParams(location.search).get('vault-preview') === '1';
let previewStory = readMission(newGame()).state;
if (vaultPreview) for (const id of STATION_IDS) previewStory = solveStation(previewStory, id).state;
let previewSave = JSON.stringify({story: JSON.stringify(previewStory), progress: {}});
const previewStorage = { getItem: () => previewSave, setItem: (_key, value) => { previewSave = value; } };
const storeKey = 'museum-mystery-walk-v1';         // player position and steps
const oldLandscapeKey = 'museum-nocturne-landscape-v1'; // from the prototype, no longer used

// Small synthesized sounds for story moments; the player remembers 'muted'.
const sound = createSoundPlayer();

// Every person starts talking by themselves when the player comes close,
// and stops when the player walks away (see story/proximity.js). No E needed.
const PEOPLE = {guard:'leon', restorer:'imani', curator:'vale'}; // map object id → story character
const talkWasNear = {};           // per character: true until the player walks away
let talkingTo = null;             // the character in the speech box right now
const speech = createSpeechBox(document.body, {
  onClose: () => { talkingTo = null; },
  playSound: id => sound.play(id),
});

// The story (stations, safe, endings) is run by web/story/host.js inside our dialog.
const story = createStoryHost({
  openPanel(title) {
    showDialog(title, '', []);
    document.querySelector('.dialog-card').classList.add('story-dark-card');
    return document.querySelector('#dialog-body');
  },
  closePanel: closeDialog,
  onVaultUnlocked: closeDialog,
  onChange() { const unlocked = !state.doorOpen && story.state.safe.open; state = { ...state, doorOpen: story.state.safe.open }; if(unlocked) vaultOpenedAt = performance.now(); savePosition(); draw(); },
  onReset: resetWorld,
  sound,
  speech,
  stations: { landscape: landscapeStation, restoration: pictureStation, portraits: portraitStation },
  storageKey: 'museum-nocturne-story-v1',
  ...(vaultPreview ? {storage: previewStorage} : {}),
});

let state;
try { state = vaultPreview ? {...initialState(), player: {x:16.5,y:9}, doorOpen:false} : restoreState(JSON.parse(localStorage.getItem(storeKey)), story.state.safe.open); }
catch { state = restoreState(null, story.state.safe.open); }
// Older saves may place the player inside the newly solid picture wall.
if (state.player.x < 8.5 && state.player.y < 3.5) state = { ...state, player: { ...state.player, y: 4 } };
const hallPaintings = [436121, 436535, 12127].map(id => {
  const image = new Image(); image.onload = () => draw(); image.src = `./assets/met-${id}.jpg`; return image;
});
const drawGallery = createGalleryRenderer();
const drawSecurityRoom = createSecurityRenderer();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const hallBackdrop = new Image();
hallBackdrop.onload = () => draw();
hallBackdrop.src = './assets/great-hall-security-door.jpg';
const vaultBackdrop = new Image();
vaultBackdrop.onload = () => draw();
vaultBackdrop.src = './assets/treasure-vault.jpg';
const wallArtwork = new Image();
let artworkReady = false;
wallArtwork.onload = () => { artworkReady = true; draw(); };
wallArtwork.src = './assets/met-436535.jpg'; // bundled copy, no API call needed
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
let vaultOpenedAt = null;
function currentGuard(){return guardDisplay();}
// While Leon talks he stands still and looks at the player.
function guardFacingNow(){
  if(talkingTo==='leon'){const g=guardDisplay(),dx=state.player.x-g.x,dy=state.player.y-g.y;return Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');}
  return guardMotion ? (guardMotion.to.x<guardMotion.from.x?'left':guardMotion.to.x>guardMotion.from.x?'right':guardMotion.to.y<guardMotion.from.y?'up':'down') : guardLastFacing;
}
function guardWalking(){return Boolean(guardMotion) && talkingTo!=='leon';}
// The thing E works on. People are left out: they talk by themselves.
function interactTarget(){const target=nearbyObject(state,currentGuard());return target && PEOPLE[target.id] ? null : target;}
function guardDisplay(){
  if (!guardMotion) return guardPosition;
  const t=Math.min(1,guardMotion.elapsed/guardMotion.duration);
  return {x:guardMotion.from.x+(guardMotion.to.x-guardMotion.from.x)*t, y:guardMotion.from.y+(guardMotion.to.y-guardMotion.from.y)*t};
}

let renderedStory = null; // the story state the journal currently shows
function save() { savePosition(); draw(); }
function updateSidebar() {
  document.body.dataset.room = state.room==='security' ? 'security' : state.player.x < 9 ? 'hall' : state.player.x < 18 ? 'gallery' : 'storage';
  document.querySelector('#room').textContent = state.room==='security' ? 'Security Room' : state.player.x < 9 ? 'Great Hall' : state.player.x < 18 ? 'Gallery & Conservation' : 'Treasure Room';
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
  const guardFacing=guardFacingNow();
  drawPerson(person.x,person.y,'guard',guardFacing,animationTime,guardWalking());
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
  const target=interactTarget(); if(target){ctx.font='bold 15px sans-serif';const text=`E  ${target.label}`;const width=ctx.measureText(text).width+22;ctx.fillStyle='rgba(30,37,38,.92)';ctx.beginPath();ctx.roundRect(player.x-width/2,player.y-93,width,28,6);ctx.fill();ctx.fillStyle='#fff5dd';ctx.fillText(text,player.x-width/2+11,player.y-74);}
}
// The vault is a separate view behind the gallery's existing door.
function drawTreasureRoom(){
  ctx.fillStyle='#061218';ctx.fillRect(0,0,896,576);
  if(vaultBackdrop.complete && vaultBackdrop.naturalWidth) {
    ctx.drawImage(vaultBackdrop,16,0,864,576);
    drawCameraLights(ctx,VAULT_CAMERAS,animationTime,reducedMotion.matches);
  }
  else {ctx.fillStyle='#ead3a4';ctx.font='18px Georgia';ctx.fillText('Opening the vault…',350,288);}
  // The genuine artwork is part of the case, displayed in the central frame.
  if(hallPaintings[1].complete && hallPaintings[1].naturalWidth)ctx.drawImage(hallPaintings[1],438,169,47,43);
  const curator=OBJECTS.find(o=>o.id==='curator');
  const figures=[{...curator,kind:'restorer'}, {...displayPlayer,kind:'rick'}].sort((a,b)=>a.y-b.y);
  for(const figure of figures){
    const point=vaultPosition(figure.x,figure.y);
    drawPerson(point.x,point.y,figure.kind,figure.kind==='rick'?facing:'down',animationTime,figure.kind==='rick'&&heldKeys.size>0);
  }
  const {x:px,y:py}=vaultPosition(displayPlayer.x,displayPlayer.y);
  const target=interactTarget();if(target){ctx.fillStyle='#17232be8';ctx.fillRect(px-85,py-92,170,26);ctx.fillStyle='#f4dfae';ctx.font='12px sans-serif';ctx.fillText('E · '+target.label,px-77,py-75);}
}
// The monitor wall uses the same actors and positions as the walkable rooms.
function cameraPeople(){
  const guard=guardDisplay();
  const guardFacing=guardFacingNow();
  const restorer=OBJECTS.find(object=>object.id==='restorer');
  const curator=OBJECTS.find(object=>object.id==='curator');
  const rooms={hall:[{...guard,kind:'guard',facing:guardFacing,moving:guardWalking()}],gallery:[{...restorer,kind:'restorer'}],vault:[{...curator,kind:'restorer'}]};
  if(state.room!=='security'){
    const room=state.player.x<9?'hall':state.player.x<18?'gallery':'vault';
    rooms[room].push({...displayPlayer,kind:'rick',facing,moving:heldKeys.size>0});
  }
  return rooms;
}
function draw() {
  canvas.style.objectPosition='50% 50%';
  ctx.clearRect(0,0,896,576);
  if(state.room==='security'){
    drawSecurityRoom(ctx,{time:animationTime,player:displayPlayer,target:nearbyObject(state),facing,moving:heldKeys.size>0,drawPerson,reducedMotion:reducedMotion.matches,peopleByRoom:cameraPeople(),doorOpen:state.doorOpen});return;
  }
  if(state.player.x < 9){drawHall();return;}
  if(state.player.x < 18){
    drawGallery(ctx, { time: animationTime, state, player: displayPlayer, objects: OBJECTS,
      target: interactTarget(), facing, moving: heldKeys.size > 0, drawPerson,
      vaultNearby: atVaultDoor(state), reducedMotion: reducedMotion.matches, doorProgress: state.doorOpen ? (vaultOpenedAt === null || reducedMotion.matches ? 1 : Math.min(1, Math.max(0,(performance.now()-vaultOpenedAt)/1600))) : 0 });
    return;
  }
  drawTreasureRoom();return;
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
  if(dialog.classList.contains('hidden')) dialogOpener = document.activeElement;
  stopMovement();
  document.querySelector('.dialog-card').classList.remove('story-dark-card');
  document.querySelector('#dialog-title').textContent=title;
  const body=document.querySelector('#dialog-body');body.replaceChildren();
  const p=document.createElement('p');p.textContent=text;body.append(p);
  const actions=document.querySelector('#dialog-actions');actions.replaceChildren();
  for(const option of options){const b=document.createElement('button');b.textContent=option.label;if(option.secondary)b.className='secondary';b.addEventListener('click',option.action);actions.append(b);}
  dialog.classList.remove('hidden');
  document.querySelector('.shell').inert = true;
  // The host adds its content synchronously after showDialog returns.
  queueMicrotask(() => (dialog.querySelector('button:not(:disabled), input, select, a[href]') ?? document.querySelector('.dialog-card')).focus());
}
function closeDialog(){
  story.leaveStation();
  dialog.classList.add('hidden');
  document.querySelector('.shell').inert = false;
  const target = dialogOpener?.isConnected && dialogOpener !== document.body ? dialogOpener : canvas;
  target.focus();
}
function handleInteract(){
  if(speech.isOpen){speech.advance();return;}
  if(!dialog.classList.contains('hidden') || roomTransition)return;
  if(atVaultDoor(state)){
    if(state.doorOpen) showDialog('Vault unlocked','Walk right through the open doorway.');
    else story.openVault();
    return;
  }
  const object=interactTarget();
  if(!object){showDialog('Nothing nearby','Move closer to a marked object. People talk to you by themselves.');return;}
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
  state=initialState();displayPlayer={...state.player};movementAnimation=null;roomTransition=null;guardPosition={x:5,y:5};guardMotion=null;guardDelay=1200;guardLastFacing='down';heldKeys.clear();speech.close();for(const id in talkWasNear)delete talkWasNear[id];
  try{if(!vaultPreview)localStorage.removeItem(oldLandscapeKey);}catch{}
  savePosition();
}
const directions = {arrowup:[0,-1],w:[0,-1],arrowdown:[0,1],s:[0,1],arrowleft:[-1,0],a:[-1,0],arrowright:[1,0],d:[1,0]};
const heldKeys = new Map();
let lastSavedAt=0;
let lastStepAt=0; // time of the last footstep sound
function currentRoom(){return state.room==='security'?'security':state.player.x<9?'hall':state.player.x<18?'gallery':'storage';}
function savePosition(){try{if(!vaultPreview)localStorage.setItem(storeKey,JSON.stringify(state));}catch{}updateSidebar();}
function stopMovement(){heldKeys.clear();savePosition();}
function animate(now){
  const delta=lastFrame ? Math.min(100,now-lastFrame) : 0;lastFrame=now;
  animationTime = now;
  const playerInHall=state.room!=='security' && state.player.x<9;
  if(!roomTransition && talkingTo!=='leon') { // Leon stands still while he talks
    if(guardMotion) {
      const nextElapsed=Math.min(guardMotion.duration,guardMotion.elapsed+delta);
      const t=nextElapsed/guardMotion.duration;
      const future={x:guardMotion.from.x+(guardMotion.to.x-guardMotion.from.x)*t,y:guardMotion.from.y+(guardMotion.to.y-guardMotion.from.y)*t};
      if(!playerInHall || Math.abs(future.x-state.player.x)>=0.45 || Math.abs(future.y-state.player.y)>=2.4)guardMotion.elapsed=nextElapsed;
      if(guardMotion.elapsed>=guardMotion.duration){guardLastFacing=guardMotion.to.x<guardMotion.from.x?'left':guardMotion.to.x>guardMotion.from.x?'right':guardMotion.to.y<guardMotion.from.y?'up':'down';guardPosition=guardMotion.to;guardDelay=guardMotion.pause;guardMotion=null;}
    } else {
      guardDelay-=delta;
      if(guardDelay<=0){
        const guardWorld=playerInHall?state:{...state,room:'museum',player:{x:-100,y:-100}};
        const action=chooseGuardAction(guardWorld,guardPosition);
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
  } else if(heldKeys.size && dialog.classList.contains('hidden')){ // the player may walk away while someone talks
    const direction=[...heldKeys.values()].at(-1);
    facing=direction[0]<0?'left':direction[0]>0?'right':direction[1]<0?'up':'down';
    const guards=[guardDisplay()];
    const next=advancePlayer(state,direction,delta,viewportForGame(),guards,canEnter);
    if(next!==state){
      if((state.room==='security')!==(next.room==='security') || ((state.player.x<9)!==(next.player.x<9)) || ((state.player.x<18)!==(next.player.x<18))) {
        // Stop held movement at the vault threshold so it cannot immediately reverse the transition.
        if((state.player.x<18)!==(next.player.x<18)) heldKeys.clear();
        roomTransition={start:now,destination:next,switched:false};
      }
      else {state=next;displayPlayer={...state.player};if(now-lastSavedAt>250){savePosition();lastSavedAt=now;}}
      // Footsteps while the player really moves; each floor sounds different (see story/sound.js).
      if(now-lastStepAt>=STEP_INTERVAL_MS){sound.playStep(currentRoom());lastStepAt=now;}
    }
  }
  checkAutoTalk();
  draw(); // Animate NPCs even while the player is idle.
  if(roomTransition){
    const progress=Math.min(1,(now-roomTransition.start)/320);
    ctx.save();ctx.fillStyle=`rgba(5,12,16,${progress<0.5?progress*2:(1-progress)*2})`;ctx.fillRect(0,0,896,576);ctx.restore();
  }
  requestAnimationFrame(animate);
}
// Opens a person's speech box when the player comes close, and closes it when they walk away.
function personPosition(objectId){return objectId==='guard' ? guardDisplay() : OBJECTS.find(o=>o.id===objectId);}
function personDistance(objectId){
  const room=state.room==='security' ? 'security' : state.player.x<9 ? 'guard' : state.player.x<18 ? 'restorer' : 'curator';
  if(room!==objectId) return Infinity; // people in other rooms are far away
  // Measure on the screen, not in tiles: the floor is drawn in perspective, so one tile
  // "down" is much shorter than one tile "right". 100 pixels count as one step.
  const onScreen={guard:hallPosition,restorer:galleryPosition,curator:vaultPosition}[objectId];
  const person=personPosition(objectId);
  return distanceBetween(onScreen(state.player.x,state.player.y),onScreen(person.x,person.y))/100;
}
function checkAutoTalk(){
  if(talkingTo){
    const objectId=Object.keys(PEOPLE).find(id=>PEOPLE[id]===talkingTo);
    if(shouldCloseTalk(personDistance(objectId))) speech.close();
    else speech.setPlacement(playerLow()?'top':'bottom');
  }
  const blocked=!dialog.classList.contains('hidden') || Boolean(roomTransition) || speech.isOpen;
  for(const [objectId,character] of Object.entries(PEOPLE)){
    const talk=shouldOpenTalk({distance:personDistance(objectId),wasNear:talkWasNear[character]??false,blocked});
    talkWasNear[character]=talk.wasNear || talkingTo===character;
    if(talk.open){
      talkingTo=character;
      speech.setPlacement(playerLow()?'top':'bottom');
      story.talkTo(character);
    }
  }
}
// Show the box at the top when the player stands low on the screen, so it never hides them.
function playerLow(){return hallPosition(state.player.x,state.player.y).y/576>0.78;}
requestAnimationFrame(animate);
document.addEventListener('keydown',event=>{
  if(speech.isOpen && speech.handleKey(event)){event.preventDefault();return;} // walking keys go on below
  if (!dialog.classList.contains('hidden')) {
    if(event.key === 'Tab') {
      const focusable = [...dialog.querySelectorAll('button:not(:disabled), a[href], input, select, [tabindex="0"]')].filter(node => node.getClientRects().length);
      const first = focusable[0], last = focusable.at(-1);
      if (!first) { event.preventDefault(); return; }
      if(event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if(!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    }
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
const soundButton=document.querySelector('#sound-toggle');
function showSoundState(){soundButton.textContent=sound.muted?'🔇 Muted':'🔊 Sound';soundButton.setAttribute('aria-pressed',String(!sound.muted));soundButton.setAttribute('aria-label',sound.muted?'Sound is off. Turn sound on':'Sound is on. Turn sound off');}
soundButton.addEventListener('click',()=>{sound.toggle();showSoundState();sound.play('click');});
showSoundState();
const musicButton=document.querySelector('#music-toggle');
function showMusicState(){musicButton.textContent=sound.musicOn?'♪ Music on':'♪ Music';musicButton.setAttribute('aria-pressed',String(sound.musicOn));}
musicButton.addEventListener('click',()=>{sound.toggleMusic();showMusicState();});
showMusicState();
// Browsers only allow sound after the first click or key press; music that was left on starts then.
for(const type of ['pointerdown','keydown'])document.addEventListener(type,()=>sound.resumeMusic(),{once:true});
document.querySelector('#mission').addEventListener('click',()=>story.showMission());
save();
story.start(); // M's message on the very first visit
setInterval(() => story.tick(), 250);
document.addEventListener('visibilitychange', () => { if (!document.hidden) story.tick(); });
