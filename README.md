# Visualize

TLDR: Type in a data related query (i.e top 10 streamed songs on Dec 12, 2017). An agent pipeline researches it on the live web, picks the way to visualize the data, and renders an aesthetic visualization. The user can publish it to a public masonry feed on the homepage (no social-media integration).

# Background

Usually I go down random data rabbit holes (i.e what were the top 10 streamed songs on Spotify on Dec 12, 2017, or what were the cost of groceries when I was born?). 

Not just are these random facts, but they also expose patterns about society (i.e inflation, why songs are getting shorter overtime, why the most expensive cappuccino is in Copenhagen while its rent costs less than US). You can’t just see a spreadsheet, actually have to see what is going on.

Hence, I built Visualize (Pinterest for data visualization) where you can go and literally type anything you want to see a data visual of. 

The agent will search and get the data, and then find the best way to present it to you. Then it creates a very nice data visualization which then can share it to a public feed (i.e on social media or to the homepage of the website).

# Four components:
1. Research & data pipeline
2. Visualization & specification engine
3. Real-Time Streaming Architecture
4. Persistence & Feed

# Tech Stack

**Web**: Next.js (App Router) + TypeScript + Tailwind CSS

**API**: Node.js/Express server (agent runs exceed serverless timeouts and hold a streaming connection)

**DB**: PostgreSQL + Drizzle ORM. Local dev: Postgres in Docker (docker-compose). Deploy: GCP

**AI/data**: Vercel AI SDK + Gemini Flash (@ai-sdk/google, free tier), Tavily Search API, Zod for schema validation

**Charts**: visx / D3.js (d3-scale, d3-shape, d3-hierarchy, d3-geo + us-atlas)

# Structure

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