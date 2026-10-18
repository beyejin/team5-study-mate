# 과제 #7 테스트 케이스

테스트는 `uv run pytest`로 실행한다. API는 FastAPI TestClient와 격리된 fake repository를 사용하고, CLI는 Typer CliRunner로 호출해 실제 공유 DB에 시험 데이터를 넣지 않는다.

## API

| 체크 | Endpoint | Request | 예상 결과 |
| --- | --- | --- | --- |
| [x] 상태와 보드 조회 | `GET /api/statuses`, `GET /api/board` | 없음 | 200, 상태 순서가 Backlog → Ready → In Progress → Done |
| [x] 업무 전체/상태별 조회 | `GET /api/issues?status=Ready` | 유효한 상태명 | 200, 해당 상태 업무만 반환 |
| [x] 없는 상태 조회 | `GET /api/issues?status=Unknown` | 알 수 없는 상태 | 404 |
| [x] 업무 생성 | `POST /api/issues` | 제목, 상태, 담당자, 마감일, 우선순위, 라벨 | 201, 연결된 필드 반환 |
| [x] 필수값 실패 | `POST /api/issues` | 빈 제목 | 422 |
| [x] 상태 오류 | `POST /api/issues` | 미등록 상태 | 404 |
| [x] 업무 상세 | `GET /api/issues/{id}` | 존재하는 UUID | 200 |
| [x] 업무 수정 | `PATCH /api/issues/{id}` | 제목 또는 설명 | 200, 수정 값 반환 |
| [x] 상태 이동 | `PATCH /api/issues/{id}` | `{"status":"In Progress"}` | 200, 상태 이력 추가 |
| [x] Done 처리 | `PATCH /api/issues/{id}` | `{"status":"Done"}` | 200, `closed_at` 기록 |
| [x] 빈 수정 실패 | `PATCH /api/issues/{id}` | `{}` | 422 |
| [x] 업무 삭제 | `DELETE /api/issues/{id}` | 존재하는 UUID | 204, 연관 행은 DB cascade 규칙으로 삭제 |
| [x] 두 번째 삭제 | `DELETE /api/issues/{id}` | 이미 삭제된 UUID | 404 |

## CLI

| 체크 | 명령 | 예상 결과 |
| --- | --- | --- |
| [x] 도움말 | `ttodo --help` | 서브명령과 인수 설명 |
| [x] 상태 목록 | `ttodo statuses --json` | JSON 상태 목록 |
| [x] 업무 목록 | `ttodo list --status Ready --json` | 필터가 API로 전달되고 JSON 출력 |
| [x] 업무 상세 | `ttodo show <issue-id> --json` | 지정 업무 조회 |
| [x] 업무 생성 | `ttodo add "Build API" --due-date 2026-10-20 --priority high --label assignment-7 --json` | 날짜/라벨/우선순위를 포함한 POST |
| [x] 상태 이동 | `ttodo move <issue-id> "In Progress"` | PATCH 요청 |
| [ ] 실제 DB E2E | API 서버와 사용자 secret key 설정 후 생성→조회→이동→삭제 | `docs/ASSIGNMENT_7_PRESENTATION.md`의 시연 순서로 확인 |
