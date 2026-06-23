import {readFile} from "node:fs/promises";

export const mdChunker = async (filePath)=> {
    const markdown = await readFile(filePath , 'utf-8');
    const headingRegex = /^(#{1,6}\s+.+)$/gm ;
    const matches = [...markdown.matchAll(headingRegex)]
    const chunks = [];

    for(let i=0 ; i<matches.length ; i++){
        const match = matches[i];
        const nextMatch = matches[i+1];

        const chunkText = markdown.slice(match.index, nextMatch ? nextMatch.index : markdown.length);
        const startLine = markdown.slice(0, match.index).split("\n").length;
        const endLine = startLine + chunkText.split("\n").length - 1;

        chunks.push({
            name: match[0],
            startLine : startLine,
            endLine : endLine,
            filePath: filePath,
            text : chunkText
        })

    }
    return chunks;
}