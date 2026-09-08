// Copies every file in the `admin-media` bucket from the old backend to a new one.
// Usage:
//   OLD_URL=... OLD_SERVICE_KEY=... NEW_URL=... NEW_SERVICE_KEY=... node migrate-storage.mjs
// Requires: npm i @supabase/supabase-js
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'admin-media';
const src = createClient(process.env.OLD_URL, process.env.OLD_SERVICE_KEY);
const dst = createClient(process.env.NEW_URL, process.env.NEW_SERVICE_KEY);

await dst.storage.createBucket(BUCKET, { public: false }).catch(() => {});

async function walk(prefix = '') {
  const { data, error } = await src.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error) throw error;
  for (const entry of data) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (!entry.id) { await walk(path); continue; }        // folder
    const { data: blob, error: dlErr } = await src.storage.from(BUCKET).download(path);
    if (dlErr) { console.error('download failed', path, dlErr.message); continue; }
    const { error: upErr } = await dst.storage.from(BUCKET)
      .upload(path, blob, { contentType: blob.type, upsert: true });
    console.log(upErr ? `FAIL ${path}: ${upErr.message}` : `ok ${path}`);
  }
}

await walk();
console.log('storage migration complete');
