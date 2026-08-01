import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { format } from "prettier";

import { loadContract, operations } from "./openapi-utils.mjs";

const contract = await loadContract();
const allOperations = operations(contract);
const output = await format(
  `// Generated from contracts/openapi.yaml. Do not edit.\nexport const apiContractVersion = ${JSON.stringify(contract.info.version)} as const;\nexport const operationIds = ${JSON.stringify(
    allOperations.map(({ operationId }) => operationId),
    null,
    2,
  )} as const;\nexport type OperationId = (typeof operationIds)[number];\n`,
  { parser: "typescript" },
);
const destination = resolve(
  import.meta.dirname,
  "../src/generated/contract-summary.ts",
);
await mkdir(resolve(destination, ".."), { recursive: true });
await writeFile(destination, output, "utf8");
console.log(`Generated ${destination}.`);
