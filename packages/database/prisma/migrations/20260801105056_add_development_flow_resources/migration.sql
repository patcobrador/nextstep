-- CreateTable
CREATE TABLE "DevelopmentFlowResource" (
    "id" UUID NOT NULL,
    "athleteId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DevelopmentFlowResource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DevelopmentFlowResource_athleteId_type_idx" ON "DevelopmentFlowResource"("athleteId", "type");

-- AddForeignKey
ALTER TABLE "DevelopmentFlowResource" ADD CONSTRAINT "DevelopmentFlowResource_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "DevelopmentFlowSnapshot"("athleteId") ON DELETE CASCADE ON UPDATE CASCADE;
