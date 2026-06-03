<p align="center">
  <a href="https://docodego.com/">
    <img src=".github/logo.png" alt="Branded Survey Builder" width="400" />
  </a>
</p>

# Branded Survey Builder — Assignment Submission

This repository contains a full-stack survey builder application implemented as the SDE intern take-home assignment.
The app includes a survey authoring experience, per-survey branding, public anonymous sharing, and an owner dashboard for response management.

## Completed features
- [x] Email/password sign-up and basic auth flow
- [x] Survey creation with title, description, branding color, and logo URL
- [x] Question builder with add / remove / reorder support
- [x] Three question types: short text, multiple choice, and rating
- [x] Public survey sharing via a unique URL
- [x] Anonymous survey response submission
- [x] Owner dashboard with survey list and response viewer
- [x] Response timestamps formatted consistently in dashboard views
- [x] Public survey pages hide auth, dashboard, and logout links for anonymous users
- [x] Local frontend/backend integration via Vite `/api` proxy

## Tech stack
- Frontend: `React`, `Vite`, `TypeScript`, `TanStack Router`, `Tailwind CSS`
- Backend: `Hono` on Cloudflare Workers
- Database: Cloudflare `D1` (SQLite-compatible)
- Package manager: `pnpm` workspace with `api` and `web`

## Database schema summary
- `users` — stores accounts: `id`, `email`, `name`, `password_hash`, `created_at`
- `surveys` — stores survey metadata and branding: `id`, `user_id`, `title`, `description`, `primary_color`, `logo_url`, `created_at`
- `questions` — stores survey questions: `id`, `survey_id`, `type`, `label`, `options`, `order_index`, `is_required`
- `responses` — stores submissions: `id`, `survey_id`, `respondent_id` (optional), `submitted_at`
- `answers` — stores each answer: `id`, `response_id`, `question_id`, `answer_value`

## Data flow
1. User signs up and is saved in `users`
2. User creates a survey and adds questions to `questions`
3. Public respondents open the shared survey URL and submit answers
4. The backend saves a `responses` record plus one `answers` record per question
5. Survey owner can view responses in the dashboard

## Local development
From the repo root:

```powershell
pnpm install
pnpm dev
```

- `pnpm install` installs dependencies for both `api` and `web`
- `pnpm dev` starts the backend and frontend together
- The frontend runs on `http://localhost:5173`
- The backend runs on `http://127.0.0.1:8787`
- Vite proxies `/api` requests to the local backend so auth and data calls work in development

## Deployment notes
- Backend is deployed on Cloudflare Workers and uses Cloudflare D1
- `api/wrangler.jsonc` includes the D1 binding configuration
- Frontend is not deployed yet, but it can be hosted from the `web` directory on Netlify or Vercel
- For Netlify, use:
  - Base directory: `web`
  - Build command: `pnpm build`
  - Publish directory: `dist`

## Project structure
- `api/` — backend serverless app
  - `src/index.ts` — Hono app and route registration
  - `src/db/schema.ts` — D1 schema SQL and initialization
  - `src/db/queries.ts` — database helper methods
  - `src/routes/` — auth, survey, question, response endpoints
- `web/` — frontend app
  - `src/routes/` — app routes and pages
  - `src/utils/api.ts` — frontend API client
  - `src/utils/date.ts` — shared timestamp formatter

## Known improvements for later
- Add secure sessions or JWT authentication for production
- Add logo upload via Cloudflare R2 instead of URL-only branding
- Add response export / analytics and better validation
- Add access control for survey editing and sharing


