# সেবাখোঁজ (ShebaKhoj)

বাংলা-প্রথম, মোবাইল-বান্ধব একটি ছোট ডেমো ওয়েব অ্যাপ। ব্যবহারকারী বাংলা বা
ইংরেজিতে সমস্যা লিখলে সার্ভার-সাইড Gemini API বিষয়টি শ্রেণীবদ্ধ করে, মূল শব্দ
বের করে এবং ডেমো প্রদানকারীদের দেখায়।

> **গুরুত্বপূর্ণ:** প্রদর্শিত সব নাম কাল্পনিক ডেমো লেবেল। এরা বাস্তব ব্যক্তি বা
> প্রতিষ্ঠান নয়, এবং কোনো ফোন নম্বর/যোগাযোগ তথ্য দেওয়া হয় না।

## আর্কিটেকচার

```
public/            → স্ট্যাটিক ফ্রন্টএন্ড (Vercel সরাসরি serve করে)
api/search.js      → Vercel serverless function: POST /api/search
api/providers.js   → Vercel serverless function: GET /api/providers
lib/handlers.js    → Gemini, fallback, provider matching (দুই জায়গায় একই কোড)
providers.js       → ছোট ডেমো ডেটাসেট
server.js          → শুধু লোকাল ডেভেলপমেন্টের জন্য HTTP সার্ভার
```

মূল `server.listen()` সার্ভার Vercel-এ চলে না। তাই ব্যাকএন্ডকে serverless
function-এ রূপান্তর করা হয়েছে। লোকাল `node server.js` একই handlers ব্যবহার করে,
তাই লোকাল ও প্রোডাকশনের আচরণ একই।

## লোকাল ডেভেলপমেন্ট

প্রয়োজন: Node.js 18+ (Vercel-এ 20+ ব্যবহার করা হয়)। কোনো npm ইনস্টলের প্রয়োজন নেই।

1. `.env` ফাইলে key বসান (এই ফাইল `.gitignore`-এ আছে):

   ```text
   GEMINI_API_KEY=আপনার_প্রকৃত_কী
   ```

   অথবা shell-এ সেট করুন:

   ```powershell
   $env:GEMINI_API_KEY = "আপনার_প্রকৃত_কী"
   ```

2. চালু করুন:

   ```powershell
   node server.js
   # অথবা: npm run dev
   ```

3. খুলুন: <http://127.0.0.1:3000>

Key না থাকলে অ্যাপ **ডেমো মোডে** চলে এবং ফলাফলে স্পষ্টভাবে তা দেখানো হয়।

### ঐচ্ছিক environment variable

| Variable | Default | কাজ |
| --- | --- | --- |
| `GEMINI_API_KEY` | (খালি) | Gemini key, শুধু সার্ভারে ব্যবহৃত; ব্রাউজারে যায় না |
| `GEMINI_MODEL` | `gemini-3.5-flash` | ব্যবহৃত মডেল (নতুন key-এ `gemini-2.5-flash` পাওয়া যায় না) |
| `PORT` | `3000` | শুধু লোকাল সার্ভারের পোর্ট |
| `HOST` | `127.0.0.1` | শুধু লোকাল; বাইরে থেকে চাইলে `0.0.0.0` |

## Vercel-এ deploy

1. GitHub repository-তে কোড push করুন (remote ইতিমধ্যে connected)।

2. Vercel Dashboard → **Add New… → Project** → repository `shebakhoj` import করুন।

3. বিল্ড কনফিগারেশন:
   - **Framework Preset:** Other
   - **Root Directory:** repository root (default)
   - **Build Command:** খালি রাখুন
   - **Output Directory:** default (Vercel `public/` স্বয়ংক্রিয়ভাবে serve করে)

4. **Environment Variables** যোগ করুন (Project Settings → Environment Variables):
   - `GEMINI_API_KEY` = আপনার প্রকৃত key — Production / Preview / Development যেকোনো পরিবেশে
   - ঐচ্ছিক: `GEMINI_MODEL` = `gemini-3.5-flash`

   `.env` ফাইল Git-এ নেই, তাই Vercel-এ upload হয় না। প্রোডাকশনে key শুধু
   Vercel environment variable থেকে পড়া হয়।

5. **Deploy** ক্লিক করুন। Vercel স্বয়ংক্রিয়ভাবে:
   - `public/` থেকে ফ্রন্টএন্ড serve করবে
   - `api/search.js` ও `api/providers.js` কে Node.js serverless function বানাবে

6. প্রতিটি push-এ Vercel auto-deploy করবে। Key পরিবর্তন করলে **Redeploy** করুন।

### যাচাই

Deploy-এর পর:

- `https://<your-project>.vercel.app/` → হোমপেজ
- `https://<your-project>.vercel.app/api/providers` → `{ "demo": true, ... }`
- `POST https://<your-project>.vercel.app/api/search` — বডি `{ "query": "ফ্যান নষ্ট" }` সহ
  → `.mode` হবে `ai` (key থাকলে) বা `demo` (না থাকলে)

## API

- `GET /api/providers` — শুধু-পড়া; কাল্পনিক ডেমো প্রদানকারী ফেরত দেয়।
- `POST /api/search` — `{ "query": "..." }` নেয়; ফেরত দেয়
  `{ category, categoryLabel, keywords, summary, providers, mode, note }`।
- AI ব্যর্থ বা key না থাকলে ডেমো শ্রেণীবিভাগে ফিরে যায়; কখনো key দেখায় না।

## ডেমো সীমাবদ্ধতা

কোনো বাস্তব প্রদানকারী, ফোন নম্বর, রিভিউ বা বুকিং সিস্টেম নেই। এটি শিখন/
প্রতিযোগিতার নমুনা মাত্র।
