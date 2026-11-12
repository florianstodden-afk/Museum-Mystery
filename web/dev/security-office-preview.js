// Preview of the Security Office with example camera feeds.
// The story state lives only in memory here (it is a room demo, not the full story).
import { drawSecurityOffice, loadSecurityOfficeBackground } from '../story/security-office/security-office.js';
import { INTERACTION_POINTS, examine, pointAt } from '../story/security-office/interactions.js';
import { newGame } from '../story/engine.js';
import { journalModel, renderJournal } from '../story/journal.js';
import { button } from '../story/dom.js';

const canvas = document.querySelector('#office');
const ctx = canvas.getContext('2d');
let state = newGame();
let hovered = null;
let background = null;

function loadImage(path) {
  const image = new Image();
  image.src = new URL(path, import.meta.url).href;
  return image;
}

const hall = loadImage('../assets/great-hall-nyc.png');
const wheatField = loadImage('../assets/met-436535.jpg');
const madameX = loadImage('../assets/met-12127.jpg');

// ---------- Example feeds: each draws into its own screen rectangle ----------

// A slowly panning, desaturated crop of a picture, like a security camera.
function imageFeed(image, crop) {
  return (c, { x, y, w, h, time }) => {
    if (!image.complete || !image.naturalWidth) return;
    const pan = Math.sin(time / 4000) * crop.w * 0.04 * image.naturalWidth;
    c.filter = 'grayscale(0.7) contrast(1.1) brightness(0.8)';
    c.drawImage(image,
      crop.x * image.naturalWidth + pan, crop.y * image.naturalHeight,
      crop.w * image.naturalWidth, crop.h * image.naturalHeight,
      x, y, w, h);
    c.filter = 'none';
  };
}

// A dark corridor with a guard walking back and forth.
function corridorFeed(c, { x, y, w, h, time }) {
  c.fillStyle = '#1c262c';
  c.fillRect(x, y, w, h);
  c.fillStyle = '#2b3840';
  c.beginPath();
  c.moveTo(x, y + h); c.lineTo(x + w * 0.35, y + h * 0.35); c.lineTo(x + w * 0.65, y + h * 0.35); c.lineTo(x + w, y + h);
  c.fill();
  const t = (Math.sin(time / 2500) + 1) / 2;
  const gx = x + w * (0.3 + t * 0.4);
  c.fillStyle = '#9fb2bb';
  c.fillRect(gx - 3, y + h * 0.52, 6, h * 0.22);
  c.beginPath(); c.arc(gx, y + h * 0.48, 4, 0, Math.PI * 2); c.fill();
}

// The delivery exit: a cart crosses the picture every few seconds.
function deliveryFeed(c, { x, y, w, h, time }) {
  c.fillStyle = '#20282c';
  c.fillRect(x, y, w, h);
  c.fillStyle = '#3c474d';
  c.fillRect(x + w * 0.55, y + h * 0.2, w * 0.35, h * 0.6); // loading door
  c.fillStyle = '#556168';
  for (let i = 0; i < 5; i++) c.fillRect(x + w * 0.55, y + h * (0.24 + i * 0.11), w * 0.35, 2);
  const t = (time % 7000) / 7000;
  const cx = x - w * 0.3 + t * w * 1.6;
  c.fillStyle = '#8f9a9f';
  c.fillRect(cx, y + h * 0.58, w * 0.22, h * 0.14);
  c.fillStyle = '#6b5a43';
  c.fillRect(cx + w * 0.02, y + h * 0.44, w * 0.18, h * 0.14); // crate under a blanket
  c.fillStyle = '#111';
  c.beginPath(); c.arc(cx + w * 0.04, y + h * 0.74, 3, 0, Math.PI * 2); c.arc(cx + w * 0.18, y + h * 0.74, 3, 0, Math.PI * 2); c.fill();
}

// The vault door with its brass dial.
function vaultFeed(c, { x, y, w, h, time }) {
  c.fillStyle = '#1f2529';
  c.fillRect(x, y, w, h);
  const r = h * 0.32;
  c.fillStyle = '#4b555b';
  c.beginPath(); c.arc(x + w / 2, y + h * 0.55, r, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#c9a35e';
  c.lineWidth = 3;
  c.beginPath(); c.arc(x + w / 2, y + h * 0.55, r * 0.45, 0, Math.PI * 2); c.stroke();
  const angle = time / 3000;
  c.beginPath(); c.moveTo(x + w / 2, y + h * 0.55); c.lineTo(x + w / 2 + Math.cos(angle) * r * 0.45, y + h * 0.55 + Math.sin(angle) * r * 0.45); c.stroke();
}

const FEEDS = [
  imageFeed(hall, { x: 0.05, y: 0.25, w: 0.5, h: 0.6 }),
  corridorFeed,
  deliveryFeed,
  imageFeed(wheatField, { x: 0, y: 0, w: 1, h: 1 }),
  null,
  imageFeed(madameX, { x: 0.15, y: 0.05, w: 0.7, h: 0.5 }),
  imageFeed(hall, { x: 0.45, y: 0.3, w: 0.5, h: 0.6 }),
  vaultFeed,
  null,
];

// ---------- Drawing loop at about 12 frames per second ----------

let lastDraw = -Infinity;
function frame(time) {
  if (time - lastDraw >= 83) {
    lastDraw = time;
    drawSecurityOffice(ctx, { width: canvas.width, height: canvas.height, time, feeds: FEEDS, background });
    drawHighlight();
  }
  requestAnimationFrame(frame);
}

function drawHighlight() {
  if (!hovered) return;
  const { area } = hovered;
  const x = area.x * canvas.width;
  const y = area.y * canvas.height;
  ctx.strokeStyle = '#f6c56e';
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 6]);
  ctx.strokeRect(x, y, area.w * canvas.width, area.h * canvas.height);
  ctx.setLineDash([]);
  ctx.font = '700 22px "DM Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  const label = `E  ${hovered.label}`;
  const labelWidth = ctx.measureText(label).width + 20;
  ctx.fillStyle = '#1c303ae6';
  ctx.fillRect(x, y - 34, labelWidth, 30);
  ctx.fillStyle = '#fff0cc';
  ctx.fillText(label, x + 10, y - 9);
}

// ---------- Input ----------

function relativePosition(event) {
  const rect = canvas.getBoundingClientRect();
  return { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
}

canvas.addEventListener('mousemove', event => {
  const { x, y } = relativePosition(event);
  hovered = pointAt(x, y);
  canvas.classList.toggle('is-pointing', hovered !== null);
});
canvas.addEventListener('mouseleave', () => { hovered = null; });
canvas.addEventListener('click', event => {
  const { x, y } = relativePosition(event);
  const point = pointAt(x, y);
  if (point) examinePoint(point.id);
});

function examinePoint(pointId) {
  const result = examine(state, pointId);
  state = result.state;
  document.querySelector('#point-title').textContent = result.title;
  document.querySelector('#point-text').textContent = result.text;
  document.querySelector('#point-message').textContent = result.message;
  renderJournal(document.querySelector('#journal'), journalModel(state));
}

// The same points as buttons, so the room also works with a keyboard.
document.querySelector('#points').replaceChildren(...INTERACTION_POINTS.map(point =>
  button(`Examine: ${point.label}`, () => examinePoint(point.id))));

renderJournal(document.querySelector('#journal'), journalModel(state));
loadSecurityOfficeBackground().then(image => { background = image; });
requestAnimationFrame(frame);
