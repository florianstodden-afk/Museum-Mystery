import service from './_service.js';
import { databaseAdapter, ensureSchema } from './_database.js';

export async function handle(request, path) {
  const connection = process.env.DATABASE_URL;
  if (!connection) return Response.json({ error: 'Online database is not connected yet.' }, { status: 503 });
  const domain = process.env.VERCEL_PROJECT_PRODUCTION_URL || new URL(request.url).host;
  const appUrl = `https://${domain}`;
  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(connection);
    await ensureSchema(sql);
    return service.fetch(request, {
      DB: databaseAdapter(sql), APP_URL: `${appUrl}/`, CALLBACK_URL: `${appUrl}/api/auth/callback`,
      GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
      GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
      ALLOWED_ORIGINS: new URL(request.url).origin,
    }, path);
  } catch {
    return Response.json({ error: 'Online service is unavailable. Try again later.' }, { status: 503 });
  }
}
