import { loadContract, operations } from "./openapi-utils.mjs";

const contract = await loadContract();
const failures = [];

if (contract.openapi !== "3.1.0") {
  failures.push("Contract must declare OpenAPI 3.1.0.");
}

const allOperations = operations(contract);
const operationIds = new Set();
for (const operation of allOperations) {
  if (!operation.operationId) {
    failures.push(`${operation.method} ${operation.path} lacks operationId.`);
  } else if (operationIds.has(operation.operationId)) {
    failures.push(`Duplicate operationId: ${operation.operationId}.`);
  } else {
    operationIds.add(operation.operationId);
  }
  if (operation.path.startsWith("/v1/")) {
    failures.push(
      `${operation.method} ${operation.path} duplicates the /v1 server prefix.`,
    );
  }
}

const importantWrites = new Set([
  "completePracticeSession",
  "completeEvidenceUpload",
  "submitEvidence",
  "submitAssessmentDecision",
  "publishCurriculum",
]);
for (const operation of allOperations) {
  if (!importantWrites.has(operation.operationId)) continue;
  const parameters = operation.parameters ?? [];
  if (
    !parameters.some((parameter) => parameter.$ref?.endsWith("/IdempotencyKey"))
  ) {
    failures.push(`${operation.operationId} must require Idempotency-Key.`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `OpenAPI valid: ${Object.keys(contract.paths ?? {}).length} paths, ${allOperations.length} operations.`,
  );
}
