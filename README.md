# 🤖 AI Code Review Bot

An automated GitHub App that reviews pull requests using **GPT-4o**. It analyzes code diffs, flags bugs, suggests improvements, and posts inline comments — just like a senior engineer would.

## Stack

| Layer     | Tech                       |
| --------- | -------------------------- |
| Runtime   | Bun.js                     |
| Framework | Express.js + TypeScript    |
| Database  | PostgreSQL (Drizzle ORM)   |
| Queue     | BullMQ + Redis             |
| AI        | OpenAI GPT-4o              |
| Auth      | GitHub App JWT             |
| Frontend  | React + Vite + TailwindCSS |

## Quick Start

### 1. Prerequisites

- [Bun](https://bun.sh) installed
- Docker + Docker Compose
- A [GitHub App](https://github.com/settings/apps/new) created

### 2. Create GitHub App

Go to **GitHub → Settings → Developer Settings → GitHub Apps → New GitHub App**:

- **Webhook URL**: Your ngrok URL + `/api/webhook`
- **Webhook secret**: Any random string
- **Permissions**:
  - `Pull requests`: Read & Write
  - `Contents`: Read-only
- **Subscribe to events**: `Pull request`
- Generate and download a **private key** (PEM file)

### 3. Configure Environment

```bash
cp .env.example apps/api/.env
```

Fill in `apps/api/.env`:

```bash
GITHUB_APP_ID=123456
GITHUB_APP_PRIVATE_KEY=$(base64 -w 0 your-app.private-key.pem)
GITHUB_WEBHOOK_SECRET=your-webhook-secret
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://codereview:codereview_secret@localhost:5432/codereview
REDIS_URL=redis://localhost:6379
```

### 4. Start Infrastructure

```bash
docker compose up -d
```

### 5. Run Database Migrations

```bash
cd apps/api
bun run db:push
```

### 6. Start the API

```bash
cd apps/api
bun run dev
```

### 7. Expose Webhook (for local dev)

```bash
ngrok http 3000
```

Copy the ngrok URL and update your GitHub App's webhook URL to `https://<ngrok-id>.ngrok.io/api/webhook`.

### 8. Start the Dashboard

```bash
cd apps/web
bun run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 9. Install the App

Go to your GitHub App's page and install it on a repository. Then open a pull request — the bot will review it within ~30 seconds!

## How It Works

```
PR Opened/Updated
      ↓
GitHub Webhook → POST /api/webhook
      ↓
Verify HMAC signature
      ↓
Create review record (DB) + Enqueue BullMQ job
      ↓ (async)
Worker: Fetch PR diff via GitHub API
      ↓
Parse unified diff → structured chunks
      ↓
Send to GPT-4o → structured JSON feedback
      ↓
Post inline review comments via GitHub API
      ↓
Save comments to PostgreSQL
      ↓
Dashboard shows review history + stats
```

## API Endpoints

| Method | Path                         | Description              |
| ------ | ---------------------------- | ------------------------ |
| `POST` | `/api/webhook`               | GitHub webhook receiver  |
| `GET`  | `/api/reviews`               | Paginated review list    |
| `GET`  | `/api/reviews/:id`           | Review detail + comments |
| `GET`  | `/api/reviews/stats/summary` | Aggregate stats          |
| `GET`  | `/api/reviews/repos/list`    | Tracked repositories     |
| `GET`  | `/health`                    | Health check             |

## Project Structure

```
synthetic-eclipse/
├── apps/
│   ├── api/                    # Bun.js + Express backend
│   │   └── src/
│   │       ├── ai/             # GPT-4 reviewer + prompts
│   │       ├── config/         # Env + logger
│   │       ├── db/             # Drizzle schema + connection
│   │       ├── github/         # Webhook, diff parser, commenter
│   │       ├── queue/          # BullMQ producer + worker
│   │       ├── routes/         # Webhook + reviews routes
│   │       └── services/       # Review orchestration
│   └── web/                    # React + Vite dashboard
│       └── src/
│           ├── api/            # Axios client + types
│           ├── components/     # Layout
│           └── pages/          # Dashboard, History, Detail
├── docker-compose.yml
└── .env.example
```

## Resume Talking Points

> _"Built a full-stack GitHub App that integrates with GitHub webhooks to automatically review pull requests using GPT-4o. The system parses unified diffs, sends structured prompts to OpenAI, and posts inline PR comments via the GitHub API. Includes a React dashboard with review history and severity analytics. Stack: Bun.js, TypeScript, Express, PostgreSQL (Drizzle ORM), BullMQ, OpenAI API, React."_
