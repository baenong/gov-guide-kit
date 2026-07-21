import { visit } from 'unist-util-visit';

export function rehypeImages() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'img') return;
      const existingClasses = Array.isArray(node.properties?.className)
        ? node.properties.className
        : [];
      node.properties = {
        ...node.properties,
        loading: 'lazy',
        decoding: 'async',
        className: [...existingClasses, 'guide-image'],
      };
    });
  };
}
