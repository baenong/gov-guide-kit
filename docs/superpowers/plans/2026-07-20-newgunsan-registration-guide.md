# 군산시 신규 공무원 임용등록 안내 페이지 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Jekyll-based, KRDS-aligned static site for GitHub Pages that guides Gunsan-si new employees through registration, with a left-nav/right-content responsive layout, mobile hamburger menu, and a month-grid calendar.

**Architecture:** Jekyll site using GitHub Pages' native build (no custom plugins outside the `github-pages` gem whitelist). A single `default` layout renders header/sidebar/footer chrome around page content. The month calendar and mobile nav toggle are rendered client-side in vanilla JS (calendar math can't run in Jekyll's Liquid/safe-mode build, so event data is serialized to JSON and rendered in the browser). Guide pages are plain Markdown files under `guide/<slug>/index.md` using the shared layout.

**Tech Stack:** Jekyll (github-pages gem), Liquid, Sass (via Jekyll's built-in converter), vanilla JavaScript (no framework, no build step), html-proofer (test-only gem) for automated HTML/link/alt-text checks.

## Global Constraints

- Deploy target is GitHub Pages' native Jekyll build (`main` branch, Settings > Pages source = `main`) — only plugins in the `github-pages` gem whitelist may be used (this plan uses `jekyll-sitemap`, which is whitelisted). No custom `_plugins/*.rb`.
- No login/authentication, no search, no multi-language support, no custom domain (`docs/superpowers/specs/2026-07-20-newgunsan-registration-guide-design.md` "범위 밖").
- Brand colors: Primary `#1A2D65`, Secondary `#018FD7`, Accent `#7AC38E`. Accent is never used as text color (contrast).
- Font: Pretendard, loaded via CDN link.
- Base body font size 16px; never go below 14px anywhere in the CSS.
- Sidebar nav has exactly 8 items (메인 + 7 guide pages) sourced from `_data/nav.yml`; current page is marked with `aria-current="page"`.
- Mobile breakpoint is `max-width: 959px` — below it the sidebar becomes an off-canvas drawer with a hamburger toggle, backdrop, ESC-to-close, and a JS focus trap.
- Site copy is Korean (`lang: ko`).
- Guide page content (the actual instructional text) is filled in conversationally after this plan lands scaffolding — pages ship with clearly-labeled placeholder copy, not fabricated instructions.

---

## Prerequisites

The implementing engineer needs Ruby (>= 2.7) and Bundler installed locally to run `bundle install` / `bundle exec jekyll build`. All commands below assume they're run from the repository root `D:\ahn\newgunsan`.

---

### Task 1: Jekyll project scaffold & build pipeline

**Files:**
- Create: `Gemfile`
- Create: `_config.yml`
- Create: `.gitignore`
- Create: `README.md`
- Create: `index.md`

**Interfaces:**
- Produces: `_config.yml` keys `title`, `description`, `lang`, `calendar_month` (string `"2026-08-01"`, consumed by Task 9's `_includes/calendar.html`), `plugins: [jekyll-sitemap]`, `exclude: [Gemfile, Gemfile.lock, README.md, docs]`.
- Produces: root `index.md` with plain front matter `title: 메인` (no `layout` key yet — added in Task 4).

- [ ] **Step 1: Create the Gemfile**

```ruby
source "https://rubygems.org"

gem "github-pages", group: :jekyll_plugins
gem "webrick"

group :test do
  gem "html-proofer"
end
```

- [ ] **Step 2: Create `_config.yml`**

```yaml
title: 군산시 신규 공무원 임용등록 안내
description: 군산시 신규 임용 공무원을 위한 임용등록 절차 안내 페이지
lang: ko
calendar_month: "2026-08-01"

plugins:
  - jekyll-sitemap

exclude:
  - Gemfile
  - Gemfile.lock
  - README.md
  - docs
```

- [ ] **Step 3: Create `.gitignore`**

```
_site/
.sass-cache/
.jekyll-cache/
.jekyll-metadata
vendor/
.bundle/
```

- [ ] **Step 4: Create `README.md`**

```markdown
# 군산시 신규 공무원 임용등록 안내

Jekyll 기반 정적 사이트. GitHub Pages(`main` 브랜치)에서 자동 빌드/배포됩니다.

## 로컬 개발

\`\`\`bash
bundle install
bundle exec jekyll serve
\`\`\`

`http://localhost:4000` 에서 확인합니다.

## 콘텐츠 수정

- 좌측 목차: `_data/nav.yml`
- 메인 공지사항: `_data/notices.yml`
- 캘린더 일정: `_data/events.yml`
- 안내 페이지 본문: `guide/<slug>/index.md`
```

- [ ] **Step 5: Create root `index.md`**

```markdown
---
title: 메인
---

# 군산시 신규 공무원 임용등록 안내

사이트 준비 중입니다.
```

- [ ] **Step 6: Install dependencies and verify the build**

Run:
```bash
bundle install
bundle exec jekyll build
```
Expected: both commands exit 0, and `_site/index.html` is created.

- [ ] **Step 7: Verify the built page contains expected content**

Run:
```bash
grep "군산시 신규 공무원 임용등록 안내" _site/index.html
```
Expected: one matching line printed (grep exits 0).

- [ ] **Step 8: Commit**

```bash
git add Gemfile Gemfile.lock _config.yml .gitignore README.md index.md
git commit -m "chore: scaffold Jekyll project for registration guide site"
```

---

### Task 2: Site data files (nav, notices, events)

**Files:**
- Create: `_data/nav.yml`
- Create: `_data/notices.yml`
- Create: `_data/events.yml`

**Interfaces:**
- Produces: `site.data.nav` — list of `{title, url}`, 8 entries, consumed by Task 5 (`_includes/sidebar.html`).
- Produces: `site.data.notices` — list of `{date, title, body}`, consumed by Task 8 (`_includes/notice-list.html`).
- Produces: `site.data.events` — list of `{date, title, detail}` with `date` as `YYYY-MM-DD` strings, consumed by Task 9 (`_includes/calendar.html` / `assets/js/calendar.js`).

- [ ] **Step 1: Create `_data/nav.yml`**

```yaml
- title: "메인"
  url: "/"
- title: "임용등록 안내"
  url: "/guide/registration/"
- title: "사전제출서류 작성방법"
  url: "/guide/pre-documents/"
- title: "증명사진 제출 안내"
  url: "/guide/photo/"
- title: "제출서류 안내"
  url: "/guide/documents/"
- title: "임용등록원서 작성방법"
  url: "/guide/application-form/"
- title: "임용직급"
  url: "/guide/rank/"
- title: "Q&A"
  url: "/guide/faq/"
```

- [ ] **Step 2: Create `_data/notices.yml`**

```yaml
- date: 2026-07-20
  title: "신규임용자 오리엔테이션 일정 안내"
  body: "오리엔테이션은 2026년 8월 3일(월) 오전 9시, 군산시청 대회의실에서 진행됩니다."
- date: 2026-07-20
  title: "제출서류 접수 기한 안내"
  body: "임용등록 서류는 2026년 7월 31일(금)까지 인사과로 제출해 주시기 바랍니다."
```

- [ ] **Step 3: Create `_data/events.yml`**

```yaml
- date: "2026-07-31"
  title: "임용등록 서류 제출 마감"
  detail: "인사과(본관 3층)로 09:00~18:00 접수"
- date: "2026-08-03"
  title: "신규임용자 오리엔테이션"
  detail: "군산시청 대회의실, 09:00 시작"
- date: "2026-08-05"
  title: "임용장 수여식"
  detail: "군산시청 대강당, 10:00 시작"
```

- [ ] **Step 4: Validate YAML syntax**

Run:
```bash
ruby -ryaml -e "YAML.load_file('_data/nav.yml'); YAML.load_file('_data/notices.yml'); YAML.load_file('_data/events.yml'); puts 'ok'"
```
Expected: prints `ok` with no exceptions.

- [ ] **Step 5: Commit**

```bash
git add _data/nav.yml _data/notices.yml _data/events.yml
git commit -m "feat: add nav, notices, and events data"
```

---

### Task 3: Global design-system CSS

**Files:**
- Create: `assets/css/main.scss`

**Interfaces:**
- Produces: `/assets/css/main.css` (Jekyll converts `.scss` → `.css` on build), linked by Task 4's `_includes/head.html`.
- Produces CSS custom properties `--color-primary`, `--color-secondary`, `--color-accent`, `--color-text`, `--color-bg`, `--color-bg-muted`, `--color-border`, `--font-body`, `--content-max-width`, `--sidebar-width` — usable by any later CSS added to this same file only (this task ships the complete stylesheet; no other task edits this file).
- Produces class names consumed by later tasks' markup: `.site-header`, `.site-header__inner`, `.site-header__brand`, `.site-header__city`, `.site-header__title`, `.nav-toggle`, `.nav-toggle__bar`, `.page`, `.sidebar`, `.sidebar__backdrop`, `.sidebar__panel`, `.sidebar__close`, `.sidebar__list`, `.sidebar__item`, `.sidebar__link`, `.sidebar__link--current`, `.content`, `.page-title`, `.notice-list__item`, `.notice-list__date`, `.notice-list__title`, `.notice-list__body`, `.calendar__grid`, `.calendar__weekday`, `.calendar__cell`, `.calendar__cell--empty`, `.calendar__day`, `.calendar__day--event`, `.calendar__badge`, `.calendar__event-list`, `.attachment-card`, `.attachment-card__icon`, `.attachment-card__name`, `.attachment-card__action`, `.faq-item`, `.site-footer`, `.sr-only`, `.skip-link`, body class `nav-open`.

- [ ] **Step 1: Create `assets/css/main.scss`**

```scss
---
---
:root {
  --color-primary: #1A2D65;
  --color-secondary: #018FD7;
  --color-accent: #7AC38E;
  --color-text: #242933;
  --color-bg: #FFFFFF;
  --color-bg-muted: #F4F6F8;
  --color-border: #D8DCE2;
  --font-body: "Pretendard", -apple-system, BlinkMacSystemFont, "Malgun Gothic", sans-serif;
  --content-max-width: 1080px;
  --sidebar-width: 260px;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.6;
  color: var(--color-text);
  background: var(--color-bg-muted);
}

.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.skip-link {
  position: absolute;
  left: -999px;
  top: 0;
  background: var(--color-primary);
  color: #fff;
  padding: 0.75rem 1rem;
  z-index: 100;
}
.skip-link:focus {
  left: 0;
}

/* Header */
.site-header {
  background: var(--color-primary);
  color: #fff;
}
.site-header__inner {
  max-width: var(--content-max-width);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
}
.site-header__brand {
  color: #fff;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}
.site-header__city { font-size: 0.875rem; opacity: 0.85; }
.site-header__title { font-size: 1.125rem; font-weight: 700; }

.nav-toggle {
  display: none;
  flex-direction: column;
  gap: 4px;
  background: transparent;
  border: 0;
  padding: 0.5rem;
  cursor: pointer;
}
.nav-toggle__bar {
  width: 24px;
  height: 2px;
  background: #fff;
}

/* Layout */
.page {
  max-width: var(--content-max-width);
  margin: 0 auto;
  display: grid;
  grid-template-columns: var(--sidebar-width) 1fr;
  gap: 2rem;
  padding: 2rem 1rem;
  align-items: start;
}

.sidebar__backdrop { display: none; }
.sidebar__panel {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem;
  position: sticky;
  top: 1rem;
}
.sidebar__close { display: none; }
.sidebar__list { list-style: none; margin: 0; padding: 0; }
.sidebar__item + .sidebar__item { margin-top: 0.25rem; }
.sidebar__link {
  display: block;
  padding: 0.6rem 0.75rem;
  border-radius: 6px;
  color: var(--color-text);
  text-decoration: none;
}
.sidebar__link:hover,
.sidebar__link:focus {
  background: var(--color-bg-muted);
}
.sidebar__link--current {
  background: var(--color-primary);
  color: #fff;
  font-weight: 700;
}

.content {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.5rem 2rem;
}
.page-title {
  font-size: 1.75rem;
  border-bottom: 2px solid var(--color-primary);
  padding-bottom: 0.75rem;
}

/* Notices */
.notice-list__item {
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-secondary);
  border-radius: 6px;
  padding: 0.75rem 1rem;
  margin-bottom: 0.75rem;
}
.notice-list__date { margin: 0; font-size: 0.875rem; color: var(--color-secondary); }
.notice-list__title { margin: 0.25rem 0; font-weight: 700; }
.notice-list__body { margin: 0; }

/* Calendar */
.calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-top: 0.5rem;
}
.calendar__weekday {
  text-align: center;
  font-weight: 700;
  padding: 0.5rem 0;
  color: var(--color-primary);
}
.calendar__cell {
  min-height: 64px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 0.35rem;
}
.calendar__cell--empty { border: none; }
.calendar__day { display: inline-block; }
.calendar__day--event {
  cursor: pointer;
  font-weight: 700;
  color: var(--color-secondary);
}
.calendar__badge {
  display: inline-block;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--color-accent);
  margin-left: 4px;
}
.calendar__event-list {
  list-style: none;
  margin: 0.5rem 0 0;
  padding: 0;
  font-size: 0.875rem;
}

/* Attachment card */
.attachment-card {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 44px;
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text);
  text-decoration: none;
  margin: 0.25rem 0;
}
.attachment-card:hover,
.attachment-card:focus {
  border-color: var(--color-secondary);
}
.attachment-card__action {
  margin-left: auto;
  color: var(--color-secondary);
  font-weight: 700;
}

/* FAQ */
.faq-item {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
}
.faq-item summary {
  cursor: pointer;
  font-weight: 700;
}

/* Tables */
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  border: 1px solid var(--color-border);
  padding: 0.5rem 0.75rem;
  text-align: left;
}

/* Footer */
.site-footer {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
  color: #5b6472;
  font-size: 0.875rem;
}

/* Mobile */
@media (max-width: 959px) {
  .nav-toggle { display: flex; }

  .page {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: fixed;
    inset: 0;
    z-index: 50;
    pointer-events: none;
  }
  .sidebar__backdrop {
    display: block;
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  .sidebar__panel {
    position: absolute;
    top: 0; left: 0; bottom: 0;
    width: 80%;
    max-width: 320px;
    border-radius: 0;
    transform: translateX(-100%);
    transition: transform 0.2s ease;
    overflow-y: auto;
  }
  .sidebar__close {
    display: block;
    margin-left: auto;
    background: transparent;
    border: 0;
    font-size: 1.25rem;
    padding: 0.5rem;
    cursor: pointer;
  }

  body.nav-open .sidebar { pointer-events: auto; }
  body.nav-open .sidebar__backdrop { opacity: 1; }
  body.nav-open .sidebar__panel { transform: translateX(0); }
  body.nav-open { overflow: hidden; }

  .content { padding: 1rem; }

  table { display: block; overflow-x: auto; }
}
```

- [ ] **Step 2: Build and verify the stylesheet compiles**

Run:
```bash
bundle exec jekyll build
grep -c "color-primary" _site/assets/css/main.css
```
Expected: build exits 0; grep prints a count of `1` or more.

- [ ] **Step 3: Commit**

```bash
git add assets/css/main.scss
git commit -m "feat: add KRDS-aligned design tokens and site stylesheet"
```

---

### Task 4: Shared layout chrome (head, header, footer, default layout)

**Files:**
- Create: `_includes/head.html`
- Create: `_includes/header.html`
- Create: `_includes/footer.html`
- Create: `_includes/sidebar.html` (stub — replaced fully in Task 5)
- Create: `_layouts/default.html`
- Modify: `index.md` (add `layout: default` to front matter)

**Interfaces:**
- Produces: `_layouts/default.html`, used by every page's front matter as `layout: default`.
- Produces: `#main-content` id on the `<main>` element (skip-link target).
- Consumes: `site.title`, `site.description` from `_config.yml` (Task 1); `assets/css/main.css` from Task 3.
- Stub `_includes/sidebar.html` in this task only outputs a `<nav id="site-sidebar">` with the id/classes Task 5 depends on — Task 5 overwrites this file's contents entirely.

- [ ] **Step 1: Create `_includes/head.html`**

```html
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{% if page.title %}{{ page.title }} - {% endif %}{{ site.title }}</title>
  <meta name="description" content="{{ site.description }}">
  <link rel="preconnect" href="https://cdn.jsdelivr.net">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css">
  <link rel="stylesheet" href="{{ '/assets/css/main.css' | relative_url }}">
</head>
```

- [ ] **Step 2: Create `_includes/header.html`**

```html
<header class="site-header">
  <div class="site-header__inner">
    <a class="site-header__brand" href="{{ '/' | relative_url }}">
      <span class="site-header__city">군산시</span>
      <span class="site-header__title">신규 공무원 임용등록 안내</span>
    </a>
    <button type="button" class="nav-toggle" id="nav-toggle" aria-expanded="false" aria-controls="site-sidebar">
      <span class="nav-toggle__bar"></span>
      <span class="nav-toggle__bar"></span>
      <span class="nav-toggle__bar"></span>
      <span class="sr-only">메뉴 열기</span>
    </button>
  </div>
</header>
```

- [ ] **Step 3: Create `_includes/footer.html`**

```html
<footer class="site-footer">
  <p>문의: 군산시청 인사과 (063-000-0000)</p>
  <p>&copy; {{ site.time | date: '%Y' }} Gunsan-si. All rights reserved.</p>
</footer>
```

- [ ] **Step 4: Create stub `_includes/sidebar.html`**

```html
<nav class="sidebar" id="site-sidebar" aria-label="주요 목차">
  <div class="sidebar__backdrop" id="sidebar-backdrop"></div>
  <div class="sidebar__panel">
    <button type="button" class="sidebar__close" id="sidebar-close">
      <span class="sr-only">메뉴 닫기</span>
      ✕
    </button>
    <p>목차 준비 중</p>
  </div>
</nav>
```

- [ ] **Step 5: Create `_layouts/default.html`**

```html
<!DOCTYPE html>
<html lang="ko">
{% include head.html %}
<body>
  <a class="skip-link" href="#main-content">본문 바로가기</a>
  {% include header.html %}
  <div class="page">
    {% include sidebar.html %}
    <main id="main-content" class="content" tabindex="-1">
      <h1 class="page-title">{{ page.title }}</h1>
      {{ content }}
    </main>
  </div>
  {% include footer.html %}
  <script src="{{ '/assets/js/nav.js' | relative_url }}" defer></script>
  {% if page.url == '/' %}
  <script src="{{ '/assets/js/calendar.js' | relative_url }}" defer></script>
  {% endif %}
</body>
</html>
```

- [ ] **Step 6: Wire `index.md` to the new layout**

Update `index.md` to:

```markdown
---
layout: default
title: 메인
---

# 군산시 신규 공무원 임용등록 안내

사이트 준비 중입니다.
```

- [ ] **Step 7: Build and verify chrome renders**

Run:
```bash
bundle exec jekyll build
grep -c "site-header__title" _site/index.html
grep -c "main-content" _site/index.html
grep -c "site-footer" _site/index.html
```
Expected: build exits 0; each grep prints `1` or more.

- [ ] **Step 8: Commit**

```bash
git add _includes/head.html _includes/header.html _includes/footer.html _includes/sidebar.html _layouts/default.html index.md
git commit -m "feat: add shared layout chrome (head, header, footer, default layout)"
```

---

### Task 5: Sidebar navigation + mobile off-canvas menu

**Files:**
- Modify: `_includes/sidebar.html` (replace stub from Task 4 entirely)
- Create: `assets/js/nav.js`

**Interfaces:**
- Consumes: `site.data.nav` (Task 2), `page.url` (Jekyll built-in), CSS classes from Task 3 (`.sidebar`, `.sidebar__backdrop`, `.sidebar__panel`, `.sidebar__close`, `.sidebar__list`, `.sidebar__item`, `.sidebar__link`, `.sidebar__link--current`), `#nav-toggle` button from Task 4's `_includes/header.html`.
- Produces: DOM ids `#site-sidebar`, `#sidebar-backdrop`, `#sidebar-close` consumed only by `assets/js/nav.js` in this same task.
- Produces: `body.nav-open` class toggled by `nav.js`, consumed by Task 3's mobile CSS (already written).

- [ ] **Step 1: Replace `_includes/sidebar.html` with the full implementation**

```html
<nav class="sidebar" id="site-sidebar" aria-label="주요 목차">
  <div class="sidebar__backdrop" id="sidebar-backdrop"></div>
  <div class="sidebar__panel">
    <button type="button" class="sidebar__close" id="sidebar-close">
      <span class="sr-only">메뉴 닫기</span>
      ✕
    </button>
    <ul class="sidebar__list">
      {% for item in site.data.nav %}
      <li class="sidebar__item">
        <a href="{{ item.url | relative_url }}"
           class="sidebar__link{% if page.url == item.url %} sidebar__link--current{% endif %}"
           {% if page.url == item.url %}aria-current="page"{% endif %}>
          {{ item.title }}
        </a>
      </li>
      {% endfor %}
    </ul>
  </div>
</nav>
```

- [ ] **Step 2: Create `assets/js/nav.js`**

```js
(function () {
  var toggle = document.getElementById('nav-toggle');
  var sidebar = document.getElementById('site-sidebar');
  var backdrop = document.getElementById('sidebar-backdrop');
  var closeBtn = document.getElementById('sidebar-close');
  if (!toggle || !sidebar || !backdrop || !closeBtn) return;

  var focusableSelector = 'a[href], button:not([disabled])';
  var lastFocused = null;

  function getFocusable() {
    return Array.prototype.slice.call(sidebar.querySelectorAll(focusableSelector));
  }

  function openMenu() {
    lastFocused = document.activeElement;
    document.body.classList.add('nav-open');
    toggle.setAttribute('aria-expanded', 'true');
    var focusable = getFocusable();
    if (focusable.length) focusable[0].focus();
    document.addEventListener('keydown', onKeydown);
  }

  function closeMenu() {
    document.body.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', onKeydown);
    if (lastFocused) lastFocused.focus();
  }

  function onKeydown(event) {
    if (event.key === 'Escape') {
      closeMenu();
      return;
    }
    if (event.key !== 'Tab') return;
    var focusable = getFocusable();
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  toggle.addEventListener('click', function () {
    if (document.body.classList.contains('nav-open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });
  closeBtn.addEventListener('click', closeMenu);
  backdrop.addEventListener('click', closeMenu);
})();
```

- [ ] **Step 3: Build and verify the nav renders all 8 items with the current one marked**

Run:
```bash
bundle exec jekyll build
grep -c "sidebar__link" _site/index.html
grep "aria-current" _site/index.html
```
Expected: build exits 0; first grep prints `8` or more (8 links, some lines may match more than once depending on class concatenation — at minimum 8); second grep shows exactly one line, and it corresponds to the "메인" link (`href="/"`).

- [ ] **Step 4: Manual QA (no automated JS test harness in this project — verify by hand)**

Run:
```bash
bundle exec jekyll serve
```
Open `http://localhost:4000` in a browser, resize to under 959px width, and confirm:
- The hamburger button appears and the sidebar is hidden by default.
- Clicking the hamburger slides the sidebar in, dims the background, and moves focus into the sidebar.
- `Tab`/`Shift+Tab` cycles focus only within the open sidebar (focus trap).
- `Esc`, the backdrop, and the close (✕) button all close the menu and return focus to the hamburger button.

- [ ] **Step 5: Commit**

```bash
git add _includes/sidebar.html assets/js/nav.js
git commit -m "feat: implement sidebar navigation and mobile off-canvas menu"
```

---

### Task 6: Guide pages (registration, pre-documents, photo, documents, application-form, rank)

**Files:**
- Create: `guide/registration/index.md`
- Create: `guide/pre-documents/index.md`
- Create: `guide/photo/index.md`
- Create: `guide/documents/index.md`
- Create: `guide/application-form/index.md`
- Create: `guide/rank/index.md`

**Interfaces:**
- Produces URLs `/guide/registration/`, `/guide/pre-documents/`, `/guide/photo/`, `/guide/documents/`, `/guide/application-form/`, `/guide/rank/` — must exactly match `_data/nav.yml` (Task 2) entries.
- Each file uses `layout: default` (Task 4) and a `title` matching its `_data/nav.yml` title.
- `guide/documents/index.md` is extended later in Task 10 with an attachment-card example — keep its placeholder body short and easy to extend.

- [ ] **Step 1: Create `guide/registration/index.md`**

```markdown
---
layout: default
title: 임용등록 안내
---

## 임용등록 절차 안내

이 페이지의 세부 내용은 준비 중입니다. 임용등록 전체 절차, 일정, 유의사항이 이 영역에 채워질 예정입니다.
```

- [ ] **Step 2: Create `guide/pre-documents/index.md`**

```markdown
---
layout: default
title: 사전제출서류 작성방법
---

## 사전제출서류 작성방법

이 페이지의 세부 내용은 준비 중입니다. 사전제출서류 항목별 작성 방법이 이 영역에 채워질 예정입니다.
```

- [ ] **Step 3: Create `guide/photo/index.md`**

```markdown
---
layout: default
title: 증명사진 제출 안내
---

## 증명사진 제출 안내

이 페이지의 세부 내용은 준비 중입니다. 증명사진 규격, 제출 방법, 유의사항이 이 영역에 채워질 예정입니다.
```

- [ ] **Step 4: Create `guide/documents/index.md`**

```markdown
---
layout: default
title: 제출서류 안내
---

## 제출서류 안내

이 페이지의 세부 내용은 준비 중입니다. 제출서류 목록과 제출처가 이 영역에 채워질 예정입니다.
```

- [ ] **Step 5: Create `guide/application-form/index.md`**

```markdown
---
layout: default
title: 임용등록원서 작성방법
---

## 임용등록원서 작성방법

이 페이지의 세부 내용은 준비 중입니다. 임용등록원서 항목별 작성 방법이 이 영역에 채워질 예정입니다.
```

- [ ] **Step 6: Create `guide/rank/index.md`**

```markdown
---
layout: default
title: 임용직급
---

## 임용직급 안내

이 페이지의 세부 내용은 준비 중입니다. 직급별 안내가 이 영역에 채워질 예정입니다.
```

- [ ] **Step 7: Build and verify all 6 pages exist and are linked correctly**

Run:
```bash
bundle exec jekyll build
for f in registration pre-documents photo documents application-form rank; do
  test -f "_site/guide/$f/index.html" && echo "OK: $f" || echo "MISSING: $f"
done
```
Expected: prints `OK: <slug>` for all six slugs.

- [ ] **Step 8: Verify current-page highlighting works on a guide page**

Run:
```bash
grep "aria-current" _site/guide/registration/index.html
```
Expected: one line, corresponding to the "임용등록 안내" link (`href="/guide/registration/"`).

- [ ] **Step 9: Commit**

```bash
git add guide/registration/index.md guide/pre-documents/index.md guide/photo/index.md guide/documents/index.md guide/application-form/index.md guide/rank/index.md
git commit -m "feat: add placeholder guide pages"
```

---

### Task 7: FAQ page with accordion

**Files:**
- Create: `guide/faq/index.md`

**Interfaces:**
- Produces URL `/guide/faq/`, matching `_data/nav.yml`'s `Q&A` entry (`/guide/faq/`).
- Uses the `.faq-item` CSS class already defined in Task 3's `main.scss` (native `<details>/<summary>`, no JS required).

- [ ] **Step 1: Create `guide/faq/index.md`**

```markdown
---
layout: default
title: Q&A
---

## 자주 묻는 질문

아래 질문/답변은 예시이며, 실제 문의 내용은 전달받는 대로 이와 같은 형식으로 채워 넣습니다.

<details class="faq-item">
  <summary>Q. 임용등록 서류는 어디로 제출하나요?</summary>
  <p>A. 군산시청 본관 3층 인사과로 방문 제출하시면 됩니다.</p>
</details>

<details class="faq-item">
  <summary>Q. 서류 제출 기한을 놓치면 어떻게 되나요?</summary>
  <p>A. 담당자에게 사전에 연락하여 안내를 받으시기 바랍니다.</p>
</details>
```

- [ ] **Step 2: Build and verify**

Run:
```bash
bundle exec jekyll build
grep -c "faq-item" _site/guide/faq/index.html
```
Expected: build exits 0; grep prints `2` or more.

- [ ] **Step 3: Commit**

```bash
git add guide/faq/index.md
git commit -m "feat: add FAQ page with accordion entries"
```

---

### Task 8: Notices list on the main page

**Files:**
- Create: `_includes/notice-list.html`
- Modify: `index.md`

**Interfaces:**
- Consumes: `site.data.notices` (Task 2), CSS classes `.notice-list__item`, `.notice-list__date`, `.notice-list__title`, `.notice-list__body` (Task 3).
- Produces: `{% include notice-list.html %}` usable from `index.md`.

- [ ] **Step 1: Create `_includes/notice-list.html`**

```html
<section class="notice-list" aria-labelledby="notice-heading">
  <h2 id="notice-heading">공지사항</h2>
  <ul>
    {% for notice in site.data.notices %}
    <li class="notice-list__item">
      <p class="notice-list__date">{{ notice.date | date: '%Y.%m.%d' }}</p>
      <p class="notice-list__title">{{ notice.title }}</p>
      <p class="notice-list__body">{{ notice.body }}</p>
    </li>
    {% endfor %}
  </ul>
</section>
```

- [ ] **Step 2: Update `index.md` to include the notice list**

```markdown
---
layout: default
title: 메인
---

{% include notice-list.html %}
```

- [ ] **Step 3: Build and verify notices render**

Run:
```bash
bundle exec jekyll build
grep -c "notice-list__item" _site/index.html
grep "신규임용자 오리엔테이션 일정 안내" _site/index.html
```
Expected: build exits 0; first grep prints `2` (two notices); second grep shows a matching line.

- [ ] **Step 4: Commit**

```bash
git add _includes/notice-list.html index.md
git commit -m "feat: show notices on the main page"
```

---

### Task 9: Month calendar on the main page

**Files:**
- Create: `_includes/calendar.html`
- Create: `assets/js/calendar.js`
- Modify: `index.md`

**Interfaces:**
- Consumes: `site.data.events` (Task 2, `{date, title, detail}` with `date` as `YYYY-MM-DD` string), `site.calendar_month` (Task 1, `"2026-08-01"`), CSS classes from Task 3 (`.calendar__grid`, `.calendar__weekday`, `.calendar__cell`, `.calendar__cell--empty`, `.calendar__day`, `.calendar__day--event`, `.calendar__badge`, `.calendar__event-list`).
- Produces: `#calendar-root` element with `data-month` and `data-events` attributes, read only by `assets/js/calendar.js` in this same task.
- `assets/js/calendar.js` is loaded conditionally on `page.url == '/'` per Task 4's `_layouts/default.html` — no change needed there.

- [ ] **Step 1: Create `_includes/calendar.html`**

```html
<section class="calendar" aria-labelledby="calendar-heading">
  <h2 id="calendar-heading">임용등록 일정</h2>
  <div id="calendar-root"
       class="calendar__root"
       data-month="{{ site.calendar_month }}"
       data-events="{{ site.data.events | jsonify | escape }}">
    <p>일정을 불러오는 중입니다...</p>
  </div>
</section>
```

- [ ] **Step 2: Create `assets/js/calendar.js`**

```js
(function () {
  var root = document.getElementById('calendar-root');
  if (!root) return;

  var monthValue = root.getAttribute('data-month');
  var events = JSON.parse(root.getAttribute('data-events') || '[]');
  var monthDate = new Date(monthValue + 'T00:00:00');
  var year = monthDate.getFullYear();
  var month = monthDate.getMonth();

  var eventsByDate = {};
  events.forEach(function (event) {
    if (!eventsByDate[event.date]) eventsByDate[event.date] = [];
    eventsByDate[event.date].push(event);
  });

  function pad(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  var firstWeekday = new Date(year, month, 1).getDay();
  var daysInMonth = new Date(year, month + 1, 0).getDate();
  var weekdayLabels = ['일', '월', '화', '수', '목', '금', '토'];

  var html = '<p class="calendar__title">' + year + '년 ' + (month + 1) + '월</p>';
  html += '<div class="calendar__grid" role="grid">';
  weekdayLabels.forEach(function (label) {
    html += '<div class="calendar__weekday" role="columnheader">' + label + '</div>';
  });

  for (var i = 0; i < firstWeekday; i++) {
    html += '<div class="calendar__cell calendar__cell--empty" role="gridcell"></div>';
  }

  for (var day = 1; day <= daysInMonth; day++) {
    var dateKey = year + '-' + pad(month + 1) + '-' + pad(day);
    var dayEvents = eventsByDate[dateKey] || [];
    html += '<div class="calendar__cell" role="gridcell">';
    if (dayEvents.length) {
      html += '<details class="calendar__details">';
      html += '<summary class="calendar__day calendar__day--event">' + day +
        '<span class="calendar__badge" aria-hidden="true"></span></summary>';
      html += '<ul class="calendar__event-list">';
      dayEvents.forEach(function (event) {
        html += '<li><strong>' + event.title + '</strong><br>' + event.detail + '</li>';
      });
      html += '</ul></details>';
    } else {
      html += '<span class="calendar__day">' + day + '</span>';
    }
    html += '</div>';
  }

  html += '</div>';
  root.innerHTML = html;
})();
```

Note: `events`/`notices` in `_data/*.yml` are maintainer-authored content (not end-user input), so building this markup via `innerHTML` carries no injection risk from external users.

- [ ] **Step 3: Update `index.md` to include the calendar**

```markdown
---
layout: default
title: 메인
---

{% include notice-list.html %}
{% include calendar.html %}
```

- [ ] **Step 4: Build and verify the calendar container and data render**

Run:
```bash
bundle exec jekyll build
grep -c "calendar-root" _site/index.html
grep "임용등록 서류 제출 마감" _site/index.html
```
Expected: build exits 0; first grep prints `1`; second grep shows the event title embedded in the `data-events` JSON attribute.

- [ ] **Step 5: Manual QA (calendar math runs client-side, no automated JS test harness)**

Run:
```bash
bundle exec jekyll serve
```
Open `http://localhost:4000` and confirm:
- The calendar renders a August 2026 grid (Sun–Sat header, correct day-of-week alignment, 31 days).
- July 31, Aug 3, and Aug 5 show a badge and expand via `<details>` to show the event title/detail when clicked.
- Days without events show a plain number, not a clickable disclosure.

- [ ] **Step 6: Commit**

```bash
git add _includes/calendar.html assets/js/calendar.js index.md
git commit -m "feat: render month calendar with event details on the main page"
```

---

### Task 10: Attachment file card component

**Files:**
- Create: `_includes/attachment-card.html`
- Modify: `guide/documents/index.md`

**Interfaces:**
- Consumes: Liquid include params `file` (path under `/assets/files/`) and `name` (display filename), CSS classes `.attachment-card`, `.attachment-card__icon`, `.attachment-card__name`, `.attachment-card__action` (Task 3).
- Real attachment files (hwp/docx/pdf) are added later by the site maintainer under `assets/files/`; this task only builds the component and wires one example usage.

- [ ] **Step 1: Create `_includes/attachment-card.html`**

```html
{% comment %}
Usage: {% include attachment-card.html file="/assets/files/example.hwp" name="증명사진 규격 안내.hwp" %}
{% endcomment %}
<a class="attachment-card" href="{{ include.file | relative_url }}" download>
  <span class="attachment-card__icon" aria-hidden="true">📎</span>
  <span class="attachment-card__name">{{ include.name }}</span>
  <span class="attachment-card__action">다운로드</span>
</a>
```

- [ ] **Step 2: Create a placeholder attachment file so the example link resolves**

```bash
mkdir -p assets/files
printf '이 파일은 임용등록 서류 서식 예시 자리표시자입니다. 실제 서식 파일로 교체될 예정입니다.\n' > assets/files/example.txt
```

- [ ] **Step 3: Add an example usage to `guide/documents/index.md`**

```markdown
---
layout: default
title: 제출서류 안내
---

## 제출서류 안내

이 페이지의 세부 내용은 준비 중입니다. 제출서류 목록과 제출처가 이 영역에 채워질 예정입니다.

### 서식 다운로드 (예시)

{% include attachment-card.html file="/assets/files/example.txt" name="제출서류 서식 예시.txt" %}
```

- [ ] **Step 4: Build and verify**

Run:
```bash
bundle exec jekyll build
grep -c "attachment-card" _site/guide/documents/index.html
test -f _site/assets/files/example.txt && echo "OK: file copied"
```
Expected: build exits 0; grep prints `1` or more; `OK: file copied` is printed.

- [ ] **Step 5: Commit**

```bash
git add _includes/attachment-card.html guide/documents/index.md assets/files/example.txt
git commit -m "feat: add attachment file card component"
```

---

### Task 11: Final verification pass

**Files:**
- No new files. Runs checks across the whole built site.

**Interfaces:**
- None produced — this task only verifies the output of Tasks 1–10.

- [ ] **Step 1: Full clean build**

Run:
```bash
rm -rf _site
bundle exec jekyll build
```
Expected: exits 0, `_site/` regenerated.

- [ ] **Step 2: Run html-proofer for broken links, missing alt text, and structural HTML issues**

Run:
```bash
bundle exec htmlproofer ./_site --disable-external --checks Links,Images,Scripts
```
Expected: exits 0 with no failures. If it reports a missing `alt` attribute or broken internal link, fix the offending file and re-run before proceeding.

- [ ] **Step 3: Verify every nav.yml URL resolves to a real page**

Run:
```bash
ruby -ryaml -e '
nav = YAML.load_file("_data/nav.yml")
nav.each do |item|
  path = item["url"] == "/" ? "_site/index.html" : "_site#{item["url"]}index.html"
  raise "MISSING: #{item["url"]}" unless File.exist?(path)
end
puts "all nav targets exist"
'
```
Expected: prints `all nav targets exist`.

- [ ] **Step 4: Manual accessibility/responsive QA checklist**

Run:
```bash
bundle exec jekyll serve
```
Using a keyboard only (no mouse) and a browser at both desktop (>=960px) and mobile (<960px) widths, confirm:
- `Tab` from the top of the page reaches the skip link first, and activating it jumps focus to `#main-content`.
- All sidebar links, the hamburger toggle, calendar day disclosures, FAQ disclosures, and the attachment card are reachable and operable via keyboard alone, with a visible focus outline at each stop.
- At <960px width, the sidebar is fully hidden until the hamburger is activated, and reappears as a persistent column at >=960px.
- Zooming text to 200% (browser zoom) does not clip or overlap any content.

- [ ] **Step 5: Update README with deployment note**

Update `README.md`, replacing its final line with:

```markdown
## 배포

`main` 브랜치에 push하면 GitHub Pages가 자동으로 Jekyll 빌드/배포합니다.
저장소 Settings > Pages 에서 Source가 `main` 브랜치인지 한 번만 확인하세요.
```

- [ ] **Step 6: Commit**

```bash
git add README.md
git commit -m "docs: add deployment note and complete verification pass"
```
