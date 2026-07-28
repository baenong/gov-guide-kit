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
# "콘텐츠/설정" 영역은 병합 시 항상 로컬 버전을 유지한다. 이 목록은
# .gitattributes의 merge=ours 규칙과, 아래 삭제/수정 충돌 자동 해결
# 로직 둘 다에서 재사용한다.
PROTECTED_PATH_PREFIXES=(
  "src/content/"
  "public/assets/"
  "site.config.json"
  "site.variables.json"
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
for prefix in "${PROTECTED_PATH_PREFIXES[@]}"; do
  if [[ "$prefix" == */ ]]; then
    pattern="${prefix}** merge=ours"
  else
    pattern="$prefix merge=ours"
  fi
  grep -qxF "$pattern" .gitattributes || echo "$pattern" >> .gitattributes
done

# "ours" 병합 드라이버는 저장소 로컬 설정(.git/config)에 등록되며,
# 새로 clone한 다른 환경에서는 이 스크립트를 한 번 실행해야 다시 활성화된다.
git config merge.ours.driver true

if [ -n "$(git status --porcelain .gitattributes)" ]; then
  git add .gitattributes
  git commit -m "chore: 템플릿 병합 시 콘텐츠/설정 파일을 보호하는 병합 규칙 등록"
fi

# .gitattributes의 merge=ours는 콘텐츠/설정 파일이 "양쪽 다 존재하지만
# 내용이 다른" 경우만 보호한다. 사용자가 그 파일을 삭제했는데 템플릿
# 쪽에서 그 파일을 수정만 한 경우(예: 예시 페이지를 지운 상태에서
# 템플릿이 그 예시 페이지를 고침) git은 이걸 병합 드라이버로 처리하지
# 않고 "modify/delete" 충돌로 표시해버린다 — 이 함수가 그 틈을 메운다.
is_protected_path() {
  local path="$1"
  for prefix in "${PROTECTED_PATH_PREFIXES[@]}"; do
    case "$path" in
      "$prefix"*) return 0 ;;
    esac
  done
  return 1
}

resolve_protected_delete_conflicts() {
  local xy path resolved_any=1
  while IFS=$'\t' read -r xy path; do
    is_protected_path "$path" || continue
    case "$xy" in
      DU)
        # 로컬(우리)이 삭제, 템플릿이 수정 -> 삭제된 상태를 그대로 유지.
        log "  - $path: 로컬에서 삭제한 콘텐츠 파일이라 삭제 상태를 유지합니다."
        git rm -q -- "$path"
        resolved_any=0
        ;;
      UD)
        # 템플릿이 삭제, 로컬이 수정/유지 -> 로컬 버전을 그대로 유지.
        log "  - $path: 템플릿에서는 삭제됐지만 로컬 콘텐츠를 그대로 유지합니다."
        git add -- "$path"
        resolved_any=0
        ;;
    esac
  done < <(git status --porcelain=v1 | grep -E '^(DU|UD) ' | sed -E 's/^(..) /\1\t/')
  return $resolved_any
}

# 최초 병합(공통 이력 없음)은 모든 경로를 "템플릿이 새로 추가한 파일"로
# 보기 때문에, 로컬에서 이미 삭제한 콘텐츠 파일도 충돌 없이 조용히
# 되살아난다 — merge=ours는 실제 충돌에만 개입하므로 이 경우엔 아예
# 발동하지 않는다. 병합 전에 "템플릿엔 있지만 로컬엔 없는 보호 경로
# 파일" 목록을 미리 적어두고, 최초 병합 뒤 되살아났다면 다시 지운다.
LOCALLY_DELETED_PROTECTED_PATHS="$(
  git ls-tree -r --name-only "$REMOTE_NAME/$TEMPLATE_BRANCH" | while IFS= read -r remote_path; do
    is_protected_path "$remote_path" || continue
    [ -e "$remote_path" ] && continue
    printf '%s\n' "$remote_path"
  done
)"

# --- 병합 -----------------------------------------------------------------

log "현재 브랜치($CURRENT_BRANCH)에 템플릿 변경사항을 병합합니다."
log "src/content, public/assets, site.config.json, site.variables.json은 그대로 유지됩니다."

MERGE_FAILED=0
if git merge-base "$REMOTE_NAME/$TEMPLATE_BRANCH" HEAD > /dev/null 2>&1; then
  # 이전에 한 번이라도 병합한 적이 있어 공통 조상이 있는 경우: 정상적인
  # 3-way 병합을 수행한다. 템플릿 코드 파일을 직접 고쳐둔 경우 여기서
  # 진짜 충돌이 나므로 수동으로 확인해야 한다 (자동으로 덮어쓰지 않는다).
  git merge --no-edit "$REMOTE_NAME/$TEMPLATE_BRANCH" || MERGE_FAILED=1
else
  # 최초 병합: "Use this template"/Fork로 만들어진 저장소는 템플릿과
  # 공통 조상이 없어, 손대지 않은 파일까지도 전부 add/add 충돌로 표시된다.
  # -X theirs로 그런 파일은 템플릿 쪽을 그대로 채택하되, 콘텐츠/설정
  # 파일은 .gitattributes의 merge=ours가 우선 적용되어 로컬 값을 유지한다.
  log "템플릿과 공통 이력이 없어(최초 병합) 손대지 않은 파일은 템플릿 쪽을 채택합니다."
  git merge --allow-unrelated-histories -X theirs --no-edit "$REMOTE_NAME/$TEMPLATE_BRANCH" || MERGE_FAILED=1

  if [ "$MERGE_FAILED" -eq 0 ] && [ -n "$LOCALLY_DELETED_PROTECTED_PATHS" ]; then
    RESTORED=0
    while IFS= read -r path; do
      [ -z "$path" ] && continue
      if [ -e "$path" ]; then
        log "  - $path: 로컬에서 삭제했던 콘텐츠 파일인데 최초 병합에서 되살아나 다시 삭제합니다."
        git rm -q -- "$path"
        RESTORED=1
      fi
    done <<< "$LOCALLY_DELETED_PROTECTED_PATHS"
    if [ "$RESTORED" -eq 1 ]; then
      git commit --amend --no-edit
    fi
  fi
fi

if [ "$MERGE_FAILED" -eq 1 ]; then
  log "콘텐츠/설정 파일의 삭제/수정 충돌을 자동으로 확인합니다..."
  resolve_protected_delete_conflicts || true

  if [ -n "$(git status --porcelain=v1 | grep -E '^(DD|AU|UD|UA|DU|AA|UU) ')" ]; then
    fail "직접 확인해야 하는 충돌이 남아 있습니다. 'git status'로 확인 후 해결하고 'git commit'으로 병합을 마무리해주세요."
  fi

  git commit --no-edit
  log "콘텐츠/설정 파일의 삭제 상태를 유지한 채 병합을 마무리했습니다."
fi

log "병합 완료. 의존성을 다시 설치하고 테스트를 실행합니다."
npm install
npm test

log "완료되었습니다. 변경 내역을 확인한 뒤 평소처럼 push 하세요."
log "주의: site.config.json / site.variables.json 은 이번 병합에서 항상 로컬 값을 유지했습니다."
log "      템플릿 쪽에서 설정 항목이 새로 추가/변경되었을 수 있으니,"
log "      git show $REMOTE_NAME/$TEMPLATE_BRANCH:site.config.json 으로 최신 템플릿 값과 비교해보세요."
