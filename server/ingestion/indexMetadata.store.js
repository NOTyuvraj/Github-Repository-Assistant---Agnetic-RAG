import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const metadataFile =
  process.env.INDEX_METADATA_FILE ||
  path.join(process.cwd(), "data", "index-metadata.json");

const readRegistry = async () => {
  try {
    return JSON.parse(await readFile(metadataFile, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw new Error(`Could not read index metadata: ${error.message}`);
  }
};

export const getIndexMetadata = async (key) => {
  const registry = await readRegistry();
  return registry[key] ?? null;
};

export const saveIndexMetadata = async (key, metadata) => {
  const registry = await readRegistry();
  registry[key] = metadata;

  await mkdir(path.dirname(metadataFile), { recursive: true });

  const temporaryFile = `${metadataFile}.${process.pid}.tmp`;
  await writeFile(temporaryFile, JSON.stringify(registry, null, 2), "utf8");
  await rename(temporaryFile, metadataFile);
};
