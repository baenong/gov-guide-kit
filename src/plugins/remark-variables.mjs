import { readFileSync } from 'node:fs';
import { visit } from 'unist-util-visit';

const VARIABLE_RE = /\{\{\s*([^{}]+?)\s*\}\}/g;

export function remarkVariables(variablesPath) {
  return (tree) => {
    const variables = JSON.parse(readFileSync(variablesPath, 'utf-8'));
    visit(tree, 'text', (node) => {
      node.value = node.value.replace(VARIABLE_RE, (match, rawKey) => {
        const key = rawKey.trim();
        if (Object.prototype.hasOwnProperty.call(variables, key)) {
          return variables[key];
        }
        console.warn(`[remark-variables] 정의되지 않은 변수: {{${key}}}`);
        return match;
      });
    });
  };
}
