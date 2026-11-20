// A small brass museum plaque under a station painting (gallery and hall share it).
// Thin gold rim, dark enamel, spaced serif capitals; no numbers or letters of the code word.
export const PLAQUE_HEIGHT = 12;

export function drawWallPlaque(ctx, centerX, top, text, { active = false } = {}) {
  ctx.save();
  ctx.font = '600 8px Georgia, "Times New Roman", serif';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '1.4px';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Test canvases may lack text metrics or gradients; fall back to plain values.
  const width = Math.ceil(ctx.measureText?.(text)?.width ?? text.length * 7) + 16;
  const left = Math.round(centerX - width / 2) + 0.5;
  const y = Math.round(top) + 0.5;
  const plate = ctx.createLinearGradient?.(0, y, 0, y + PLAQUE_HEIGHT) ?? '#18262b';
  plate.addColorStop?.(0, '#1f3036');
  plate.addColorStop?.(1, '#121e23');
  ctx.shadowColor = 'rgba(0,0,0,.45)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = plate;
  roundRect(ctx, left, y, width, PLAQUE_HEIGHT, 2);
  ctx.fill?.();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 1;
  ctx.strokeStyle = active ? '#ffe5a0' : '#b8955a';
  roundRect(ctx, left, y, width, PLAQUE_HEIGHT, 2);
  ctx.stroke?.();
  ctx.fillStyle = active ? '#fff1c9' : '#e8d3a0';
  ctx.fillText(text, centerX, y + PLAQUE_HEIGHT / 2 + 0.5);
  ctx.restore();
  return width;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath?.();
  if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); return; }
  ctx.rect?.(x, y, w, h);
}
