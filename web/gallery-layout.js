// Pixel coordinates match the 1536×1024 artwork displayed at x=16, width=864.
export const GALLERY = { left: 46, right: 846, top: 241, bottom: 549, stepX: 100, stepY: 22 };
export function galleryPosition(x, y) { return { x: 96 + (x - 10) * GALLERY.stepX, y: 252 + (y - 3) * GALLERY.stepY }; }
export const GALLERY_BENCHES = [{ x: 12, y: 8 }, { x: 15, y: 8 }];
export const GALLERY_OBSTACLES = [
  { left: 242, right: 367, top: 334, bottom: 390 },
  { left: 530, right: 657, top: 334, bottom: 390 },
  { left: 139, right: 187, top: 240, bottom: 277 }, // back-wall plant
  { left: 42, right: 105, top: 454, bottom: 520 },
  { left: 795, right: 853, top: 454, bottom: 520 },
];
export const GALLERY_CAMERAS = [{ x: 179, y: 70, phase: 0 }, { x: 718, y: 70, phase: 360 }];
export const GALLERY_HALL_ROW = 6;
export function cameraLightOn(time, phase = 0) { return ((time + phase) % 1800) < 900; }

// The perspective side walls taper toward the back. Test the real artwork floor,
// not just a rectangular map, and leave narrow corridors for both actual doors.
export function galleryFloorContains(x, y) {
  if (y < GALLERY.top || y > GALLERY.bottom) return false;
  if (x < 150 && y >= 287 && y <= 341) return true; // west archway
  if (x > 780 && y >= 373 && y <= 395) return true; // east vault
  const left = y < 333 ? 150 - (y - 241) * 80 / 92 : 70 - (y - 333) * 36 / 216;
  const right = y < 378 ? 747 + (y - 241) * 83 / 137 : 830 + (y - 378) * 32 / 171;
  return x >= left && x <= right;
}
export function galleryWalkable(x, y) {
  const p = galleryPosition(x,y);
  return galleryFloorContains(p.x,p.y) && !GALLERY_OBSTACLES.some(o=>p.x>=o.left&&p.x<=o.right&&p.y>=o.top&&p.y<=o.bottom);
}
export function galleryFootprintFits(x, y) {
  return [[-.18,-.32],[.18,-.32],[-.18,.32],[.18,.32]].every(([dx,dy])=>galleryWalkable(x+dx,y+dy));
}
// The hall's row 4 meets the gallery's visible west archway at row 6.
export function galleryDoorTransition(from, to) {
  if(from.x<9&&to.x>=9&&to.x<18)return {...to,y:GALLERY_HALL_ROW};
  if(from.x>=9&&from.x<18&&to.x<9)return {...to,y:4};
  return to;
}
