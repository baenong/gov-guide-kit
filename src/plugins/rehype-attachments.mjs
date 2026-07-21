import { visit } from 'unist-util-visit';

const DOCUMENT_EXTENSIONS = new Set([
  'pdf', 'hwp', 'hwpx', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip',
]);

function extractLinkText(node) {
  let text = '';
  visit(node, 'text', (t) => {
    text += t.value;
  });
  return text;
}

export function rehypeAttachments() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'a') return;
      const href = node.properties?.href;
      if (typeof href !== 'string') return;

      const ext = href.split('.').pop()?.toLowerCase();
      if (!ext || !DOCUMENT_EXTENSIONS.has(ext)) return;

      const linkText = extractLinkText(node).trim();
      const filename = linkText || decodeURIComponent(href.split('/').pop() ?? href);

      node.properties = {
        ...node.properties,
        download: true,
        className: ['guide-attachment-card'],
      };
      node.children = [
        {
          type: 'element',
          tagName: 'span',
          properties: {
            className: ['guide-attachment-card__icon', `guide-attachment-card__icon--${ext}`],
          },
          children: [{ type: 'text', value: ext.toUpperCase() }],
        },
        {
          type: 'element',
          tagName: 'span',
          properties: { className: ['guide-attachment-card__name'] },
          children: [{ type: 'text', value: filename }],
        },
      ];
    });
  };
}
