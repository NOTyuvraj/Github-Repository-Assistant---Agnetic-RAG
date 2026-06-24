import { filter } from "./filter.js";
import { chunker } from "./chunker.js";
import { cloneRepo } from "./cloner.js";

export const ingestionOrchestrator = async (repoURL) => {
    try{

        const cloneDir = await cloneRepo(repoURL);
        const filesPath = await filter(cloneDir);
        const chunks = [];
        for(const file of filesPath){
            chunks.push(...await chunker(file));
            
        }
        return chunks;

    }catch(err){
        throw err;
    }
}