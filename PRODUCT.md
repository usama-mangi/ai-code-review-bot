# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Team leads and engineering managers who oversee code quality across multiple repositories. They install the GitHub App on their repos, configure review rules per repository, and use the dashboard to monitor review activity, severity trends, and bot performance. Developers on the team also interact with bot comments on PRs via `/accept` and `/explain` commands.

## Product Purpose

An automated, AI-powered GitHub App that serves as an intelligent first-pass code quality gatekeeper. It reviews pull requests by analyzing code diffs, flagging bugs and security issues, suggesting improvements, and posting inline comments directly on GitHub PRs — before human review begins. The dashboard provides visibility into review activity, severity distributions, and bot health across all connected repositories.

## Positioning

Interactive PR commands that go beyond passive commenting. Unlike tools that only leave review comments, this bot lets developers `/accept` suggested changes (which creates a commit on the PR branch) and `/explain` any finding for deeper educational context. Combined with multi-model AI support (OpenAI, Anthropic, Google with automatic fallback) and a self-hosted architecture, it gives teams full control over their code review pipeline without vendor lock-in.

## Operating Context

- Lives in the GitHub development workflow — triggered by webhook events on PR open, update, reopen, and ready-for-review
- Runs as a Dockerized service (Express API + React dashboard + PostgreSQL + Redis + Nginx) typically deployed on Azure VMs or similar infrastructure
- The dashboard is accessed via browser after GitHub OAuth login
- PR interaction happens entirely on GitHub — developers never need to visit the dashboard to benefit from the bot
- Reviews are processed asynchronously via a BullMQ queue with retry logic and dead letter handling
- Per-repository configuration (severity thresholds, max comments, file patterns, custom instructions, notification targets) is managed through the dashboard's Repositories page

## Capabilities and Constraints

**Confirmed functionality:**
- Multi-model AI review with provider fallback chain (OpenAI, Anthropic, Google Gemini)
- Static security pre-scanner (8 regex rules for secrets, SQL injection, eval, innerHTML, etc.)
- Parallel file review (batched in groups of 5)
- Inline GitHub PR comments with severity badges (bug, security, improvement, style, info)
- `/accept` command: applies AI-suggested changes as a commit on the PR branch
- `/explain` command: replies with detailed educational explanation of any finding
- Per-repository configuration: min severity, max comments, draft PR review, file exclude/include patterns, custom AI instructions
- Notification system: Slack (Block Kit webhooks) and email (SendGrid) on review completion
- Dashboard: aggregate stats, severity trends over time, review history with pagination, review detail with file sidebar and filters, repository management, architecture visualization, performance metrics
- Dead letter queue for failed jobs after 5 retries
- Rate limiting (100/min webhooks, 200/min API)

**Technical constraints:**
- GitHub App — requires GitHub App credentials and webhook setup
- PostgreSQL and Redis required
- Bun.js runtime
- Open-source, self-hosted — no managed cloud offering

**Explicitly undecided:**
- No confirmed brand name, voice, or visual identity beyond the favicon asset
- No confirmed accessibility requirements or WCAG target level
- No confirmed target deployment scale (small teams vs. large orgs)

## Brand Commitments

- GitHub App name: `code-qa-review-bot`
- Project codename: `synthetic-eclipse` (root package.json)
- Favicon asset exists at `apps/web/public/favicon.png`
- No formal brand guidelines, color system, or typography choices documented
- No confirmed voice or tone guidelines

## Evidence on Hand

- Full working codebase with API, web dashboard, database schema, queue system, AI providers, and GitHub integration
- `README.md` — architecture overview, tech stack, application flow
- `AGENTS.md` — comprehensive project context including architecture, conventions, and 10 suggested improvements
- `CHANGES.md` — changelog documenting two development rounds (10 feature implementations + 5 token optimization changes, dated July 9-10, 2026)
- `.env.example` — 40 environment variables covering all integration points
- No customer testimonials, case studies, press coverage, or usage metrics
- No marketing copy, landing page, or public-facing documentation beyond the GitHub repo

## Product Principles

1. **Code never leaves your infrastructure.** Self-hosted by default, the bot processes PRs on your servers with your chosen AI provider — no third-party dashboard sees your code unless you choose to share it.
2. **Interactive, not passive.** Review comments are starting points for action: accept suggestions with one command, ask for explanations, configure per-repo rules. The bot participates in the review, it doesn't just annotate it.
3. **Resilient by design.** Queue-based async processing with retries, dead letter queues, and multi-provider fallback means reviews complete even when individual components fail.
4. **Configurable per context.** Every repository has different standards. Severity thresholds, file patterns, custom instructions, and notification targets are all per-repo, not global defaults.

## Accessibility & Inclusion

No product-specific accessibility requirements have been established. The dashboard uses semantic HTML and TailwindCSS utilities but has not been audited against WCAG standards.
