import { Module } from "@nestjs/common";

import { WalkingSkeletonController } from "./walking-skeleton.controller.js";
import { WalkingSkeletonService } from "./walking-skeleton.service.js";

@Module({
  controllers: [WalkingSkeletonController],
  providers: [WalkingSkeletonService],
})
export class AppModule {}
