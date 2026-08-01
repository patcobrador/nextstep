import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { loadContract, operations } from "./openapi-utils.mjs";
import {
  destination as typesDestination,
  renderOpenApiTypes,
} from "./generate-openapi-types.mjs";

const contract = await loadContract();
const generated = await readFile(
  resolve(import.meta.dirname, "../src/generated/contract-summary.ts"),
  "utf8",
);
for (const { operationId } of operations(contract)) {
  if (!generated.includes(JSON.stringify(operationId))) {
    console.error(`Generated summary is missing ${operationId}.`);
    process.exitCode = 1;
  }
}
if (process.exitCode !== 1)
  console.log("Generated contract summary is current.");

const generatedTypes = await readFile(typesDestination, "utf8");
const expectedTypes = await renderOpenApiTypes();
if (generatedTypes !== expectedTypes) {
  console.error(
    "Generated OpenAPI types are stale. Run pnpm contracts:generate.",
  );
  process.exitCode = 1;
} else {
  console.log("Generated OpenAPI types are current.");
}
