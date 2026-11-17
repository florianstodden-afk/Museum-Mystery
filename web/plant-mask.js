// The gallery foliage is green/yellow; its floor and gold pots are much redder.
// A soft edge retains the fine leaves without painting floor over a character.
export function foliageOpacity(r,g,b){
  const amount=Math.min((g-r*.78-2)/12,(g-b*1.1-2)/12);
  return Math.round(255*Math.max(0,Math.min(1,amount)));
}
