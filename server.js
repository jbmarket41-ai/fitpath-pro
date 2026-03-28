require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const app = express();

// ─── CORS ───
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json({ limit: '1mb' }));

// ─── STATIC FILES ───
// Serves from /public AND root — works wherever index.html lives
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname)));

// ─── ENV VARS ───
const OPENAI_KEY = process.env.OPENAI_KEY;
const TG_TOKEN = process.env.TG_TOKEN;
const TG_CHAT_ID = process.env.TG_CHAT_ID;
const STRIPE_SECRET = process.env.STRIPE_SECRET;

// ─── STRIPE ───
let stripe = null;
if (STRIPE_SECRET) {
  stripe = require('stripe')(STRIPE_SECRET);
} else {
  console.warn('⚠️  STRIPE_SECRET not set — cancel subscription will not work');
}

// ─── HASHED LICENSE KEYS ───
const LICENSE_HASHES = {
  weekly: [
    "2ea759c909541d2a6c369f8ebe4cd91336903047c54526efb2c8fedb387c94aa",
    "5ecdf9f2c760cf170e9e4ffad3f3dfd9c27baf0c6af041700ad51ee2692d40eb",
    "dd16267e2b93b4a8c789156ba54ec9da191c8db25d4f45306cacdf9933b6a804",
    "d838d98ad04b9761779d71b6096608bb93e5e9d890b09f65bc3adc6b25902cd6",
    "a03f7b9a0f78d41424bada54d23f5245fe45199b2a2e4944f8d787eb7ff1e38c",
    "ca0660152dc79505ed5034614c1af04d5e2f928492c9822285a83bef0ad08429",
    "d57abad5c2a0e33429ff5da8bd081b991ce26a98bc641a3449e4891d9052b29b",
    "7e8f685e840ab64179473213fcfb2be4097c82e14d5d08d833ce1a7776040cad",
    "4302b055a83a37e5329526cc43f0f2877083dc8ba884e7397ef3e221c4f056e1",
    "79dfe88cf3fcf435808efe360f519a6bc9a7058985444371471b86c6c77e0603",
    "1ed1177ab0f62cb43e507e6fc836a388fddceee1fa46934bfd7aaaedad685f40",
    "771d163120121f8d787d7203295d95eed19a5dd93afc6b3cf84943d074d2e6c5",
    "0331410244c7af2e5dbabc5408def3f355baa6800608e1c211938beb634af0ca",
    "220240c0ab1d50d06cca7901cd0ce86cc9e57087651759e38c6477e2d708dfe5",
    "0c32c24767a9fc9beb2d47eb0fa77a1459974cb129a819f5c909534edbdd0989",
    "f82898c73271148ea8c888eac77b506309453206be855289d9c6e8780d08e923",
    "c01179077a4cf43ddddfed29d440d57023a5a7f948d5509f54e77f62e9958d77",
    "a82c2fb2a7cec1d0f1b8bb95b84c6de16bcab0b401f25b42872202d037cd7e74",
    "beb71950c9936db878e24a3d5b6d37c38b08dd99d7999710ac21cda504fff8d6",
    "bdac29660e6e21fcd762d6c48e9e415679ef750a5537663be8bbb13833b661f7",
    "521a3313c25d8d778bb15401aa47913d381c9f58d2251aaa3a460c02c7945738",
    "22da2798aa77cf426c0fd031e378a1bebb34fd45c16d003afd807c0c7a0aae64",
    "1225bab537651a9352dbc8827cb43da1a05376c6757c7304d19f0300eb6b2349",
    "8c3636e684d3f4bbd8116c9a9d0148564630e7aee61759b21d2e1b94a0eb76c6",
    "5872ae9284ecfbef6bec82af81bdf4772225c4abf59d22afbccbc9df5c7aa405",
    "3fe644521103f69ca7bed39ca082db2f47d255e13f2a1abce608f854685945ea",
    "b3bbebcc13c8e61658308d2e06b3f52a5d067cec30527c53f2198e9143623493",
    "1426b92a5a6e7f537f81132734b27a7a2fa55ca136e1db727ddd4217a2cf22b3",
    "96cebb6b10c7abf808aeea05c66481def866630cb867c2fb5ac86ee7702572a7",
    "a1f997a93b9b40a4af93644e3c21113e7fb82cc89820ebc6ff6013a93f61557e",
    "f9314a3c666dc9c6548ed0d16de5b0de0b631f0aadb270467198f1c45ffb429e",
    "082f5fe0cbfd3ee594f60a09f2d211a7a6777a17724057f51ba0873970582ed4",
    "6e66e8534e14caf4345554aeeaae04e2706dc855092d838f79be5827a9c7157f"
  ],
  monthly: [
    "03dd8368f21b69ff12d64216355b4c4d8c8b16be3787c2b0ad8f9938fa7ca2f3",
    "7ffb71c010b4fe723b961ca9650d042ac3b46024ea892c8c43d4cca66752d734",
    "f266f721c823e164172b374843666b9bd35ccdb5e069b889a87641bd0a70ae30",
    "a74668597d65a971a9f8bcb26a1b5dba4363b96a086161f984c64da384863116",
    "92b74e718316e60793c6a3e87b15870f75097e13fbf49030c9ecca79ad119ef0",
    "1082f1a43e5631c65f0762b252dec268924df74ab66f4a9ef9ba220fda5f57ae",
    "72e6e8bdef572a457f34b672950fbed4daa5c840f0b95a21129b373ac202033c",
    "272cdaf7a5f7c39e659f29a3c15a92512ed8a6ad84345a1e6e97ad47e9c1921c",
    "8d32294207522baa46d1bb7aab1fb7e0f89e2a1965334ff452c26d9c3d1a8e73",
    "f6e73c71b484af7d86822ee2b3588883139a4e8ee91aabf63432ea93660a4538",
    "48e2d313eab6d31102d6d97672726251c6c5037a4c98693005178111e627e1f5",
    "b7440fd58e0f24aa2d733cdfb903425cc22af8287f5d6c9a7ff6a963c374b515",
    "77d95fbe8f7e4705981ec60f4968d7a82107398f44a33bd7fed77db931aa31c4",
    "c7fbfb782f6da5e1264900d1cda1416869c744f43ecfca34742bc9c3a94e6ecd",
    "2a8adf015d982ec0cf89dee618d20fed5354eafd6bc2c40a853c9ee4cf904e68",
    "e3173c3e65747205ee86b2a5deab045540abc58b57ae3aa86ba45bd0cb05f9e7",
    "dec676ca81ea86e1ec93bc9bf1b2a553b1e78921d04eb3ee36d3ba8497e2903d",
    "2d4f4ffd9393bbf2200fc6e7bbefeb22e4c75807406891ea043491c47c108a20",
    "b5bf74ed089348d871110cef1c177d176346412cac066b275fbeca62168932df",
    "83f1a82498cfec80f1fc63568a44246a83b2d03d13c35a45b5bec3dd758c963a",
    "ea78bfff4d940bd77a0faf271950abdb8b40f2e2d2104cc2e44a88c0a997091c",
    "f68cc6c6d5f675f24f3666ccb89d072420ba15d17b7ccbd3d1a8c8d9d52d4c63",
    "2e950ff9034f189e7e94e5ee04437b738e9aac58fa8bb6ff3cbf5093f5b37130",
    "fde4bca02f098dc9a7ad9a42ff56a0e1c335275759562103195806dc2fe06afb",
    "83c7bee781ae314cd5f6848586fcd41b1b0829ad869f7b0fce1e63c820b27bfe",
    "2bdf429b8b95cace9162b83de877b14df050ca2cc0a9a1e174c46ef8ba7d4142",
    "4b700d6f7b750c1487c5e4cb97f448fb955be174cf7379651f35c08aaac6e901",
    "92f80541ae07f783d26cbf2960936f27ee47875fd26ecd21d7b50217eebfcc83",
    "cd353db2d2fd55bef5bd2ca8dc5e8e8f4c5ed3fcd94cea41e85007edcd94d259",
    "b8ca4593ea6df25a650fa2623fe8cd7efca4df868af865c3475df1e318d0b6c2",
    "170dbda5d1a35a3e0ab4367290439ae95d0bd0d747a1d102e8569ab13af86b6a",
    "1c482e8ddc9366a45d1fe7518fd5f42522f83bec1a19525bb782a1f727d5b4df",
    "fcf4e9dcef68ee7a6aa05768c62c47e8372c4d47cf5f7aa24201468031a8f080",
    "5ef57a16e35cee27e500410ea2ac610e656cde4ec55ea417d545c489210a5033"
  ],
  yearly: [
    "c9061d53aedc418f4088ef1e33cc9fce3e97fc225f87a529d573c5833458961c",
    "179d7d8b898889612d48cc36d6d3594272b03b01659275b3b4c92bac5d001bbf",
    "28b6fb2be6602a434275f3957ce90b7c79d2f31a07218d322ea377ab0a6e3ff4",
    "50f701545d9536cf4f9ca28776e0c4c5e3186dfe36942a0f72857c8f05f6bfd7",
    "3b171451a91ba53d02810ecd2566e2612bb8740753882ebab12051095d83a15c",
    "75ca79b45bc4b1fc0aa2428fe21414b3ff546ce597fa12f073286cc2b5d73556",
    "aa6920bd70f998c4b8eafb82c6c438dce9a940ec4efb9a04c1111576bee12dad",
    "6ae8cb9e636819aff26d4e709137cd65a09e5574c8ef2e72cae0675c3e4853bb",
    "35c27f46dbc1447cb352d67da5652e94dc246f660d23e55f78216bb0b0905580",
    "afb0df297ede25f1750b20d432251a84b90ed8a40b2c4faee9da990d7c863f63",
    "3c38e946eac2d55119fffcb5283bf7b8f7751c2698fc17c6839b965d9d03ceed",
    "0315515bf9160a969ca6e7465eee6c68031f69095d27b0f2142b9d29a8b98fe2",
    "7196f8b179b232f9f06aea2874bd7dd7af7393df865470319123578b2dfd95c9",
    "d2303e24d502a523647598b9d33bb16872e49d8686e5064049a9b91aeccdcbd4",
    "3e2b79b6e29a60283cb1a45019633ed2ebe8b9935a27708be53dd7d2b0c70964",
    "e14506c050519374c9c721149ac7b3efe6be092ebf76bcbe23598f8f6a8814a3",
    "ad036c3edfd5ae87d4b07af1be2aaa7776b59c59dbd910ee0fbc766159af9f64",
    "ef20569c654070ee74d043334c11dd05906b0b14eeec2ae93ba83c1238d62984",
    "684934d74a051ce649dd3bb4c821a54b578047edfbce6655903f61b06ea8aed7",
    "953a481ec52f1e319a04ae5ff0d1c599fd37a9ec21283dc8f1242254fcb057d2",
    "7534d1ec81945de639f11b56a22862c14473824339ef6d511a33372b8ef36cfc",
    "7917b5680a68190ddabcd2846257706efbf6a7751ae4a885b61ff4b5d3606f2f",
    "306b0d0223a5d7eae453298b46441571218b1a6c8eb8d750963b15af2ff99917",
    "befd59b5620b041ba9e0cbd48511201c6a65af8c97abe364060441f7a16f4baa",
    "f11cb22badd5e998091c1ca897113821bac50a0985764f4f92e70fe4932f49f5",
    "cacf8dc9055253f56f9e0c68456f669e9e1fff84e711e47a00e818514049e03d",
    "3e8a053cedfbb51f319d4c4be5cb5dd2b4ae66878d016bc829b67a7abf862e65",
    "e65a34002e08777c265df58c86fefe62301da14b3ab3af8edf3eade421fe153e",
    "17a3fd7db06010ec767459d65d400d877afb6c13f7032457ea728d489b486775",
    "6b51166419842273bb69a20f705f7068b085faeedd2bbe6693e84761dbb3969f",
    "35bc873b86837092e86246518993c93a3064a6ce528b187b0bf08afc6ba896a1",
    "1273e3fb48d0f6b0fb4966074083df77f673c9f1d21502e97a60fec8a43d0603",
    "020adcce6a68a15c512efa73e9a9e0dc6c945d42c07058ee12ee9e9fb749c98a"
  ]
};

// ─── SUPABASE (for one-time key tracking) ───
const { createClient } = require('@supabase/supabase-js');
const SUPA_URL = process.env.SUPA_URL;
const SUPA_SERVICE_KEY = process.env.SUPA_SERVICE_KEY; // service role key — NOT the anon key
let supa = null;
if (SUPA_URL && SUPA_SERVICE_KEY) {
  supa = createClient(SUPA_URL, SUPA_SERVICE_KEY);
  console.log('Supabase: ✓ connected (key tracking enabled)');
} else {
  console.warn('⚠️  SUPA_URL / SUPA_SERVICE_KEY not set — keys will NOT be one-time use');
}

// ─── VALIDATE LICENSE KEY (one-time use via Supabase) ───
app.post('/api/validate-key', async (req, res) => {
  const { key, email } = req.body;
  if (!key) return res.json({ valid: false, error: 'No key provided' });

  const hash = crypto.createHash('sha256').update(key.trim().toUpperCase()).digest('hex');
  const durations = { weekly: 7*86400000, monthly: 30*86400000, yearly: 365*86400000 };

  // Find which plan this hash belongs to
  let matchedPlan = null;
  for (const [plan, hashes] of Object.entries(LICENSE_HASHES)) {
    if (hashes.includes(hash)) { matchedPlan = plan; break; }
  }

  if (!matchedPlan) return res.json({ valid: false, error: 'Invalid key' });

  // If Supabase not configured, fall back to multi-use (warn in logs)
  if (!supa) {
    console.warn('⚠️  Key used without one-time check (Supabase not configured):', hash.slice(0,12));
    return res.json({ valid: true, plan: matchedPlan, duration: durations[matchedPlan] });
  }

  try {
    // Check if already used
    const { data: existing } = await supa
      .from('used_keys')
      .select('hash, email, used_at')
      .eq('hash', hash)
      .maybeSingle();

    if (existing) {
      console.log(`Key already used by ${existing.email} on ${existing.used_at}`);
      return res.json({ valid: false, error: 'This key has already been used.' });
    }

    // Mark as used
    await supa.from('used_keys').insert({
      hash,
      plan: matchedPlan,
      email: email || 'unknown',
      used_at: new Date().toISOString()
    });

    console.log(`Key activated — plan: ${matchedPlan}, email: ${email || 'unknown'}`);
    res.json({ valid: true, plan: matchedPlan, duration: durations[matchedPlan] });

  } catch (e) {
    console.error('Key validation error:', e.message);
    // Fail open — if Supabase is down, let the key work so users aren't locked out
    res.json({ valid: true, plan: matchedPlan, duration: durations[matchedPlan] });
  }
});

// ─── CANCEL STRIPE SUBSCRIPTION ───
app.post('/api/cancel-sub', async (req, res) => {
  const { email, appEmail, userName, plan, goal, diet, currentWeight, goalWeight, startDate, streak } = req.body;
  if (!email) return res.json({ ok: false, error: 'No email provided' });
  if (!stripe) return res.json({ ok: false, error: 'Stripe not configured on server' });
  try {
    const customers = await stripe.customers.list({ email: email.toLowerCase(), limit: 1 });
    if (!customers.data.length) {
      // Still notify even if not found on Stripe
      await sendTelegram(
        `⚠️ *Cancellation Attempted — Not Found on Stripe*
` +
        `👤 Name: ${userName || 'Unknown'}
` +
        `📧 App Email: ${appEmail || email}
` +
        `💳 Stripe Email Tried: ${email}
` +
        `📦 Plan: ${plan || 'Unknown'}
` +
        `🎯 Goal: ${goal || '—'} | Diet: ${diet || '—'}
` +
        `⚖️ Weight: ${currentWeight || '—'} → ${goalWeight || '—'}
` +
        `📅 Started: ${startDate || '—'} | Streak: ${streak || 0} days
` +
        `⏰ Time: ${new Date().toUTCString()}
` +
        `
_No matching Stripe customer found for this email._`
      );
      return res.json({ ok: false, error: 'No Stripe customer found for this email' });
    }

    const customer = customers.data[0];
    const subs = await stripe.subscriptions.list({ customer: customer.id, status: 'active', limit: 10 });

    if (!subs.data.length) {
      await sendTelegram(
        `⚠️ *Cancellation Attempted — No Active Sub*
` +
        `👤 Name: ${userName || 'Unknown'}
` +
        `📧 App Email: ${appEmail || email}
` +
        `💳 Stripe Customer: ${customer.id}
` +
        `📦 Plan: ${plan || 'Unknown'}
` +
        `⏰ Time: ${new Date().toUTCString()}
` +
        `
_Customer exists but no active subscriptions found._`
      );
      return res.json({ ok: false, error: 'No active subscriptions found' });
    }

    // Get subscription details before cancelling
    const sub = subs.data[0];
    const subPlan = sub.items?.data[0]?.price?.nickname || sub.items?.data[0]?.price?.id || plan || 'Unknown';
    const periodEnd = sub.current_period_end
      ? new Date(sub.current_period_end * 1000).toDateString()
      : 'Unknown';
    const startedAt = sub.start_date
      ? new Date(sub.start_date * 1000).toDateString()
      : startDate || 'Unknown';
    const totalPaid = ((sub.items?.data[0]?.price?.unit_amount || 0) / 100).toFixed(2);

    // Cancel all active subs
    for (const s of subs.data) {
      await stripe.subscriptions.cancel(s.id);
    }

    console.log(`Cancelled ${subs.data.length} subscription(s) for ${email}`);

    // Send full cancellation alert to Telegram
    await sendTelegram(
      `🚨 *SUBSCRIPTION CANCELLED*
` +
      `━━━━━━━━━━━━━━━━━━━━
` +
      `👤 *Name:* ${userName || 'Unknown'}
` +
      `📧 *App Email:* ${appEmail || 'Unknown'}
` +
      `💳 *Stripe Email:* ${email}
` +
      `🆔 *Stripe Customer:* ${customer.id}
` +
      `━━━━━━━━━━━━━━━━━━━━
` +
      `📦 *Plan:* ${subPlan}
` +
      `💰 *Price:* $${totalPaid}
` +
      `📅 *Sub Started:* ${startedAt}
` +
      `🏁 *Access Until:* ${periodEnd}
` +
      `━━━━━━━━━━━━━━━━━━━━
` +
      `🎯 *Goal:* ${goal || '—'}
` +
      `🍽️ *Diet:* ${diet || '—'}
` +
      `⚖️ *Weight:* ${currentWeight || '—'} → ${goalWeight || '—'}
` +
      `📆 *App Start Date:* ${startDate || '—'}
` +
      `🔥 *Streak:* ${streak || 0} days
` +
      `━━━━━━━━━━━━━━━━━━━━
` +
      `⏰ *Cancelled at:* ${new Date().toUTCString()}`
    );

    res.json({ ok: true, cancelled: subs.data.length, accessUntil: periodEnd });
  } catch (e) {
    console.error('Stripe cancel error:', e.message);
    await sendTelegram(`❌ *Cancel Error*
Email: ${email}
Error: ${e.message}`);
    res.json({ ok: false, error: e.message });
  }
});

// ─── AI CHAT ───
app.post('/api/chat', async (req, res) => {
  const { system, messages } = req.body;
  if (!OPENAI_KEY) return res.json({ error: 'OpenAI not configured' });
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 300,
        messages: [{ role: 'system', content: system }, ...messages]
      })
    });
    const d = await r.json();
    if (d.error) return res.json({ error: d.error.message });
    res.json({ reply: d.choices[0].message.content });
  } catch (e) {
    res.json({ error: e.message });
  }
});

// ─── TELEGRAM HELPER (used internally too) ───
async function sendTelegram(text) {
  if (!TG_TOKEN || !TG_CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT_ID, text, parse_mode: 'Markdown' })
    });
  } catch (e) {
    console.error('Telegram notify error:', e.message);
  }
}

// ─── TELEGRAM SUPPORT ───
app.post('/api/support/send', async (req, res) => {
  const { text } = req.body;
  if (!TG_TOKEN || !TG_CHAT_ID) return res.json({ ok: false, fallback: true });
  try {
    const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT_ID, text, parse_mode: 'Markdown' })
    });
    const d = await r.json();
    res.json({ ok: d.ok });
  } catch (e) {
    res.json({ ok: false, fallback: true });
  }
});

app.post('/api/support/poll', async (req, res) => {
  const { offset } = req.body;
  if (!TG_TOKEN) return res.json({ results: [] });
  try {
    const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/getUpdates?offset=${offset}&limit=10&timeout=0`);
    const d = await r.json();
    res.json({ results: d.result || [] });
  } catch (e) {
    res.json({ results: [] });
  }
});

// ─── HEALTH CHECK ───
app.get('/api/health', (req, res) => {
  res.json({ ok: true, stripe: !!stripe, openai: !!OPENAI_KEY, telegram: !!(TG_TOKEN && TG_CHAT_ID) });
});

// ─── CATCH-ALL: serve index.html for any non-API route ───
// This fixes localhost:3000 and ngrok — serves index.html from wherever it lives
app.get('*', (req, res) => {
  const publicPath = path.join(__dirname, 'public', 'index.html');
  const rootPath = path.join(__dirname, 'index.html');
  if (fs.existsSync(publicPath)) return res.sendFile(publicPath);
  if (fs.existsSync(rootPath)) return res.sendFile(rootPath);
  res.status(404).send('index.html not found. Place it in /public/ or same folder as server.js');
});

// ─── START ───
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🌿 FitPath Pro running at http://localhost:${PORT}`);
  console.log(`   Stripe:   ${stripe ? '✓' : '✗ not configured'}`);
  console.log(`   OpenAI:   ${OPENAI_KEY ? '✓' : '✗ not configured'}`);
  console.log(`   Telegram: ${TG_TOKEN ? '✓' : '✗ not configured'}\n`);
});
