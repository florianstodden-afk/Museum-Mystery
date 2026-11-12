// The Security Office: a story room drawn on a canvas.
// drawSecurityOffice(ctx, { width, height, time, feeds, background })
//
// - width/height: canvas size in pixels (16:9 looks best, e.g. 1672 × 941).
// - time: milliseconds (e.g. from requestAnimationFrame). Drives flicker and the clock.
// - feeds: up to 9 functions, one per screen (left→right, top→bottom). Each is called as
//   feed(ctx, { x, y, w, h, time }) and may draw only inside that rectangle.
//   A missing feed (null/undefined) shows "NO SIGNAL" with noise.
// - background: an optional loaded image (see loadSecurityOfficeBackground). If given, it is
//   drawn without distortion instead of the code-drawn room.

// All furniture positions, relative to the room size (0 = left/top, 1 = right/bottom).
// interactions.js uses the same numbers for its click areas.
export const LAYOUT = Object.freeze({
  floorTop: 0.6,
  monitorWall: { x: 0.31, y: 0.08, w: 0.38, h: 0.42 },
  desk: { x: 0.22, y: 0.55, w: 0.56, h: 0.17 },
  keyCabinet: { x: 0.04, y: 0.17, w: 0.11, h: 0.27 },
  shiftSchedule: { x: 0.17, y: 0.15, w: 0.11, h: 0.25 },
  radio: { x: 0.7, y: 0.475, w: 0.04, h: 0.075 },
  mug: { x: 0.33, y: 0.5, w: 0.03, h: 0.05 },
  lamp: { x: 0.25, y: 0.36, w: 0.06, h: 0.19 },
  window: { x: 0.73, y: 0.1, w: 0.1, h: 0.3 },
  locker: { x: 0.86, y: 0.14, w: 0.1, h: 0.56 },
});

export const SCREEN_COUNT = 9;

const COLORS = {
  wallTop: '#17222e', wallBottom: '#22303b', trim: '#8a6d3f', brass: '#c9a35e',
  floorNear: '#2a1f18', floorFar: '#3a2b20', metal: '#59636a', metalDark: '#343c42',
  screenOff: '#1a1f22', glow: '#7fb6d8', lamp: '#ffd38a', ink: '#e9dfca',
};

// Rectangles of the nine screens, in pixels.
export function monitorLayout(width, height) {
  const wall = LAYOUT.monitorWall;
  const gap = Math.max(4, width * 0.006);
  const pad = gap * 1.6;
  const innerW = wall.w * width - pad * 2;
  const innerH = wall.h * height - pad * 2;
  const screenW = (innerW - gap * 2) / 3;
  const screenH = (innerH - gap * 2) / 3;
  const screens = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      screens.push({
        index: row * 3 + col,
        x: wall.x * width + pad + col * (screenW + gap),
        y: wall.y * height + pad + row * (screenH + gap),
        w: screenW,
        h: screenH,
      });
    }
  }
  return screens;
}

// Loads web/story/security-office/security-office.png if it exists. Resolves to the image or null.
export function loadSecurityOfficeBackground(url = new URL('./security-office.png', import.meta.url).href) {
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

// A repeatable "random" number between 0 and 1 for a given seed (same seed → same number).
function noise(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// Real time is turned into frames of 1/12 second, so the screens flicker at about 12 fps.
function frameOf(time) {
  return Math.floor(time / 83);
}

function px(rect, width, height) {
  return { x: rect.x * width, y: rect.y * height, w: rect.w * width, h: rect.h * height };
}

export function drawSecurityOffice(ctx, { width, height, time = 0, feeds = [], background = null }) {
  ctx.save();
  if (background) drawBackgroundImage(ctx, background, width, height);
  else drawRoom(ctx, width, height, time);
  drawScreens(ctx, width, height, time, feeds);
  drawLighting(ctx, width, height, time);
  ctx.restore();
}

// "Cover" the canvas like CSS background-size: cover – the image is cropped, never stretched.
function drawBackgroundImage(ctx, image, width, height) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const w = image.naturalWidth * scale;
  const h = image.naturalHeight * scale;
  ctx.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
}

// ---------- The room, drawn in code ----------

function drawRoom(ctx, width, height, time) {
  const floorY = LAYOUT.floorTop * height;

  // Back wall with a subtle vertical gradient and stone panels.
  const wall = ctx.createLinearGradient(0, 0, 0, floorY);
  wall.addColorStop(0, COLORS.wallTop);
  wall.addColorStop(1, COLORS.wallBottom);
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, width, floorY);
  ctx.strokeStyle = '#ffffff0d';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += width / 14) {
    ctx.strokeRect(x + 6, height * 0.04, width / 14 - 12, floorY * 0.8);
  }
  // Wooden wainscot and brass trim.
  ctx.fillStyle = '#2b2119';
  ctx.fillRect(0, floorY - height * 0.07, width, height * 0.07);
  ctx.fillStyle = COLORS.trim;
  ctx.fillRect(0, floorY - height * 0.072, width, height * 0.004);
  ctx.fillRect(0, floorY - height * 0.004, width, height * 0.004);

  // Floor: wooden planks getting darker towards the viewer.
  const floor = ctx.createLinearGradient(0, floorY, 0, height);
  floor.addColorStop(0, COLORS.floorFar);
  floor.addColorStop(1, COLORS.floorNear);
  ctx.fillStyle = floor;
  ctx.fillRect(0, floorY, width, height - floorY);
  ctx.strokeStyle = '#00000033';
  for (let i = 1; i < 8; i++) {
    const y = floorY + (height - floorY) * (i / 8) ** 1.4;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }

  drawWindow(ctx, px(LAYOUT.window, width, height), time);
  drawKeyCabinet(ctx, px(LAYOUT.keyCabinet, width, height));
  drawShiftSchedule(ctx, px(LAYOUT.shiftSchedule, width, height));
  drawLocker(ctx, px(LAYOUT.locker, width, height));
  drawMonitorHousing(ctx, px(LAYOUT.monitorWall, width, height));
  drawDesk(ctx, px(LAYOUT.desk, width, height));
  drawLamp(ctx, px(LAYOUT.lamp, width, height));
  drawMug(ctx, px(LAYOUT.mug, width, height), time);
  drawRadio(ctx, px(LAYOUT.radio, width, height), time);
}

function drawWindow(ctx, r, time) {
  ctx.fillStyle = '#0b1220';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  // Stars that twinkle slowly.
  for (let i = 0; i < 18; i++) {
    const alpha = 0.3 + 0.5 * noise(i + Math.floor(time / 900) * 0.01);
    ctx.fillStyle = `rgba(233,223,202,${alpha.toFixed(2)})`;
    ctx.fillRect(r.x + noise(i * 3.1) * r.w, r.y + noise(i * 7.7) * r.h * 0.45, 1.5, 1.5);
  }
  // Skyline silhouettes with a few lit windows.
  for (let i = 0; i < 9; i++) {
    const bw = r.w / 9;
    const bh = r.h * (0.25 + noise(i * 5.3) * 0.5);
    ctx.fillStyle = '#121b29';
    ctx.fillRect(r.x + i * bw, r.y + r.h - bh, bw - 1, bh);
    ctx.fillStyle = '#f6c56e88';
    for (let j = 0; j < 4; j++) {
      if (noise(i * 13 + j) > 0.55) ctx.fillRect(r.x + i * bw + bw * 0.3, r.y + r.h - bh + 6 + j * 9, 2, 3);
    }
  }
  // Window frame and cross.
  ctx.strokeStyle = '#4a3a28';
  ctx.lineWidth = Math.max(3, r.w * 0.05);
  ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.beginPath();
  ctx.moveTo(r.x + r.w / 2, r.y); ctx.lineTo(r.x + r.w / 2, r.y + r.h);
  ctx.moveTo(r.x, r.y + r.h / 2); ctx.lineTo(r.x + r.w, r.y + r.h / 2);
  ctx.stroke();
}

function drawKeyCabinet(ctx, r) {
  ctx.fillStyle = '#3b2c1f';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = COLORS.trim;
  ctx.lineWidth = 2;
  ctx.strokeRect(r.x + 3, r.y + 3, r.w - 6, r.h - 6);
  // 4 × 5 brass hooks, most with a key.
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 4; col++) {
      const hx = r.x + r.w * (0.18 + col * 0.21);
      const hy = r.y + r.h * (0.15 + row * 0.17);
      ctx.fillStyle = COLORS.brass;
      ctx.beginPath(); ctx.arc(hx, hy, Math.max(1.5, r.w * 0.02), 0, Math.PI * 2); ctx.fill();
      if ((row * 4 + col) % 7 !== 3) {
        ctx.strokeStyle = '#d8c08a';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx, hy + r.h * 0.07); ctx.stroke();
        ctx.beginPath(); ctx.arc(hx, hy + r.h * 0.085, r.w * 0.03, 0, Math.PI * 2); ctx.stroke();
      }
    }
  }
}

function drawShiftSchedule(ctx, r) {
  ctx.fillStyle = '#5a4630';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  // Three pinned paper sheets with unreadable lines.
  const sheets = [
    { x: 0.08, y: 0.08, w: 0.5, h: 0.5, tilt: -0.04 },
    { x: 0.5, y: 0.14, w: 0.42, h: 0.4, tilt: 0.05 },
    { x: 0.16, y: 0.6, w: 0.68, h: 0.32, tilt: 0.01 },
  ];
  for (const sheet of sheets) {
    ctx.save();
    ctx.translate(r.x + sheet.x * r.w, r.y + sheet.y * r.h);
    ctx.rotate(sheet.tilt);
    ctx.fillStyle = '#e7dcc5';
    ctx.fillRect(0, 0, sheet.w * r.w, sheet.h * r.h);
    ctx.fillStyle = '#7d72628c';
    for (let y = 8; y < sheet.h * r.h - 4; y += 6) ctx.fillRect(5, y, sheet.w * r.w * (0.5 + noise(y) * 0.4), 1.5);
    ctx.fillStyle = '#b5413b';
    ctx.beginPath(); ctx.arc(sheet.w * r.w / 2, 3, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

function drawLocker(ctx, r) {
  const body = ctx.createLinearGradient(r.x, 0, r.x + r.w, 0);
  body.addColorStop(0, COLORS.metal);
  body.addColorStop(1, COLORS.metalDark);
  ctx.fillStyle = body;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = '#1d2327';
  ctx.lineWidth = 2;
  ctx.strokeRect(r.x, r.y, r.w / 2, r.h);
  ctx.strokeRect(r.x + r.w / 2, r.y, r.w / 2, r.h);
  // Air slits and handles.
  for (const half of [0, 1]) {
    const hx = r.x + half * r.w / 2;
    for (let i = 0; i < 5; i++) ctx.fillRect(hx + r.w * 0.1, r.y + r.h * 0.06 + i * 7, r.w * 0.28, 2);
    ctx.fillStyle = '#9aa3a8';
    ctx.fillRect(hx + r.w * (half ? 0.06 : 0.38), r.y + r.h * 0.45, 3, r.h * 0.08);
    ctx.fillStyle = '#1d2327';
  }
}

function drawMonitorHousing(ctx, r) {
  ctx.fillStyle = '#0c1115';
  ctx.fillRect(r.x - 6, r.y - 6, r.w + 12, r.h + 12);
  ctx.strokeStyle = COLORS.trim;
  ctx.lineWidth = 2;
  ctx.strokeRect(r.x - 6, r.y - 6, r.w + 12, r.h + 12);
}

function drawDesk(ctx, r) {
  // Desk top
  ctx.fillStyle = '#4a3624';
  ctx.fillRect(r.x, r.y, r.w, r.h * 0.18);
  ctx.fillStyle = COLORS.trim;
  ctx.fillRect(r.x, r.y + r.h * 0.18, r.w, 2);
  // Front panel with three drawers
  ctx.fillStyle = '#33251a';
  ctx.fillRect(r.x + r.w * 0.02, r.y + r.h * 0.2, r.w * 0.96, r.h * 0.8);
  ctx.strokeStyle = '#00000055';
  for (let i = 0; i < 3; i++) ctx.strokeRect(r.x + r.w * (0.06 + i * 0.31), r.y + r.h * 0.32, r.w * 0.26, r.h * 0.5);
  ctx.fillStyle = COLORS.brass;
  for (let i = 0; i < 3; i++) ctx.fillRect(r.x + r.w * (0.17 + i * 0.31), r.y + r.h * 0.55, r.w * 0.04, 3);
  // Keyboard
  const kx = r.x + r.w * 0.4;
  const ky = r.y - r.h * 0.08;
  ctx.fillStyle = '#20272c';
  ctx.fillRect(kx, ky, r.w * 0.2, r.h * 0.12);
  ctx.fillStyle = '#4c575e';
  for (let i = 0; i < 12; i++) for (let j = 0; j < 3; j++) ctx.fillRect(kx + 4 + i * (r.w * 0.2 - 8) / 12, ky + 3 + j * 5, (r.w * 0.2 - 8) / 12 - 2, 3);
}

function drawLamp(ctx, r) {
  ctx.strokeStyle = COLORS.brass;
  ctx.lineWidth = Math.max(2, r.w * 0.06);
  ctx.beginPath();
  ctx.moveTo(r.x + r.w * 0.5, r.y + r.h);
  ctx.lineTo(r.x + r.w * 0.35, r.y + r.h * 0.4);
  ctx.lineTo(r.x + r.w * 0.7, r.y + r.h * 0.15);
  ctx.stroke();
  ctx.fillStyle = '#2f4a3a';
  ctx.beginPath();
  ctx.moveTo(r.x + r.w * 0.45, r.y);
  ctx.lineTo(r.x + r.w, r.y + r.h * 0.12);
  ctx.lineTo(r.x + r.w * 0.85, r.y + r.h * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = COLORS.brass;
  ctx.fillRect(r.x + r.w * 0.2, r.y + r.h - 4, r.w * 0.6, 4);
}

function drawMug(ctx, r, time) {
  ctx.fillStyle = '#d9cdb5';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = '#d9cdb5';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(r.x + r.w, r.y + r.h * 0.45, r.h * 0.22, -Math.PI / 2, Math.PI / 2); ctx.stroke();
  // Slow rising steam.
  ctx.strokeStyle = '#ffffff2a';
  for (let i = 0; i < 2; i++) {
    const sway = Math.sin(time / 700 + i * 2) * r.w * 0.2;
    ctx.beginPath();
    ctx.moveTo(r.x + r.w * (0.3 + i * 0.4), r.y);
    ctx.quadraticCurveTo(r.x + r.w * 0.5 + sway, r.y - r.h * 0.5, r.x + r.w * (0.3 + i * 0.4) - sway, r.y - r.h);
    ctx.stroke();
  }
}

function drawRadio(ctx, r, time) {
  ctx.fillStyle = '#1e2428';
  ctx.fillRect(r.x, r.y + r.h * 0.2, r.w, r.h * 0.8);
  ctx.fillRect(r.x + r.w * 0.7, r.y, r.w * 0.12, r.h * 0.25); // antenna
  ctx.fillStyle = '#3a454c';
  for (let i = 0; i < 4; i++) ctx.fillRect(r.x + r.w * 0.15, r.y + r.h * (0.45 + i * 0.1), r.w * 0.7, 2);
  // A small LED that blinks every two seconds.
  ctx.fillStyle = Math.floor(time / 1000) % 2 === 0 ? '#ff6b57' : '#5a2a24';
  ctx.beginPath(); ctx.arc(r.x + r.w * 0.25, r.y + r.h * 0.3, Math.max(1.5, r.w * 0.08), 0, Math.PI * 2); ctx.fill();
}

// ---------- Screens ----------

function drawScreens(ctx, width, height, time, feeds) {
  const frame = frameOf(time);
  for (const screen of monitorLayout(width, height)) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(screen.x, screen.y, screen.w, screen.h);
    ctx.clip();
    const feed = feeds[screen.index];
    if (typeof feed === 'function') {
      ctx.fillStyle = '#0b1014';
      ctx.fillRect(screen.x, screen.y, screen.w, screen.h);
      feed(ctx, { x: screen.x, y: screen.y, w: screen.w, h: screen.h, time });
    } else {
      drawNoSignal(ctx, screen, frame);
    }
    drawScanlines(ctx, screen, frame);
    drawTimestamp(ctx, screen, time);
    ctx.restore();
    // Thin black bezel.
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(screen.x, screen.y, screen.w, screen.h);
  }
}

function drawNoSignal(ctx, screen, frame) {
  ctx.fillStyle = COLORS.screenOff;
  ctx.fillRect(screen.x, screen.y, screen.w, screen.h);
  const dot = Math.max(2, screen.w / 60);
  for (let i = 0; i < 140; i++) {
    const seed = frame * 1000 + screen.index * 200 + i;
    const shade = Math.floor(60 + noise(seed) * 140);
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.fillRect(screen.x + noise(seed + 0.3) * screen.w, screen.y + noise(seed + 0.7) * screen.h, dot, dot);
  }
  ctx.fillStyle = '#e9dfcacc';
  ctx.font = `700 ${Math.max(9, screen.h * 0.13)}px "DM Sans", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NO SIGNAL', screen.x + screen.w / 2, screen.y + screen.h / 2);
}

function drawScanlines(ctx, screen, frame) {
  ctx.fillStyle = '#00000038';
  for (let y = screen.y; y < screen.y + screen.h; y += 3) ctx.fillRect(screen.x, y, screen.w, 1);
  // A faint brightness flicker per screen.
  const flicker = noise(frame * 7 + screen.index) * 0.06;
  ctx.fillStyle = `rgba(160,210,255,${flicker.toFixed(3)})`;
  ctx.fillRect(screen.x, screen.y, screen.w, screen.h);
}

// The clock starts at 21:12 and runs with real time, so 21:14 shows up after two minutes.
export function clockText(time) {
  const seconds = Math.floor(21 * 3600 + 12 * 60 + time / 1000);
  const h = String(Math.floor(seconds / 3600) % 24).padStart(2, '0');
  const m = String(Math.floor(seconds / 60) % 60).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function drawTimestamp(ctx, screen, time) {
  ctx.font = `600 ${Math.max(8, screen.h * 0.09)}px ui-monospace, Menlo, monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#e9dfcae0';
  ctx.fillText(`CAM ${String(screen.index + 1).padStart(2, '0')}`, screen.x + 5, screen.y + 4);
  ctx.textAlign = 'right';
  ctx.fillText(clockText(time), screen.x + screen.w - 5, screen.y + 4);
}

// ---------- Light ----------

function drawLighting(ctx, width, height, time) {
  // Warm lamp light on the desk.
  const lamp = px(LAYOUT.lamp, width, height);
  const lx = lamp.x + lamp.w * 0.85;
  const ly = lamp.y + lamp.h * 0.4;
  const warm = ctx.createRadialGradient(lx, ly, 4, lx, ly, width * 0.22);
  warm.addColorStop(0, 'rgba(255,211,138,0.32)');
  warm.addColorStop(1, 'rgba(255,211,138,0)');
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, width, height);

  // Cold blue glow from the monitor wall, breathing very slightly.
  const wall = px(LAYOUT.monitorWall, width, height);
  const pulse = 0.16 + Math.sin(time / 1300) * 0.02;
  const cold = ctx.createRadialGradient(wall.x + wall.w / 2, wall.y + wall.h / 2, 10, wall.x + wall.w / 2, wall.y + wall.h, width * 0.45);
  cold.addColorStop(0, `rgba(127,182,216,${pulse.toFixed(3)})`);
  cold.addColorStop(1, 'rgba(127,182,216,0)');
  ctx.fillStyle = cold;
  ctx.fillRect(0, 0, width, height);

  // Dark corners.
  const vignette = ctx.createRadialGradient(width / 2, height * 0.45, height * 0.3, width / 2, height * 0.5, width * 0.75);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}
