#!/usr/bin/env bash
# 이 저장소(gov-guide-kit)를 "Use this template" 또는 Fork로 복제해 만든
# 다운스트림 프로젝트에서 실행하는 스크립트입니다.
#
# 에디터/페이지 렌더링 코드 등 "템플릿 코드"는 최신 버전으로 갱신하되,
# 이미 작성해 둔 안내 페이지(src/content), 업로드한 이미지/첨부파일(public/assets),
# 사이트 설정(site.config.json, site.variables.json)은 절대 덮어쓰지 않습니다.
#
# 사용법:
#   scripts/update-from-template.sh [템플릿 저장소 URL] [브랜치]
#
# 예:
#   scripts/update-from-template.sh
#   scripts/update-from-template.sh https://github.com/baenong/gov-guide-kit.git main
#
# 처음 실행할 때뿐 아니라, 템플릿이 다시 업데이트될 때마다 재실행하면 됩니다.

set -euo pipefail

TEMPLATE_URL="${1:-https://github.com/baenong/gov-guide-kit.git}"
TEMPLATE_BRANCH="${2:-main}"
REMOTE_NAME="template"

# 템플릿 코드가 덮어써도 되는 영역과 달리, 사용자가 직접 채워 넣는
# "콘텐츠/설정" 영역은 병합 시 항상 로컬 버전을 유지한다.
PROTECTED_PATTERNS=(
  "src/content/** merge=ours"
  "public/assets/** merge=ours"
  "site.config.json merge=ours"
  "site.variables.json merge=ours"
)

log() { printf '\n[update-from-template] %s\n' "$1"; }
fail() { printf '\n[update-from-template] 오류: %s\n' "$1" >&2; exit 1; }

# --- 사전 점검 -----------------------------------------------------------

git rev-parse --is-inside-work-tree > /dev/null 2>&1 \
  || fail "git 저장소 루트에서 실행해주세요."

if [ -n "$(git status --porcelain)" ]; then
  fail "커밋되지 않은 변경사항이 있습니다. 먼저 커밋하거나 stash한 뒤 다시 실행해주세요."
fi

CURRENT_BRANCH="$(git symbolic-ref --short -q HEAD || true)"
if [ -z "$CURRENT_BRANCH" ]; then
  fail "detached HEAD 상태입니다. 브랜치를 체크아웃한 뒤 다시 실행해주세요."
fi

# --- 템플릿 원격 저장소 등록/갱신 -----------------------------------------

if git remote get-url "$REMOTE_NAME" > /dev/null 2>&1; then
  git remote set-url "$REMOTE_NAME" "$TEMPLATE_URL"
else
  git remote add "$REMOTE_NAME" "$TEMPLATE_URL"
fi

log "템플릿 저장소($TEMPLATE_URL, $TEMPLATE_BRANCH 브랜치)에서 최신 변경사항을 가져옵니다."
git fetch "$REMOTE_NAME" "$TEMPLATE_BRANCH"

# --- 콘텐츠/설정 보호 규칙 등록 (최초 1회만 실질적으로 반영됨) -------------

touch .gitattributes
for pattern in "${PROTECTED_PATTERNS[@]}"; do
  grep -qxF "$pattern" .gitattributes || echo "$pattern" >> .gitattributes
done

# "ours" 병합 드라이버는 저장소 로컬 설정(.git/config)에 등록되며,
# 새로 clone한 다른 환경에서는 이 스크립트를 한 번 실행해야 다시 활성화된다.
git config merge.ours.driver true

if [ -n "$(git status --porcelain .gitattributes)" ]; then
  git add .gitattributes
  git commit -m "chore: 템플릿 병합 시 콘텐츠/설정 파일을 보호하는 병합 규칙 등록"
fi

# --- 병합 -----------------------------------------------------------------

log "현재 브랜치($CURRENT_BRANCH)에 템플릿 변경사항을 병합합니다."
log "src/content, public/assets, site.config.json, site.variables.json은 그대로 유지됩니다."

if git merge-base "$REMOTE_NAME/$TEMPLATE_BRANCH" HEAD > /dev/null 2>&1; then
  # 이전에 한 번이라도 병합한 적이 있어 공통 조상이 있는 경우: 정상적인
  # 3-way 병합을 수행한다. 템플릿 코드 파일을 직접 고쳐둔 경우 여기서
  # 진짜 충돌이 나므로 수동으로 확인해야 한다 (자동으로 덮어쓰지 않는다).
  git merge --no-edit "$REMOTE_NAME/$TEMPLATE_BRANCH"
else
  # 최초 병합: "Use this template"/Fork로 만들어진 저장소는 템플릿과
  # 공통 조상이 없어, 손대지 않은 파일까지도 전부 add/add 충돌로 표시된다.
  # -X theirs로 그런 파일은 템플릿 쪽을 그대로 채택하되, 콘텐츠/설정
  # 파일은 .gitattributes의 merge=ours가 우선 적용되어 로컬 값을 유지한다.
  log "템플릿과 공통 이력이 없어(최초 병합) 손대지 않은 파일은 템플릿 쪽을 채택합니다."
  git merge --allow-unrelated-histories -X theirs --no-edit "$REMOTE_NAME/$TEMPLATE_BRANCH"
fi

log "병합 완료. 의존성을 다시 설치하고 테스트를 실행합니다."
npm install
npm test

log "완료되었습니다. 변경 내역을 확인한 뒤 평소처럼 push 하세요."
log "주의: site.config.json / site.variables.json 은 이번 병합에서 항상 로컬 값을 유지했습니다."
log "      템플릿 쪽에서 설정 항목이 새로 추가/변경되었을 수 있으니,"
log "      git show $REMOTE_NAME/$TEMPLATE_BRANCH:site.config.json 으로 최신 템플릿 값과 비교해보세요."
