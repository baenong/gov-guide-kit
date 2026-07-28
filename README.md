<p align="center">
  <img src="./.github/assets/brightness.svg" width="128">
</p>

<hr>

<h1 align="center">gov-guide-kit</h1>

<p align="center">
  <i>코드 한 줄 몰라도, 공공기관 민원 안내 사이트를 만듭니다</i>
  <br>
  <br>공공기관이 복사해서 쓰는 재사용 가능한 안내 사이트 템플릿입니다.
  <br>로그인·검색·백엔드 없이, 마크다운(또는 GUI 에디터)으로 작성한 콘텐츠를 KRDS 스타일의 정적 사이트로 자동 변환해 배포합니다.
</p>

<p align="center">
  <a href="https://astro.build/"><img src="https://img.shields.io/badge/Astro-4-BC52EE.svg?logo=astro&logoColor=white" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.5-3178C6.svg?logo=typescript&logoColor=white" /></a>
  <img src="https://img.shields.io/badge/Node-22-339933.svg?logo=node.js&logoColor=white" />
  <a href="https://vitest.dev/"><img src="https://img.shields.io/badge/Vitest-tested-6E9F18.svg?logo=vitest&logoColor=white" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License: MIT" /></a>
</p>

## 전체 흐름 한눈에 보기

1. 이 저장소를 복사한다 (GitHub "Use this template" 또는 Fork)
2. `site.config.json`에 기관명·색상·로고를 적어 우리 기관 사이트로 만든다
3. Vercel, GitHub Pages, GitLab Pages 중 하나를 연결한다 (한 번만 하면 됨)
4. `npm run editor`로 로컬 GUI 에디터를 열어 페이지 내용을 작성한다 (마크다운 문법 몰라도 됨)
5. 변경사항을 저장(`git push`)하면 몇 분 안에 실제 웹사이트에 반영된다

아래 순서대로 따라 하면 됩니다.

## 1단계. 저장소 복사하기

GitHub에서 이 저장소를 열고 우측 상단의 **"Use this template"** 버튼(또는 **Fork**)을 눌러 내 계정으로 복사합니다. 이후 작업은 전부 복사된 내 저장소에서 진행합니다.

## 2단계. 우리 기관 정보 설정하기 (최초 1회)

저장소 루트의 `site.config.json` 파일을 아래처럼 수정합니다.

```json
{
  "orgName": "기관명",
  "colors": { "primary": "#1A2D65", "secondary": "#018FD7", "accent": "#7AC38E" },
  "logoPath": "/assets/logo.svg",
  "logoBackground": false
}
```

> 코드 편집이 부담스럽다면, 4단계의 로컬 GUI 에디터를 실행한 뒤 좌측 상단 **"사이트 설정"** 버튼으로도 같은 항목(기관명·색상·로고 경로·로고 배경)을 화면에서 수정할 수 있습니다.

- `orgName`: 헤더에 표시될 기관명
- `colors`: 사이트 전체에 쓰이는 주요 색상 (기본색/보조색/강조색)
- `logoPath`: 로고 이미지 경로. `public/assets/` 폴더에 로고 파일을 넣고 그 경로를 적습니다 (예: `public/assets/logo.svg`에 파일을 두면 `/assets/logo.svg`).
- `logoBackground`: 헤더 색과 로고 색이 비슷해 로고가 잘 안 보일 때 `true`로 설정하면 로고 뒤에 흰색 배경을 깔아줍니다 (생략하면 `false`).

GitHub 웹사이트에서 `site.config.json` 파일을 열어 연필(수정) 아이콘을 누르면 코드를 몰라도 수정 후 바로 커밋할 수 있습니다.

## 3단계. 배포 연결하기 (최초 1회, 셋 중 하나 선택)

### 옵션 A: Vercel (추천 — 설정이 더 간단함)

1. [vercel.com](https://vercel.com)에 GitHub 계정으로 로그인합니다.
2. "New Project"에서 방금 복사한 저장소를 선택합니다.
3. 별도 설정 없이 "Deploy"를 누르면 끝입니다. 이후 저장소에 `git push`할 때마다 자동으로 다시 배포됩니다.

### 옵션 B: GitHub Pages (Vercel 계정 없이 무료로 운영 가능)

1. 저장소의 **Settings → Pages**로 이동합니다.
2. "Build and deployment" 항목의 소스를 **GitHub Actions**로 지정합니다.
3. 저장소에 이미 포함된 `.github/workflows/deploy.yml`이 `main` 브랜치에 push할 때마다 자동으로 빌드/배포합니다. 진행 상황은 저장소의 **Actions** 탭에서 확인할 수 있습니다.

### 옵션 C: GitLab Pages (GitLab에 올리는 경우)

1. 저장소를 GitHub 대신(또는 추가로) GitLab에도 push합니다.
2. 저장소에 이미 포함된 `.gitlab-ci.yml`이 기본 브랜치에 push할 때마다 자동으로 빌드/배포합니다. 진행 상황은 GitLab의 **CI/CD → Pipelines**에서 확인할 수 있습니다.
3. 저장소 이름이 일반 프로젝트라면 별도 설정이 필요 없습니다. 다만 이 저장소가 GitLab의 특수 "그룹/네임스페이스 전용 Pages 프로젝트"(`<네임스페이스>.gitlab.io`라는 이름의 저장소)라면, 프로젝트의 **Settings → CI/CD → Variables**에서 `GITLAB_PAGES_BASE` 값을 `/`로 추가해야 합니다.

## 4단계. 콘텐츠 작성하기

### 방법 1: 로컬 GUI 에디터 사용 (추천, 비개발자용)

마크다운 문법을 몰라도 화면에서 버튼을 눌러 콘텐츠를 작성할 수 있는 도구가 포함되어 있습니다.

1. 컴퓨터에 [Node.js](https://nodejs.org) (22 이상)를 설치합니다.
2. 저장소를 내 컴퓨터에 내려받습니다 (GitHub Desktop을 쓰면 명령어 없이 가능합니다).
3. 터미널(또는 GitHub Desktop의 "Open in Terminal")에서 아래 명령을 한 번 실행합니다.

   ```bash
   npm install
   ```

4. 이후 콘텐츠를 작성할 때마다 아래 명령으로 에디터를 엽니다.

   ```bash
   npm run editor
   ```

   브라우저가 자동으로 열리며 `http://localhost:4322`에서 에디터 화면이 나타납니다. 이때 실제 사이트를 미리 볼 수 있는 서버(`http://localhost:4321`)도 함께 자동으로 실행되어, 화면 오른쪽 패널에 실시간 미리보기가 함께 표시됩니다.

5. 왼쪽에서 페이지를 선택하거나 "새 페이지"로 새로 만듭니다. 제목/설명/본문을 입력하고, 툴바 버튼(굵게·중제목·소제목·공지·주의·캘린더·표·글자색·페이지 링크·이미지·첨부파일)을 눌러 마크다운 문법을 몰라도 서식을 삽입할 수 있습니다.
6. 반복해서 쓰이는 값(등록 마감일 등)은 왼쪽 사이드바 하단의 "변수" 섹션에서 한 번만 등록해두면, "삽입" 버튼으로 아무 페이지에나 가져다 쓸 수 있습니다. 값을 나중에 바꾸면 그 변수를 쓰는 모든 페이지가 함께 갱신됩니다.
7. 오른쪽 미리보기 패널 상단의 **PC / 모바일 / 전체화면** 버튼으로, 실제 PC·모바일 화면에서 어떻게 보이는지 축소된 크기로 바로 확인할 수 있습니다.
8. 작성이 끝나면 "저장" 버튼을 누릅니다. 오른쪽 미리보기가 곧바로 최신 내용으로 새로고침됩니다. (이 저장은 아직 내 컴퓨터의 파일에만 반영됩니다 — 실제 웹사이트에 올리려면 아래 5단계가 필요합니다.)

### 방법 2: `.md` 파일 직접 편집 (개발자 또는 GitHub 웹 화면에서 직접 수정하고 싶은 경우)

`src/content/guide/` 폴더의 `.md` 파일을 직접 열어 아래 문법으로 작성합니다.

1. 파일 맨 위에는 이렇게 적습니다.

   ```md
   ---
   title: 페이지 제목
   order: 2
   ---

   본문 내용...
   ```

   `order` 숫자가 작을수록 좌측 메뉴 위쪽에 표시됩니다.

2. 강조 박스:

   ```md
   :::notice
   여기에 공지 내용을 씁니다.
   :::

   :::warning
   여기에 주의사항을 씁니다.
   :::
   ```

3. 캘린더:

   ```md
   :::calendar
   - 2026-08-15: 임용등록 마감
   - 2026-08-20: 서류 제출
   - 2026-08-24~2026-08-28: 하계휴가
   :::
   ```

   `날짜~날짜: 제목` 형식으로 쓰면 여러 날에 걸친 일정(기간 일정)이 되며, 캘린더에서 해당 날짜들에 걸쳐 하나로 이어진 막대로 표시됩니다.

4. 다른 페이지로 링크: `[임용등록 안내](/guide/registration)`
5. 첨부파일(hwp/pdf 등)은 일반 링크로 씁니다. 자동으로 다운로드 카드로 바뀝니다.

   ```md
   [2026년 임용등록원서.hwp](/assets/files/2026-form.hwp)
   ```

6. 이미지는 일반 마크다운 문법을 씁니다(경로는 반드시 `/`로 시작): `![설명](/assets/images/파일명.png)`
7. 굵은 글씨는 `**내용**`처럼 별표 두 개로 감쌉니다.
8. 표는 일반 마크다운 표 문법을 그대로 씁니다.

   ```md
   | 이름 | 나이 |
   | --- | --- |
   | 홍길동 | 30 |
   ```

9. 반복해서 쓰이는 값은 `site.variables.json`에 한 번만 적어두고, 본문에서는 `{{등록일}}`처럼 참조합니다.

   ```json
   { "등록일": "2026-08-15" }
   ```

   ```md
   등록 마감은 {{등록일}}까지입니다.
   ```

## 5단계. 변경사항을 실제 웹사이트에 반영하기

에디터에서 "저장"을 누르거나 `.md` 파일을 직접 고친 것만으로는 실제 웹사이트가 바뀌지 않습니다. 변경사항을 저장소에 올려야(push) 3단계에서 연결한 Vercel/GitHub Pages/GitLab Pages가 자동으로 새로 빌드합니다.

- **GitHub Desktop을 쓰는 경우**: 변경된 파일 목록이 자동으로 보입니다. 하단에 커밋 메시지(예: "임용등록 안내 페이지 수정")를 적고 "Commit to main" → "Push origin"을 누르면 끝입니다.
- **터미널을 쓰는 경우**:

  ```bash
  git add -A
  git commit -m "임용등록 안내 페이지 수정"
  git push
  ```

이후 Vercel은 1~2분 내로, GitHub Pages는 저장소의 **Actions** 탭에서, GitLab Pages는 **CI/CD → Pipelines**에서 진행 상황을 확인할 수 있습니다.

## 6단계. 템플릿 업데이트 받기 (원본 저장소가 개선되었을 때)

이 템플릿(gov-guide-kit)에 새로운 기능이나 수정사항이 추가되면, 이미 복사해서 쓰고 있는 내 저장소에도 반영할 수 있습니다. 이미 작성한 안내 페이지(`src/content`), 업로드한 이미지/첨부파일(`public/assets`), 사이트 설정(`site.config.json`, `site.variables.json`)은 그대로 유지되고 에디터/렌더링 코드만 갱신됩니다.

**Git Bash를 쓰는 경우:**

```bash
scripts/update-from-template.sh
```

**PowerShell을 쓰는 경우** (Git for Windows가 설치되어 있으면 됩니다):

```powershell
scripts/update-from-template.ps1
```

내 저장소 루트(커밋되지 않은 변경사항이 없는 상태)에서 위 명령을 실행하면 됩니다. 처음 실행할 때뿐 아니라 템플릿이 다시 업데이트될 때마다 재실행하면 됩니다. 실행 중 충돌이 표시되면, 그건 대부분 내가 직접 고친 에디터 코드와 템플릿 쪽 수정이 같은 부분을 건드린 경우이니 직접 어느 쪽을 남길지 확인 후 커밋하면 됩니다.

## 개발자용 로컬 명령어

```bash
npm install
npm run dev        # 미리보기: http://localhost:4321
npm run editor      # 로컬 GUI 에디터(http://localhost:4322) + 미리보기 서버를 함께 실행
npm run build       # 정적 빌드 (front matter/색상 대비 오류가 있으면 표시됨)
npm run test        # 단위 테스트
npm run test:links  # 빌드 산출물의 깨진 링크 검사
```

## 향후 계획

- 자유롭게 작성한 글(정형화되지 않은 텍스트)을 AI가 자동으로 이 프로젝트의 마크다운 형식(front matter, `:::notice`/`:::calendar` 등)으로 변환해주는 기능을 추가할 예정입니다. 비개발자가 문법을 전혀 몰라도, 편하게 쓴 글만으로 페이지를 만들 수 있게 하는 것이 목표입니다.

## 라이선스

[MIT](./LICENSE) — 자유롭게 포크·수정·배포할 수 있습니다.
