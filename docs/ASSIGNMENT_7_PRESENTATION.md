# 과제 #7 발표 흐름 (3분)

## 0:00–0:25 | 문제와 기존 DB

“과제 #5에서 설계한 팀 공유 업무 DB를 그대로 사용했습니다. 새 칸반 DB를 하나 더 만들지 않고 issues, statuses, users, labels와 연결 테이블을 API에서 사용합니다.”

화면: Supabase 테이블 구조와 보드 상태 4개를 보여줍니다.

## 0:25–1:10 | API

Swagger UI에서 `/docs`를 열고 상태 조회와 업무 목록을 보여줍니다. `POST /api/issues` 요청으로 제목, 상태, 담당자, 마감일, 우선순위, 라벨이 포함된 업무를 등록합니다.

## 1:10–1:55 | CLI와 실제 저장

```powershell
uv run ttodo statuses
uv run ttodo add "과제 #7 API 시연" --status Ready --assignee "한예진" --due-date 2026-10-20 --priority high --label assignment-7
uv run ttodo board
uv run ttodo move <issue-id> "In Progress"
uv run ttodo list --status "In Progress"
```

Supabase `issues`, `issue_assignees`, `issue_labels`, `status_history`에서 같은 내용이 저장됐는지 보여줍니다.

## 1:55–2:30 | Codex 스킬

`.agents/skills/team-kanban/SKILL.md`를 보여주고, Codex가 큰 작업을 시작할 때 카드 생성, 진행 중/완료 시 상태 이동을 CLI로 수행하도록 안내합니다.

## 2:30–3:00 | 검증과 보안 범위

“CRUD와 실패 입력은 pytest로 확인했습니다. 데이터베이스 공개 테이블에 RLS가 꺼져 있다는 Advisor 경고도 확인했습니다. 이 프로젝트는 로컬에서만 실행하며 서버 키는 백엔드에만 둡니다. 공개 서비스로 배포하기 전에 팀 접근 정책과 RLS를 합의해야 합니다.”

실제 DB 시연 전 `.env`에 Supabase project URL과 서버 전용 Secret Key를 설정합니다. 키는 발표 화면이나 저장소에 노출하지 않습니다.
