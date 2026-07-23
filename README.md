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
   [2026년 임용등록원서.hwp](/assets/files/2026-form.hwp)
   ```

7. 이미지는 일반 마크다운 문법을 씁니다(경로는 반드시 `/`로 시작): `![설명](/assets/images/파일명.png)`
8. 반복해서 쓰이는 값(예: 등록 마감일)은 `site.variables.json`에 한 번만 적어두고, 본문에서는 `{{등록일}}`처럼 참조합니다. 값을 바꾸면 이걸 쓰는 모든 페이지가 다음 빌드에 자동으로 갱신됩니다.

   ```json
   { "등록일": "2026-08-15" }
   ```

   ```md
   등록 마감은 {{등록일}}까지입니다.
   ```

9. 수정 후 `git push`만 하면 배포는 자동으로 진행됩니다. Vercel은 몇 분 내로, GitHub Pages는 Actions 탭에서 진행 상황을 확인할 수 있습니다.

## 기관 설정 (최초 1회)

`site.config.json`에서 기관명, 색상, 로고 경로를 수정합니다.

```json
{
  "orgName": "기관명",
  "colors": { "primary": "#1A2D65", "secondary": "#018FD7", "accent": "#7AC38E" },
  "logoPath": "/assets/logo.svg"
}
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
