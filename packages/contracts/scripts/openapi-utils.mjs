import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { parse } from "yaml";

export const contractPath = resolve(
  import.meta.dirname,
  "../../../contracts/openapi.yaml",
);

export async function loadContract() {
  return parse(await readFile(contractPath, "utf8"));
}

export function operations(contract) {
  return Object.entries(contract.paths ?? {}).flatMap(([path, pathItem]) =>
    ["get", "post", "put", "patch", "delete"].flatMap((method) => {
      const operation = pathItem[method];
      return operation === undefined
        ? []
        : [{ method: method.toUpperCase(), path, ...operation }];
    }),
  );
}
