import { drawCameraLights } from './camera-lights.js';
import { foliageOpacity } from './plant-mask.js?v=1';
import { GALLERY_CAMERAS, GALLERY_OBSTACLES, galleryPosition } from './gallery-layout.js';

// Keep the approved concept as the actual room background, not an approximation.
export function createGalleryRenderer() {
  const artwork = new Image(); artwork.src = './assets/gallery-nocturne-nyc.jpg';
  const openVault = new Image(); openVault.src = './assets/gallery-vault-open.jpg';
  const vaultInterior = new Image(); vaultInterior.src = './assets/treasure-vault.jpg';
  const plantMasks = new WeakMap();
  const maskFor=(image,plant)=>{
    let masks=plantMasks.get(image);
    if(!masks){masks=new Map();plantMasks.set(image,masks);}
    const key=`${plant.left},${plant.top}`;
    if(masks.has(key))return masks.get(key);
    const canvas=document.createElement('canvas');
    canvas.width=Math.ceil((plant.right-plant.left)/.5625);
    canvas.height=Math.ceil((plant.bottom-plant.top)/.5625);
    const mask=canvas.getContext('2d',{willReadFrequently:true});
    mask.drawImage(image,(plant.left-16)/.5625,plant.top/.5625,(plant.right-plant.left)/.5625,(plant.bottom-plant.top)/.5625,0,0,canvas.width,canvas.height);
    const pixels=mask.getImageData(0,0,canvas.width,canvas.height);
    for(let i=0;i<pixels.data.length;i+=4)pixels.data[i+3]=foliageOpacity(pixels.data[i],pixels.data[i+1],pixels.data[i+2]);
    mask.putImageData(pixels,0,0);
    masks.set(key,canvas);
    return canvas;
  };
  const box=(ctx,x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
  return function drawGallery(ctx, { time, state, player, objects, target, facing, moving, drawPerson, vaultNearby, reducedMotion, doorProgress = state.doorOpen ? 1 : 0 }) {
    box(ctx,0,0,896,576,'#061218');
    if(artwork.complete&&artwork.naturalWidth)ctx.drawImage(artwork,16,0,864,576);
    else {ctx.fillStyle='#ead3a4';ctx.font='18px Georgia';ctx.fillText('Opening the gallery…',350,288);return;}
    // The opened doorway contains a view of the same room the player enters.
    if(state.doorOpen && openVault.complete && openVault.naturalWidth){
      const progress=Math.min(1,Math.max(0,doorProgress));
      ctx.save();ctx.globalAlpha=progress;ctx.drawImage(openVault,16,0,864,576);ctx.restore();
      if(vaultInterior.complete && vaultInterior.naturalWidth){
        ctx.save();ctx.globalAlpha=progress;ctx.beginPath();ctx.moveTo(782,205);ctx.quadraticCurveTo(791,191,802,199);ctx.lineTo(820,210);ctx.lineTo(827,222);ctx.lineTo(827,352);ctx.lineTo(782,320);ctx.closePath();ctx.clip();
        ctx.drawImage(vaultInterior,430,80,700,710,782,197,45,159);ctx.restore();
      }
      // Move the closed door face toward its swung-open position while the reveal develops.
      if(progress<1){
        ctx.save();ctx.globalAlpha=1-progress;ctx.translate(-58*progress,0);ctx.beginPath();ctx.moveTo(773,198);ctx.quadraticCurveTo(780,188,790,194);ctx.lineTo(819,210);ctx.lineTo(819,356);ctx.lineTo(773,325);ctx.closePath();ctx.clip();ctx.drawImage(artwork,16,0,864,576);ctx.restore();
      }
    }
    drawCameraLights(ctx,GALLERY_CAMERAS,time,reducedMotion);
    // Tiny labels sit below the actual picture frames. The art remains unobstructed.
    for(const [id,x] of [['note',296],['painting',448],['frames',676]]){
      const active=target?.id===id;ctx.fillStyle=active?'#ffe5a0':'#bd985c';
      ctx.fillRect(x-13,199,26,5);
      if(active){ctx.beginPath();ctx.moveTo(x,207);ctx.lineTo(x+4,211);ctx.lineTo(x,215);ctx.lineTo(x-4,211);ctx.fill();}
      if(id==='note' || id==='frames'){
        ctx.fillStyle='#182a32';ctx.fillRect(x-38,177,id==='frames' ? 88 : 76,19);
        ctx.fillStyle='#f3dca4';ctx.font='bold 11px sans-serif';ctx.fillText(id==='note' ? 'L · PUZZLE' : 'D · FORGERY',x-31,190);
      }
    }
    const items=[...objects.filter(o=>o.x>9&&o.x<18&&!['note','painting','frames'].includes(o.id)),{...player,id:'player'}].sort((a,b)=>a.y-b.y);
    ctx.save();ctx.beginPath();ctx.rect(20,150,856,400);ctx.clip();
    for(const item of items){const p=galleryPosition(item.x,item.y);
      if(item.id==='player'){drawPerson(p.x,p.y,'rick',facing,time,moving);continue;}
      if(item.id==='restorer'){drawPerson(p.x,p.y,'restorer','down',time,false);continue;}
      ctx.fillStyle='#080d1455';ctx.beginPath();ctx.ellipse(p.x,p.y+4,31,8,0,0,Math.PI*2);ctx.fill();
      box(ctx,p.x-25,p.y-9,4,14,'#a18452');box(ctx,p.x+21,p.y-9,4,14,'#a18452');
      box(ctx,p.x-28,p.y-21,56,18,'#4a3225');box(ctx,p.x-30,p.y-24,60,5,'#bb995e');box(ctx,p.x-28,p.y-23,56,1,'#e0bc79');
      if(item.id==='monitors'){
        box(ctx,p.x-26,p.y-44,52,27,'#101d23');
        for(let i=0;i<3;i++){box(ctx,p.x-23+i*17,p.y-41,13,21,['#527c79','#79948a','#436d76'][i]);box(ctx,p.x-22+i*17,p.y-34,11,1,'#c9d4b877');}
      }else{box(ctx,p.x-13,p.y-31,26,13,'#ead9ae');for(let i=0;i<3;i++)box(ctx,p.x-9,p.y-28+i*3,17,1,'#85734e');}
    }
    // Redraw the bench foreground only when a character is behind it.
    for(const b of GALLERY_OBSTACLES.slice(0,2)){
      if(items.some(o=>{const p=galleryPosition(o.x,o.y);return p.y<b.top&&Math.abs(p.x-(b.left+b.right)/2)<85;})){
        ctx.drawImage(artwork,(b.left-16)/.5625,b.top/.5625,(b.right-b.left)/.5625,(b.bottom-b.top)/.5625,b.left,b.top,b.right-b.left,b.bottom-b.top);
      }
    }
    // Redraw only leaf-colored pixels, leaving the floor between leaves transparent.
    const plants=[
      {left:133,top:185,right:193,bottom:277},
      {left:36,top:420,right:110,bottom:520},
      {left:787,top:420,right:860,bottom:520},
    ];
    const backdrop=state.doorOpen && openVault.complete && openVault.naturalWidth ? openVault : artwork;
    for(const plant of plants){
      const behind=items.some(item=>{const p=galleryPosition(item.x,item.y);return p.y<plant.bottom && p.y>plant.top && p.x+16>plant.left && p.x-16<plant.right;});
      if(behind)ctx.drawImage(maskFor(backdrop,plant),plant.left,plant.top,plant.right-plant.left,plant.bottom-plant.top);
    }
    ctx.restore();
    if(target||(vaultNearby&&!state.doorOpen)){const p=galleryPosition(player.x,player.y);const text=`E · ${vaultNearby&&!state.doorOpen?'Enter vault code':target.label}`;
      ctx.font='12px sans-serif';const width=Math.min(800,ctx.measureText(text).width+26),x=Math.max(48,Math.min(846-width,p.x-width/2)),y=Math.max(215,p.y-88);
      ctx.fillStyle='#101c22ed';ctx.strokeStyle='#cba868';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(x,y,width,29,5);ctx.fill();ctx.stroke();ctx.fillStyle='#f4dfae';ctx.fillText(text,x+13,y+19);
    }
  };
}
