import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import openapiTS, { astToString } from "openapi-typescript";
import { format } from "prettier";

const contractUrl = new URL("../../../contracts/openapi.yaml", import.meta.url);
export const destination = resolve(
  import.meta.dirname,
  "../src/generated/openapi.ts",
);

export async function renderOpenApiTypes() {
  const nodes = await openapiTS(contractUrl);
  return format(
    `// Generated from contracts/openapi.yaml. Do not edit.\n${astToString(nodes)}`,
    { parser: "typescript" },
  );
}

if (
  process.argv[1] &&
  pathToFileURL(process.argv[1]).href === import.meta.url
) {
  await mkdir(resolve(destination, ".."), { recursive: true });
  await writeFile(destination, await renderOpenApiTypes(), "utf8");
  console.log(`Generated ${destination}.`);
}
