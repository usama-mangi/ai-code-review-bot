# ai-code-review-bot

## Project Overview

An automated, AI-powered GitHub App that integrates into the software development lifecycle as an intelligent code quality gatekeeper. It reviews pull requests using Kimi-K2 (via OpenAI-compatible API), analyzing code diffs, flagging bugs, suggesting improvements, and posting inline comments on PRs.

## Architecture

```
GitHub Webhook → Nginx → Express API → BullMQ (Redis) → Worker → Octokit (GitHub API)
                                                    ↓
                                              PostgreSQL (Drizzle ORM)
```

- **GitHub fires a webhook** on PR open/update → Nginx routes to the Express API
- **API** queues the review task in BullMQ (Redis-backed)
- **Background worker** fetches the PR diff via Octokit → queries the AI model → posts inline review comments
- **PostgreSQL** persists review data (via Drizzle ORM)
- **React dashboard** for monitoring review metrics, severity stats, and history

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Bun.js |
| **Backend** | Express.js, TypeScript |
| **Queue** | BullMQ + Redis |
| **Database** | PostgreSQL + Drizzle ORM |
| **GitHub API** | Octokit |
| **Logging** | Winston |
| **AI** | OpenAI-compatible API (Kimi-K2 via OpenRouter/OpenAI) |
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS, Recharts, date-fns, Axios, Lucide React |
| **DevOps** | Docker, Docker Compose, Nginx, GitHub Actions, Azure VMs |
| **Tooling** | Bun, Drizzle Kit, ESLint |

## Project Structure

```
apps/
├── api/                    # Backend Express API + BullMQ worker
│   ├── src/
│   │   ├── ai/             # AI model integration (Kimi-K2)
│   │   ├── config/         # App configuration
│   │   ├── db/             # Drizzle ORM schema & migrations
│   │   ├── github/         # Octokit integration (PR diffs, comments)
│   │   ├── queue/          # BullMQ job definitions & worker
│   │   ├── routes/         # Express route handlers
│   │   ├── services/       # Business logic services
│   │   ├── auth.middleware.ts
│   │   └── index.ts        # Entry point
│   ├── drizzle/            # Drizzle migrations
│   ├── Dockerfile
│   └── drizzle.config.ts
├── web/                    # React dashboard frontend
│   ├── src/
│   │   ├── api/            # API client (Axios)
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── AuthContext.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── Dockerfile
│   └── vite.config.ts
nginx/
│   └── codereview.conf     # Nginx reverse proxy config
docker-compose.yml          # Dev environment
docker-compose.prod.yml     # Production environment
.github/workflows/deploy.yml # CI/CD pipeline
```

## Key Conventions

- **Monorepo** using Bun workspaces (`apps/*`)
- **TypeScript** throughout (strict mode assumed)
- **Containerized** deployment — every service runs in Docker
- **Environment variables** configured via `.env` (see `.env.example`)
- **Async job processing** via BullMQ — API enqueues, worker processes
- **Drizzle ORM** for database access — migrations in `apps/api/drizzle/`

## Suggested Improvements (from project brief)

1. Multi-model AI provider support (Anthropic, Google, etc.) with fallback logic
2. Sophisticated code analysis — security scanning, performance profiling
3. Code suggestion acceptance workflow (apply suggested changes with a button)
4. Per-repository configuration for review rules and severity thresholds
5. Comment summarization feature to reduce noise on large PRs
6. Parallel multi-file review for faster feedback
7. Webhook retry mechanism and dead letter queue handling
8. User notification system (Slack/Email integration)
9. Performance metrics dashboard (review time, queue depth, model latency)
10. Draft PR support with incremental feedback