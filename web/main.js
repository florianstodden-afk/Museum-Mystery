import { WIDTH, HEIGHT, OBJECTS, initialState, validState, hasAllEvidence,
  move, nearbyObject, interact, openVault, chooseEnding } from './engine.js';
import { start as startLandscape, initialLandscape } from './minigames/landscape.js';

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
let metArtwork = null;
const wallArtwork = new Image();
let artworkReady = false;
wallArtwork.onload = () => { artworkReady = true; draw(); };
let displayPlayer = { ...state.player };
let movementAnimation = null;
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
function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
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
    if(object.id==='guard'||object.id==='restorer'){
      rect(x+8,y+5,16,22,object.id==='guard'?'#294d68':'#694f71');rect(x+10,y+2,12,10,'#e3b88b');rect(x+8,y+26,6,5,'#26343c');rect(x+18,y+26,6,5,'#26343c');
    }else if(object.id==='painting'){rect(x+3,y+3,26,26,'#d2a350');rect(x+6,y+6,20,20,'#648e86');rect(x+15,y+8,3,18,'#294e44');}
    else if(object.id==='vault'){rect(x+3,y+3,26,27,'#bb8e46');rect(x+6,y+6,20,21,'#547b7a');rect(x+14,y+9,3,16,'#2e5245');}
    else {rect(x+4,y+7,24,18,'#73543d');rect(x+8,y+3,16,16,'#e6d5a9');rect(x+10,y+7,12,2,'#947d5b');}
    if(Math.abs(object.x-state.player.x)+Math.abs(object.y-state.player.y)===1){ctx.strokeStyle='#ffda79';ctx.lineWidth=3;ctx.strokeRect(x+1,y+1,30,30);}
  }
  const p=state.player;const px=displayPlayer.x*TILE,py=displayPlayer.y*TILE;
  // Blue spiky hair, pale face and white coat: Rick-inspired pixel character.
  rect(px+7,py+12,18,15,'#eee9dc');rect(px+14,py+13,4,13,'#9fcbd2');
  rect(px+10,py+4,12,10,'#ead0b7');rect(px+8,py+2,16,5,'#8bd6e6');
  for(const [hx,hy] of [[7,3],[10,0],[14,-2],[18,0],[22,3]]) rect(px+hx,py+hy,4,6,'#8bd6e6');
  rect(px+10,py+8,3,2,'#33424a');rect(px+18,py+8,3,2,'#33424a');
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
const MOVE_MS = 150;
function handleMove(dx,dy){
  if (!dialog.classList.contains('hidden') || movementAnimation) return;
  const next = move(state,dx,dy);
  if(next === state) return;
  const from = {...state.player}; state = next;
  movementAnimation = {from, to: {...next.player}, start: performance.now()};
  save();
}
function animate(now){
  if(movementAnimation){
    const t = Math.min(1, (now - movementAnimation.start) / MOVE_MS);
    displayPlayer = {x: movementAnimation.from.x + (movementAnimation.to.x - movementAnimation.from.x)*t,
      y: movementAnimation.from.y + (movementAnimation.to.y - movementAnimation.from.y)*t};
    if(t >= 1) movementAnimation = null;
    draw();
  }
  if(!movementAnimation && heldKeys.size && dialog.classList.contains('hidden')){
    const direction = [...heldKeys.values()].at(-1); handleMove(...direction);
  }
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
document.querySelector('#reset').addEventListener('click',()=>showDialog('Neues Spiel?','Der bisherige Fortschritt dieses Falls wird zurückgesetzt.',[{label:'Zurücksetzen',action:reset},{label:'Abbrechen',action:closeDialog,secondary:true}]));
save();
