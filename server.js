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
  console.warn('⚠️  STRIPE_SECRET not set');
}

// ─── HASHED LICENSE KEYS ───
const LICENSE_HASHES = {
  weekly: [
    "587bc809bc6020aa703a13cbb8483d3cd6d84cc1c7bf8fbe20f83ce883fe82f8",
    "36b84336e5b65958a51b0855588c926de48f2cead274f7e29647aca20c32705f",
    "a1ab0044acaeb4935aa9454cbcf70049fb3c46a321f439452dc52a99090d2106",
    "87429ef4a6f0ae3496071088d19340f11bebd833ff88cc66cecc63723025b210",
    "2b6faea9373b2c0a37b16a7f0338f34686a21a7bfa5b494dcedbfc37969589e4",
    "6c512c63fe155e62e0e5dde0fb2317625f38cb229b4a255a30da8f95951d12d0",
    "d600ca1b880416e01633f3406c5a919eb11538f810bc1330c52ead4d3a0460d0",
    "2b38ea0846ad99feb4b54cd366482ffaa3bf6d600a6b2262fc106e7d1ef807eb",
    "9439821c4948a82c81048c8b49314c600aa07e23d4feb5bcbfb4cf99ba76d7e4",
    "f9b8e81aace42b728cd0acfe3acb4b21906a37be94309fb4187da01a6309e7de",
    "33643139ca0eaf46a5c628eaca2c13d93621ad37b8111c309a433e642e293c3f",
    "216fb14b404012d23d49b7bac3fd436c794b2506be2f0344754857de6aaf4b9e",
    "8ea9038d73ff2c63ff3399da232b32357751daf9a35efef2518a5ef25b913e19",
    "bea6f666c4653a3280f44609bf7fedfd0a8b68bd73411416b6e7fdeb45a3cc63",
    "26500cc33be3d6888a5902d30ae4d2f4c186e44b956881ab5d583b39ff4bbdff",
    "573442ecc1169c3a87daa92e68ad9ccc553ce71f2471d56a1403b0f0cf78a15f",
    "19bcdae940aaa909e9a101c392e0c2655fbde631fffcd4e6ea14c0ce9033041f",
    "67267f1c3595c647bfb9803a2d034995b045e80b954246b4cfa47ca85949108c",
    "84c571145256815c5a3322b1dd5b43e95f2b835e6010bc0bca8b2025ff21d013",
    "90bd1b7bc1602586a84f01ad14bb243a47d45adaf8364e8f4acab60090766073",
    "df09334fb411a822dfdd219a8263a6b101443857a709be18c6a24cea0402a25c",
    "bd771d3f39b33b6d7bb2d1573bc602a390ddb705206ee0a989a0ae43578dc110",
    "b85cb740a1d070329a38997376cee92e73ce42f0db74daa09773b2a4e62401ee",
    "beda2a10387846475aa7156092e6a49813a44d7d0bcc396045fed7bf6a1499ee",
    "6d6a0a5adaf8af36c1261b5efb06ec2f206f57014a06710860a89e14d72f32c1",
    "a900bbcfac743b7933c4569820391614fe53e0bab28adff4562a3226bf0fe2a6",
    "0df8048bab41d335c13496281a6f2a77c3d1f89c004404cf355fb3b9f0b38faa",
    "1fe6e499577304867e4f8537ffdbface394989897697e330f7e95ac280d1e5c1",
    "bd2debb583f4baf0098c41da7d7aa9c67bc0065c9c4e5e0605410a9be1e57769",
    "2fc2a4d71ec6cf82b90b9f69cce554e35d024bace7dfa7e1578bc8ca5426a061",
    "13803dca20933711d6ac10c552ab017c25c26cbc460628ba704866f4e4a3edcf",
    "210a1264304fdef94f6b13963d437c05c92e1b0ce8ff776ec8916aa5cbb474e8",
    "70ba15a4133d8a172043ae19a3a416874cd61f8d05131f3f1a3a93c38473b1d7"
  ],
  monthly: [
    "48ed78d807c9a989d2eed579cd9c009b6c962c5b7ed643838245eff79627ade2",
    "65c537f84b20d70b9f2afd0723079b4de03d4aae53deed078a0ba788670d8ca4",
    "e1f84d4772f59e1a29421379f1aeb4ebf3d0bb307eb5c1d7318a761d6a84cba0",
    "61543e62c4011648ecd16bd8afb1e93676c6fcedf591649f69f2a1eb4ce8b925",
    "99376ea7c4d1d53dbd17674b184ca30c4985316704337b2ae8ce9dab650db60b",
    "9c8d4edfd1c434b5f511c959996e614847cd4867dc8630d7352b4f04ae933e99",
    "4b4ffded8265ae603c9c5958ddb79f2da2282e5825af97726b668c7b99bb6795",
    "1547556e809d0e1c70aecfba72f220b55f29a0ee3187716eefba6d85a59e8b6b",
    "c5573b249fbf39a28a04c2c0a24e9af30b4a64658d05a190c218cd6a98e3d9b7",
    "98e76c64d6daa86691e0a8994df8352e3d905f2dca8f15400eb1db3ccbe35063",
    "fb5f3d44b2e9bad82adbfad351041b97c699c7f424aaafed17963d3e97e059ad",
    "e0aee3fd0aa3ba2d42cd3d3cb612d011a96db67094a9e54e67904f4dd2b95b63",
    "e5216d339c0925babd24d3484407c5a90d96d451e9f3d8b992fd7182cdc06041",
    "0021a038ee27cc695e9270f717708bac03dae8c12904bfb9a2335246f6bea418",
    "4e2ba3e57a538547c1ab99eee224bf8cb4daa37a15c8e381ff71333d9dc86143",
    "2a5ccf46d8ba9b031f8480894e531688574d908b7d3872eab2b07a95774998cf",
    "bfc161764933872e1d6bbb5ea14238dc153117948be0921994789d07bfc7d207",
    "1e294e1b3634492f91ee00be5704acf224fbbd7089a3af7b620c9642ffbf8b44",
    "5a339c20a24657e4a49e507df90384d95d065a8c1b330b16a0cba3cf939125f7",
    "6682f36b987cd5a85b0fb71f27bbd0ffcc90e5c01f72180fa09f209e1856461c",
    "08e4b319a8c73cc67d9545b7df7d365df12dfde78dc3f8ccfde7d6720246f21f",
    "bbd05586e0552f855860e018d665f36950f547be757e1493d71d65cf76e515c0",
    "7b6b1a78fe4be86da596f42d3776f861d310da7f11e95539dc8474f9bd891ff4",
    "8959dfd55f822299ff2390490212ff3f064af2f61b62db2b881afa429028a43b",
    "d627c449401542e715f372ae90c01ed281f01208b5f53a1ac96f9544bea949dd",
    "bee67c972b87f18bed0a39ffbbb727e79d1df1ef4cae696f93fc9ef3d37f6996",
    "84471d51dc09fe4a96f1a92d28ec41193c19e6081a9ecdfe1f9a2c0ab05942d9",
    "47d2c248817388c9c5afcbec9a85d27cb6dc9f6e8dc84645063616be1280192d",
    "5e532542b01ca41a2ef6da2c82e9a5a8de723206e97ee4ada13955769eb8f8e8",
    "714035599f530405daf5d582f17cce524322fb1fb655a7c8a1d5eb349d6fb78f",
    "797e1c79b9170125b460a219be4bcff4b172ee08e4e83d08e70ad1532adba62b",
    "fb589289070f0547bbbb8567b0003d357f23329273184b8766f2fc7a106c4302",
    "6f36ed7efde0819cd60f81ad004c75df812c46b24e0dc8b8699ce7498109ee2a",
    "28a2754689df22de6276041fa0932467ed58125eeae7fd7287d874d285780cf4"
  ],
  yearly: [
    "179a374ced69da0306e1c1c0b86eb25d2527cec607946bfddfa5efa70bdb44d1",
    "9a090a028d4b6df1fdbdc3d4a4f823473b3fbe8c17f0274ed639ca113c560723",
    "55f53bd71faee992c53448af433d251c43da411758a997a92f54eea82d4ccce8",
    "ffa63171a3f5234415a93a228c3b763a43db10029051cc63e6ea10c7d4778529",
    "d7e858d0f33ad084aef48b7601903c77eef7521096f6c09ede9da8b7836fab35",
    "a845b79a9d971d70c4d242df551d429a1fb99cc2df281a20b139b3752c78306c",
    "32858ac2c62888b5bbde54ed4fc7472a8df8625045443dff3cc7aa598c175c6b",
    "dac891b40549bba13586b06a2b7f3bac4a6877c866c4827736f68dc69197643c",
    "9aeb286362d2d0303ca93a8f54c5a21f16b90d58f830b41217e69dff7728f882",
    "67de9b5d8b0662fba8679aaa453a2cf182632b4a4481dcdfbb6f67bd569ec761",
    "1a6abc0c94a38295784cb919e59b2af17612c903795276285165ef2ac17321e8",
    "34fec71fff53298565253068430c166edbde6ffb3cfbb697538943a532131955",
    "2adf23162e73b6c69ac46a91bca2f5e7651047b011d0f3b43437f67bb92dbda9",
    "c97fd3d793cafd8e9c142d5d7f31c0a8f13abad26bec6ed376aed6d9cd991df0",
    "ecfe71fbafa66432312fc17e53b9fb5163a20f8b551d3a438a23db7ee84704b5",
    "0da8b8f4dfc1ba584ad78fbc96dce4c8ffc70425c3dc405536d3ec0b055a9bb2",
    "f997ee54e33acb71acdc59dce4970f993d261f4e867262b521c8ab13d6d8ed8a",
    "6d5cbc964a81583188c8d24de02325b3a63f923e449144a98b0bdd6b0dfc3fa6",
    "2926c6cc42a03d5ffffcf3b9bcf7168f885aee9362034283f36585fe8c3dad1a",
    "16bc7d480e744c6e459b453706f1009efbc43f402acc3464b5a9166557a6ec9e",
    "56d01f04061625c8be1de93e763a79c7f79be1dea9f00d03a7f471f7e3c32a95",
    "6997213a3bcb95d485b0bdf17b9886b8d7c0d8b6221ffbec658ee5fbe14dc7c3",
    "c1562887daa90cab30315efe0e213778ef4384bbd3d7442e5aa3272a7796a0d6",
    "dcb4832fb0ece797e6d64bafe7791fe3bdcb04ad811ad4a4701ef6801411c77c",
    "2bc34c340dfcba41c811251b368f0da1bc00a2330a3f5b6d2e25f0e255802663",
    "80640885d93a3ad199d380f815a0c2e69dd94f0894ab9f0ff531d49106e7bf98",
    "a06b8bae26b7085e32079923575b9a4da276a9450de50bf0f118df08d0e21db7",
    "b56a84e184db4a312c0c0b71c03f7f5ba6229e0b7d57a83519c39e76f2253dc4",
    "34cc0e2aa5cf6399299a80430678261aacc539cb8476cf1975c2b921130f6533",
    "d214df498c5acb3ed4ba199a6bd98f13c05e8a2c4e06eb67fed9941ff38d7172",
    "f485a7bd0db7555bf75a70d004efed1fd23e81f84848721df35d20995ee14ae0",
    "95dca034e48526f0c03b3c07c2b124690fc886bea270b36d938580c33efe3e33",
    "6762c17deaa99eeef475550040dd7ee7c234fa4bd7b8140eaa3521d07166f758"
  ]
};

// ─── SUPABASE ───
const { createClient } = require('@supabase/supabase-js');
const SUPA_URL = process.env.SUPA_URL;
const SUPA_SERVICE_KEY = process.env.SUPA_SERVICE_KEY;
let supa = null;
if (SUPA_URL && SUPA_SERVICE_KEY) {
  supa = createClient(SUPA_URL, SUPA_SERVICE_KEY);
  console.log('Supabase: ✓ connected');
} else {
  console.warn('⚠️  SUPA_URL / SUPA_SERVICE_KEY not set — keys will NOT be one-time use');
}

// ─── VALIDATE LICENSE KEY ───
app.post('/api/validate-key', async (req, res) => {
  const { key, email } = req.body;
  if (!key) return res.json({ valid: false, error: 'No key provided' });

  const hash = crypto.createHash('sha256').update(key.trim().toUpperCase()).digest('hex');
  const durations = { weekly: 7*86400000, monthly: 30*86400000, yearly: 365*86400000 };

  let matchedPlan = null;
  for (const [plan, hashes] of Object.entries(LICENSE_HASHES)) {
    if (hashes.includes(hash)) { matchedPlan = plan; break; }
  }
  if (!matchedPlan) return res.json({ valid: false, error: 'Invalid key' });

  if (!supa) {
    console.warn('⚠️  Key used without one-time check:', hash.slice(0, 12));
    return res.json({ valid: true, plan: matchedPlan, duration: durations[matchedPlan] });
  }

  try {
    const { data: existing } = await supa.from('used_keys').select('hash,email,used_at').eq('hash', hash).maybeSingle();
    if (existing) return res.json({ valid: false, error: 'This key has already been used.' });
    await supa.from('used_keys').insert({ hash, plan: matchedPlan, email: email || 'unknown', used_at: new Date().toISOString() });
    console.log(`Key activated — plan: ${matchedPlan}, email: ${email || 'unknown'}`);
    res.json({ valid: true, plan: matchedPlan, duration: durations[matchedPlan] });
  } catch (e) {
    console.error('Key validation error:', e.message);
    res.json({ valid: true, plan: matchedPlan, duration: durations[matchedPlan] });
  }
});

// ─── CANCEL STRIPE SUBSCRIPTION ───
app.post('/api/cancel-sub', async (req, res) => {
  const { email, userName } = req.body;
  if (!email) return res.json({ ok: false, error: 'No email provided' });
  if (!stripe) return res.json({ ok: false, error: 'Stripe not configured' });
  try {
    const customers = await stripe.customers.list({ email: email.toLowerCase(), limit: 1 });
    if (!customers.data.length) return res.json({ ok: false, error: 'No Stripe customer found' });
    const customer = customers.data[0];
    const subs = await stripe.subscriptions.list({ customer: customer.id, status: 'active', limit: 10 });
    if (!subs.data.length) return res.json({ ok: false, error: 'No active subscriptions found' });
    for (const s of subs.data) await stripe.subscriptions.cancel(s.id);
    res.json({ ok: true });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

// ─── AI COACH ───
app.post('/api/chat', async (req, res) => {
  const { system, messages } = req.body;
  if (!OPENAI_KEY) return res.json({ error: 'OpenAI not configured' });
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({ model: 'gpt-4o', max_tokens: 350, messages: [{ role: 'system', content: system }, ...messages] })
    });
    const d = await r.json();
    if (d.error) return res.json({ error: d.error.message });
    res.json({ reply: d.choices[0].message.content });
  } catch (e) {
    res.json({ error: e.message });
  }
});

// ─── HEALTH CHECK ───
app.get('/api/health', (req, res) => {
  res.json({ ok: true, stripe: !!stripe, openai: !!OPENAI_KEY, supabase: !!supa });
});

// ─── CATCH-ALL ───
app.get('*', (req, res) => {
  const publicPath = path.join(__dirname, 'public', 'index.html');
  const rootPath = path.join(__dirname, 'index.html');
  if (fs.existsSync(publicPath)) return res.sendFile(publicPath);
  if (fs.existsSync(rootPath)) return res.sendFile(rootPath);
  res.status(404).send('index.html not found.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n⚡ Athletiq running at http://localhost:${PORT}`);
  console.log(`   Stripe:   ${stripe ? '✓' : '✗ not configured'}`);
  console.log(`   OpenAI:   ${OPENAI_KEY ? '✓' : '✗ not configured'}`);
  console.log(`   Supabase: ${supa ? '✓' : '✗ not configured'}\n`);
});