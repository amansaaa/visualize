// Express entry point: middleware (CORS, JSON, trust proxy) and route mounting.
import { env } from "./env";
import cors from "cors";
import express from "express";
import { generateRouter } from "./routes/generate";

// Express entry point (creates the application object everything else attaches to)
const app = express();


/**
 * Express typically figures out request's IP address (req.ip) by looking at the TCP connection
 * However, the application sits behind a proxy/load balancer (Cloud Run)
 * so the TCP conncetion Express sees is from the proxy and not the real user
 * Trust proxy tells Express that the IP addresses are from a trusted proxy; so it can read the header X-Forwarded-For
 */
app.set("trust proxy", true);

// Tell's the browser to allow Next.js app and Express API to read from each other (blocked by browser by default)
app.use(cors({ origin: env.WEB_ORIGIN }));

// Reads raw request and parses it as JSON which fills the req.body before the handler parses this in routes/generate.ts
app.use(express.json());

app.use("/generate", generateRouter);

app.listen(env.API_PORT, () => {
  console.log(`apps/api listening on port ${env.API_PORT}`);
});
