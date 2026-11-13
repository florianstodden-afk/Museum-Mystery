// The office has its own floor and shares the existing story examination actions.
export const SECURITY_OBJECTS = [
  {id:'office-roster',x:2,y:1,label:'Shift schedule',story:{examine:'shift-schedule'}},
  {id:'office-monitors',x:4,y:1,label:'Camera overview',story:{examine:'monitor-wall'}},
  {id:'office-radio',x:6,y:1,label:'Walkie-talkie',story:{examine:'radio'}},
  {id:'office-keys',x:7,y:1,label:'Key cabinet',story:{examine:'key-cabinet'}},
];
export const OFFICE_START = {x:4.5,y:8.8};
export const GALLERY_RETURN = {x:16.35,y:14};
export function officePosition(x,y){return {x:100+(x-1)*100,y:330+(y-1)*20};}
export function canEnterOffice(x,y){
  return x>=1 && x<=8 && y>=2 && y<=10 && !SECURITY_OBJECTS.some(o=>o.x===x&&o.y===y);
}
export function officePortal(state,from,to){
  if(state.room==='security'){
    if(to.y>from.y && to.y>=9.7 && to.x>=4 && to.x<=5)
      return {room:'museum',player:{...GALLERY_RETURN}};
  } else if(from.x>=9 && from.x<18 && to.x>from.x && to.x>=16.9 && to.y>=12.5 && to.y<=15.5){
    return {room:'security',player:{...OFFICE_START}};
  }
  return null;
}

// Images correspond to actual museum areas; the other channels show no signal.
export function createSecurityRenderer(){
  const image = src=>{const i=new Image();i.src=src;return i;};
  const background=image('./assets/security-office.png');
  const hall=image('./assets/great-hall-gallery-door.png');
  const gallery=image('./assets/gallery-security-door.png');
  function screen(ctx, x,y,w,h,source,crop,label, time){
    ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
    ctx.fillStyle='#0b151b';ctx.fillRect(x,y,w,h);
    if(source?.complete && source.naturalWidth){
      ctx.globalAlpha=.8;ctx.drawImage(source,crop[0]*source.naturalWidth,crop[1]*source.naturalHeight,crop[2]*source.naturalWidth,crop[3]*source.naturalHeight,x,y,w,h);ctx.globalAlpha=1;
      ctx.fillStyle='rgba(27,80,104,.24)';ctx.fillRect(x,y,w,h);
    } else {ctx.fillStyle='#78949a';ctx.font='8px monospace';ctx.fillText('NO SIGNAL',x+5,y+h/2);}
    ctx.fillStyle='rgba(0,0,0,.3)';for(let sy=y+1;sy<y+h;sy+=4)ctx.fillRect(x,sy,w,1);
    ctx.fillStyle='#e5f3ec';ctx.font='bold 7px monospace';ctx.fillText(label,x+3,y+9);
    if(source){ctx.fillStyle=Math.floor(time/900)%2?'#fb5454':'#8e3030';ctx.beginPath();ctx.arc(x+w-6,y+6,2,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
  return function drawOffice(ctx,{time,player,target,facing,moving,drawPerson}){
    ctx.fillStyle='#091317';ctx.fillRect(0,0,896,576);
    if(!background.complete||!background.naturalWidth){ctx.fillStyle='#eee0bc';ctx.font='18px Georgia';ctx.fillText('Opening the security room…',310,280);return;}
    ctx.drawImage(background,16,0,864,576);
    const channels=[
      [hall,[.14,.2,.73,.6],'01 HALL'],
      [gallery,[0,0,1,1],'02 GALLERY'],
      [gallery,[.82,.25,.16,.45],'03 VAULT'],
      [null,[], '04'],[null,[],'05'],[null,[],'06'],
      [null,[],'07'],[null,[],'08'],[null,[],'09'],
    ];
    for(let i=0;i<9;i++){
      const [source,crop,label]=channels[i];
      screen(ctx,298+(i%3)*104,30+Math.floor(i/3)*63,90,50,source,crop,label,time);
    }
    const p=officePosition(player.x,player.y);
    drawPerson(p.x,p.y,'rick',facing,time,moving);
    if(target){
      const message=`E · ${target.label}`;ctx.font='bold 13px sans-serif';const width=ctx.measureText(message).width+22;
      const x=Math.max(25,Math.min(871-width,p.x-width/2)),y=Math.max(200,p.y-92);
      ctx.fillStyle='#101c22ee';ctx.strokeStyle='#cba868';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(x,y,width,28,5);ctx.fill();ctx.stroke();ctx.fillStyle='#f4dfae';ctx.fillText(message,x+11,y+19);
    }
    ctx.fillStyle='#f4dfae';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText('EXIT TO GALLERY',448,555);ctx.textAlign='left';
  };
}
