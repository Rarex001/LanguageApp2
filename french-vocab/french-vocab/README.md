# French Vocab

A personal French vocabulary tool with Reverso Context-style word highlighting, a word bank, and an A–Z browse view. Translations are powered by the free MyMemory API.

## Features

- **Translate tab** — paste any French text, get the English translation, then click individual words to save them to your bank
- **Word bank** — all your saved words with a progress % toward 3,000 common French words
- **Browse A–Z** — all saved words grouped by letter; hover a word to see its translation

## Deploy to Vercel (5 minutes)

### Option A — Deploy from GitHub (recommended)

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your repo
4. Click **Deploy** — no environment variables needed
5. Done! You'll get a live URL like `french-vocab.vercel.app`

### Option B — Deploy via Vercel CLI

```bash
npm install -g vercel
cd french-vocab
npm install
vercel
```

Follow the prompts. Your app will be live in under a minute.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Translation API

Uses [MyMemory](https://mymemory.translated.net/) — free, no API key needed. Rate limit is 1,000 words/day on the free tier. For heavier use, add your email as a query param in `src/app/api/translate/route.ts`:

```
&de=your@email.com
```

This increases the limit to 10,000 words/day.
