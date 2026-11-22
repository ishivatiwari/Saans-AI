import { existsSync } from "node:fs";
import path from "node:path";
import express from "express";
import { createApp } from "./app.ts";
if (existsSync(".env")) process.loadEnvFile(".env");
const app = createApp();
const dist = path.resolve("dist");
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get("/{*path}", (_req, res) =>
    res.sendFile(path.join(dist, "index.html")),
  );
}
const port = Number(process.env.PORT) || 3001;
const host = process.env.RENDER === "true" ? "0.0.0.0" : "127.0.0.1";
app.listen(port, host, () =>
  console.log(`Saans server listening on port ${port}`),
);
