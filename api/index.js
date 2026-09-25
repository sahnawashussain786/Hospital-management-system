// Vercel serverless entry — mounts the Express API (server/src/app.js).
// vercel.json rewrites /api/* to this function; the app mounts its routes
// under the /api prefix, so incoming URLs resolve unchanged.
import app from '../server/src/app.js';
import { connectServerlessDB } from '../server/src/config/db.js';

export default async function handler(req, res) {
  // Await (cached) connection first so app.js's readiness gate passes;
  // a failed attempt returns false fast, which we surface as a clean 503.
  const ok = await connectServerlessDB();
  if (!ok) {
    res.status(503).json({
      success: false,
      message: 'Database is unreachable — please try again in a few seconds.',
    });
    return;
  }
  return app(req, res);
}
