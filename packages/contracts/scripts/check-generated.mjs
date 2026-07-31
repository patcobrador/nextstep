import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { loadContract, operations } from "./openapi-utils.mjs";

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
