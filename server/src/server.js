import 'dotenv/config';

import { connectDB } from './config/db.js';
import app from './app.js';

const PORT = Number.parseInt(process.env.PORT, 10);
const validPort = Number.isInteger(PORT) && PORT > 0 && PORT <= 65535 ? PORT : 5000;

// Start HTTP immediately; Mongo connects (and retries) in the background.
app.listen(validPort, () => {
  console.log(`✔ MediBook API listening on http://localhost:${validPort}`);
  connectDB({ attempts: Infinity }).then((ok) => {
    if (ok) {
      console.log('✔ Database ready — API serving data.');
    } else {
      console.error(
        '✖ MongoDB authentication failed. Fix credentials in server/.env, then restart. HTTP server stays up.'
      );
    }
  });
});
