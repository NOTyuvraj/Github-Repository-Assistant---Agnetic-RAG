import { tmpdir } from "node:os";
import simpleGit from "simple-git";
import path from "node:path";

export const cloneRepoBranch = async (repoURL, branch) => {
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

  const git = simpleGit();

  if (branch) {
    await git.clone(repoURL, cloneDir, ["--branch", branch, "--single-branch"]);
  } else {
    // Let Git select the repository's default branch.
    await git.clone(repoURL, cloneDir);
  }

  const repoGit = simpleGit(cloneDir);

  const commitSha = (await repoGit.revparse(["HEAD"])).trim();

  const currentBranch = (
    await repoGit.revparse(["--abbrev-ref", "HEAD"])
  ).trim();

  return {
    cloneDir,
    commitSha,
    branch: currentBranch,
  };
};
