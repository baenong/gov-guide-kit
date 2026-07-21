const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export function parseFrontmatter(raw) {
  const match = raw.match(FRONTMATTER_RE);
  if (!match) {
    throw new Error('Front matter block (--- ... ---) not found');
  }
  const [, frontmatterBlock, body] = match;
  const data = {};
  for (const line of frontmatterBlock.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) {
      throw new Error(`Invalid front matter line: "${line}"`);
    }
    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    value = value.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
    data[key] = value;
  }

  if (typeof data.title !== 'string' || data.title === '') {
    throw new Error('Front matter is missing "title"');
  }
  if (data.order === undefined || Number.isNaN(Number(data.order))) {
    throw new Error('Front matter is missing a numeric "order"');
  }

  return {
    title: data.title,
    order: Number(data.order),
    description: data.description,
    body: body.replace(/^\r?\n/, ''),
  };
}

export function serializeFrontmatter({ title, order, description }, body) {
  const lines = [`title: ${title}`, `order: ${order}`];
  if (description) {
    lines.push(`description: ${description}`);
  }
  return `---\n${lines.join('\n')}\n---\n\n${body.trimStart()}\n`;
}
