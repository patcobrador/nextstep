import "reflect-metadata";

import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module.js";

if (
  process.env["NODE_ENV"] === "production" &&
  process.env["IDENTITY_ADAPTER"] !== "cognito"
) {
  throw new Error("Production startup requires the Cognito identity adapter.");
}

const app = await NestFactory.create(AppModule, { bufferLogs: true });
app.setGlobalPrefix("v1");
await app.listen(Number(process.env["PORT"] ?? 3001), "127.0.0.1");
