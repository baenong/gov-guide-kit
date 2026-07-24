import { visit } from 'unist-util-visit';

const CALLOUT_TYPES = new Set(['notice', 'warning']);
const EVENT_LINE = /^(\d{4}-\d{2}-\d{2})(?:~(\d{4}-\d{2}-\d{2}))?:\s*(.+)$/;

function extractText(node) {
  let text = '';
  visit(node, 'text', (t) => {
    text += t.value;
  });
  return text;
}

function extractEvents(containerNode) {
  const events = [];
  visit(containerNode, 'listItem', (item) => {
    const line = extractText(item).trim();
    const match = line.match(EVENT_LINE);
    if (match) {
      const [, date, endDate, title] = match;
      events.push(endDate ? { date, endDate, title } : { date, title });
    }
  });
  return events;
}

export function remarkContainers() {
  return (tree) => {
    visit(tree, (node) => node.type === 'containerDirective', (node) => {
      if (CALLOUT_TYPES.has(node.name)) {
        node.data = node.data || {};
        node.data.hName = 'div';
        node.data.hProperties = {
          className: ['guide-callout', `guide-callout--${node.name}`],
        };
        return;
      }

      if (node.name === 'calendar') {
        const events = extractEvents(node);
        node.children = [];
        node.data = node.data || {};
        node.data.hName = 'div';
        node.data.hProperties = {
          className: ['guide-calendar'],
          'data-events': JSON.stringify(events),
        };
      }
    });
  };
}
