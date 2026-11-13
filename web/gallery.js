import { GALLERY_CAMERAS, GALLERY_OBSTACLES, galleryPosition, cameraLightOn } from './gallery-layout.js';

// Keep the approved concept as the actual room background, not an approximation.
export function createGalleryRenderer() {
  const artwork = new Image(); artwork.src = './assets/gallery-nocturne-nyc.png';
  const box=(ctx,x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
  return function drawGallery(ctx, { time, state, player, objects, target, facing, moving, drawPerson, vaultNearby, reducedMotion }) {
    box(ctx,0,0,896,576,'#061218');
    if(artwork.complete&&artwork.naturalWidth)ctx.drawImage(artwork,16,0,864,576);
    else {ctx.fillStyle='#ead3a4';ctx.font='18px Georgia';ctx.fillText('Opening the gallery…',350,288);return;}
    // Cover the baked-in red diode before drawing its live on/off state.
    for(const camera of GALLERY_CAMERAS){
      box(ctx,camera.x-3,camera.y-3,6,6,'#1c1117');
      const on=reducedMotion||cameraLightOn(time,camera.phase);
      ctx.save();ctx.fillStyle=on?'#ff4141':'#591d25';ctx.shadowColor='#ff2626';ctx.shadowBlur=on?8:0;
      ctx.beginPath();ctx.arc(camera.x,camera.y,1.8,0,Math.PI*2);ctx.fill();ctx.restore();
    }
    // Tiny labels sit below the actual picture frames. The art remains unobstructed.
    for(const [id,x] of [['painting',448],['frames',676]]){
      const active=target?.id===id;ctx.fillStyle=active?'#ffe5a0':'#bd985c';
      ctx.fillRect(x-13,199,26,5);
      if(active){ctx.beginPath();ctx.moveTo(x,207);ctx.lineTo(x+4,211);ctx.lineTo(x,215);ctx.lineTo(x-4,211);ctx.fill();}
    }
    if(state.doorOpen){
      ctx.save();ctx.fillStyle='#07141bde';ctx.beginPath();ctx.moveTo(778,251);ctx.lineTo(819,272);ctx.lineTo(819,352);ctx.lineTo(778,322);ctx.closePath();ctx.fill();
      ctx.fillStyle='#c4db9a';ctx.beginPath();ctx.arc(772,305,2,0,Math.PI*2);ctx.fill();ctx.restore();
    }
    const items=[...objects.filter(o=>o.x>9&&o.x<18&&!['painting','frames'].includes(o.id)),{...player,id:'player'}].sort((a,b)=>a.y-b.y);
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
    ctx.restore();
    if(target||vaultNearby){const p=galleryPosition(player.x,player.y);const text=`E · ${target?.label??(state.doorOpen?'Vault door (open)':'Unlock vault')}`;
      ctx.font='12px sans-serif';const width=Math.min(800,ctx.measureText(text).width+26),x=Math.max(48,Math.min(846-width,p.x-width/2)),y=Math.max(215,p.y-88);
      ctx.fillStyle='#101c22ed';ctx.strokeStyle='#cba868';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(x,y,width,29,5);ctx.fill();ctx.stroke();ctx.fillStyle='#f4dfae';ctx.fillText(text,x+13,y+19);
    }
  };
}
