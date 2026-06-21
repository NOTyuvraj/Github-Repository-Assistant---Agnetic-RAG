import { readdir } from "node:fs/promises";
import path from "node:path";

const unwantedExt = [".txt", ".mp4", ".jpeg", ".svg"];

const unwantedDir = ["node_modules", ".git"];

const unwantedFile = ["package-lock.json", "yarn.lock"];

const fileList = [];

export const filter = async (repoDir) => {
  try {
    
    const files = await readdir(repoDir, { withFileTypes: true });

    for (const file of files) {
      if (file.isDirectory()) {
        if (unwantedDir.includes(file.name)) continue;
        const fullpath = path.join(repoDir, file.name);
        await filter(fullpath);
        console.log(fullpath);
      } else {
        if (unwantedFile.includes(file.name)) continue;
        const extensionName = path.extname(file.name);
        if (unwantedExt.includes(extensionName)) continue;
        const fullpath = path.join(repoDir , file.name);
        fileList.push(fullpath)
      }
    }
    return fileList;
  } catch (err) {
    throw err;
  }
};
