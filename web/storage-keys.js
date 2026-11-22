// Storage keys per player: guests use the base key, a signed-in player gets their own copy.
// (Moved here from the removed local-auth.js; the keys are unchanged, so saves keep loading.)
function normalizedName(name) { return String(name).trim().toLowerCase(); }

export function profileStorageKey(base, username) {
  return username ? `${base}:profile:${normalizedName(username)}` : base;
}
