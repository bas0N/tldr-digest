# TLDR Daily Digest

A GitHub Actions-powered app that scrapes tldr.tech daily, uses AI to filter interesting articles (especially agent-related), creates concise summaries, and emails them via Resend.

## Features

- **Multi-source scraping**: Fetches from tldr.tech/tech, /ai, and /dev newsletters
- **AI-powered filtering**: Uses Gemini to score articles for relevance (agents, AI, dev tools)
- **Smart summarization**: Generates 2-3 sentence summaries highlighting key insights
- **Email delivery**: Clean HTML digest via Resend

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo>
cd tldr-digest
npm install
```

### 2. Get API Keys

- **Gemini**: Get a free key at [aistudio.google.com](https://aistudio.google.com)
- **Resend**: Get a key at [resend.com/api-keys](https://resend.com/api-keys)

### 3. Configure Secrets

**Option A: Interactive setup (recommended)**
```bash
gh auth login  # if not already authenticated
./scripts/setup-secrets.sh
```

**Option B: Manual setup**
```bash
gh secret set GEMINI_API_KEY --body "your-key"
gh secret set RESEND_API_KEY --body "your-key"
gh secret set EMAIL_TO --body "your@email.com"
```

### 4. Run

**Locally:**
```bash
export GEMINI_API_KEY="your-key"
export RESEND_API_KEY="your-key"
export EMAIL_TO="your@email.com"
npm run digest
```

**Via GitHub Actions:**
- Push to GitHub
- Go to Actions tab → "Daily TLDR Digest" → "Run workflow"

## Schedule

The workflow runs daily at 8am UTC. Edit `.github/workflows/daily-digest.yml` to change.

## Costs

All free tier:
- **Gemini**: 15 req/min free
- **Resend**: 100 emails/day free
- **GitHub Actions**: 2000 min/month free

## Project Structure

```
tldr-digest/
├── src/
│   ├── scraper.ts       # Fetch & parse TLDR pages
│   ├── filter.ts        # AI filtering with Gemini
│   ├── summarizer.ts    # Generate short summaries
│   ├── emailer.ts       # Send via Resend
│   └── index.ts         # Main orchestrator
├── .github/workflows/
│   └── daily-digest.yml # Cron job
└── scripts/
    └── setup-secrets.sh # Interactive setup
```
