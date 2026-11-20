const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };

export function validSubmission(value) {
  return value && typeof value === 'object'
    && typeof value.playerId === 'string' && /^[a-f0-9-]{36}$/i.test(value.playerId)
    && typeof value.name === 'string' && /^[A-Za-z0-9_-]{3,24}$/.test(value.name)
    && Number.isInteger(value.points) && value.points >= 0 && value.points <= 80
    && value.max === 80 && ['heist', 'open-file'].includes(value.ending);
}

export function ranked(rows) {
  let lastPoints = null;
  let rank = 0;
  return rows.map(row => {
    if (row.points !== lastPoints) rank++;
    lastPoints = row.points;
    return { rank, playerId: row.player_id, name: row.display_name,
      points: row.points, max: row.max_points, ending: row.ending };
  });
}

function response(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...JSON_HEADERS, ...(origin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {}) },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(value => value.trim());
    if (origin && !allowed.includes(origin)) return response({ error: 'Origin not allowed.' }, 403);
    const url = new URL(request.url);
    if (url.pathname !== '/runs') return response({ error: 'Not found.' }, 404, origin);
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: {
        'Access-Control-Allow-Origin': origin || '', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin',
      } });
    }
    if (!env.DB) return response({ error: 'Leaderboard database is not configured.' }, 503, origin);
    try {
      if (request.method === 'GET') {
        const result = await env.DB.prepare('SELECT player_id, display_name, points, max_points, ending FROM leaderboard ORDER BY points DESC, created_at ASC, player_id ASC LIMIT 25').all();
        return response({ entries: ranked(result.results || []) }, 200, origin);
      }
      if (request.method === 'POST') {
        if (Number(request.headers.get('Content-Length') || 0) > 1024) return response({ error: 'Request too large.' }, 413, origin);
        const raw = await request.text();
        if (raw.length > 1024) return response({ error: 'Request too large.' }, 413, origin);
        let run;
        try { run = JSON.parse(raw); } catch { return response({ error: 'Invalid JSON.' }, 400, origin); }
        if (!validSubmission(run)) return response({ error: 'Invalid run.' }, 400, origin);
        await env.DB.prepare(`INSERT INTO leaderboard (player_id, display_name, points, max_points, ending)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(player_id) DO UPDATE SET display_name=excluded.display_name, points=excluded.points,
            max_points=excluded.max_points, ending=excluded.ending, created_at=CURRENT_TIMESTAMP
          WHERE excluded.points > leaderboard.points`)
          .bind(run.playerId, run.name, run.points, run.max, run.ending).run();
        return response({ ok: true }, 200, origin);
      }
      return response({ error: 'Method not allowed.' }, 405, origin);
    } catch {
      return response({ error: 'Leaderboard unavailable. Try again later.' }, 503, origin);
    }
  },
};
