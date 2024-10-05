import { Level } from "level";
import { describe } from "vitest";
import { runStorageAdapterTests } from "@automerge/automerge-repo/helpers/tests/storage-adapter-tests.js";
import { LevelStorageAdapter } from "../src/index.js";

describe("LevelStorageAdapter", () => {
  const db = new Level<string, Uint8Array | undefined>("test/test-db", {
    valueEncoding: "view",
  });

  const setup = async () => {
    await db.clear();
    const adapter = new LevelStorageAdapter(db);
    return { adapter };
  };

  runStorageAdapterTests(setup);
});
