// The safe: a code-word field with feedback. The host passes the state and gets the word back.
// renderSafe(container, { state, message }, onTry)  – onTry(word) is called on submit.
import { CASE, CODEWORD } from './case-1.js';
import { el } from './dom.js';

export function safeModel(state) {
  const proofs = CASE.stations.filter(station => state.stations[station.id].solved).length;
  return {
    open: state.safe.open,
    proofs,
    needed: CASE.stations.length,
    ready: proofs === CASE.stations.length && !state.safe.open,
    attempts: state.safe.attempts,
  };
}

export function renderSafe(container, { state, message = '', playSound = () => {} }, onTry) {
  const model = safeModel(state);
  let input = null;
  const feedback = el('p', { className: 'story-feedback', text: message, attrs: { 'aria-live': 'polite' } });
  const parts = [
    el('p', { className: 'story-eyebrow', text: 'THE SAFE' }),
    el('p', { className: 'story-status', text: `Station proofs: ${model.proofs} / ${model.needed}` }),
  ];

  if (model.open) {
    parts.push(el('p', { className: 'story-text', text: 'The safe stands open. The original painting and a folder of documents are inside.' }));
  } else {
    if (!model.ready) parts.push(el('p', { className: 'story-text', text: 'Collect proof from all four stations before the code can unlock the door.' }));
    let degrees = 0;
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const increment = 360 / alphabet.length;
    const currentLetter = () => alphabet[((Math.round(-degrees / increment) % 26) + 26) % 26];
    input = el('input', {attrs: {id:'story-safe-word', name:'word', type:'hidden'}});
    const slots=el('div',{className:'vault-code-slots',attrs:{'aria-label':'Entered code','aria-live':'polite'}});
    function showSlots(){
      slots.replaceChildren(...Array.from({length:4},(_,i)=>el('span',{className:'vault-code-slot',text:input.value[i] || '·'})));
    }
    showSlots();
    const ring = el('div', {className:'vault-wheel-ring', attrs:{tabindex:'0',role:'slider','aria-label':'Alphabet wheel','aria-valuemin':'1','aria-valuemax':'26','aria-valuenow':'1','aria-valuetext':'A'}});
    for(let i=0;i<alphabet.length;i++){
      const letter=el('span',{className:'vault-wheel-letter',text:alphabet[i]});
      letter.style.setProperty('--letter-angle',`${i * increment}deg`);
      ring.append(letter);
    }
    const select = el('button',{className:'vault-wheel-hub',text:'A',attrs:{type:'button','aria-label':'Select letter A'}});
    const dial=el('div',{className:'vault-wheel'},[ring,select]);
    let lastNotch = 0;
    // While dragging, the ring follows the pointer directly (no transition, at most one update per frame).
    let frame=0;
    function scheduleUpdate(){
      if(frame)return;
      frame=(globalThis.requestAnimationFrame ?? (fn=>setTimeout(fn,16)))(()=>{frame=0;update();});
    }
    function update(){
      const notch=Math.round(-degrees/increment);
      if(notch!==lastNotch){playSound('vault-tick');lastNotch=notch;}
      ring.style.transform=`rotate(${degrees}deg)`;
      const letter=currentLetter();
      select.textContent=letter;select.setAttribute('aria-label',`Select letter ${letter}`);
      ring.setAttribute('aria-valuenow',String(alphabet.indexOf(letter)+1));ring.setAttribute('aria-valuetext',letter);
    }
    let previousAngle=null, pointerId=null;
    function angle(event){
      const rect=dial.getBoundingClientRect();
      return Math.atan2(event.clientY-(rect.top+rect.height/2),event.clientX-(rect.left+rect.width/2))*180/Math.PI;
    }
    dial.addEventListener('pointerdown',event=>{
      if(event.target===select || (event.button!==undefined && event.button!==0))return;
      event.preventDefault();previousAngle=angle(event);pointerId=event.pointerId;
      dial.setPointerCapture?.(pointerId);
      ring.classList.add('is-dragging');
    });
    dial.addEventListener('pointermove',event=>{
      if(pointerId!==event.pointerId || previousAngle===null)return;
      const next=angle(event);let delta=next-previousAngle;
      if(delta>180)delta-=360;if(delta< -180)delta+=360;
      degrees+=delta;previousAngle=next;scheduleUpdate();
    });
    function finish(event){
      if(pointerId!==event.pointerId)return;
      previousAngle=null;pointerId=null;ring.classList.remove('is-dragging');
      degrees=Math.round(degrees/increment)*increment;update();   // snaps to the nearest letter with the CSS transition
    }
    dial.addEventListener('pointerup',finish);dial.addEventListener('pointercancel',finish);
    dial.addEventListener('keydown',event=>{
      if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
        event.preventDefault();event.stopPropagation?.();degrees+=(event.key==='ArrowLeft'?increment:-increment);update();
      }
    });
    select.addEventListener('click',()=>{if(input.value.length<4){const letter=currentLetter();playSound(letter===CODEWORD[input.value.length]?'vault-correct':'vault-set');input.value+=letter;showSlots();}});
    const erase=el('button',{className:'story-button',text:'Remove last letter',attrs:{type:'button'}});
    erase.addEventListener('click',()=>{input.value=input.value.slice(0,-1);showSlots();});
    const wheel=el('div',{className:'vault-wheel-wrap'},[
      el('div',{className:'vault-wheel-pointer',attrs:{'aria-hidden':'true'}}),dial,
    ]);
    const form = el('form', {className:'story-form vault-code-form'}, [input,slots,erase,
      el('button',{className:'story-button',text:'Try the lock',attrs:{type:'submit'}}),
    ]);
    form.addEventListener('submit', event=>{event.preventDefault();onTry(input.value);});
    parts.push(el('p',{className:'story-text',text:'Drag the wheel to a letter, then press the centre. Repeat for all four letters.'}),wheel,form);
  }

  parts.push(feedback);
  container.replaceChildren(el('section', { className: 'story-safe' }, parts));

}
