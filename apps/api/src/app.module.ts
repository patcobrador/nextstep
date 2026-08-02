import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
} from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";

import { DevelopmentFlowRepository } from "./development-flow.repository.js";
import { AuthorisationService } from "./authorisation.service.js";
import { CheckpointAController } from "./checkpoint-a.controller.js";
import { CheckpointAService } from "./checkpoint-a.service.js";
import { HealthController } from "./health.controller.js";
import {
  ProblemDetailsFilter,
  RequestContextMiddleware,
} from "./http-foundation.js";
import {
  CognitoIdentityAdapter,
  IDENTITY_ADAPTER,
  IdentityGuard,
  LocalHeaderIdentityAdapter,
} from "./identity.js";
import { PrismaService } from "./prisma.service.js";
import { WalkingSkeletonController } from "./walking-skeleton.controller.js";
import { WalkingSkeletonService } from "./walking-skeleton.service.js";

@Module({
  controllers: [
    HealthController,
    CheckpointAController,
    WalkingSkeletonController,
  ],
  providers: [
    PrismaService,
    AuthorisationService,
    CheckpointAService,
    DevelopmentFlowRepository,
    WalkingSkeletonService,
    LocalHeaderIdentityAdapter,
    CognitoIdentityAdapter,
    {
      provide: IDENTITY_ADAPTER,
      inject: [LocalHeaderIdentityAdapter, CognitoIdentityAdapter],
      useFactory: (
        local: LocalHeaderIdentityAdapter,
        cognito: CognitoIdentityAdapter,
      ) => (process.env["IDENTITY_ADAPTER"] === "cognito" ? cognito : local),
    },
    { provide: APP_GUARD, useClass: IdentityGuard },
    { provide: APP_FILTER, useClass: ProblemDetailsFilter },
  ],
  exports: [PrismaService, DevelopmentFlowRepository],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes("*");
  }
}
