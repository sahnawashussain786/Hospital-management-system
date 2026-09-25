// Vercel serverless entry — exports the Express app as a Node.js handler.
// The middleware/routes live in ../src/app.js; this file only establishes a
// serverless-friendly MongoDB connection before handing off the request.
import app from '../src/app.js';
import { connectServerlessDB } from '../src/config/db.js';

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
