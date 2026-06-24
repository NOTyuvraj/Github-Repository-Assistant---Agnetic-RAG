import * as parser from "@babel/parser";
import { readFile } from "node:fs/promises";

export const jsChunker = async (filePath) => {
  try {
    console.log(filePath);
    const code = await readFile(filePath, "utf-8");
    const parsedCode = parser.parse(code, {
      locations: true,
      sourceType: "module",
    });

    const results = [];
    const lines = code.split("\n");

    for (const chunk of parsedCode.program.body) {
      let funcName, lineStart, lineEnd, text;

      if (chunk.type === "ExportNamedDeclaration") {
        if (chunk.declaration?.type === "FunctionDeclaration") {
          funcName = chunk.declaration.id.name;
          lineStart = chunk.declaration.loc.start.line;
          lineEnd = chunk.declaration.loc.end.line;
          text = lines.slice(lineStart - 1, lineEnd).join("\n");
        } else if (chunk.declaration?.declarations) {
          funcName = chunk.declaration.declarations[0].id.name;
          lineStart = chunk.declaration.declarations[0].loc.start.line;
          lineEnd = chunk.declaration.declarations[0].loc.end.line;
          text = lines.slice(lineStart - 1, lineEnd).join("\n");
        } else {
          continue;
        }
      } else if (chunk.type === "FunctionDeclaration") {
        funcName = chunk.id.name;
        lineStart = chunk.loc.start.line;
        lineEnd = chunk.loc.end.line;
        text = lines.slice(lineStart - 1, lineEnd).join("\n");
      } else if (
        chunk.type === "ExportNamedDeclaration" &&
        chunk.declaration?.type === "FunctionDeclaration"
      ) {
        funcName = chunk.declaration.id.name;
        lineStart = chunk.declaration.loc.start.line;
        lineEnd = chunk.declaration.loc.end.line;
      } else {
        continue;
      }
      const chunkObj = {
        name: funcName,
        startLine: lineStart,
        endLine: lineEnd,
        filePath: filePath,
        text,
      };
      results.push(chunkObj);
    }
    return results;
  } catch (err) {
    throw err;
  }
};
