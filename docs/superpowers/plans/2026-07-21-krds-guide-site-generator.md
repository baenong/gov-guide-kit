# KRDS Guide Site Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable Astro-based template repository that public institutions can fork to publish a KRDS-styled, non-developer-editable guide site, deployable to Vercel and/or GitHub Pages with no backend.

**Architecture:** Astro static site generator using classic Content Collections (`type: 'content'` + Zod schema) so front matter errors fail the build with a readable message. Custom `remark`/`rehype` plugins implement `:::notice`/`:::calendar` container directives and turn plain markdown links/images into styled attachment cards and responsive images — content authors never write anything beyond standard markdown plus the `:::` container syntax. All interactive behavior (mobile nav drawer, calendar month navigation) is isolated in small vanilla-JS modules with pure, unit-testable core functions.

**Tech Stack:** Astro 4.x (classic content collections API, not the Astro 5 content-layer loaders — pinned for API stability), remark-directive, unified/remark/rehype toolchain, Vitest + jsdom for unit tests, GitHub Actions + `actions/deploy-pages` for GitHub Pages, Vercel zero-config static deploy.

## Global Constraints

- No backend, no login, no search, no i18n, no custom domain (spec "범위 밖").
- Content authors edit only `src/content/guide/*.md` — front matter (`title: string`, `order: number`, `description?: string`) plus body markdown. They never touch `.astro` files.
- Custom block syntax is plain-text-safe `:::name ... :::` container directives only — no MDX/JSX in content files.
- Attachment cards and responsive images are produced automatically from standard markdown link/image syntax — no special syntax required for those.
- Colors are the single source of truth in root `site.config.ts` (`orgName`, `colors.primary/secondary/accent`, `logoPath`); components reference only the resulting CSS custom properties.
- Body text minimum 14px, base 16px/line-height 1.6, Pretendard font, KRDS heading scale.
- Mobile breakpoint is `max-width: 959px`; below it, sidebar becomes an off-canvas drawer with backdrop, ESC-to-close, backdrop-click-to-close, and a JS focus trap.
- `site.config.ts` primary/secondary colors are checked against WCAG 2.1 AA (4.5:1) at build time; failures are warnings, not build failures (spec: "빌드 경고").
- Deploy target is selected via `DEPLOY_TARGET` env var (`vercel` default, `github-pages` alternate); GitHub Pages build additionally needs `GITHUB_PAGES_BASE`.
- Site language is Korean (`lang="ko"`).

---

### Task 1: Project scaffold & Astro configuration

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `src/pages/index.astro` (temporary placeholder, replaced in Task 8)

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `preview`, `test`, `test:links` — later tasks assume these exist.
- Produces: `astro.config.mjs` exporting a `defineConfig` object with a `markdown.remarkPlugins` / `markdown.rehypePlugins` array that Task 4 and Task 5 append their plugins into.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "krds-guide-site",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "tsx scripts/check-contrast.ts && astro build",
    "preview": "astro preview",
    "test": "vitest run",
    "test:links": "linkinator dist --recurse"
  },
  "dependencies": {
    "astro": "^4.15.0"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "jsdom": "^24.1.0",
    "linkinator": "^6.0.4",
    "rehype-stringify": "^10.0.0",
    "remark-directive": "^3.0.0",
    "remark-parse": "^11.0.0",
    "remark-rehype": "^11.1.0",
    "tsx": "^4.16.0",
    "typescript": "^5.5.0",
    "unified": "^11.0.5",
    "unist-util-visit": "^5.0.0",
    "vitest": "^2.0.0",
    "zod": "^3.23.0"
  }
}
```

- [ ] **Step 2: Create `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import remarkDirective from 'remark-directive';

const deployTarget = process.env.DEPLOY_TARGET ?? 'vercel';
const isGithubPages = deployTarget === 'github-pages';

export default defineConfig({
  site: isGithubPages
    ? 'https://example.github.io'
    : 'https://example.vercel.app',
  base: isGithubPages ? (process.env.GITHUB_PAGES_BASE ?? '/') : '/',
  markdown: {
    remarkPlugins: [remarkDirective],
    rehypePlugins: [],
  },
});
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 4: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 5: Create `.gitignore`**

```
node_modules/
dist/
.astro/
.vercel/
```

- [ ] **Step 6: Create placeholder `src/pages/index.astro`**

```astro
---
---
<html lang="ko">
  <body>
    <p>scaffold placeholder — replaced in Task 8</p>
  </body>
</html>
```

- [ ] **Step 7: Install dependencies and verify the build**

Run: `npm install`
Expected: installs without errors.

Run: `npm run build`
Expected: `astro build` succeeds (contrast script has nothing to check yet — Task 3 adds it, so this build only exercises Astro itself) and `dist/index.html` is created.

- [ ] **Step 8: Commit**

```bash
git add package.json astro.config.mjs tsconfig.json vitest.config.ts .gitignore src/pages/index.astro package-lock.json
git commit -m "chore: scaffold Astro project with build/test tooling"
```

---

### Task 2: Content collection schema & sample content

**Files:**
- Create: `src/content/schema.ts`
- Create: `src/content/config.ts`
- Create: `src/content/guide/index.md`
- Create: `src/content/guide/sample.md`
- Test: `tests/schema.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `guideSchema` (zod object) from `src/content/schema.ts`, consumed only by `src/content/config.ts`.
- Produces: `guide` collection with schema `{ title: string, order: number, description?: string }`, importable from `astro:content` as `getCollection('guide')` / `getEntry('guide', slug)` — Task 8 (routing) and Task 7 (sidebar) depend on this exact shape.

- [ ] **Step 1: Write the failing schema test**

```ts
// tests/schema.test.ts
import { describe, it, expect } from 'vitest';
import { guideSchema } from '../src/content/schema';

describe('guide content schema', () => {
  it('accepts valid front matter', () => {
    expect(() =>
      guideSchema.parse({ title: '임용등록 안내', order: 1 }),
    ).not.toThrow();
  });

  it('rejects a non-numeric order field', () => {
    expect(() =>
      guideSchema.parse({ title: '임용등록 안내', order: '일' }),
    ).toThrow();
  });

  it('rejects missing title', () => {
    expect(() => guideSchema.parse({ order: 1 })).toThrow();
  });
});
```

Note: the schema is defined in a plain `src/content/schema.ts` module using `zod` directly (not re-exported through `astro:content`, which is a virtual module that only resolves inside Astro's own Vite pipeline and cannot be imported from a plain Vitest run). `src/content/config.ts` (Step 3) imports this same schema object into `defineCollection`, so there is exactly one schema definition, tested directly and reused by Astro at build time.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/schema.test.ts`
Expected: FAIL — `Cannot find module '../src/content/schema'`.

- [ ] **Step 3: Create `src/content/schema.ts`**

```ts
import { z } from 'zod';

export const guideSchema = z.object({
  title: z.string(),
  order: z.number(),
  description: z.string().optional(),
});
```

- [ ] **Step 4: Create `src/content/config.ts`**

```ts
import { defineCollection } from 'astro:content';
import { guideSchema } from './schema';

const guide = defineCollection({
  type: 'content',
  schema: guideSchema,
});

export const collections = { guide };
```

- [ ] **Step 5: Create sample content `src/content/guide/index.md`**

```md
---
title: 메인
order: 0
---

:::notice
이 사이트는 예시 안내 페이지입니다. 실제 배포 전 콘텐츠를 교체하세요.
:::

## 공지사항

- 신규 임용 공무원은 아래 절차를 순서대로 확인하세요.

:::calendar
- 2026-08-15: 임용등록 마감
- 2026-08-20: 서류 제출
:::
```

- [ ] **Step 6: Create sample content `src/content/guide/sample.md`**

```md
---
title: 예시 안내 페이지
order: 1
description: 목차와 페이지 링크 동작을 확인하기 위한 예시 페이지
---

## 준비 서류

아래 서류를 순서대로 준비합니다.

1. 신분증 사본
2. 증명사진 1매
3. 임용등록원서

## 자주 묻는 질문

- 접수 기한을 놓치면 어떻게 되나요?

자세한 내용은 [메인 페이지](/)를 참고하세요.
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npx vitest run tests/schema.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 8: Commit**

```bash
git add src/content/schema.ts src/content/config.ts src/content/guide/index.md src/content/guide/sample.md tests/schema.test.ts
git commit -m "feat: add guide content collection schema and sample pages"
```

---

### Task 3: Branding config & WCAG contrast checker

**Files:**
- Create: `site.config.ts`
- Create: `src/lib/contrast.ts`
- Create: `scripts/check-contrast.ts`
- Test: `tests/contrast.test.ts`

**Interfaces:**
- Produces: `contrastRatio(hexA, hexB): number` and `meetsAA(foregroundHex, backgroundHex): boolean` from `src/lib/contrast.ts` — consumed by `scripts/check-contrast.ts` and, in Task 6, by `BaseLayout.astro` (which reads `site.config.ts` colors, not `contrast.ts`).
- Produces: default export of `site.config.ts` with shape `{ orgName: string, colors: { primary: string, secondary: string, accent: string }, logoPath: string }` — consumed by Task 6 (`BaseLayout.astro`), Task 7 (`Header.astro`/`Footer.astro`).

- [ ] **Step 1: Write the failing contrast test**

```ts
// tests/contrast.test.ts
import { describe, it, expect } from 'vitest';
import { contrastRatio, meetsAA } from '../src/lib/contrast';

describe('contrastRatio', () => {
  it('returns 21 for black on white', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
  });

  it('returns 1 for identical colors', () => {
    expect(contrastRatio('#1A2D65', '#1A2D65')).toBeCloseTo(1, 5);
  });
});

describe('meetsAA', () => {
  it('passes for a dark navy on white', () => {
    expect(meetsAA('#1A2D65', '#FFFFFF')).toBe(true);
  });

  it('fails for a light gray on white', () => {
    expect(meetsAA('#CCCCCC', '#FFFFFF')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/contrast.test.ts`
Expected: FAIL — `Cannot find module '../src/lib/contrast'`.

- [ ] **Step 3: Implement `src/lib/contrast.ts`**

```ts
export function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const channel = c / 255;
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function contrastRatio(hexA: string, hexB: string): number {
  const l1 = relativeLuminance(hexToRgb(hexA));
  const l2 = relativeLuminance(hexToRgb(hexB));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsAA(foregroundHex: string, backgroundHex: string): boolean {
  return contrastRatio(foregroundHex, backgroundHex) >= 4.5;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/contrast.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Create `site.config.ts`**

```ts
export interface SiteConfig {
  orgName: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  logoPath: string;
}

const siteConfig: SiteConfig = {
  orgName: '기관명',
  colors: {
    primary: '#1A2D65',
    secondary: '#018FD7',
    accent: '#7AC38E',
  },
  logoPath: '/assets/logo.svg',
};

export default siteConfig;
```

- [ ] **Step 5b: Create the placeholder logo referenced by `logoPath`**

`site.config.ts`'s default `logoPath` (`/assets/logo.svg`) is an absolute path served from Astro's `public/` directory. Without a real file there, `Header.astro` (Task 7) renders a broken `<img>` and Task 10's link checker fails the build.

```bash
mkdir -p public/assets
```

Create `public/assets/logo.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#FFFFFF" />
  <text x="16" y="21" font-family="sans-serif" font-size="14" font-weight="700" text-anchor="middle" fill="#1A2D65">로고</text>
</svg>
```

- [ ] **Step 6: Create `scripts/check-contrast.ts`**

```ts
import siteConfig from '../site.config';
import { meetsAA } from '../src/lib/contrast';

const pairs: Array<[string, string, string]> = [
  ['primary', siteConfig.colors.primary, '#FFFFFF'],
  ['secondary', siteConfig.colors.secondary, '#FFFFFF'],
];

let hasFailure = false;
for (const [name, foreground, background] of pairs) {
  if (!meetsAA(foreground, background)) {
    console.warn(
      `[check-contrast] "${name}" (${foreground}) on ${background} fails WCAG AA (4.5:1) for body text.`,
    );
    hasFailure = true;
  }
}

if (hasFailure) {
  console.warn('[check-contrast] Build will continue — review site.config.ts colors for accessibility.');
} else {
  console.log('[check-contrast] All configured colors meet WCAG AA contrast.');
}
```

- [ ] **Step 7: Verify the check script runs standalone**

Run: `npx tsx scripts/check-contrast.ts`
Expected: prints `[check-contrast] All configured colors meet WCAG AA contrast.` (default colors pass).

- [ ] **Step 8: Commit**

```bash
git add site.config.ts public/assets/logo.svg src/lib/contrast.ts scripts/check-contrast.ts tests/contrast.test.ts
git commit -m "feat: add branding config and WCAG contrast build check"
```

---

### Task 4: Markdown container plugin (notice/warning + calendar)

**Files:**
- Create: `src/plugins/remark-containers.mjs`
- Test: `tests/remark-containers.test.ts`

**Interfaces:**
- Produces: `remarkContainers()` unified plugin — appended to `astro.config.mjs`'s `markdown.remarkPlugins` array (after `remarkDirective`) in Task 8.
- Produces: calendar containers render as `<div class="guide-calendar" data-events="[...]">` — Task 9's client calendar script depends on this exact class name and the `data-events` attribute being a JSON array of `{ date, title }`.
- Produces: notice/warning containers render as `<div class="guide-callout guide-callout--{name}">` — Task 6's global CSS depends on this class naming.

- [ ] **Step 1: Write the failing test**

```ts
// tests/remark-containers.test.ts
import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkDirective from 'remark-directive';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { remarkContainers } from '../src/plugins/remark-containers.mjs';

function render(markdown: string): string {
  return unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkContainers)
    .use(remarkRehype)
    .use(rehypeStringify)
    .processSync(markdown)
    .toString();
}

describe('remarkContainers', () => {
  it('renders a notice container as a styled div', () => {
    const html = render(':::notice\n안내 문구\n:::');
    expect(html).toContain('class="guide-callout guide-callout--notice"');
    expect(html).toContain('안내 문구');
  });

  it('renders a warning container with its own modifier class', () => {
    const html = render(':::warning\n마감 임박\n:::');
    expect(html).toContain('class="guide-callout guide-callout--warning"');
  });

  it('parses a calendar container into event JSON', () => {
    const html = render(
      ':::calendar\n- 2026-08-15: 임용등록 마감\n- 2026-08-20: 서류 제출\n:::',
    );
    expect(html).toContain('class="guide-calendar"');
    expect(html).toContain('data-events=');
    expect(html).toContain('임용등록 마감');
    expect(html).toContain('2026-08-15');
  });

  it('ignores unrecognized directive names', () => {
    const html = render(':::unknown\ntext\n:::');
    expect(html).not.toContain('guide-callout');
    expect(html).not.toContain('guide-calendar');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/remark-containers.test.ts`
Expected: FAIL — `Cannot find module '../src/plugins/remark-containers.mjs'`.

- [ ] **Step 3: Implement `src/plugins/remark-containers.mjs`**

```js
import { visit } from 'unist-util-visit';

const CALLOUT_TYPES = new Set(['notice', 'warning']);
const EVENT_LINE = /^(\d{4}-\d{2}-\d{2}):\s*(.+)$/;

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
      events.push({ date: match[1], title: match[2] });
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/remark-containers.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/plugins/remark-containers.mjs tests/remark-containers.test.ts
git commit -m "feat: add notice/warning/calendar markdown container plugin"
```

---

### Task 5: Rehype plugins for attachment cards & responsive images

**Files:**
- Create: `src/plugins/rehype-attachments.mjs`
- Create: `src/plugins/rehype-images.mjs`
- Test: `tests/rehype-attachments.test.ts`
- Test: `tests/rehype-images.test.ts`

**Interfaces:**
- Produces: `rehypeAttachments()` and `rehypeImages()` unified plugins — appended to `astro.config.mjs`'s `markdown.rehypePlugins` array in Task 8.
- Produces: attachment links render as `<a class="guide-attachment-card" download>` containing `<span class="guide-attachment-card__icon guide-attachment-card__icon--{ext}">` and `<span class="guide-attachment-card__name">` — Task 6's global CSS depends on these class names.
- Produces: `<img>` tags gain `loading="lazy"`, `decoding="async"`, and class `guide-image` — Task 6's global CSS depends on `guide-image`.

- [ ] **Step 1: Write the failing attachment test**

```ts
// tests/rehype-attachments.test.ts
import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { rehypeAttachments } from '../src/plugins/rehype-attachments.mjs';

function render(markdown: string): string {
  return unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeAttachments)
    .use(rehypeStringify)
    .processSync(markdown)
    .toString();
}

describe('rehypeAttachments', () => {
  it('converts a document link into an attachment card', () => {
    const html = render('[2026년 임용등록원서.hwp](assets/files/2026-form.hwp)');
    expect(html).toContain('guide-attachment-card');
    expect(html).toContain('download');
    expect(html).toContain('HWP');
    expect(html).toContain('2026년 임용등록원서.hwp');
  });

  it('leaves an internal page link untouched', () => {
    const html = render('[다른 페이지](/guide/registration)');
    expect(html).not.toContain('guide-attachment-card');
  });

  it('leaves an image markdown untouched', () => {
    const html = render('![증명사진 예시](assets/images/photo-example.png)');
    expect(html).not.toContain('guide-attachment-card');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/rehype-attachments.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/plugins/rehype-attachments.mjs`**

```js
import { visit } from 'unist-util-visit';

const DOCUMENT_EXTENSIONS = new Set([
  'pdf', 'hwp', 'hwpx', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip',
]);

export function rehypeAttachments() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'a') return;
      const href = node.properties?.href;
      if (typeof href !== 'string') return;

      const ext = href.split('.').pop()?.toLowerCase();
      if (!ext || !DOCUMENT_EXTENSIONS.has(ext)) return;

      const filename = decodeURIComponent(href.split('/').pop() ?? href);

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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/rehype-attachments.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Write the failing images test**

```ts
// tests/rehype-images.test.ts
import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { rehypeImages } from '../src/plugins/rehype-images.mjs';

function render(markdown: string): string {
  return unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeImages)
    .use(rehypeStringify)
    .processSync(markdown)
    .toString();
}

describe('rehypeImages', () => {
  it('adds lazy loading and the responsive class to images', () => {
    const html = render('![증명사진 예시](assets/images/photo-example.png)');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('decoding="async"');
    expect(html).toContain('class="guide-image"');
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run tests/rehype-images.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 7: Implement `src/plugins/rehype-images.mjs`**

```js
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
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run tests/rehype-images.test.ts`
Expected: PASS (1 test).

- [ ] **Step 9: Commit**

```bash
git add src/plugins/rehype-attachments.mjs src/plugins/rehype-images.mjs tests/rehype-attachments.test.ts tests/rehype-images.test.ts
git commit -m "feat: add attachment-card and responsive-image rehype plugins"
```

---

### Task 6: Global KRDS styles

**Files:**
- Create: `src/styles/global.css`

**Interfaces:**
- Consumes: class names produced by Task 4 (`guide-callout`, `guide-callout--notice/warning`, `guide-calendar`) and Task 5 (`guide-attachment-card`, `guide-attachment-card__icon`, `guide-attachment-card__name`, `guide-image`).
- Produces: CSS custom properties `--color-primary`, `--color-secondary`, `--color-accent` expected to be set by `BaseLayout.astro` (Task 7); this file only reads them, it does not define their values.
- Produces: layout classes `guide-layout`, `guide-content`, `guide-sidebar`, `guide-sidebar__list`, `guide-sidebar__toggle`, `guide-header`, `guide-footer`, `guide-toc` — consumed by Task 7 and Task 8 components.

- [ ] **Step 1: Write `src/styles/global.css`**

```css
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

:root {
  --color-primary: #1A2D65;
  --color-secondary: #018FD7;
  --color-accent: #7AC38E;
  --color-text: #242933;
  --color-bg: #FFFFFF;
  --color-bg-muted: #F4F6F8;
  --color-border: #D8DCE2;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: 'Pretendard', system-ui, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: var(--color-text);
  background: var(--color-bg);
}

h1 { font-size: 32px; }
h2 { font-size: 24px; margin-top: 2.5rem; }
h3 { font-size: 18px; margin-top: 2rem; }

a { color: var(--color-secondary); }

.guide-header {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  background: var(--color-primary);
}

.guide-header__brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #FFFFFF;
  text-decoration: none;
  font-weight: 700;
}

.guide-header__logo {
  height: 32px;
  width: auto;
}

.guide-layout {
  display: flex;
  align-items: flex-start;
  max-width: 1200px;
  margin: 0 auto;
}

.guide-content {
  flex: 1;
  min-width: 0;
  padding: 2rem 1.5rem;
}

.guide-sidebar {
  width: 260px;
  flex-shrink: 0;
  padding: 2rem 1rem;
  border-right: 1px solid var(--color-border);
  position: sticky;
  top: 0;
}

.guide-sidebar__toggle {
  display: none;
}

.guide-sidebar__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.guide-sidebar__list a {
  display: block;
  padding: 0.6rem 0.75rem;
  border-radius: 6px;
  color: var(--color-text);
  text-decoration: none;
  min-height: 44px;
  display: flex;
  align-items: center;
}

.guide-sidebar__list a[aria-current='page'] {
  background: var(--color-primary);
  color: #FFFFFF;
  font-weight: 700;
}

.guide-sidebar__list a:focus-visible {
  outline: 3px solid var(--color-secondary);
  outline-offset: 2px;
}

.guide-toc {
  background: var(--color-bg-muted);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem 1.25rem;
  margin: 1.5rem 0;
}

.guide-toc__label {
  font-weight: 700;
  margin: 0 0 0.5rem;
}

.guide-toc ul {
  margin: 0;
  padding-left: 1.25rem;
}

.guide-toc__item--depth3 {
  margin-left: 1rem;
  font-size: 14px;
}

.guide-callout {
  border-left: 4px solid var(--color-secondary);
  background: var(--color-bg-muted);
  padding: 1rem 1.25rem;
  margin: 1.5rem 0;
  border-radius: 0 8px 8px 0;
}

.guide-callout--warning {
  border-left-color: #C0392B;
  background: #FDEDEC;
}

.guide-attachment-card {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  min-height: 44px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  text-decoration: none;
  color: var(--color-text);
  margin: 0.5rem 0;
}

.guide-attachment-card__icon {
  font-size: 12px;
  font-weight: 700;
  background: var(--color-primary);
  color: #FFFFFF;
  border-radius: 4px;
  padding: 0.2rem 0.4rem;
}

.guide-image {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}

.guide-footer {
  padding: 2rem 1.5rem;
  border-top: 1px solid var(--color-border);
  text-align: center;
  font-size: 14px;
  color: var(--color-text);
}

.guide-calendar {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem;
  margin: 1.5rem 0;
}

@media (max-width: 959px) {
  .guide-layout {
    flex-direction: column;
  }

  .guide-sidebar__toggle {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 1rem;
    margin: 1rem 1.5rem 0;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-bg);
  }

  .guide-sidebar {
    position: fixed;
    inset: 0 30% 0 0;
    z-index: 20;
    background: var(--color-bg);
    transform: translateX(-100%);
    transition: transform 0.2s ease;
    overflow-y: auto;
  }

  .guide-sidebar[data-open='true'] {
    transform: translateX(0);
  }

  .guide-sidebar__backdrop {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 10;
  }

  .guide-sidebar__backdrop[data-open='true'] {
    display: block;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/global.css
git commit -m "feat: add KRDS global stylesheet"
```

---

### Task 7: Base layout, header, footer, sidebar with mobile drawer

**Files:**
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/Header.astro`
- Create: `src/components/Footer.astro`
- Create: `src/components/Sidebar.astro`
- Create: `src/scripts/mobile-nav.ts`
- Test: `tests/mobile-nav.test.ts`

**Interfaces:**
- Consumes: `site.config.ts` default export (Task 3); `getCollection('guide')` (Task 2); `src/styles/global.css` (Task 6).
- Produces: `BaseLayout.astro` accepting `Props { title: string }`, rendering `<slot />` inside `<main class="guide-content">` — consumed by Task 8's pages.
- Produces: `initMobileNav(root: Document | HTMLElement): void` from `src/scripts/mobile-nav.ts`, exported for both browser bootstrap and unit testing.

- [ ] **Step 1: Write the failing mobile-nav test**

```ts
// tests/mobile-nav.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { initMobileNav } from '../src/scripts/mobile-nav';

function setupDom() {
  document.body.innerHTML = `
    <button class="guide-sidebar__toggle" aria-expanded="false" aria-controls="guide-sidebar">메뉴</button>
    <div class="guide-sidebar__backdrop" data-open="false"></div>
    <nav id="guide-sidebar" class="guide-sidebar" data-open="false">
      <a href="/">메인</a>
      <a href="/guide/sample">예시</a>
    </nav>
  `;
}

describe('initMobileNav', () => {
  beforeEach(() => {
    setupDom();
    initMobileNav(document);
  });

  it('opens the drawer when the toggle button is clicked', () => {
    const toggle = document.querySelector<HTMLButtonElement>('.guide-sidebar__toggle')!;
    toggle.click();
    const sidebar = document.getElementById('guide-sidebar')!;
    expect(sidebar.dataset.open).toBe('true');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('closes the drawer on Escape key', () => {
    const toggle = document.querySelector<HTMLButtonElement>('.guide-sidebar__toggle')!;
    toggle.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    const sidebar = document.getElementById('guide-sidebar')!;
    expect(sidebar.dataset.open).toBe('false');
  });

  it('closes the drawer when the backdrop is clicked', () => {
    const toggle = document.querySelector<HTMLButtonElement>('.guide-sidebar__toggle')!;
    toggle.click();
    const backdrop = document.querySelector<HTMLElement>('.guide-sidebar__backdrop')!;
    backdrop.click();
    const sidebar = document.getElementById('guide-sidebar')!;
    expect(sidebar.dataset.open).toBe('false');
  });

  it('traps focus within the sidebar links while open', () => {
    const toggle = document.querySelector<HTMLButtonElement>('.guide-sidebar__toggle')!;
    toggle.click();
    const links = document.querySelectorAll<HTMLAnchorElement>('#guide-sidebar a');
    links[links.length - 1].focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    document.getElementById('guide-sidebar')!.dispatchEvent(event);
    expect(document.activeElement).toBe(links[0]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/mobile-nav.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/scripts/mobile-nav.ts`**

```ts
export function initMobileNav(root: Document | HTMLElement = document): void {
  const toggle = root.querySelector<HTMLButtonElement>('.guide-sidebar__toggle');
  const sidebar = root.querySelector<HTMLElement>('.guide-sidebar');
  const backdrop = root.querySelector<HTMLElement>('.guide-sidebar__backdrop');
  if (!toggle || !sidebar || !backdrop) return;

  function open(): void {
    sidebar!.dataset.open = 'true';
    backdrop!.dataset.open = 'true';
    toggle!.setAttribute('aria-expanded', 'true');
  }

  function close(): void {
    sidebar!.dataset.open = 'false';
    backdrop!.dataset.open = 'false';
    toggle!.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', () => {
    const isOpen = sidebar!.dataset.open === 'true';
    if (isOpen) close();
    else open();
  });

  backdrop.addEventListener('click', close);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && sidebar!.dataset.open === 'true') {
      close();
      toggle!.focus();
    }
  });

  sidebar.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const focusable = sidebar!.querySelectorAll<HTMLElement>('a, button');
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/mobile-nav.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Create `src/components/Header.astro`**

```astro
---
interface Props {
  orgName: string;
  logoPath: string;
}
const { orgName, logoPath } = Astro.props;
---
<header class="guide-header">
  <a class="guide-header__brand" href="/">
    <img src={logoPath} alt={`${orgName} 로고`} class="guide-header__logo" />
    <span class="guide-header__org">{orgName}</span>
  </a>
  <button
    class="guide-sidebar__toggle"
    aria-expanded="false"
    aria-controls="guide-sidebar"
    type="button"
  >
    메뉴
  </button>
</header>
```

- [ ] **Step 6: Create `src/components/Footer.astro`**

```astro
---
interface Props {
  orgName: string;
}
const { orgName } = Astro.props;
const year = new Date().getFullYear();
---
<footer class="guide-footer">
  <p>&copy; {year} {orgName}</p>
</footer>
```

- [ ] **Step 7: Create `src/components/Sidebar.astro`**

```astro
---
import { getCollection } from 'astro:content';

const entries = (await getCollection('guide')).sort((a, b) => a.data.order - b.data.order);
const currentPath = Astro.url.pathname;

function hrefFor(slug: string): string {
  return slug === 'index' ? '/' : `/guide/${slug}`;
}
---
<div class="guide-sidebar__backdrop" data-open="false"></div>
<nav id="guide-sidebar" class="guide-sidebar" data-open="false" aria-label="사이트 메뉴">
  <ul class="guide-sidebar__list">
    {entries.map((entry) => {
      const href = hrefFor(entry.slug);
      const isCurrent = currentPath === href || currentPath === `${href}/`;
      return (
        <li>
          <a href={href} aria-current={isCurrent ? 'page' : undefined}>{entry.data.title}</a>
        </li>
      );
    })}
  </ul>
</nav>
<script>
  import { initMobileNav } from '../scripts/mobile-nav';
  initMobileNav(document);
</script>
```

- [ ] **Step 8: Create `src/layouts/BaseLayout.astro`**

```astro
---
import siteConfig from '../../site.config';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import Sidebar from '../components/Sidebar.astro';
import '../styles/global.css';

interface Props {
  title: string;
}
const { title } = Astro.props;
const { colors, orgName } = siteConfig;
---
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title} · {orgName}</title>
    <style define:vars={{ colorPrimary: colors.primary, colorSecondary: colors.secondary, colorAccent: colors.accent }}>
      :root {
        --color-primary: var(--colorPrimary);
        --color-secondary: var(--colorSecondary);
        --color-accent: var(--colorAccent);
      }
    </style>
  </head>
  <body>
    <Header orgName={orgName} logoPath={siteConfig.logoPath} />
    <div class="guide-layout">
      <Sidebar />
      <main class="guide-content">
        <slot />
      </main>
    </div>
    <Footer orgName={orgName} />
  </body>
</html>
```

- [ ] **Step 9: Commit**

```bash
git add src/layouts/BaseLayout.astro src/components/Header.astro src/components/Footer.astro src/components/Sidebar.astro src/scripts/mobile-nav.ts tests/mobile-nav.test.ts
git commit -m "feat: add base layout, header/footer, and responsive sidebar with mobile drawer"
```

---

### Task 8: Page routing & table of contents

**Files:**
- Create: `src/components/TableOfContents.astro`
- Modify: `src/pages/index.astro` (replace Task 1 placeholder)
- Create: `src/pages/guide/[...slug].astro`
- Modify: `astro.config.mjs` (wire in Task 4 and Task 5 plugins)

**Interfaces:**
- Consumes: `entry.render()` returning `{ Content, headings: { depth, slug, text }[] }` (Astro's built-in content collection API); `remarkContainers` (Task 4); `rehypeAttachments`, `rehypeImages` (Task 5).
- Produces: every route under `/` and `/guide/<slug>` renders through `BaseLayout` with an auto-generated TOC for H2/H3 headings.

- [ ] **Step 1: Wire plugins into `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import remarkDirective from 'remark-directive';
import { remarkContainers } from './src/plugins/remark-containers.mjs';
import { rehypeAttachments } from './src/plugins/rehype-attachments.mjs';
import { rehypeImages } from './src/plugins/rehype-images.mjs';

const deployTarget = process.env.DEPLOY_TARGET ?? 'vercel';
const isGithubPages = deployTarget === 'github-pages';

export default defineConfig({
  site: isGithubPages
    ? 'https://example.github.io'
    : 'https://example.vercel.app',
  base: isGithubPages ? (process.env.GITHUB_PAGES_BASE ?? '/') : '/',
  markdown: {
    remarkPlugins: [remarkDirective, remarkContainers],
    rehypePlugins: [rehypeAttachments, rehypeImages],
  },
});
```

- [ ] **Step 2: Create `src/components/TableOfContents.astro`**

```astro
---
interface Heading {
  depth: number;
  slug: string;
  text: string;
}
interface Props {
  headings: Heading[];
}
const { headings } = Astro.props;
const items = headings.filter((h) => h.depth === 2 || h.depth === 3);
---
{items.length > 0 && (
  <nav class="guide-toc" aria-label="페이지 목차">
    <p class="guide-toc__label">목차</p>
    <ul>
      {items.map((h) => (
        <li class={`guide-toc__item guide-toc__item--depth${h.depth}`}>
          <a href={`#${h.slug}`}>{h.text}</a>
        </li>
      ))}
    </ul>
  </nav>
)}
```

- [ ] **Step 3: Replace `src/pages/index.astro`**

```astro
---
import { getEntry } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import TableOfContents from '../components/TableOfContents.astro';

const entry = await getEntry('guide', 'index');
if (!entry) throw new Error('src/content/guide/index.md is required');
const { Content, headings } = await entry.render();
---
<BaseLayout title={entry.data.title}>
  <h1>{entry.data.title}</h1>
  <TableOfContents headings={headings} />
  <Content />
</BaseLayout>
```

- [ ] **Step 4: Create `src/pages/guide/[...slug].astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import TableOfContents from '../../components/TableOfContents.astro';

export async function getStaticPaths() {
  const entries = await getCollection('guide', ({ slug }) => slug !== 'index');
  return entries.map((entry) => ({
    params: { slug: entry.slug },
    props: { entry },
  }));
}

const { entry } = Astro.props;
const { Content, headings } = await entry.render();
---
<BaseLayout title={entry.data.title}>
  <h1>{entry.data.title}</h1>
  <TableOfContents headings={headings} />
  <Content />
</BaseLayout>
```

- [ ] **Step 5: Build and verify routing/TOC/attachment/callout output**

Run: `npm run build`
Expected: build succeeds, producing `dist/index.html` and `dist/guide/sample/index.html`.

Run (bash): `grep -o 'guide-toc' dist/guide/sample/index.html | head -1`
Expected: outputs `guide-toc` (the sample page's H2 headings produced a TOC).

Run (bash): `grep -o 'guide-callout--notice' dist/index.html | head -1`
Expected: outputs `guide-callout--notice`.

Run (bash): `grep -o 'aria-current="page"' dist/index.html | head -1`
Expected: outputs `aria-current="page"` (sidebar marks the current page).

- [ ] **Step 6: Commit**

```bash
git add astro.config.mjs src/components/TableOfContents.astro src/pages/index.astro src/pages/guide/[...slug].astro
git commit -m "feat: wire markdown plugins and add page routing with auto TOC"
```

---

### Task 9: Calendar rendering

**Files:**
- Create: `src/lib/calendar-grid.ts`
- Create: `src/components/Calendar.astro`
- Create: `src/scripts/calendar.ts`
- Modify: `src/layouts/BaseLayout.astro` (mount the calendar script once, globally)
- Test: `tests/calendar-grid.test.ts`
- Test: `tests/calendar-client.test.ts`

**Interfaces:**
- Consumes: `data-events` JSON attribute produced by Task 4's `remarkContainers` on `.guide-calendar` elements.
- Produces: `buildMonthGrid(year: number, month: number, events: CalendarEvent[]): CalendarDay[]` from `src/lib/calendar-grid.ts`, reused identically on the server (initial render) and client (month navigation).
- Produces: `renderCalendarMonth(container: HTMLElement, year: number, month: number, events: CalendarEvent[]): void` and `initCalendars(root: Document | HTMLElement): void` from `src/scripts/calendar.ts`.

- [ ] **Step 1: Write the failing calendar-grid test**

```ts
// tests/calendar-grid.test.ts
import { describe, it, expect } from 'vitest';
import { buildMonthGrid } from '../src/lib/calendar-grid';

describe('buildMonthGrid', () => {
  it('produces 31 in-month days for August 2026 with correct leading blanks', () => {
    const days = buildMonthGrid(2026, 8, []);
    const inMonth = days.filter((d) => d.inCurrentMonth);
    expect(inMonth).toHaveLength(31);
    // 2026-08-01 is a Saturday (weekday index 6)
    expect(days[0].inCurrentMonth).toBe(false);
    expect(days[6].date).toBe('2026-08-01');
  });

  it('attaches events to the matching day', () => {
    const days = buildMonthGrid(2026, 8, [{ date: '2026-08-15', title: '임용등록 마감' }]);
    const day15 = days.find((d) => d.date === '2026-08-15')!;
    expect(day15.events).toEqual([{ date: '2026-08-15', title: '임용등록 마감' }]);
  });

  it('leaves days without events with an empty array', () => {
    const days = buildMonthGrid(2026, 8, [{ date: '2026-08-15', title: '임용등록 마감' }]);
    const day10 = days.find((d) => d.date === '2026-08-10')!;
    expect(day10.events).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/calendar-grid.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/calendar-grid.ts`**

```ts
export interface CalendarEvent {
  date: string;
  title: string;
}

export interface CalendarDay {
  date: string;
  dayOfMonth: number;
  inCurrentMonth: boolean;
  events: CalendarEvent[];
}

export function buildMonthGrid(year: number, month: number, events: CalendarEvent[]): CalendarDay[] {
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const startWeekday = firstOfMonth.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const list = eventsByDate.get(event.date) ?? [];
    list.push(event);
    eventsByDate.set(event.date, list);
  }

  const days: CalendarDay[] = [];
  for (let i = 0; i < startWeekday; i++) {
    days.push({ date: '', dayOfMonth: 0, inCurrentMonth: false, events: [] });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    days.push({ date, dayOfMonth: day, inCurrentMonth: true, events: eventsByDate.get(date) ?? [] });
  }
  return days;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/calendar-grid.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Write the failing calendar client test**

```ts
// tests/calendar-client.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderCalendarMonth, initCalendars } from '../src/scripts/calendar';

function setupDom(eventsJson: string) {
  document.body.innerHTML = `
    <div class="guide-calendar" data-events='${eventsJson}'></div>
  `;
}

describe('renderCalendarMonth', () => {
  it('renders a grid with the event title visible', () => {
    const container = document.createElement('div');
    renderCalendarMonth(container, 2026, 8, [{ date: '2026-08-15', title: '임용등록 마감' }]);
    expect(container.textContent).toContain('임용등록 마감');
    expect(container.querySelectorAll('[data-day]').length).toBeGreaterThan(27);
  });
});

describe('initCalendars', () => {
  beforeEach(() => {
    setupDom(JSON.stringify([{ date: '2026-08-15', title: '임용등록 마감' }]));
    initCalendars(document);
  });

  it('renders the current month grid on init', () => {
    const container = document.querySelector('.guide-calendar')!;
    expect(container.querySelector('.guide-calendar__grid')).not.toBeNull();
  });

  it('navigates to the next month when the next button is clicked', () => {
    const container = document.querySelector('.guide-calendar')!;
    const label = container.querySelector('.guide-calendar__label')!;
    const before = label.textContent;
    const nextButton = container.querySelector<HTMLButtonElement>('.guide-calendar__next')!;
    nextButton.click();
    expect(label.textContent).not.toBe(before);
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run tests/calendar-client.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 7: Implement `src/scripts/calendar.ts`**

```ts
import { buildMonthGrid, type CalendarEvent } from '../lib/calendar-grid';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export function renderCalendarMonth(
  container: HTMLElement,
  year: number,
  month: number,
  events: CalendarEvent[],
): void {
  const days = buildMonthGrid(year, month, events);

  // Header (label/prev/next) is created once and reused across month
  // navigation — replacing it on every render would leave any external
  // reference to the label element (e.g. a caller reading its text after
  // clicking "next") pointing at a detached, permanently-stale node.
  let header = container.querySelector<HTMLElement>('.guide-calendar__header');
  let label: HTMLElement;
  let prevButton: HTMLButtonElement;
  let nextButton: HTMLButtonElement;

  if (!header) {
    header = document.createElement('div');
    header.className = 'guide-calendar__header';

    prevButton = document.createElement('button');
    prevButton.type = 'button';
    prevButton.className = 'guide-calendar__prev';
    prevButton.textContent = '이전 달';

    label = document.createElement('span');
    label.className = 'guide-calendar__label';

    nextButton = document.createElement('button');
    nextButton.type = 'button';
    nextButton.className = 'guide-calendar__next';
    nextButton.textContent = '다음 달';

    header.append(prevButton, label, nextButton);
    container.appendChild(header);
  } else {
    label = header.querySelector<HTMLElement>('.guide-calendar__label')!;
    prevButton = header.querySelector<HTMLButtonElement>('.guide-calendar__prev')!;
    nextButton = header.querySelector<HTMLButtonElement>('.guide-calendar__next')!;
  }

  label.textContent = `${year}년 ${month}월`;

  const oldGrid = container.querySelector('.guide-calendar__grid');
  oldGrid?.remove();

  const grid = document.createElement('div');
  grid.className = 'guide-calendar__grid';

  for (const weekday of WEEKDAY_LABELS) {
    const cell = document.createElement('div');
    cell.className = 'guide-calendar__weekday';
    cell.textContent = weekday;
    grid.appendChild(cell);
  }

  for (const day of days) {
    const cell = document.createElement('div');
    cell.className = 'guide-calendar__day';
    if (day.inCurrentMonth) {
      cell.dataset.day = String(day.dayOfMonth);
      const dayNumber = document.createElement('span');
      dayNumber.textContent = String(day.dayOfMonth);
      cell.appendChild(dayNumber);
      for (const event of day.events) {
        const badge = document.createElement('span');
        badge.className = 'guide-calendar__event';
        badge.textContent = event.title;
        cell.appendChild(badge);
      }
    }
    grid.appendChild(cell);
  }

  container.appendChild(grid);

  prevButton.onclick = () => {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    renderCalendarMonth(container, prevYear, prevMonth, events);
  };

  nextButton.onclick = () => {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    renderCalendarMonth(container, nextYear, nextMonth, events);
  };
}

export function initCalendars(root: Document | HTMLElement = document): void {
  const containers = root.querySelectorAll<HTMLElement>('.guide-calendar');
  const today = new Date();

  containers.forEach((container) => {
    const raw = container.dataset.events ?? '[]';
    let events: CalendarEvent[] = [];
    try {
      events = JSON.parse(raw);
    } catch {
      events = [];
    }
    renderCalendarMonth(container, today.getFullYear(), today.getMonth() + 1, events);
  });
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run tests/calendar-client.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 9: Mount the calendar script in `BaseLayout.astro`**

Add this `<script>` block right before `</body>` in `src/layouts/BaseLayout.astro`:

```astro
    <script>
      import { initCalendars } from '../scripts/calendar';
      initCalendars(document);
    </script>
  </body>
</html>
```

- [ ] **Step 10: Build and verify the calendar renders**

Run: `npm run build && npm run preview -- --port 4321 &`
Run (bash): `sleep 1 && curl -s http://localhost:4321/ | grep -o 'guide-calendar'`
Expected: outputs `guide-calendar` (server-rendered container is present; grid itself is client-rendered from `data-events`, confirmed by the unit tests above).

Stop the preview server afterward (`kill %1` or close the background job).

- [ ] **Step 11: Commit**

```bash
git add src/lib/calendar-grid.ts src/components/Calendar.astro src/scripts/calendar.ts src/layouts/BaseLayout.astro tests/calendar-grid.test.ts tests/calendar-client.test.ts
git commit -m "feat: render calendar container as an interactive month grid"
```

---

### Task 10: Deployment configuration & content-author documentation

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `README.md`

**Interfaces:**
- Consumes: `DEPLOY_TARGET`/`GITHUB_PAGES_BASE` env branching already implemented in `astro.config.mjs` (Task 1/8); `npm run build`, `npm run test`, `npm run test:links` (Task 1).

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run test
      - env:
          DEPLOY_TARGET: github-pages
          GITHUB_PAGES_BASE: /${{ github.event.repository.name }}
        run: npm run build
      - run: npm run test:links
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Verify the workflow YAML is syntactically valid**

Run (bash): `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/deploy.yml'))" && echo OK`
Expected: `OK`.

- [ ] **Step 3: Create `README.md`**

```markdown
# KRDS 민원 안내 사이트 템플릿

공공기관이 포크해서 사용하는 재사용 가능한 안내 사이트 템플릿입니다. 로그인·검색·백엔드 없이, 마크다운 콘텐츠를 KRDS 스타일의 정적 사이트로 자동 변환합니다.

## 콘텐츠 작성자 가이드 (비개발자용)

1. `src/content/guide/` 폴더의 `.md` 파일만 수정합니다. 다른 폴더/파일은 건드릴 필요가 없습니다.
2. 파일 맨 위에는 아래처럼 정보를 적습니다.

   ```md
   ---
   title: 페이지 제목
   order: 2
   ---

   본문 내용...
   ```

   `order` 숫자가 작을수록 좌측 메뉴 위쪽에 표시됩니다.

3. 강조 박스는 아래처럼 씁니다.

   ```md
   :::notice
   여기에 공지 내용을 씁니다.
   :::

   :::warning
   여기에 주의사항을 씁니다.
   :::
   ```

4. 캘린더는 아래처럼 날짜와 제목을 나열합니다.

   ```md
   :::calendar
   - 2026-08-15: 임용등록 마감
   - 2026-08-20: 서류 제출
   :::
   ```

5. 다른 페이지로 링크: `[임용등록 안내](/guide/registration)`
6. 첨부파일(hwp/pdf 등)은 일반 링크로 씁니다. 자동으로 다운로드 카드로 바뀝니다.

   ```md
   [2026년 임용등록원서.hwp](assets/files/2026-form.hwp)
   ```

7. 이미지는 일반 마크다운 문법을 씁니다: `![설명](assets/images/파일명.png)`
8. 수정 후 `git push`만 하면 배포는 자동으로 진행됩니다. Vercel은 몇 분 내로, GitHub Pages는 Actions 탭에서 진행 상황을 확인할 수 있습니다.

## 기관 설정 (최초 1회)

`site.config.ts`에서 기관명, 색상, 로고 경로를 수정합니다.

```ts
export default {
  orgName: '기관명',
  colors: { primary: '#1A2D65', secondary: '#018FD7', accent: '#7AC38E' },
  logoPath: '/assets/logo.svg',
};
```

## 개발자용 로컬 명령어

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # 정적 빌드 (front matter/색상 대비 오류가 있으면 표시됨)
npm run test      # 단위 테스트
npm run test:links # 빌드 산출물의 깨진 링크 검사
```

## 배포

- **Vercel**: 저장소를 Vercel에 연결하면 `main` push 시 자동 빌드/배포됩니다. 별도 설정이 필요 없습니다.
- **GitHub Pages**: 저장소 Settings → Pages에서 소스를 "GitHub Actions"로 지정하면 `.github/workflows/deploy.yml`이 `main` push마다 자동 배포합니다.
```

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml README.md
git commit -m "docs: add deployment workflow and content-author guide"
```

---

## Final verification

- [ ] **Run the full test suite**

Run: `npm run test`
Expected: all test files (`schema`, `contrast`, `remark-containers`, `rehype-attachments`, `rehype-images`, `mobile-nav`, `calendar-grid`, `calendar-client`) pass.

- [ ] **Run a full production build**

Run: `npm run build`
Expected: succeeds, prints the contrast check result, and produces `dist/index.html` and `dist/guide/sample/index.html`.

- [ ] **Run the link checker**

Run: `npm run test:links`
Expected: no broken internal links reported.
