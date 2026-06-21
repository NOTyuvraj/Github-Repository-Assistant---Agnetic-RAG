import simpleGit from "simple-git";

export const cloneRepo = async (repoURL) => {
  try{
    const repoName = repoURL.split('/')[4];
    const cloneDir = `./repoCloneFolder/${repoName}-${Date.now()}`
    await simpleGit().clone(repoURL, cloneDir);
    return cloneDir;
  }
  catch(err){
    throw err;
  }
}