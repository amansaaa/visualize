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

