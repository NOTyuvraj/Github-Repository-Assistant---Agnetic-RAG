import { tmpdir } from "node:os";
import simpleGit from "simple-git";
import path from "node:path";

export const cloneRepoBranch = async (repoURL, branch = "main") => {
  try {
    const repoName =
      new URL(repoURL).pathname
        .split("/")
        .filter(Boolean)
        .at(-1)
        ?.replace(/\.git$/, "") || "repository";

    const cloneDir = path.join(
      tmpdir(),
      "repoCloneFolder",
      `${repoName}-${Date.now()}`,
    );

    await simpleGit().clone(repoURL, cloneDir, [
      "--branch",
      branch,
      "--single-branch",
    ]);
    
    const commitSha = (await simpleGit(cloneDir).revparse(["HEAD"])).trim();

    return {cloneDir, commitSha};

  } catch (err) {
    throw err;
  }
};
