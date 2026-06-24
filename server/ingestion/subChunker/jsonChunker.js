import {readFile} from "node:fs/promises"

export const jsonChunker = async (filePath)=> {
    try{
        const jsonCode = await readFile(filePath, 'utf-8');
        const jsonParser = JSON.parse(jsonCode);
        const results = [];

        for(const [key,value] of Object.entries(jsonParser)){
            results.push({
                name:key,
                startLine:null,
                endLine:null,
                filePath:filePath,
                text:JSON.stringify({[key]: value}, null , 2)
            });
        }
        return results;

    }catch(err){
        throw err;
    }
}
