import * as parser from "@babel/parser";
import { readFile } from "node:fs/promises";
import path from "node:path";

const isFn = (n) =>
  n?.type === "ArrowFunctionExpression" || n?.type === "FunctionExpression";

export const jsChunker = async (filePath) => {
  const code = await readFile(filePath, "utf-8");

  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: "unambiguous", // handles both ESM and CommonJS
      plugins: ["jsx", "typescript"], // drop "typescript" if JS only
      errorRecovery: true,
    });
  } catch (err) {
    throw new Error(`Failed to parse ${filePath}: ${err.message}`);
  }

  const results = [];
  const leftovers = [];

  const push = (name, node) => {
    results.push({
      name,
      startLine: node.loc.start.line,
      endLine: node.loc.end.line,
      filePath,
      text: code.slice(node.start, node.end),
    });
  };

  // returns true if it produced a chunk
  const handleDeclaration = (decl, outer) => {
    if (!decl) return false;

    if (
      decl.type === "FunctionDeclaration" ||
      decl.type === "ClassDeclaration"
    ) {
      push(decl.id?.name ?? "default", outer);
      return true;
    }
    if (decl.type === "VariableDeclaration") {
      let found = false;
      for (const d of decl.declarations) {
        if (d.id.type === "Identifier" && isFn(d.init)) {
          push(d.id.name, outer);
          found = true;
        }
      }
      return found;
    }
    return false;
  };

  // CommonJS: `app.init = function () {}`, `module.exports = function () {}`
  const handleAssignment = (node) => {
    if (node.type !== "ExpressionStatement") return false;

    const expr = node.expression;

    if (expr.type !== "AssignmentExpression") return false;
    if (expr.left.type !== "MemberExpression") return false;

    if (!isFn(expr.right) && expr.right.type !== "ClassExpression") {
      return false;
    }

    console.log(
      "FOUND ASSIGNMENT:",
      code.slice(expr.left.start, expr.left.end),
    );

    push(code.slice(expr.left.start, expr.left.end), node);

    return true;
  };

  for (const node of ast.program.body) {
    let handled = false;

    switch (node.type) {
      case "FunctionDeclaration":
      case "ClassDeclaration":
      case "VariableDeclaration":
        handled = handleDeclaration(node, node);
        break;
      case "ExportNamedDeclaration":
      case "ExportDefaultDeclaration":
        handled = handleDeclaration(node.declaration, node);
        break;
      case "ExpressionStatement":
        handled = handleAssignment(node);
        break;
    }

    if (!handled) leftovers.push(node);
  }

  // Everything not chunked above: imports, requires, module.exports = ..., constants
  if (leftovers.length) {
    const first = leftovers[0];
    const last = leftovers[leftovers.length - 1];
    results.push({
      name: `${path.basename(filePath)} (top-level)`,
      startLine: first.loc.start.line,
      endLine: last.loc.end.line,
      filePath,
      text: leftovers.map((n) => code.slice(n.start, n.end)).join("\n"),
    });
  }

  return results;
};
