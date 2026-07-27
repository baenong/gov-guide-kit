import { check, LinkState } from 'linkinator';
import { resolveBase } from './deploy-base.mjs';

const base = resolveBase();

// dist/ 산출물 자체에는 base 경로만큼의 하위 폴더가 없다 (base는 실제
// 배포될 때 호스팅 쪽 URL에 붙는 접두사일 뿐이다). base가 "/"가 아니면
// 빌드된 HTML의 절대경로 링크(예: /gov-guide-kit/...)가 dist/ 루트
// 기준으로도 찾아지도록 접두사를 제거해준다.
const trimmedBase = base.replace(/\/$/, '');
// linkinator는 상대경로가 아니라 완전한 절대 URL(origin 포함, 예:
// "http://localhost:PORT/gov-guide-kit/...")에 이 정규식을 적용하므로,
// origin 뒤에 오는 base 접두사만 지워지도록 origin을 캡처해 되돌려준다.
const urlRewriteExpressions =
  trimmedBase === ''
    ? []
    : [
        {
          pattern: new RegExp(`^(https?://[^/]+)${trimmedBase}(?=/|$)`),
          replacement: '$1',
        },
      ];

const result = await check({
  path: 'dist',
  recurse: true,
  urlRewriteExpressions,
});

const broken = result.links.filter((link) => link.state === LinkState.BROKEN);
for (const link of broken) {
  console.error(`[${link.status ?? '?'}] ${link.url}`);
}

if (!result.passed) {
  console.error(`\n${broken.length}개의 깨진 링크를 찾았습니다.`);
  process.exit(1);
}

console.log(`깨진 링크 없음 (${result.links.length}개 링크 확인).`);
