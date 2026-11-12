import { WIDTH, HEIGHT, OBJECTS, initialState, validState, hasAllEvidence,
  move, nearbyObject, interact, openVault, chooseEnding } from './engine.js';
import { start as startLandscape, initialLandscape } from './minigames/landscape.js';
import { movementDuration } from './motion.js';

const TILE = 32;
const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const dialog = document.querySelector('#dialog');
const storeKey = 'museum-mystery-walk-v1';
let state;
const landscapeKey = 'museum-nocturne-landscape-v1';
let landscapeState;
try { landscapeState = JSON.parse(localStorage.getItem(landscapeKey)) || initialLandscape(); }
catch { landscapeState = initialLandscape(); }
try { const saved = JSON.parse(localStorage.getItem(storeKey)); state = validState(saved) ? saved : initialState(); }
catch { state = initialState(); }
// Older saves may place the player inside the newly solid picture wall.
if (state.player.x < 9 && state.player.y < 4) state = { ...state, player: { ...state.player, y: 4 } };
let metArtwork = null;
const hallPaintings = [436121, 436535, 12127].map(id => {
  const image = new Image(); image.onload = () => draw(); image.src = `./assets/met-${id}.jpg`; return image;
});
const hallBackdrop = new Image();
hallBackdrop.onload = () => draw();
hallBackdrop.src = './assets/great-hall-nyc.png';
const wallArtwork = new Image();
let artworkReady = false;
wallArtwork.onload = () => { artworkReady = true; draw(); };
let displayPlayer = { ...state.player };
let movementAnimation = null;
let facing = 'down';
let animationTime = 0;
let metStatus = 'lädt';

fetch('https://collectionapi.metmuseum.org/public/collection/v1/objects/436535')
  .then(response => { if (!response.ok) throw new Error('API nicht erreichbar'); return response.json(); })
  .then(data => { if (!data.isPublicDomain || !data.primaryImageSmall) throw new Error('Bild nicht öffentlich'); metArtwork = data; metStatus = 'bereit'; wallArtwork.src = data.primaryImageSmall; })
  .catch(() => { metStatus = 'offline'; });

function save() { localStorage.setItem(storeKey, JSON.stringify(state)); updateSidebar(); draw(); }
function updateSidebar() {
  document.querySelector('#room').textContent = state.player.x < 9 ? 'Empfangshalle' : state.player.x < 18 ? 'Galerie & Restaurierung' : 'Depot';
  document.querySelector('#progress').textContent = `${state.clues.length} / 3 Belege`;
  document.querySelector('#pass').textContent = state.pass ? 'Depotausweis ✓' : 'Kein Ausweis';
  document.querySelector('#steps').textContent = `${state.steps} Schritte`;
  const labels = { ledger: 'Besucherprotokoll', painting: 'Frischer Firnis', note: 'Restaurierungsnotiz' };
  const journal = Object.entries(labels).map(([id,label]) => `<div class="journal-item ${state.clues.includes(id) ? '' : 'missing'}"><b>${state.clues.includes(id) ? '✓' : '○'}</b>${label}</div>`).join('');
  const next = !state.clues.includes('ledger') ? 'Suche das Protokoll im Empfang.' : !state.pass ? 'Sprich mit dem Wachmann.' : !hasAllEvidence(state) ? 'Untersuche Galerie und Restaurierung.' : !state.vaultOpen ? 'Löse den Code an der orangefarbenen Depottür.' : state.ending ? 'Fall abgeschlossen.' : 'Finde das Original im Depot.';
  document.querySelector('#journal').innerHTML = journal + `<p><strong>Nächster Schritt:</strong> ${next}</p>`;
}

function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
function tile(x,y,color){rect(x*TILE,y*TILE,TILE,TILE,color);}
function hallPosition(x,y){ return {x: (x + 0.5) * canvas.width / 9, y: 345 + (y - 2) * 14}; }
function drawPerson(x,y,kind,direction='down',time=0,moving=false){
  ctx.save(); ctx.translate(x,y);
  const sway = kind === 'guard' ? Math.sin(time / 800) * 1.5 : moving ? Math.sin(time / 100) * 2 : 0;
  ctx.translate(0,sway);
  ctx.lineWidth=1.5;ctx.strokeStyle='#263036';
  ctx.fillStyle='rgba(25,20,15,.24)';ctx.beginPath();ctx.ellipse(0,2,17,5,0,0,Math.PI*2);ctx.fill();
  if(kind==='rick'){
    // An expressive, larger character with a white coat and blue spiky hair.
    const stride=moving ? Math.sin(time/100)*5 : 0;
    ctx.strokeStyle='#303c3a';ctx.lineWidth=5;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(-6,-11);ctx.lineTo(-7-stride,-1);ctx.moveTo(6,-11);ctx.lineTo(7+stride,-1);ctx.stroke();
    ctx.strokeStyle='#5b3b2a';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-10-stride,0);ctx.lineTo(-4-stride,0);ctx.moveTo(4+stride,0);ctx.lineTo(10+stride,0);ctx.stroke();
    ctx.fillStyle='#473927';ctx.fillRect(-9,-14,18,7);
    ctx.fillStyle='#faf9eb';ctx.beginPath();ctx.moveTo(-14,-34);ctx.lineTo(14,-34);ctx.lineTo(17,-7);ctx.lineTo(-17,-7);ctx.closePath();ctx.fill();ctx.strokeStyle='#394648';ctx.lineWidth=1.2;ctx.stroke();
    ctx.fillStyle='#9bd9d5';ctx.fillRect(-6,-32,12,21);
    ctx.fillStyle='#fffdf4';ctx.beginPath();ctx.moveTo(-12,-34);ctx.lineTo(-4,-31);ctx.lineTo(-8,-24);ctx.lineTo(-5,-20);ctx.lineTo(-10,-10);ctx.lineTo(-15,-9);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(12,-34);ctx.lineTo(4,-31);ctx.lineTo(8,-24);ctx.lineTo(5,-20);ctx.lineTo(10,-10);ctx.lineTo(15,-9);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#e8c4a9';ctx.beginPath();ctx.ellipse(0,-41,10,11,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#a8e7f1';ctx.strokeStyle='#34464a';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-10,-45);ctx.lineTo(-21,-49);ctx.lineTo(-12,-52);ctx.lineTo(-18,-61);ctx.lineTo(-8,-56);ctx.lineTo(-7,-65);ctx.lineTo(-2,-58);ctx.lineTo(3,-67);ctx.lineTo(6,-58);ctx.lineTo(16,-64);ctx.lineTo(12,-54);ctx.lineTo(21,-52);ctx.lineTo(10,-44);ctx.closePath();ctx.fill();ctx.stroke();
    if(direction!=='up'){
      const offset = direction==='left' ? -3 : direction==='right' ? 3 : 0;
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-4+offset,-42,3.7,0,Math.PI*2);ctx.arc(4+offset,-42,3.7,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.fillStyle='#293037';ctx.fillRect(-4+offset,-43,1.5,3);ctx.fillRect(4+offset,-43,1.5,3);
      ctx.strokeStyle='#53665e';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-7+offset,-47);ctx.lineTo(-1+offset,-46);ctx.moveTo(2+offset,-46);ctx.lineTo(8+offset,-47);ctx.moveTo(-3+offset,-36);ctx.lineTo(4+offset,-36);ctx.stroke();
    }
    ctx.strokeStyle='#53635d';ctx.beginPath();ctx.moveTo(-13,-32);ctx.lineTo(-16,-8);ctx.lineTo(16,-8);ctx.lineTo(13,-32);ctx.stroke();
  } else {
    ctx.fillStyle='#263743';ctx.fillRect(-10,-9,8,10);ctx.fillRect(2,-9,8,10);
    ctx.fillStyle='#355568';ctx.beginPath();ctx.roundRect(-13,-34,26,26,4);ctx.fill();
    ctx.fillStyle='#d4a888';ctx.beginPath();ctx.ellipse(Math.sin(time/2200)*2,-40,9,10,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#223440';ctx.fillRect(-10,-50,20,6);ctx.fillRect(-12,-46,24,3);
    const look=Math.sin(time/2200)*2;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-3+look,-41,2.6,0,Math.PI*2);ctx.arc(4+look,-41,2.6,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#243038';ctx.fillRect(-3+look,-42,1.3,2.5);ctx.fillRect(4+look,-42,1.3,2.5);ctx.strokeStyle='#6c4237';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-2+look,-35);ctx.lineTo(3+look,-35);ctx.stroke();
    ctx.fillStyle='#d5bd80';ctx.fillRect(-2,-28,4,5);
  }
  ctx.restore();
}
function drawHall(){
  if(hallBackdrop.complete && hallBackdrop.naturalWidth) ctx.drawImage(hallBackdrop,0,0,canvas.width,canvas.height);
  else {ctx.fillStyle='#c8bba3';ctx.fillRect(0,0,canvas.width,canvas.height);}
  // Public-domain Met works are stored locally so every frame works offline.
  for (const [index, x, y, width, height] of [[0,159,247,35,59],[1,410,244,77,55],[2,701,247,35,59]]) {
    const image = hallPaintings[index];
    if(image.complete && image.naturalWidth) ctx.drawImage(image,x,y,width,height);
    else {ctx.fillStyle='#394e46';ctx.fillRect(x,y,width,height);}
  }
  const guard=OBJECTS.find(o=>o.id==='guard'); const ledger=OBJECTS.find(o=>o.id==='ledger');
  const desk=hallPosition(ledger.x,ledger.y);ctx.fillStyle='#5b4633';ctx.beginPath();ctx.ellipse(desk.x,desk.y+3,45,12,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#b79c71';ctx.fillRect(desk.x-28,desk.y-14,56,16);ctx.fillStyle='#f0e2bc';ctx.fillRect(desk.x-10,desk.y-17,20,12);
  const person=hallPosition(guard.x,guard.y);
  // The guard shifts weight and looks around within his interaction tile.
  drawPerson(person.x + Math.sin(animationTime/1500)*12,person.y,'guard','down',animationTime);
  // Brass-edged barriers mark the walkable floor; leave a gap at the gallery doorway.
  ctx.lineWidth=3;ctx.strokeStyle='rgba(89,69,42,.75)';ctx.beginPath();
  ctx.moveTo(86,362);ctx.lineTo(86,554);ctx.moveTo(86,554);ctx.lineTo(864,554);
  ctx.moveTo(864,362);ctx.lineTo(864,430);ctx.moveTo(864,458);ctx.lineTo(864,554);ctx.stroke();
  ctx.lineWidth=1;ctx.strokeStyle='rgba(255,222,139,.8)';ctx.stroke();
  // Indicate the connecting doorway, which is reached at the middle of the east wall.
  ctx.fillStyle='rgba(39,46,44,.84)';ctx.beginPath();ctx.roundRect(770,365,118,30,6);ctx.fill();ctx.fillStyle='#f7e8c7';ctx.font='bold 14px sans-serif';ctx.fillText('GALERIE  →',782,385);
  const player=hallPosition(displayPlayer.x,displayPlayer.y);drawPerson(player.x,player.y,'rick',facing,animationTime,Boolean(movementAnimation));
  const target=nearbyObject(state); if(target){ctx.font='bold 15px sans-serif';const text=`E  ${target.label}`;const width=ctx.measureText(text).width+22;ctx.fillStyle='rgba(30,37,38,.92)';ctx.beginPath();ctx.roundRect(player.x-width/2,player.y-93,width,28,6);ctx.fill();ctx.fillStyle='#fff5dd';ctx.fillText(text,player.x-width/2+11,player.y-74);}
}
function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(state.player.x < 9){drawHall();return;}
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
  tile(9,9,'#b1986c');tile(18,9,state.vaultOpen?'#ab956d':'#ad683b');
  if(!state.vaultOpen){rect(18*TILE+12,9*TILE+10,8,13,'#f6c56e');}
  for(const object of OBJECTS){
    const x=object.x*TILE,y=object.y*TILE;
    ctx.save();
    if(object.id==='guard'||object.id==='restorer') ctx.translate(Math.sin(animationTime/1600 + object.x)*2,Math.sin(animationTime/800 + object.y));
    if(object.id==='guard'||object.id==='restorer'){
      rect(x+8,y+5,16,22,object.id==='guard'?'#294d68':'#694f71');rect(x+10,y+2,12,10,'#e3b88b');rect(x+8,y+26,6,5,'#26343c');rect(x+18,y+26,6,5,'#26343c');
    }else if(object.id==='painting'){rect(x+3,y+3,26,26,'#d2a350');rect(x+6,y+6,20,20,'#648e86');rect(x+15,y+8,3,18,'#294e44');}
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
  ctx.fillText('EMPFANG',50,85);ctx.fillText('GALERIE',360,54);ctx.fillText('DEPOT',665,54);
  const target=nearbyObject(state);if(target || (p.x===17&&p.y===9)){
    rect(px-14,py-29,120,24,'#1c303a');ctx.fillStyle='#fff0cc';ctx.fillText(`E  ${target?.label??'Depottür'}`,px-8,py-12);
  }
}

function showDialog(title,text,options=[{label:'Weiter',action:closeDialog}]){
  heldKeys.clear();
  document.querySelector('#dialog-title').textContent=title;
  const body=document.querySelector('#dialog-body');body.replaceChildren();
  const p=document.createElement('p');p.textContent=text;body.append(p);
  const actions=document.querySelector('#dialog-actions');actions.replaceChildren();
  for(const option of options){const b=document.createElement('button');b.textContent=option.label;if(option.secondary)b.className='secondary';b.addEventListener('click',option.action);actions.append(b);}
  dialog.classList.remove('hidden');
}
function closeDialog(){dialog.classList.add('hidden');}
function showArtwork(){
  if(!metArtwork){const p=document.createElement('p');p.textContent=metStatus==='offline'?'Die Met-API ist gerade nicht erreichbar. Die Ermittlung bleibt spielbar.':'Kunstdaten werden noch geladen …';document.querySelector('#dialog-body').append(p);return;}
  const img=document.createElement('img');img.src=metArtwork.primaryImageSmall;img.alt=metArtwork.title;
  const caption=document.createElement('p');caption.textContent=`Met-Werk ${metArtwork.objectID}: ${metArtwork.title}, ${metArtwork.artistDisplayName}, ${metArtwork.objectDate}. Das Original ist öffentlich zugänglich.`;
  const link=document.createElement('a');link.href=metArtwork.objectURL;link.target='_blank';link.rel='noopener';link.textContent='Originaleintrag im Met ansehen';
  document.querySelector('#dialog-body').append(img,caption,link);
}
function handleInteract(){
  if(!dialog.classList.contains('hidden'))return;
  if(state.player.x===17&&state.player.y===9){
    if(!state.pass||!hasAllEvidence(state)){showDialog('Depottür',openVault(state,'').text);return;}
    if(state.vaultOpen){showDialog('Depottür','Die Tür ist bereits offen. Geh hindurch.');return;}
    showDialog('Zahlenschloss','Die Restauratorin deutete auf die Uhrzeit des verdächtigen Eintrags. Gib vier Ziffern ein.',[
      {label:'Code prüfen',action:()=>{const code=document.querySelector('#vault-code').value.trim();const result=openVault(state,code);state=result.state;save();showDialog('Depottür',result.text);}},
      {label:'Später',action:closeDialog,secondary:true},
    ]);
    const input=document.createElement('input');input.id='vault-code';input.inputMode='numeric';input.maxLength=4;input.placeholder='Vier Ziffern';input.setAttribute('aria-label','Vierstelliger Zahlencode');document.querySelector('#dialog-body').append(input);input.focus();
    return;
  }
  const object=nearbyObject(state);if(!object){showDialog('Niemand in der Nähe','Geh an ein markiertes Objekt oder eine Person heran.');return;}
  if (object.id === 'painting') {
    showDialog('Landschaftsgalerie · Station B', '');
    startLandscape(document.querySelector('#dialog-body'), {
      state: landscapeState,
      onChange: next => { landscapeState = next; localStorage.setItem(landscapeKey, JSON.stringify(next)); }
    }, result => {
      const current = interact(state, 'painting'); state = current.state; save();
      const notice = document.createElement('p'); notice.textContent = `Beweis im Journal: ${result.evidence}`;
      document.querySelector('#dialog-body').append(notice);
    });
    return;
  }
  const result=interact(state,object.id);state=result.state;save();
  if(result.choice){showDialog('Die letzte Entscheidung',result.text,[
    {label:'Original heimlich zurückbringen',action:()=>end('restore')},
    {label:'Fälschung öffentlich aufdecken',action:()=>end('expose'),secondary:true},
  ]);return;}
  showDialog(object.label,result.text);if(result.artwork)showArtwork();
}
function end(choice){state=chooseEnding(state,choice);save();
  const restore='Du bringst das echte Bild unbemerkt zurück. Das Museum ist gerettet, aber der Kurier und die Vertuschung bleiben unbekannt. ENDE A: Stille Rettung.';
  const expose='Du zeigst Protokoll, Firnis und Notiz der Öffentlichkeit. Die Fälschung wird aufgedeckt; das Museum muss Verantwortung übernehmen. ENDE B: Die Wahrheit ans Licht.';
  showDialog('Fall abgeschlossen',choice==='restore'?restore:expose,[{label:'Neues Spiel',action:reset}]);
}
function reset(){state=initialState();displayPlayer={...state.player};movementAnimation=null;heldKeys.clear();landscapeState=initialLandscape();localStorage.removeItem(landscapeKey);save();closeDialog();}
const directions = {arrowup:[0,-1],w:[0,-1],arrowdown:[0,1],s:[0,1],arrowleft:[-1,0],a:[-1,0],arrowright:[1,0],d:[1,0]};
const heldKeys = new Map();
function handleMove(dx,dy){
  facing = dx < 0 ? 'left' : dx > 0 ? 'right' : dy < 0 ? 'up' : 'down';
  if (!dialog.classList.contains('hidden') || movementAnimation) return;
  const next = move(state,dx,dy);
  if(next === state) return;
  const from = {...state.player}; state = next;
  const viewport=canvas.getBoundingClientRect();
  const duration=movementDuration(from,next.player,viewport,from.x<9?'hall':'gallery');
  movementAnimation = {from, to: {...next.player}, start: performance.now(), duration};
  save();
}
function animate(now){
  animationTime = now;
  if(movementAnimation){
    const t = Math.min(1, (now - movementAnimation.start) / movementAnimation.duration);
    displayPlayer = {x: movementAnimation.from.x + (movementAnimation.to.x - movementAnimation.from.x)*t,
      y: movementAnimation.from.y + (movementAnimation.to.y - movementAnimation.from.y)*t};
    if(t >= 1) movementAnimation = null;
    draw();
  }
  if(!movementAnimation && heldKeys.size && dialog.classList.contains('hidden')){
    const direction = [...heldKeys.values()].at(-1); handleMove(...direction);
  }
  draw(); // Animate NPCs even while the player is idle.
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
document.addEventListener('keydown',event=>{
  if (!dialog.classList.contains('hidden')) { if (event.key === 'Escape') closeDialog(); return; }
  const key=event.key.toLowerCase();
  if(directions[key]){ event.preventDefault(); heldKeys.set(key,directions[key]); }
  else if((key==='e'||key==='enter') && !event.repeat){event.preventDefault();handleInteract();}
});
document.addEventListener('keyup',event=>heldKeys.delete(event.key.toLowerCase()));
window.addEventListener('blur',()=>heldKeys.clear());
document.addEventListener('visibilitychange',()=>{if(document.hidden) heldKeys.clear();});
document.querySelectorAll('[data-move]').forEach(button=>button.addEventListener('click',()=>{const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};handleMove(...d[button.dataset.move]);}));
document.querySelector('#touch-interact').addEventListener('click',handleInteract);
document.querySelector('#journal-toggle').addEventListener('click', event=>{const sidebar=document.querySelector('#sidebar');sidebar.hidden=!sidebar.hidden;event.currentTarget.setAttribute('aria-expanded',String(!sidebar.hidden));});
document.querySelector('#reset').addEventListener('click',()=>showDialog('Neues Spiel?','Der bisherige Fortschritt dieses Falls wird zurückgesetzt.',[{label:'Zurücksetzen',action:reset},{label:'Abbrechen',action:closeDialog,secondary:true}]));
save();
