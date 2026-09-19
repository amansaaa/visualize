// POST /generate: rate limit, validate body, open stream, run pipeline.
import { generateRequestSchema } from "@visualize/shared";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { openEventStream } from "../lib/sse";
import { runPipeline } from "../pipeline";

// Routes get attached to the empty router object
export const generateRouter = Router();

// Rate limit by every hour; 10 generations / hour per IP
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

// Connect POST handler on router's root path
generateRouter.post("/", limiter, async (req, res) => {
  const parsed = generateRequestSchema.safeParse(req.body);
  // Unable to parse the client's payload (i.e the query for a visualization)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const stream = openEventStream(res);
  try {
    await runPipeline(parsed.data, stream.send, stream.signal);
  } finally {
    stream.close();
  }
});
