// astro.config.mjs와 scripts/check-links.mjs가 공유하는 배포 대상별
// base 경로 계산 로직. 두 곳 모두 같은 DEPLOY_TARGET/env 값을 보고
// 같은 base를 알아야 하므로 하나로 모아둔다.
const BASE_BY_TARGET = {
  vercel: '/',
  'github-pages': process.env.GITHUB_PAGES_BASE ?? '/',
  'gitlab-pages': process.env.GITLAB_PAGES_BASE ?? '/',
};

export function resolveBase() {
  const deployTarget = process.env.DEPLOY_TARGET ?? 'vercel';
  return BASE_BY_TARGET[deployTarget] ?? BASE_BY_TARGET.vercel;
}
