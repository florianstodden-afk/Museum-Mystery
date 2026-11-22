import { figuresBackToFront } from './character-depth.js?v=1';
import { newGame, readMission, solveStation } from './story/engine.js';
import { STATION_IDS } from './story/case-1.js';
import { drawCameraLights, VAULT_CAMERAS } from './camera-lights.js';
import { vaultPosition } from './vault-layout.js';
import { galleryPosition } from './gallery-layout.js';
import { createSecurityRenderer } from './security-room.js?v=live-people-3';
import { createGalleryRenderer } from './gallery.js?v=plaques-1';
import { drawWallPlaque } from './wall-plaque.js?v=1';
import { WIDTH, HEIGHT, OBJECTS, initialState, restoreState, canEnter, nearbyObject, atVaultDoor } from './engine.js?v=station-numbers-1';
import * as catalogueStation from './minigames/curators-catalogue.js?v=credits-1';
import * as forgeryStation from './minigames/spot-the-forgery.js';
import * as pictureStation from './minigames/picture-puzzle.js';
import * as portraitStation from './minigames/portrait-timeline.js?v=flash-4s-1';
import { createStoryHost } from './story/host.js?v=people-2';
import { peopleModel, renderPeople } from './story/people.js?v=people-1';
import { journalModel, renderJournal } from './story/journal.js?v=journal-blank-1';
import { createSoundPlayer, STEP_INTERVAL_MS } from './story/sound.js?v=vault-wheel-7';
import { scoreboard, bestRunStore } from './story/scoring.js';
import { renderScoreboard } from './story/scoreboard-view.js';
import { canPublish, loadLeaderboard, publishRun, renderLeaderboard } from './leaderboard.js?v=run-time-1';
import { LEADERBOARD_URL } from './leaderboard-config.js';
import { createCloudSync, initialSession, loginUrl, signOut } from './github-auth.js';
import { movementDuration, advancePlayer } from './motion.js?v=gallery-route-8';
import { chooseGuardAction } from './guard.js?v=station-i-patrol-1';
import { interactionFor, nudgeOffset } from './interaction.js';
import { createSpeechBox } from './story/speech-box.js?v=npc-conversation-1';
import { talkPartner, shouldCloseTalk, distanceBetween, facingToward } from './story/proximity.js?v=npc-e-1';
import { profileStorageKey } from './storage-keys.js';

const TILE = 32;
const canvas = document.querySelector('#game');
const homeScreen = document.querySelector('#home-screen');
const gameMenu = document.querySelector('#game-menu');
const gameMenuToggle = document.querySelector('#game-menu-toggle');
const ctx = canvas.getContext('2d');
ctx.setTransform(2,0,0,2,0,0);
function viewportForGame(){const r=canvas.getBoundingClientRect();const scale=Math.min(r.width/896,r.height/576);return {width:896*scale,height:576*scale};}
const dialog = document.querySelector('#dialog');
let dialogOpener = null;
const vaultPreview = new URLSearchParams(location.search).get('vault-preview') === '1';
const startup = vaultPreview ? { user: null, save: null, error: null } : await initialSession();
const activeProfile = startup.user ? `github:${startup.user.id}` : null;
const activeLogin = startup.user?.login || null;
const pendingKey = activeProfile ? profileStorageKey('museum-mystery-pending-save-v1', activeProfile) : null;
try { if(pendingKey){const pending=JSON.parse(localStorage.getItem(pendingKey));if(pending)startup.save=pending;} } catch {}
if (startup.save && activeProfile) {
  try {
    localStorage.setItem(profileStorageKey('museum-nocturne-story-v1', activeProfile), JSON.stringify(startup.save.story));
    localStorage.setItem(profileStorageKey('museum-mystery-walk-v1', activeProfile), JSON.stringify(startup.save.walk));
  } catch { startup.error = 'This browser cannot load your online save.'; }
}
let previewStory = readMission(newGame()).state;
if (vaultPreview) for (const id of STATION_IDS) previewStory = solveStation(previewStory, id).state;
let previewSave = JSON.stringify({story: JSON.stringify(previewStory), progress: {}});
const previewStorage = { getItem: () => previewSave, setItem: (_key, value) => { previewSave = value; } };
const storeKey = profileStorageKey('museum-mystery-walk-v1', activeProfile); // player position and steps
const oldLandscapeKey = 'museum-nocturne-landscape-v1'; // from the prototype, no longer used

// Small synthesized sounds for story moments; the player remembers 'muted'.
const sound = createSoundPlayer();

// Every person starts talking only after an E interaction.
const PEOPLE = {guard:'leon', restorer:'imani', curator:'vale'}; // map object id → story character
let nudgedAt = -Infinity;        // when the player last shook "nothing here" (interaction.js)
let talkingTo = null;             // the character in the speech box right now
const speech = createSpeechBox(document.body, {
  onClose: () => { talkingTo = null; },
  playSound: id => sound.play(id),
});

// The story (stations, safe, endings) is run by web/story/host.js inside our dialog.
let cloudSync = null;
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
  onHome: showHome,
  onFinished(finalState, progress) {
    const board = scoreboard(finalState, progress);
    if (!activeProfile) return;
    (async () => {
      try { await cloudSync.flush(); if(canPublish(board))await publishRun(board); }
      catch (error) { console.warn('Online result could not be saved:', error.message); }
    })();
  },
  sound,
  speech,
  stations: { landscape: catalogueStation, restoration: pictureStation, portraits: portraitStation, archive: forgeryStation },
  storageKey: profileStorageKey('museum-nocturne-story-v1', activeProfile),
  ...(vaultPreview ? {storage: previewStorage} : {}),
});

let state;
try { state = vaultPreview ? {...initialState(), player: {x:16.5,y:9}, doorOpen:false} : restoreState(JSON.parse(localStorage.getItem(storeKey)), story.state.safe.open); }
catch { state = restoreState(null, story.state.safe.open); }
if (activeProfile) cloudSync = createCloudSync(() => ({
  story: JSON.parse(localStorage.getItem(profileStorageKey('museum-nocturne-story-v1', activeProfile))), walk: state,
}), message => { const label=document.querySelector('#home-sync-status'); label.textContent=message; label.hidden=false; }, pendingKey);
if(pendingKey)try{if(localStorage.getItem(pendingKey))cloudSync.schedule();}catch{}
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
const guardStarts=[{x:5,y:8},{x:7,y:8},{x:2,y:12}];
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
  if(talkingTo==='leon')return facingToward(guardDisplay(),state.player);
  return guardMotion ? (guardMotion.to.x<guardMotion.from.x?'left':guardMotion.to.x>guardMotion.from.x?'right':guardMotion.to.y<guardMotion.from.y?'up':'down') : guardLastFacing;
}
function guardWalking(){return Boolean(guardMotion) && talkingTo!=='leon';}
// The nearby target determines which person E addresses.
function interactTarget(){return nearbyObject(state,currentGuard());}
function guardDisplay(){
  if (!guardMotion) return guardPosition;
  const t=Math.min(1,guardMotion.elapsed/guardMotion.duration);
  return {x:guardMotion.from.x+(guardMotion.to.x-guardMotion.from.x)*t, y:guardMotion.from.y+(guardMotion.to.y-guardMotion.from.y)*t};
}

let renderedStory = null; // the story state the journal currently shows
function save() { savePosition(); draw(); }
function updateSidebar() {
  document.body.dataset.room = state.room==='security' ? 'security' : state.player.x < 9 ? 'hall' : state.player.x < 18 ? 'gallery' : 'storage';
  document.querySelector('#steps').textContent = `${state.steps} steps`;
  // Walking saves the position several times a second. The journal only changes with the story,
  // so it is rebuilt only when the story state is a new object (every story action creates one).
  if (story.state === renderedStory) return;
  renderedStory = story.state;
  const model = journalModel(story.state);
  document.querySelector('#progress').textContent = `${model.slots.filter(slot => slot.solved).length} / 4 letters`;
  document.querySelector('#pass').textContent = `${model.score.total} / ${model.score.max} points`;
  renderJournal(document.querySelector('#journal'), model, document.querySelector('#journal-evidence'));
  renderPeople(document.querySelector('#journal-people'), peopleModel(story.state), drawPortrait);
}

// A small portrait for the journal's "People" page, drawn with the game's own figure.
function drawPortrait(canvas, kind){
  const c=canvas.getContext('2d');
  if(!c)return;
  c.clearRect(0,0,canvas.width,canvas.height);
  c.save();c.scale(1.15,1.15);
  drawPerson(28,62,kind,'down',0,false,c);
  c.restore();
}

// Journal tabs: "Case" (letters, evidence, notes) and "People".
function showJournalTab(name){
  const people=name==='people';
  for(const [id,on] of [['#journal-tab-case',!people],['#journal-tab-people',people]]){
    const tab=document.querySelector(id);tab.setAttribute('aria-selected',String(on));tab.tabIndex=on?0:-1;
  }
  document.querySelector('#journal-case-pages').hidden=people;
  document.querySelector('#journal-people-page').hidden=!people;
}
document.querySelector('#journal-tab-case').addEventListener('click',()=>showJournalTab('case'));
document.querySelector('#journal-tab-people').addEventListener('click',()=>showJournalTab('people'));
document.querySelector('.journal-tabs').addEventListener('keydown',event=>{
  if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
  event.preventDefault();
  const next=document.querySelector('#journal-tab-people').getAttribute('aria-selected')==='true'?'case':'people';
  showJournalTab(next);document.querySelector(`#journal-tab-${next}`).focus();
});

function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
function tile(x,y,color){rect(x*TILE,y*TILE,TILE,TILE,color);}
function hallPosition(x,y){ return {x: (x + 0.5) * 896 / 9, y: 345 + (y - 2) * 14}; }
// `target` lets the journal draw the same figure on its own small canvas.
function drawPerson(x,y,kind,direction='down',time=0,moving=false,target=ctx){
  const ctx=target;
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
  // Use the artwork itself, excluding the dark margins in the Met photographs.
  for (const [index, x, y, width, height, crop] of [
    [0,413,254,72,44,[.04,.045,.92,.91]],
    [2,657,253,34,46,[.09,.04,.82,.91]],
  ]) {
    const image = hallPaintings[index];
    if(image.complete && image.naturalWidth) drawFramedArtwork(image,x,y,width,height,crop);
    else {ctx.fillStyle='#394e46';ctx.fillRect(x,y,width,height);}
  }
  // Station 1 (portraits) is the large painting in the middle of the hall wall.
  drawStationPortrait(interactTarget()?.id==='ledger');

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
  const player=hallPosition(displayPlayer.x,displayPlayer.y);
  const hallFigures=[{...guardDisplay(),kind:'guard'}, {...displayPlayer,kind:'rick'}];
  for(const {figure,point} of figuresBackToFront(hallFigures,hallPosition)){
    const isPlayer=figure.kind==='rick';
    drawPerson(point.x,point.y,figure.kind,isPlayer?facing:guardFacingNow(),animationTime,isPlayer?heldKeys.size>0:guardWalking());
  }
  const target=interactTarget(); if(target){ctx.font='bold 15px sans-serif';const text=`E  ${target.label}`;const width=ctx.measureText(text).width+22;ctx.fillStyle='rgba(30,37,38,.92)';ctx.beginPath();ctx.roundRect(player.x-width/2,player.y-93,width,28,6);ctx.fill();ctx.fillStyle='#fff5dd';ctx.fillText(text,player.x-width/2+11,player.y-74);}
}
// The frames are already part of the hall background; keep their gold edges visible.
const STATION_I_FRAME={x:413,y:254,width:72,height:44};
function drawFramedArtwork(image,x,y,width,height,[cx,cy,cw,ch]){
  const sourceWidth=image.naturalWidth*cw, sourceHeight=image.naturalHeight*ch;
  const scale=Math.max(width/sourceWidth,height/sourceHeight);
  const sw=width/scale, sh=height/scale;
  const sx=image.naturalWidth*cx+(sourceWidth-sw)/2;
  const sy=image.naturalHeight*cy+(sourceHeight-sh)/2;
  ctx.drawImage(image,sx,sy,sw,sh,x,y,width,height);
}
function drawStationPortrait(active){
  const {x,y,width,height}=STATION_I_FRAME, mid=x+width/2;
  drawWallPlaque(ctx,mid,y+height+9,'PORTRAITS',{active});
  ctx.fillStyle=active?'#ffe5a0':'#bd985c';ctx.fillRect(mid-13,y+height+30,26,5);
  if(active){ctx.beginPath();ctx.moveTo(mid,y+height+38);ctx.lineTo(mid+4,y+height+42);ctx.lineTo(mid,y+height+46);ctx.lineTo(mid-4,y+height+42);ctx.fill();}
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
  if(hallPaintings[1].complete && hallPaintings[1].naturalWidth)
    drawFramedArtwork(hallPaintings[1],435.5,165,61,52,[.03,.04,.94,.92]);
  const curator=OBJECTS.find(o=>o.id==='curator');
  const figures=[{...curator,kind:'restorer'}, {...displayPlayer,kind:'rick'}];
  for(const {figure,point} of figuresBackToFront(figures,vaultPosition)){
    drawPerson(point.x,point.y,figure.kind,figure.kind==='rick'?facing:talkingTo==='vale'?facingToward(curator,state.player):'down',animationTime,figure.kind==='rick'&&heldKeys.size>0);
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
// Draws the scene; during a nudge the player is drawn a few pixels to the side.
function draw() {
  const resting=displayPlayer;
  const shake=nudgeOffset(performance.now()-nudgedAt,reducedMotion.matches);
  if(shake) displayPlayer={...resting,x:resting.x+shake};
  try{drawScene();}finally{displayPlayer=resting;}
}
function drawScene() {
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
  gameMenuToggle.hidden = true;
  document.querySelector('#game-journal-toggle').hidden = true;
  homeScreen.inert = true;
  document.querySelector('.shell').inert = true;
  // The host adds its content synchronously after showDialog returns.
  queueMicrotask(() => (dialog.querySelector('button:not(:disabled), input, select, a[href]') ?? document.querySelector('.dialog-card')).focus());
}
function closeDialog(){
  story.leaveStation();
  dialog.classList.add('hidden');
  document.querySelector('.shell').inert = !homeScreen.hidden;
  homeScreen.inert = false;
  gameMenuToggle.hidden = !homeScreen.hidden || !entryScreen.hidden;
  document.querySelector('#game-journal-toggle').hidden = !homeScreen.hidden || !entryScreen.hidden;
  const target = dialogOpener?.isConnected && dialogOpener !== document.body && !dialogOpener.closest('[hidden]') ? dialogOpener : homeScreen.hidden ? canvas : document.querySelector('#home-start');
  target.focus();
}
function handleInteract(){
  if(!homeScreen.hidden)return;
  if(speech.isOpen){speech.advance();return;}
  if(!dialog.classList.contains('hidden') || roomTransition)return;
  const object=interactTarget();
  // Once open, the doorway is crossed by walking; E should not steal a nearby object's action.
  const action=interactionFor({atVaultDoor:atVaultDoor(state) && !state.doorOpen,target:object});
  if(action==='vault'){
    if(state.doorOpen) showDialog('Vault unlocked','Walk right through the open doorway.');
    else story.openVault();
    return;
  }
  // No object near: no popup, just a short shake and a quiet tap sound (see interaction.js).
  if(action==='nudge'){nudgedAt=performance.now();sound.play('nudge');return;}
  // Every person talks the same way: only after E, box above or below the player.
  const character=talkPartner(object.id,PEOPLE);
  if(character){
    talkingTo=character;
    speech.setPlacement(playerLow()?'top':'bottom');
    story.talkTo(character);
    return;
  }
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
  state=initialState();displayPlayer={...state.player};movementAnimation=null;roomTransition=null;guardPosition={x:5,y:8};guardMotion=null;guardDelay=1200;guardLastFacing='down';heldKeys.clear();speech.close();
  try{if(!vaultPreview)localStorage.removeItem(oldLandscapeKey);}catch{}
  savePosition();
}
const directions = {arrowup:[0,-1],w:[0,-1],arrowdown:[0,1],s:[0,1],arrowleft:[-1,0],a:[-1,0],arrowright:[1,0],d:[1,0]};
const heldKeys = new Map();
let lastSavedAt=0;
let lastStepAt=0; // time of the last footstep sound
function currentRoom(){return state.room==='security'?'security':state.player.x<9?'hall':state.player.x<18?'gallery':'storage';}
function savePosition(){try{if(!vaultPreview)localStorage.setItem(storeKey,JSON.stringify(state));}catch{}if(cloudSync)cloudSync.schedule();updateSidebar();}
function stopMovement(){heldKeys.clear();savePosition();}
function animate(now){
  const delta=lastFrame ? Math.min(100,now-lastFrame) : 0;lastFrame=now;
  animationTime = now;
  if(!homeScreen.hidden || !gameMenu.hidden || !document.querySelector('#sidebar').hidden){requestAnimationFrame(animate);return;}
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
  checkTalkDistance();
  draw(); // Animate NPCs even while the player is idle.
  if(roomTransition){
    const progress=Math.min(1,(now-roomTransition.start)/320);
    ctx.save();ctx.fillStyle=`rgba(5,12,16,${progress<0.5?progress*2:(1-progress)*2})`;ctx.fillRect(0,0,896,576);ctx.restore();
  }
  requestAnimationFrame(animate);
}
// Everyone talks after E. Open speech closes when walking away.
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
function checkTalkDistance(){
  if(!talkingTo)return;
  const objectId=Object.keys(PEOPLE).find(id=>PEOPLE[id]===talkingTo);
  if(shouldCloseTalk(personDistance(objectId))) speech.close();
  else speech.setPlacement(playerLow()?'top':'bottom');
}
// Show the box at the top when the player stands low on the screen, so it never hides them.
function playerLow(){return hallPosition(state.player.x,state.player.y).y/576>0.78;}
requestAnimationFrame(animate);
document.addEventListener('keydown',event=>{
  if(!entryScreen.hidden)return;
  if(!document.querySelector('#sidebar').hidden){
    if(event.key==='Escape' || event.key.toLowerCase()==='j'){event.preventDefault();closeJournal();}
    return;
  }
  if(!homeScreen.hidden)return;   // the journal opens in the game (J or the menu), not on the Home screen
  if(!gameMenu.hidden){
    if(event.key==='Escape'){event.preventDefault();closeGameMenu();return;}
    if(event.key.toLowerCase()==='j' && !event.repeat){event.preventDefault();closeGameMenu(false);openJournal(document.querySelector('#journal-toggle'));return;}
    if(event.key==='Tab'){
      const focusable=[...gameMenu.querySelectorAll('button:not(:disabled)')];
      const first=focusable[0],last=focusable.at(-1);
      if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
    }
    return;
  }
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
  if(event.key==='Escape'){event.preventDefault();openGameMenu();return;}
  if(event.key.toLowerCase()==='j' && !event.repeat){event.preventDefault();openJournal(document.querySelector('#game-journal-toggle'));return;}
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
document.querySelector('#journal-toggle').addEventListener('click', event=>{closeGameMenu(false);openJournal(event.currentTarget);});
document.querySelector('#game-journal-toggle').addEventListener('click',event=>openJournal(event.currentTarget));
document.querySelector('#hint').addEventListener('click',()=>{closeGameMenu(false);canvas.focus();story.showHint();});
const soundButton=document.querySelector('#sound-toggle');
const homeSoundButton=document.querySelector('#home-sound');
function showSoundState(){soundButton.textContent=sound.muted?'🔇 Sound off':'🔊 Sound on';soundButton.setAttribute('aria-pressed',String(!sound.muted));soundButton.setAttribute('aria-label',sound.muted?'Sound off. Turn sound on':'Sound on. Turn sound off');homeSoundButton.textContent=sound.muted?'Sound off':'Sound on';homeSoundButton.setAttribute('aria-pressed',String(!sound.muted));}
function toggleSound(){sound.toggle();showSoundState();sound.play('click');}
soundButton.addEventListener('click',toggleSound);
homeSoundButton.addEventListener('click',toggleSound);
showSoundState();
const musicButton=document.querySelector('#music-toggle');
const homeMusicButton=document.querySelector('#home-music');
function showMusicState(){musicButton.textContent=sound.musicOn?'♪ Music on':'♪ Music off';musicButton.setAttribute('aria-pressed',String(sound.musicOn));homeMusicButton.textContent=sound.musicOn?'Music on':'Music off';homeMusicButton.setAttribute('aria-pressed',String(sound.musicOn));}
function toggleMusic(){sound.toggleMusic();showMusicState();}
musicButton.addEventListener('click',toggleMusic);
homeMusicButton.addEventListener('click',toggleMusic);
showMusicState();
// Browsers only allow sound after the first click or key press; music that was left on starts then.
for(const type of ['pointerdown','keydown'])document.addEventListener(type,()=>sound.resumeMusic(),{once:true});
document.querySelector('#mission').addEventListener('click',()=>{closeJournal(false);(homeScreen.hidden?canvas:document.querySelector('#home-start')).focus();story.showMission();});
const homeStart=document.querySelector('#home-start');
const homeNew=document.querySelector('#home-new');
const homeSettings=document.querySelector('#home-settings');
const homeSettingsPanel=document.querySelector('#home-settings-panel');
const homeScoreboard=document.querySelector('#home-scoreboard');
const homeScoreboardPanel=document.querySelector('#home-scoreboard-panel');
const leaderboardStatus=document.querySelector('#leaderboard-status');
const leaderboardResults=document.querySelector('#leaderboard-results');
const ONLINE=Boolean(LEADERBOARD_URL && activeProfile);
document.querySelector('#leaderboard-online').hidden=!ONLINE;
async function refreshLeaderboard(){
  leaderboardStatus.textContent='Loading shared results…';
  try {
    const data=await loadLeaderboard();
    renderLeaderboard(leaderboardResults,data.entries,activeProfile);
    leaderboardStatus.textContent='Results from all published players.';
  } catch(error) {
    leaderboardResults.replaceChildren();
    leaderboardStatus.textContent=error.message;
  }
}
document.querySelector('#leaderboard-refresh').addEventListener('click',refreshLeaderboard);
const homeConfirm=document.querySelector('#home-confirm');
const journalOverlay=document.querySelector('#sidebar');
const gameJournalToggle=document.querySelector('#game-journal-toggle');
let journalOpener=null;
const entryScreen=document.querySelector('#entry-screen');
const entryMessage=document.querySelector('#entry-message');
entryMessage.textContent=startup.error || (location.hostname.endsWith('github.io')
  ? 'GitHub sign-in opens the online version of the game.'
  : LEADERBOARD_URL ? '' : 'GitHub sign-in is available at museum-mystery.vercel.app.');
document.querySelector('#entry-github').addEventListener('click',()=>{
  const url=loginUrl();
  if(url)location.assign(url);
  else entryMessage.textContent='Open museum-mystery.vercel.app for GitHub sign-in, or play as a guest here.';
});
document.querySelector('#entry-guest').addEventListener('click',()=>{
  entryScreen.hidden=true;
  homeScreen.inert=false;
  showHome();
});
function closeHomePanels(){
  homeSettingsPanel.hidden=true;homeScoreboardPanel.hidden=true;homeConfirm.hidden=true;
  homeSettings.setAttribute('aria-expanded','false');
  homeScoreboard.setAttribute('aria-expanded','false');
}
function openJournal(opener){
  if(!entryScreen.hidden || !dialog.classList.contains('hidden') || !journalOverlay.hidden)return;
  journalOpener=opener;
  stopMovement();
  speech.close();
  journalOverlay.hidden=false;
  document.querySelector('.shell').inert=true;
  homeScreen.inert=true;
  gameMenuToggle.hidden=true;
  gameJournalToggle.hidden=true;
  document.querySelector('#journal-close').focus();
}
function closeJournal(restoreFocus=true){
  if(journalOverlay.hidden)return;
  journalOverlay.hidden=true;
  homeScreen.inert=false;
  document.querySelector('.shell').inert=!homeScreen.hidden;
  gameMenuToggle.hidden=!homeScreen.hidden || !entryScreen.hidden;
  gameJournalToggle.hidden=!homeScreen.hidden || !entryScreen.hidden;
  if(restoreFocus)(journalOpener?.isConnected && !journalOpener.closest('[hidden]')?journalOpener:homeScreen.hidden?canvas:document.querySelector('#home-start')).focus();
}
document.querySelector('#journal-close').addEventListener('click',()=>closeJournal());
journalOverlay.addEventListener('click',event=>{if(event.target===journalOverlay)closeJournal();});
journalOverlay.addEventListener('keydown',event=>{
  if(event.key!=='Tab')return;
  const focusable=[...journalOverlay.querySelectorAll('button:not(:disabled),a[href]')];
  const first=focusable[0],last=focusable.at(-1);
  if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
});
function openGameMenu(){
  if(!homeScreen.hidden || !dialog.classList.contains('hidden') || !journalOverlay.hidden)return;
  stopMovement();
  speech.close();
  gameMenu.hidden=false;
  gameJournalToggle.hidden=true;
  gameMenuToggle.setAttribute('aria-expanded','true');
  gameMenuToggle.setAttribute('aria-label','Close in-game menu');
  document.querySelector('.shell').inert=true;
  document.querySelector('#game-menu-resume').focus();
}
function closeGameMenu(restoreFocus=true){
  if(gameMenu.hidden)return;
  gameMenu.hidden=true;
  gameJournalToggle.hidden=false;
  gameMenuToggle.setAttribute('aria-expanded','false');
  gameMenuToggle.setAttribute('aria-label','Open in-game menu');
  document.querySelector('.shell').inert=!dialog.classList.contains('hidden') || !homeScreen.hidden;
  if(restoreFocus)gameMenuToggle.focus();
}
gameMenuToggle.addEventListener('click',()=>gameMenu.hidden?openGameMenu():closeGameMenu());
gameMenu.addEventListener('click',event=>{if(event.target===gameMenu)closeGameMenu();});
document.querySelector('#game-menu-resume').addEventListener('click',()=>closeGameMenu());
// An old or broken save was thrown away: say so once on the home screen, without a dialog.
let saveNoticeShown=false;
function showSaveNotice(){
  const notice=document.querySelector('#home-notice');
  notice.hidden=saveNoticeShown || !story.discardedSave;
  if(!notice.hidden)notice.textContent='Game updated. Your run starts fresh.';
  if(entryScreen.hidden)saveNoticeShown=true;   // only counts once the player can see the home screen
}
function showHome(){
  closeJournal(false);
  closeGameMenu(false);
  stopMovement();speech.close();
  if(!dialog.classList.contains('hidden'))closeDialog();
  homeScreen.hidden=false;
  const profileLabel=document.querySelector('#home-current-profile');
  profileLabel.hidden=false;
  profileLabel.textContent=activeProfile?`GitHub: @${activeLogin}`:'Guest · progress on this device only';
  const syncLabel=document.querySelector('#home-sync-status');
  syncLabel.hidden=!activeProfile;
  if(activeProfile && !syncLabel.textContent)syncLabel.textContent='Online save ready';
  homeScoreboard.disabled=!activeProfile;
  homeScoreboard.setAttribute('aria-label',activeProfile?'Scoreboard':'Leaderboard requires GitHub sign-in');
  document.querySelector('#home-switch-profile').textContent=activeProfile?'Sign out':'Sign in with GitHub';
  gameMenuToggle.hidden=true;
  gameJournalToggle.hidden=true;
  document.querySelector('.shell').inert=true;
  homeStart.disabled=!story.state.missionRead;
  homeStart.setAttribute('aria-label',story.state.ending?'Resume Game - view ending':'Resume Game');
  const board=scoreboard(story.state,story.progress);
  const bestRun=bestRunStore((()=>{try{return localStorage;}catch{return null;}})(),profileStorageKey('museum-nocturne-best-run-v1',activeProfile));
  // A finished run may become the best run (stored on this device only).
  const best=board.finished?bestRun.record({points:board.points,timeMs:board.timeMs,max:board.max,status:board.status}):bestRun.get();
  renderScoreboard(document.querySelector('#home-scoreboard-result'),board,best);
  // Retry a winning result if the previous automatic publication was interrupted.
  if(activeProfile && canPublish(board))cloudSync.flush().then(()=>publishRun(board)).catch(()=>{});
  showSaveNotice();
  closeHomePanels();
  (homeStart.disabled?homeNew:homeStart).focus();
}
function enterGame(){
  homeScreen.hidden=true;
  gameMenuToggle.hidden=false;
  gameJournalToggle.hidden=false;
  document.querySelector('.shell').inert=false;
  canvas.focus();
  if(story.state.ending)story.openVault();
  else story.start();
}
homeStart.addEventListener('click',enterGame);
homeNew.addEventListener('click',()=>{
  if(!story.state.missionRead){enterGame();return;}
  closeHomePanels();homeConfirm.hidden=false;document.querySelector('#home-confirm-new').focus();
});
document.querySelector('#home-confirm-new').addEventListener('click',()=>{
  homeConfirm.hidden=true;
  homeScreen.hidden=true;
  gameMenuToggle.hidden=false;
  gameJournalToggle.hidden=false;
  document.querySelector('.shell').inert=false;
  story.reset();
});
document.querySelector('#home-cancel-new').addEventListener('click',()=>{closeHomePanels();homeNew.focus();});
homeSettings.addEventListener('click',()=>{
  const opening=homeSettingsPanel.hidden;closeHomePanels();homeSettingsPanel.hidden=!opening;
  homeSettings.setAttribute('aria-expanded',String(opening));
  if(opening)document.querySelector('#home-sound').focus();
});
document.querySelector('#home-switch-profile').addEventListener('click',async()=>{
  if(activeProfile){try{await cloudSync?.flush();}catch{}await signOut();location.reload();}
  else {const url=loginUrl();if(url)location.assign(url);else location.reload();}
});
homeScoreboard.addEventListener('click',()=>{
  if(!activeProfile)return;
  const opening=homeScoreboardPanel.hidden;closeHomePanels();homeScoreboardPanel.hidden=!opening;
  homeScoreboard.setAttribute('aria-expanded',String(opening));
  if(opening){homeScoreboardPanel.querySelector('button').focus();if(ONLINE)refreshLeaderboard();}
});
homeScreen.querySelectorAll('[data-close-home-panel]').forEach(button=>button.addEventListener('click',()=>{
  const opener=button.closest('#home-settings-panel')?homeSettings:homeScoreboard;
  closeHomePanels();opener.focus();
}));
homeScreen.addEventListener('keydown',event=>{
  if(event.key==='Escape' && (!homeSettingsPanel.hidden || !homeScoreboardPanel.hidden || !homeConfirm.hidden)){
    closeHomePanels();homeNew.focus();event.preventDefault();
  }
});
document.querySelector('#home-button').addEventListener('click',showHome);
save();
if(activeProfile){entryScreen.hidden=true;homeScreen.inert=false;}
showHome(); // The mission starts only after the player chooses Start game.
if(!activeProfile)document.querySelector('#entry-github').focus();
if(!activeProfile && LEADERBOARD_URL && new URLSearchParams(location.search).get('github-login')==='1'){
  history.replaceState(null,'',location.pathname);
  location.replace(loginUrl());
}
setInterval(() => story.tick(), 250);
document.addEventListener('visibilitychange', () => { if (!document.hidden) story.tick(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) cloudSync?.flush().catch(() => {}); });
