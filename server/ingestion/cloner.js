import { tmpdir } from "node:os";
import simpleGit from "simple-git";
import path from "node:path";

export const cloneRepo = async (repoURL) => {
  try{
    const repoName = repoURL.split('/')[4];
    const cloneDir = path.join( tmpdir() , `./repoCloneFolder/${repoName}-${Date.now()}`);
    await simpleGit().clone(repoURL, cloneDir);
    return cloneDir;
  }
  catch(err){
    throw err;
  }
}