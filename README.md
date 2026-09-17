# visualize

Structure

  visualize/
  ├── package.json            Root scripts: dev, typecheck, db:up, db:generate, db:migrate
  ├── pnpm-workspace.yaml     Declares apps/* and packages/* as one workspace
  ├── tsconfig.base.json      Shared strict TypeScript settings every package extends
  ├── docker-compose.yml      Local Postgres 17 (user/pass/db = visualize, port 5432)
  ├── .env.example / .env     One env file for the whole repo (DB URL, API keys, ports)
  ├── design/mockups/         Your 17 screenshots
  │
  ├── packages/shared/        Zod schemas both apps import, so they can't drift apart
  │   └── src/
  │       ├── sources.ts          Citation: url, domain, title
  │       ├── visualization.ts    A finished chart: prompt, title, description, data, spec, sources
  │       ├── events.ts           Stream events (search / consolidate / compose / result / error)
  │       └── charts/
  │           ├── spec.ts         One schema per v1 chart type; rejects charts we can't draw
  │           └── themes.ts       Theme names the agent can pick
  │
  ├── packages/db/            The only code that knows the table layout
  │   ├── drizzle.config.ts       Tells drizzle-kit where the schema and migrations are
  │   └── src/
  │       ├── schema.ts           The `visualizations` table + feed index
  │       └── client.ts           One connection pool, used by api (insert) and web (feed, publish)
  │
  ├── apps/api/               Express: long-running agent runs + streaming
  │   └── src/
  │       ├── index.ts            Server startup, CORS, trust proxy
  │       ├── env.ts              Exits at startup if a key is missing, not halfway through a run
  │       ├── routes/generate.ts  POST /generate: rate limit → validate → stream → pipeline
  │       ├── lib/
  │       │   ├── sse.ts          Stream helper; aborts the run when the browser disconnects
  │       │   ├── llm.ts          The one place the Gemini model is chosen
  │       │   └── tavily.ts       Web search client
  │       └── pipeline/           One file per step, so each can be built and tested alone
  │           ├── index.ts        Orchestrator that runs the steps in order
  │           ├── plan.ts         Hidden: search queries, and whether a follow-up needs new data
  │           ├── search.ts       SEARCH
  │           ├── consolidate.ts  CONSOLIDATE
  │           ├── compose.ts      COMPOSE
  │           └── save.ts         Single INSERT as a draft
  │
  └── apps/web/               Next.js 16: every screen from the mockups
      ├── next.config.ts          Loads root .env, standalone output (for Docker), compiles shared/db
      └── src/
          ├── app/
          │   ├── layout.tsx, globals.css
          │   ├── page.tsx        Homepage feed (Server Component)
          │   └── actions.ts      Publish Server Action
          ├── lib/
          │   ├── feed.ts         Published-charts query
          │   ├── stream.ts       Browser side of POST /generate
          │   ├── session.ts      Session tray storage (sessionStorage)
          │   ├── themes.ts       Actual colors for each theme
          │   └── format.ts       $3.8M, 12.4%, 2h 36m
          └── components/
              ├── Header.tsx              "index" + New visualization
              ├── feed/                   Feed (masonry), FeedCard
              ├── detail/DetailModal.tsx  Read-only card modal
              ├── compose/                AskBar, ComposeModal
              ├── workspace/              Workspace (split view), Terminal
              ├── session/SessionTray.tsx Green dot
              └── charts/                 Chart.tsx (dispatcher) + the 8 v1 chart types