import { Injectable, type OnModuleDestroy } from "@nestjs/common";
import { createPrismaClient } from "@nextstep/database";

@Injectable()
export class PrismaService implements OnModuleDestroy {
  readonly client = createPrismaClient();

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }
}
