'use strict';

/**
 * Shared request handlers for ShebaKhoj.
 *
 * Used by both:
 *  - Vercel serverless functions in /api
 *  - the local development server (server.js)
 *
 * The Gemini key is only read from process.env here. On Vercel it comes from
 * the project's Environment Variables; this module never opens a .env file.
 */

const { providers, categoryLabels, categoryOrder } = require('../providers');

const MODEL = (process.env.GEMINI_MODEL || 'gemini-3.5-flash').trim();
const MODEL_FALLBACKS = ['gemini-3.5-flash', 'gemini-flash-lite-latest'].filter(
  (model) => model !== MODEL
);

const PLACEHOLDERS = new Set([
  'paste_your_key_here',
  'your_real_key_here',
  'your_api_key_here',
  'your-key-here',
  'changeme',
]);

function getApiKey() {
  const raw = String(process.env.GEMINI_API_KEY || '').trim();
  if (!raw || PLACEHOLDERS.has(raw.toLowerCase())) return '';
  return raw;
}

function send(res, status, body, type) {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy':
      "default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; form-action 'self'",
  });
  res.end(body);
}

function sendJson(res, status, object) {
  send(res, status, JSON.stringify(object), 'application/json; charset=utf-8');
}

// Vercel parses JSON bodies into req.body; local Node needs the raw stream.
async function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') return JSON.parse(req.body);
    if (typeof req.body === 'object') return req.body;
  }

  return new Promise((resolve, reject) => {
    let raw = '';
    let tooLarge = false;
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      if (tooLarge) return;
      raw += chunk;
      if (raw.length > 12000) {
        tooLarge = true;
        raw = '';
        reject(new Error('too_large'));
      }
    });
    req.on('end', () => {
      if (tooLarge) return;
      try {
        resolve(JSON.parse(raw || '{}'));
      } catch {
        reject(new Error('invalid_json'));
      }
    });
    req.on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// Keyword helpers (demo fallback and provider matching)
// ---------------------------------------------------------------------------
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsTerm(text, term) {
  const value = String(term || '').trim();
  if (!value) return false;
  const lower = String(text || '').toLowerCase();
  if (/^[a-z0-9\s-]+$/i.test(value)) {
    const escaped = escapeRegExp(value.toLowerCase());
    return new RegExp('(?<![a-z0-9])' + escaped + '(?![a-z0-9])', 'i').test(lower);
  }
  return lower.includes(value.toLowerCase());
}

const KEYWORDS = {
  electronics: [
    'ফ্যান', 'fan', 'বিদ্যু', 'electric', 'ওয়্যার', 'wiring', 'এসি', 'ac',
    'ফ্রিজ', 'fridge', 'ওয়াশিং', 'washing', 'ল্যাপটপ', 'laptop',
    'কম্পিউটার', 'computer', 'মোবাইল', 'mobile', 'ফোন', 'phone',
    'টিভি', 'tv', 'রিপেয়ার', 'repair', 'চার্জ', 'সার্কিট', 'লাইট',
    'light', 'সকেট', 'socket', 'সুইচ', 'switch',
  ],
  plumbing: [
    'পাইপ', 'pipe', 'নল', 'ট্যাপ', 'tap', 'ফুটো', 'leak', 'পানি', 'water',
    'বাথরুম', 'bathroom', 'টয়লেট', 'toilet', 'ড্রেন', 'drain', 'শাওয়ার',
    'shower', 'সিঙ্ক', 'sink', 'প্লাম্বিং', 'plumbing',
  ],
  internet: [
    'ইন্টারনেট', 'internet', 'wi-fi', 'wifi', 'ওয়াইফাই', 'রাউটার', 'router',
    'নেটওয়ার্ক', 'network', 'ব্রডব্যান্ড', 'broadband', 'স্পিড', 'speed',
    'সিগন্যাল', 'signal', 'কনেকশন', 'connection',
  ],
  cleaning: [
    'পরিচ্ছন্ন', 'cleaning', 'clean', 'ঝাড়ু', 'mop', 'মেঝে', 'floor',
    'ধুলো', 'dust', 'সাফ', 'সফ', 'ক্লিনিং', 'বাড়ি পরিষ্কার', 'পরিষ্কার',
  ],
  painting: [
    'পেইন্ট', 'paint', 'রঙ', 'color', 'colour', 'দেওয়াল', 'wall',
    'প্লাস্টার', 'plaster', 'পেইন্টার', 'painter',
  ],
  pest_control: [
    'পোকা', 'মাকড়সা', 'কীট', 'pest', 'মশা', 'mosquito', 'ককরোচ',
    'cockroach', 'bug', 'insect', 'ইঁদুর', 'rodent',
  ],
  carpentry: [
    'কাঠ', 'wood', 'দরজা', 'door', 'জানালা', 'window', 'ফার্নিচার',
    'furniture', 'তাক', 'shelf', 'কাঠমিস্ত্রি', 'carpenter', 'টেবিল',
    'table', 'চেয়ার', 'chair',
  ],
};

function fallbackAnalyze(query) {
  const text = String(query || '').toLowerCase();
  let best = 'other';
  let bestScore = 0;
  const found = [];

  for (const [category, terms] of Object.entries(KEYWORDS)) {
    let score = 0;
    for (const term of terms) {
      if (containsTerm(text, term)) {
        score += 1;
        if (!found.includes(term)) found.push(term);
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = category;
    }
  }

  let keywords = found.slice(0, 6);
  if (keywords.length < 4) {
    const words = String(query || '')
      .split(/[\s,।.!?;:]+/)
      .map((word) => word.trim())
      .filter(
        (word) =>
          word.length >= 3 &&
          !keywords.some((keyword) => keyword.toLowerCase() === word.toLowerCase())
      );
    keywords = keywords.concat(words.slice(0, 6 - keywords.length));
  }

  const summary = bestScore
    ? `বর্ণনা থেকে মনে হচ্ছে ${categoryLabels[best]} সেবার প্রয়োজন।`
    : 'বর্ণনাটি খুব সংক্ষিপ্ত; সঠিক সেবা বেছে নিতে আরও কিছু বিশদ যোগ করুন।';

  return { category: best, keywords, summary };
}

// ---------------------------------------------------------------------------
// Gemini (server-side only)
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = [
  'You classify a short service request written in Bangla or English for a',
  'demo local-service discovery website in Bangladesh.',
  'Return ONLY a JSON object (no markdown) with exactly these fields:',
  '- "category": MUST be exactly one of these lowercase ASCII strings:',
  '  electronics, plumbing, internet, cleaning, painting, pest_control, carpentry, other',
  '- "keywords": array of up to 6 short useful Bangla or English keywords describing the problem',
  '- "summary": one short Bangla sentence summarizing the request',
  'Do NOT translate or rename the category value. Use "other" only when no listed category fits.',
  'Never include phone numbers or real identities.',
].join('\n');

function parseJsonFromText(text) {
  let cleaned = String(text || '').trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end > start) cleaned = cleaned.slice(start, end + 1);
  return JSON.parse(cleaned);
}

async function callGemini(query, key) {
  const models = [MODEL].concat(MODEL_FALLBACKS);
  let lastError = null;

  for (const model of models) {
    // The key is only ever used in this server-side request.
    const url =
      'https://generativelanguage.googleapis.com/v1beta/models/' +
      encodeURIComponent(model) +
      ':generateContent';

    try {
      const response = await fetch(url + '?key=' + encodeURIComponent(key), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: query }] }],
          generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
        }),
        signal: AbortSignal.timeout(12000),
      });

      if (!response.ok) throw new Error('Gemini HTTP ' + response.status);
      const data = await response.json();
      const parts =
        data && data.candidates && data.candidates[0] &&
        data.candidates[0].content && data.candidates[0].content.parts;
      const text = Array.isArray(parts)
        ? parts.map((part) => (typeof part.text === 'string' ? part.text : '')).join('')
        : '';
      return parseJsonFromText(text);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Gemini unavailable');
}

function normalizeAnalysis(input, query) {
  const object = input && typeof input === 'object' ? input : {};
  const rawCategory = String(object.category || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  let category = categoryOrder.includes(rawCategory) ? rawCategory : '';
  if (!category) {
    // Some models answer with a Bangla label instead of the required key.
    for (const key of categoryOrder) {
      const label = String(categoryLabels[key] || '').toLowerCase();
      if (label && (rawCategory.includes(label) || label.includes(rawCategory))) {
        category = key;
        break;
      }
    }
  }

  let keywords = Array.isArray(object.keywords)
    ? object.keywords
        .filter((keyword) => typeof keyword === 'string')
        .map((keyword) => keyword.trim().slice(0, 40))
        .filter(Boolean)
        .slice(0, 6)
    : [];

  if (!category) {
    const hint = fallbackAnalyze([query, keywords.join(' ')].filter(Boolean).join(' '));
    category = hint.category;
  }
  if (!category) category = 'other';
  if (keywords.length === 0) keywords = fallbackAnalyze(String(object.summary || '')).keywords;

  const summary =
    typeof object.summary === 'string' && object.summary.trim()
      ? object.summary.trim().slice(0, 240)
      : `${categoryLabels[category]} বিষয়ক সেবার প্রয়োজন মনে হচ্ছে।`;

  return { category, keywords, summary };
}

// ---------------------------------------------------------------------------
// Matching demo providers
// ---------------------------------------------------------------------------
function matchProviders(analysis) {
  const keywords = analysis.keywords.map((keyword) => String(keyword).toLowerCase());

  return providers
    .map((provider) => {
      let score = provider.category === analysis.category ? 10 : 0;
      for (const keyword of keywords) {
        if (!keyword) continue;
        if (provider.keywords.some((word) => containsTerm(word, keyword) || containsTerm(keyword, word))) {
          score += 2;
        }
        if (provider.specialties.some((item) => containsTerm(item, keyword))) score += 1;
      }
      return { provider, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((entry) => entry.provider);
}

// ---------------------------------------------------------------------------
// Handlers — identical response shape on Vercel and locally
// ---------------------------------------------------------------------------
async function searchHandler(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405, { Allow: 'POST' });
    return res.end();
  }

  let parsed;
  try {
    parsed = await readBody(req);
  } catch (error) {
    const tooLarge = error && error.message === 'too_large';
    return sendJson(res, tooLarge ? 413 : 400, {
      error: tooLarge
        ? 'অনুসন্ধানের লেখা খুব দীর্ঘ।'
        : 'অনুরোধটি পড়া যায়নি। আবার চেষ্টা করুন।',
    });
  }

  const query = typeof parsed.query === 'string' ? parsed.query.trim().slice(0, 500) : '';
  if (!query) {
    return sendJson(res, 400, { error: 'অনুগ্রহ করে সমস্যাটি কয়েক শব্দে লিখুন।' });
  }

  const key = getApiKey();
  let analysis;
  let mode = 'ai';
  let note = '';

  if (!key) {
    analysis = fallbackAnalyze(query);
    mode = 'demo';
    note =
      'GEMINI_API_KEY সেট করা নেই, তাই ডেমো শ্রেণীবিভাগ দেখানো হচ্ছে। ' +
      'পরিবেশে key সেট করলে AI মোড চলবে।';
  } else {
    try {
      analysis = normalizeAnalysis(await callGemini(query, key), query);
    } catch (error) {
      // Never log the key or the request URL that contains it.
      console.error('[gemini] request failed:', error && error.message ? error.message : 'unknown error');
      analysis = fallbackAnalyze(query);
      mode = 'demo';
      note = 'Gemini API-তে পৌঁছানো যায়নি, তাই ডেমো শ্রেণীবিভাগ দেখানো হচ্ছে। পরে আবার চেষ্টা করুন।';
    }
  }

  const matches = matchProviders(analysis);

  return sendJson(res, 200, {
    query,
    category: analysis.category,
    categoryLabel: categoryLabels[analysis.category] || categoryLabels.other,
    keywords: analysis.keywords,
    summary: analysis.summary,
    mode,
    note,
    providers: matches,
    emptyMessage: matches.length
      ? ''
      : 'এই বর্ণনার সাথে মেলে এমন কোনো ডেমো প্রদানকারী নেই। ' +
        'অনুগ্রহ করে সমস্যাটি অন্য শব্দে বা আরও বিশদভাবে লিখুন (যেমন: ফ্যান, পাইপ, ইন্টারনেট, পেইন্ট)।',
  });
}

function providersHandler(req, res) {
  if (req.method !== 'GET') {
    res.writeHead(405, { Allow: 'GET' });
    return res.end();
  }

  return sendJson(res, 200, {
    demo: true,
    notice: 'সব এন্ট্রি কাল্পনিক; কোনো বাস্তব পরিচয় বা যোগাযোগ তথ্য নেই।',
    providers,
  });
}

module.exports = { searchHandler, providersHandler, getApiKey, MODEL };
