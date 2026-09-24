import mongoose from 'mongoose';

const LOCAL_FALLBACK = 'mongodb://127.0.0.1:27017/medibook';

function resolveUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('your_mongodb')) return LOCAL_FALLBACK;
  return uri;
}

/** Print actionable guidance for common connection failures. */
function printConnectionHelp(err, uri) {
  const msg = String(err?.message || '');
  const code = err?.code ?? err?.errorResponse?.code;

  if (code === 8000 || /bad auth/i.test(msg)) {
    console.error(`
✖ MongoDB rejected your credentials (bad auth).

  Checklist:
  1. Use the DATABASE USER password (Atlas -> Database Access),
     NOT your Atlas website login password.
  2. Re-type the password carefully, or reset it in Database Access.
  3. Special characters in the password must be URL-encoded:
        @  ->  %40      #  ->  %23      :  ->  %3A
        /  ->  %2F      %  ->  %25      <space>  ->  %20
  4. Confirm the user exists and is ACTIVE in Database Access.

  Current URI user/host being used:
     ${uri.replace(/\/\/([^:]+):[^@]*@/, '//$1:****@')}
`);
  } else if (err?.name === 'MongooseServerSelectionError' || /ETIMEDOUT|SSL|whitelist|IP/i.test(msg)) {
    console.error(`
✖ Could not reach the MongoDB cluster (network).

  Checklist:
  1. Atlas -> Network Access: add your current IP
     (or use 0.0.0.0/0 for development anywhere).
  2. Office/college WiFi may block port 27017 — try another network.
`);
  } else if (/ENOTFOUND|querySrv|ECONNREFUSED/i.test(msg)) {
    console.error(`
✖ Host not found / refused.

  Checklist:
  1. Check the URI for typos (cluster name, mongodb.net domain).
  2. "mongodb+srv://" needs DNS that resolves SRV records.
  3. For a local database, is mongod actually running?
`);
  }
}

const isBadAuth = (err) =>
  (err?.code ?? err?.errorResponse?.code) === 8000 || /bad auth/i.test(String(err?.message || ''));

/**
 * Connect to MongoDB with automatic retries.
 * - Server usage: attempts=Infinity -> keeps retrying through network blips.
 *   Bad credentials abort immediately (they need a human to fix).
 * - Returns true when connected; false only when unrecoverable (bad auth / gave up).
 */
export async function connectDB({ attempts = Infinity } = {}) {
  const uri = resolveUri();
  mongoose.set('strictQuery', true);

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠ MongoDB disconnected — retrying automatically…');
  });

  let delay = 1500;
  for (let i = 1; i <= attempts; i++) {
    try {
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
      console.log(`✔ MongoDB connected: ${conn.connection.host}`);
      return true;
    } catch (err) {
      if (isBadAuth(err)) {
        printConnectionHelp(err, uri);
        return false; // retrying won't fix credentials
      }
      if (i === 1 || i % 5 === 0) printConnectionHelp(err, uri);
      const label = attempts === Infinity ? `${i}` : `${i}/${attempts}`;
      console.error(`✖ MongoDB connect attempt ${label} failed — retrying in ${Math.round(delay / 1000)}s…`);
      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(delay * 1.6, 12000);
    }
  }
  return false;
}
