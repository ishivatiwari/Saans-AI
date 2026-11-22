import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { registerAirRoutes } from "./routes/air.ts";
import { registerChatRoutes } from "./routes/chat.ts";

export function createApp() {
  const app = express();
  if (process.env.RENDER === "true") {
    app.set("trust proxy", 1);
  }
  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "script-src": ["'self'"],
          "img-src": ["'self'", "data:"],
          "connect-src": ["'self'"],
        },
      },
    }),
  );
  app.use(express.json({ limit: "20kb" }));
  app.use(
    "/api",
    rateLimit({
      windowMs: 60_000,
      limit: 60,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { error: "Too many requests. Please try again in a minute." },
    }),
  );
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      assistant: process.env.GEMINI_API_KEY ? "ai" : "local",
    });
  });
  registerAirRoutes(app);
  registerChatRoutes(app);
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "API route not found." });
  });
  app.use(
    (
      err: { status?: number },
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      res
        .status(err.status === 413 ? 413 : 400)
        .json({ error: "The request could not be processed." });
    },
  );
  return app;
}
