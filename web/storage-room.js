// The storage room behind the vault door, drawn in code in the pixel style of the other rooms.
// The rules do not change: the walkable map tiles are still x 19–26, y 1–16 (see engine.js).
// This file only turns those tiles into a perspective view, like gallery-layout.js does for the gallery.

// Map tiles → canvas pixels (canvas is 896 × 576).
export const STORAGE = { firstX: 19, lastX: 26, firstY: 1, lastY: 16, stepX: 84, stepY: 20 };

export function storagePosition(x, y) {
  return { x: 154 + (x - STORAGE.firstX) * STORAGE.stepX, y: 236 + (y - STORAGE.firstY) * STORAGE.stepY };
}

// The floor is a trapezoid: narrow at the back wall, wide at the front.
export const STORAGE_FLOOR = { backY: 214, frontY: 560, backLeft: 120, backRight: 776, frontLeft: 24, frontRight: 872 };

export function storageFloorContains(px, py) {
  const f = STORAGE_FLOOR;
  if (py < f.backY || py > f.frontY) return false;
  const t = (py - f.backY) / (f.frontY - f.backY);
  const left = f.backLeft + (f.frontLeft - f.backLeft) * t;
  const right = f.backRight + (f.frontRight - f.backRight) * t;
  return px >= left && px <= right;
}

// Where the doorway to the gallery sits on the left wall (map tile 18, 9).
export const STORAGE_DOOR = storagePosition(18, 9);

export function createStorageRenderer() {
  const painting = new Image();
  painting.src = './assets/met-436535.jpg'; // Wheat Field with Cypresses, bundled Met copy

  const box = (ctx, x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const shape = (ctx, points, color) => {
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
    for (const [x, y] of points.slice(1)) ctx.lineTo(x, y);
    ctx.closePath(); ctx.fill();
  };

  function drawWalls(ctx) {
    const f = STORAGE_FLOOR;
    box(ctx, 0, 0, 896, 576, '#0d1418');
    // Back wall: dark stone blocks with mortar lines.
    box(ctx, f.backLeft, 26, f.backRight - f.backLeft, f.backY - 26, '#2a3740');
    for (let row = 0; row * 22 + 26 < f.backY; row++) {
      const y = 26 + row * 22;
      box(ctx, f.backLeft, y, f.backRight - f.backLeft, 1, '#1d272e');
      for (let x = f.backLeft + (row % 2) * 24; x < f.backRight; x += 48) box(ctx, x, y, 1, 22, '#1d272e');
    }
    box(ctx, f.backLeft, f.backY - 8, f.backRight - f.backLeft, 8, '#3a2a1e'); // wooden skirting
    box(ctx, f.backLeft, f.backY - 9, f.backRight - f.backLeft, 1, '#b8965c');
    // Ceiling band and side walls.
    shape(ctx, [[0, 0], [896, 0], [f.backRight, 26], [f.backLeft, 26]], '#141c21');
    shape(ctx, [[0, 0], [f.backLeft, 26], [f.backLeft, f.backY], [f.frontLeft, f.frontY], [0, 576]], '#1f2a31');
    shape(ctx, [[896, 0], [f.backRight, 26], [f.backRight, f.backY], [f.frontRight, f.frontY], [896, 576]], '#1f2a31');
    // Floor: concrete slabs with perspective lines.
    shape(ctx, [[f.backLeft, f.backY], [f.backRight, f.backY], [f.frontRight, f.frontY], [f.frontLeft, f.frontY]], '#3b474c');
    ctx.strokeStyle = '#2c363a'; ctx.lineWidth = 1;
    for (let i = 1; i < 8; i++) {
      const t = i / 8;
      ctx.beginPath();
      ctx.moveTo(f.backLeft + (f.backRight - f.backLeft) * t, f.backY);
      ctx.lineTo(f.frontLeft + (f.frontRight - f.frontLeft) * t, f.frontY);
      ctx.stroke();
    }
    for (let i = 1; i < 7; i++) {
      const y = f.backY + (f.frontY - f.backY) * (i / 7) ** 1.3;
      const t = (y - f.backY) / (f.frontY - f.backY);
      ctx.beginPath();
      ctx.moveTo(f.backLeft + (f.frontLeft - f.backLeft) * t, y);
      ctx.lineTo(f.backRight + (f.frontRight - f.backRight) * t, y);
      ctx.stroke();
    }
    box(ctx, 0, f.frontY, 896, 576 - f.frontY, '#141c21');
  }

  // Storage racks with crates and wrapped canvases on the back wall.
  function drawRack(ctx, left, right) {
    const top = 64, bottom = 206;
    box(ctx, left, top, 4, bottom - top, '#6b737a');
    box(ctx, right - 4, top, 4, bottom - top, '#6b737a');
    for (const y of [104, 150, 196]) box(ctx, left, y, right - left, 4, '#7c858c');
    const crates = [['#6b4d33', 30, 34], ['#c9b48a', 20, 40], ['#5c4330', 36, 30], ['#d8c8a2', 16, 38], ['#6b4d33', 28, 26]];
    for (const [shelfIndex, shelfY] of [104, 150, 196].entries()) {
      let x = left + 8;
      for (let i = 0; x < right - 30; i++) {
        const [color, w, h] = crates[(i + shelfIndex * 2) % crates.length];
        box(ctx, x, shelfY - h, w, h, color);
        box(ctx, x, shelfY - h, w, 2, '#00000033');
        if (color === '#c9b48a' || color === '#d8c8a2') box(ctx, x + w / 2 - 1, shelfY - h, 2, h, '#8a7a5a'); // string on wrapped canvas
        else box(ctx, x + 4, shelfY - h + 6, w - 8, 5, '#e7dcc5'); // label
        x += w + 6;
      }
    }
  }

  // The big round safe in the back wall – open, because you can only stand here once it is open.
  function drawSafe(ctx, time) {
    const cx = 448, cy = 118;
    box(ctx, cx - 86, cy - 84, 172, 172, '#3d474e');
    box(ctx, cx - 82, cy - 80, 164, 164, '#232b30');
    ctx.fillStyle = '#0a0f12'; ctx.beginPath(); ctx.arc(cx, cy, 66, 0, Math.PI * 2); ctx.fill();
    // Inside: an empty slot where the painting was, and the folder of documents.
    box(ctx, cx - 40, cy - 30, 80, 56, '#151d22');
    box(ctx, cx - 22, cy + 8, 44, 8, '#c9b48a');
    box(ctx, cx - 22, cy + 8, 44, 1, '#e7dcc5');
    // The swung-open door, seen from the side.
    shape(ctx, [[cx + 66, cy - 66], [cx + 96, cy - 58], [cx + 96, cy + 58], [cx + 66, cy + 66]], '#7c858c');
    box(ctx, cx + 84, cy - 10, 6, 20, '#b8965c');
    // Brass bolts around the opening, softly glinting.
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const glint = 0.5 + 0.5 * Math.sin(time / 900 + i);
      ctx.fillStyle = glint > 0.85 ? '#f6dc9a' : '#b8965c';
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * 74, cy + Math.sin(a) * 74, 3, 0, Math.PI * 2); ctx.fill();
    }
  }

  // The doorway back to the gallery on the left wall, with warm light from the gallery.
  function drawDoorway(ctx) {
    const d = STORAGE_DOOR;
    shape(ctx, [[d.x - 30, d.y - 112], [d.x + 18, d.y - 98], [d.x + 18, d.y + 6], [d.x - 30, d.y + 16]], '#c4955a');
    shape(ctx, [[d.x - 24, d.y - 104], [d.x + 12, d.y - 93], [d.x + 12, d.y + 2], [d.x - 24, d.y + 10]], '#e7c58c');
    // The heavy vault door, swung open against the wall.
    shape(ctx, [[d.x + 18, d.y - 98], [d.x + 44, d.y - 112], [d.x + 44, d.y + 20], [d.x + 18, d.y + 6]], '#5d666d');
    box(ctx, d.x + 30, d.y - 50, 5, 18, '#b8965c');
  }

  function drawLights(ctx) {
    for (const x of [270, 448, 626]) {
      box(ctx, x - 14, 26, 28, 6, '#3a4248');
      box(ctx, x - 8, 32, 16, 4, '#ffe2a0');
    }
    // A warm pool of light on the painting, the rest stays dark.
    const easel = storagePosition(23, 5);
    const glow = ctx.createRadialGradient(easel.x, easel.y - 40, 10, easel.x, easel.y - 20, 220);
    glow.addColorStop(0, 'rgba(255, 220, 150, 0.32)');
    glow.addColorStop(1, 'rgba(255, 220, 150, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 896, 576);
    const shade = ctx.createRadialGradient(448, 330, 220, 448, 330, 620);
    shade.addColorStop(0, 'rgba(0, 0, 0, 0)');
    shade.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, 896, 576);
  }

  // The original painting on an easel (map object "vault").
  function drawEasel(ctx, p) {
    ctx.fillStyle = '#08101455'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 4, 36, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#6b4d33'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(p.x - 22, p.y); ctx.lineTo(p.x - 6, p.y - 92); ctx.moveTo(p.x + 22, p.y); ctx.lineTo(p.x + 6, p.y - 92);
    ctx.moveTo(p.x, p.y - 4); ctx.lineTo(p.x, p.y - 88); ctx.stroke();
    box(ctx, p.x - 40, p.y - 86, 80, 60, '#b8965c');
    if (painting.complete && painting.naturalWidth) ctx.drawImage(painting, p.x - 36, p.y - 82, 72, 52);
    else box(ctx, p.x - 36, p.y - 82, 72, 52, '#5b7a52');
    box(ctx, p.x - 44, p.y - 26, 88, 5, '#6b4d33');
  }

  return function drawStorage(ctx, { time, player, objects, target, facing, moving, drawPerson }) {
    drawWalls(ctx);
    drawRack(ctx, 132, 342);
    drawRack(ctx, 554, 764);
    drawSafe(ctx, time);
    drawDoorway(ctx);

    // Draw everything standing on the floor from back to front, so nearer things cover farther ones.
    const items = [...objects.filter(o => o.x >= STORAGE.firstX), { ...player, id: 'player' }].sort((a, b) => a.y - b.y);
    for (const item of items) {
      const p = storagePosition(item.x, item.y);
      if (item.id === 'player') drawPerson(p.x, p.y, 'rick', facing, time, moving);
      else if (item.id === 'vault') drawEasel(ctx, p);
      else if (item.id === 'curator') drawPerson(p.x, p.y, 'curator', 'down', time, false);
    }
    drawLights(ctx);

    ctx.fillStyle = '#e7c58c'; ctx.font = '600 13px Georgia, serif';
    ctx.fillText('STORAGE', 410, 18);

    if (target) {
      const p = storagePosition(player.x, player.y);
      const text = `E · ${target.label}`;
      ctx.font = '12px sans-serif';
      const width = ctx.measureText(text).width + 26;
      const x = Math.max(48, Math.min(846 - width, p.x - width / 2));
      const y = Math.max(215, p.y - 96);
      ctx.fillStyle = '#101c22ed'; ctx.strokeStyle = '#cba868'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(x, y, width, 29, 5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f4dfae'; ctx.fillText(text, x + 13, y + 19);
    }
  };
}
