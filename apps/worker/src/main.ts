import { createPrismaClient } from "@nextstep/database";
import {
  DeterministicLocalScanner,
  mediaConfiguration,
  S3PrivateMediaStore,
} from "@nextstep/media";

import { MediaJobs } from "./media-jobs.js";

const configuration = mediaConfiguration();
const database = createPrismaClient();
const jobs = new MediaJobs(
  database,
  new S3PrivateMediaStore(configuration),
  new DeterministicLocalScanner(),
  configuration,
);
let stopping = false;

const stop = () => {
  stopping = true;
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

while (!stopping) {
  const worked = await jobs.runOnce();
  if (!worked) await new Promise((resolve) => setTimeout(resolve, 500));
}
await database.$disconnect();
