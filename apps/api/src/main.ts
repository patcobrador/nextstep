import "reflect-metadata";

import { ConsoleLogger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module.js";

if (
  process.env["NODE_ENV"] === "production" &&
  process.env["IDENTITY_ADAPTER"] !== "cognito"
) {
  throw new Error("Production startup requires the Cognito identity adapter.");
}

const logger = new ConsoleLogger({
  colors: process.env["NODE_ENV"] !== "production",
  json: process.env["LOG_FORMAT"] !== "pretty",
  prefix: "NextStep",
});
const app = await NestFactory.create(AppModule, { bufferLogs: true, logger });
app.setGlobalPrefix("v1");
app.enableShutdownHooks();
await app.listen(
  Number(process.env["PORT"] ?? 3001),
  process.env["HOST"] ?? "127.0.0.1",
);
