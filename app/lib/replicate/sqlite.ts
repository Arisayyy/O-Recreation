import { persistence } from "@trestleinc/replicate/client";

export const sqlite = persistence.web.sqlite.once({
  name: "orchid",
  worker: () =>
    new Worker(new URL("../../workers/replicate-sqlite.worker.ts", import.meta.url), {
      type: "module",
    }),
});

