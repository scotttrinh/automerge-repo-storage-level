import type { Level } from "level";
import type {
  StorageAdapterInterface,
  StorageKey,
  Chunk,
} from "@automerge/automerge-repo/slim";

export class LevelStorageAdapter implements StorageAdapterInterface {
  constructor(
    private database: Level<string, Uint8Array | undefined>,
    private keySeparator = "::",
  ) {}

  async load(keyArray: StorageKey): Promise<Uint8Array | undefined> {
    const key = keyArray.join(this.keySeparator);
    const result = await this.database
      .get(key, { valueEncoding: "view" })
      .catch((e: unknown) => {
        if (
          typeof e === "object" &&
          e !== null &&
          "code" in e &&
          e.code === "LEVEL_NOT_FOUND"
        ) {
          return undefined;
        }
        throw e;
      });
    // n.b. even with "view" encoding, the returned value is a Buffer in
    // classic-level (node.js)
    return result
      ? new Uint8Array(result.buffer, result.byteOffset, result.byteLength)
      : undefined;
  }

  async save(keyArray: StorageKey, data: Uint8Array): Promise<void> {
    const key = keyArray.join(this.keySeparator);
    await this.database.put(key, data, { valueEncoding: "view" });
  }

  async remove(keyArray: StorageKey): Promise<void> {
    const key = keyArray.join(this.keySeparator);
    await this.database.del(key);
  }

  async loadRange(keyPrefix: StorageKey): Promise<Chunk[]> {
    const prefix = keyPrefix.join(this.keySeparator);
    const result: Chunk[] = [];
    for await (const [key, value] of this.database.iterator({
      gte: prefix,
      lt: `${prefix}~`,
      valueEncoding: "view",
    })) {
      result.push({
        key: key.split(this.keySeparator),
        data: value
          ? new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
          : undefined,
      });
    }

    return result;
  }

  async removeRange(keyPrefix: StorageKey): Promise<void> {
    if (keyPrefix.length === 0) {
      await this.database.clear();
      return;
    }

    const prefix = keyPrefix.join(this.keySeparator);
    await this.database.clear({ gte: prefix, lt: `${prefix}~` });
  }
}
