# 군산시 신규 공무원 임용등록 안내 페이지 설계

- 작성일: 2026-07-20
- 배포 대상: GitHub Pages
- 원본 참고: Notion 페이지 (https://tranquil-magpie-ac4.notion.site/8bbb75bc3a134e86bd13b1ef8b1c5b2b) — 도메인 제약과 Notion 기능 한계로 재설계

## 배경 및 목적

군산시 신규 임용 공무원을 대상으로 임용등록 절차를 안내하는 정적 웹페이지. 로그인 등 계정 기능은 불필요하며 순수 정보 전달(공지, 절차, 서류, 서식, Q&A)이 목적이다. KRDS(정부 디자인 시스템) 원칙을 따르고, 좌측 목차 + 우측 본문의 반응형 레이아웃(모바일은 햄버거 메뉴)으로 구성한다.

## 기술 스택

- **Jekyll** 사용, GitHub Pages 네이티브 빌드로 별도 CI 설정 없이 `main` 브랜치 push만으로 자동 배포
- 콘텐츠는 Markdown + Front Matter로 관리
- 커스텀 도메인 없음 — `https://<계정>.github.io/<repo>/` 형태로 서비스

## 정보구조(IA) / 사이트맵

```
/                          메인 (공지사항 + 월간 캘린더)
/guide/registration        임용등록 안내
/guide/pre-documents       사전제출서류 작성방법
/guide/photo               증명사진 제출 안내
/guide/documents           제출서류 안내
/guide/application-form    임용등록원서 작성방법
/guide/rank                임용직급
/guide/faq                 Q&A
```

## 공통 레이아웃

- **헤더**: 군산시 로고/타이틀. 모바일 뷰포트에서는 햄버거 아이콘으로 전환.
- **좌측 사이드바(목차)**: 위 8개 항목(메인 포함) 리스트. 현재 페이지는 색상/굵기 및 `aria-current`로 표시. PC에서는 고정(sticky) 사이드바, 모바일에서는 off-canvas 드로어로 전환.
  - 모바일 드로어: 햄버거 클릭 → 좌측에서 슬라이드 인, 배경 딤 처리, ESC/바깥 클릭/닫기 버튼으로 닫힘, 포커스 트랩 적용.
- **본문 영역(우측)**: 페이지 제목, 섹션, 리스트, 표, 첨부파일 카드, 이미지 등.
- **푸터**: 문의처, 저작권 정보.

## 디자인 시스템 (KRDS + 군산시 브랜드 컬러)

### 컬러
- Primary `#1A2D65` (군산시 대표 네이비): 헤더, 좌측 목차 선택 항목, 주요 버튼
- Secondary `#018FD7` (블루): 링크, 보조 강조, 캘린더 오늘 날짜/이벤트 표시
- Accent `#7AC38E` (그린): 완료/성공 상태, 태그 포인트 용도로 제한 사용 (텍스트 색상으로 미사용)
- 그레이스케일/배경: KRDS 표준 (본문 텍스트 `#242933`, 배경 `#FFFFFF`/`#F4F6F8`, 보더 `#D8DCE2`)
- 모든 전경/배경 조합은 WCAG 2.1 AA 명도 대비(본문 4.5:1 이상, 큰 텍스트 3:1 이상) 확인 후 사용

### 타이포그래피
- 폰트: Pretendard (가변 폰트)
- 본문 16px/line-height 1.6, 최소 본문 크기 14px 미만 금지
- 제목 계층: H1 28~32px ~ H4 18px, KRDS 헤딩 스케일 준수

### 핵심 컴포넌트
- 좌측 목차 내비게이션 (현재 위치 강조, 키보드 포커스 아웃라인 명확)
- 모바일 헤더 + 햄버거 오프캔버스 메뉴
- 공지/알림 박스 (정보/경고 구분 스타일)
- 표(제출서류 목록 등) — 모바일에서는 가로 스크롤 또는 카드형 전환
- 첨부파일 카드 (파일명 + 확장자 아이콘 + 다운로드 버튼, 클릭 영역 44px 이상)
- 아코디언 (Q&A 페이지: 질문 클릭 시 답변 펼침, `aria-expanded` 사용)
- 월간 캘린더 그리드 (요일 헤더 + 날짜 그리드, 일정 있는 날짜 뱃지 표시, 클릭 시 해당일 일정 상세 노출, 모바일에서 축소 대응)

### 접근성
- KRDS 접근성 가이드 준수: 키보드 내비게이션, 스크린리더 라벨, 명확한 포커스 표시, 명도 대비 기준
- 로그인/검색 등 불필요한 기능 배제로 인터페이스 단순화

## 콘텐츠/파일 구조

```
_config.yml
_data/
  nav.yml              # 좌측 목차 순서/제목/경로
  notices.yml          # 메인 공지사항 목록
  events.yml           # 캘린더 일정 데이터 (날짜, 제목, 상세)
_layouts/
  default.html         # 헤더+사이드바+본문+푸터 공통 레이아웃
_includes/
  header.html, sidebar.html, footer.html, calendar.html
guide/
  registration.md
  pre-documents.md
  photo.md
  documents.md
  application-form.md
  rank.md
  faq.md
assets/
  css/, js/, images/, files/ (첨부 서식 원본)
index.md               # 메인 페이지
```

## 콘텐츠 반영 방식

- Notion 원본을 자동으로 가져올 수 없어(JS 렌더링), 각 섹션 콘텐츠는 대화를 통해 순차적으로 전달받아 해당 `guide/*.md` 파일에 반영한다.
- 첨부파일(서식 한글/워드/PDF 등)은 `assets/files/`에 저장하고 첨부파일 카드에서 링크 연결. 파일 실물은 추후 전달받는다.
- 캘린더/공지사항은 `_data/events.yml`, `_data/notices.yml`에 항목을 추가/수정하는 방식으로 관리하여 코드 수정 없이 데이터만으로 갱신 가능하게 한다.
- Q&A는 `guide/faq.md`에 질문-답변 구조로 작성하고 아코디언 컴포넌트로 렌더링한다.

## 배포

- `main` 브랜치에 push하면 GitHub Pages가 Jekyll을 자동 빌드/배포 (저장소 Settings > Pages에서 소스를 `main` 브랜치로 지정)
- 커스텀 도메인 미사용, 향후 필요 시 `CNAME` 파일 추가로 확장 가능

## 범위 밖 (Out of scope)

- 로그인/인증 기능
- 검색 기능
- 다국어 지원
- 커스텀 도메인 연결 (현재는 GitHub Pages 기본 도메인만 사용)
