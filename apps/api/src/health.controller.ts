import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from "@nestjs/common";

import { PrismaService } from "./prisma.service.js";
import { Public } from "./public.decorator.js";

@Controller("health")
@Public()
export class HealthController {
  constructor(
    @Inject(PrismaService) private readonly database: PrismaService,
  ) {}

  @Get("live")
  live() {
    return { status: "ok" };
  }

  @Get("ready")
  async ready() {
    try {
      await this.database.client.$queryRaw`SELECT 1`;
      return { status: "ready", dependencies: { database: "up" } };
    } catch {
      throw new ServiceUnavailableException("Database is unavailable.");
    }
  }
}
