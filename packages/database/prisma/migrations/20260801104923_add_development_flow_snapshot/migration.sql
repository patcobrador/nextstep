-- CreateTable
CREATE TABLE "DevelopmentFlowSnapshot" (
    "athleteId" UUID NOT NULL,
    "householdKey" TEXT NOT NULL,
    "aggregateVersion" INTEGER NOT NULL DEFAULT 1,
    "state" JSONB NOT NULL,
    "adapterState" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "DevelopmentFlowSnapshot_pkey" PRIMARY KEY ("athleteId")
);

-- CreateIndex
CREATE INDEX "DevelopmentFlowSnapshot_householdKey_idx" ON "DevelopmentFlowSnapshot"("householdKey");
