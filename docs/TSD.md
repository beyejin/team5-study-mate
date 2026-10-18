# 과제 #7 기술 명세

## 구성

```text
Codex / team member
        │
        ▼
ttodo CLI (Typer, local process)
        │ HTTP, 127.0.0.1:8000
        ▼
FastAPI ── Supabase PostgREST API
             issues / statuses / users / labels / join tables
```

## 기술

- Python 3.11, `uv`
- FastAPI + Pydantic: 입력 검증, REST API, Swagger UI
- Typer: `ttodo` CLI
- HTTPX: Supabase REST와 CLI API 요청
- pytest + FastAPI TestClient: API / CLI 동작 검증
- Ruff: lint와 import 정렬

## API

| Method | Path | 동작 |
| --- | --- | --- |
| GET | `/health` | 로컬 API 상태 |
| GET | `/api/statuses` | 보드 열 조회 |
| GET | `/api/board` | 상태별 업무를 묶은 칸반 보드 조회 |
| GET | `/api/issues?status=Ready&limit=100` | 업무 조회 |
| POST | `/api/issues` | 업무 생성 |
| GET | `/api/issues/{issue_id}` | 업무 한 건 조회 |
| PATCH | `/api/issues/{issue_id}` | 업무 수정 및 상태 이동 |
| DELETE | `/api/issues/{issue_id}` | 업무 삭제 |

FastAPI가 `/docs`에 OpenAPI/Swagger UI를 제공한다.

## 데이터 매핑

- 칸반 카드 → `issues`
- 열/상태 → `statuses`
- 담당자 → `users` + `issue_assignees`
- 라벨 → `labels` + `issue_labels`
- 상태 이동 기록 → `status_history`
- 마감일 → `issues.due_date`
- 우선순위 → `priority:low`, `priority:medium`, `priority:high` 라벨

우선순위는 기존 DB에 전용 컬럼이 없어 라벨 규약으로 표현한다. 사용자에게 보이는 일반 라벨과 API 응답의 `priority` 값은 분리한다.

## 환경 설정과 보안

API 서버는 `SUPABASE_URL`과 서버 전용 `SUPABASE_SECRET_KEY`를 `.env`에서 읽는다. 기존 프로젝트의 legacy `service_role` key를 쓸 때는 `SUPABASE_SERVICE_ROLE_KEY`도 인식한다. 새 `sb_secret_` 키는 `apikey` 헤더로만 보내고 legacy JWT 키는 Bearer 헤더도 보낸다.

CLI에는 DB 키를 주지 않는다. CLI는 `TTODO_API_URL`(기본 `http://127.0.0.1:8000`)만 사용한다. 백엔드는 `127.0.0.1`에만 바인딩한다. 현재 수업 DB는 로그인/RLS 정책이 없으므로 API를 공개 호스트에 배포하지 않는다.

## 오류와 일관성

- 입력 오류: 422
- 없는 상태/업무: 404
- Supabase 연결 또는 저장 오류: 502/503
- 업무 생성 중 담당자·라벨·상태 이력 저장이 실패하면 생성한 업무를 보상 삭제한다.
- 업무 수정은 여러 PostgREST 요청을 사용하므로 동시 쓰기에 대한 완전한 트랜잭션은 제공하지 않는다. 팀 규모가 커지면 데이터베이스 RPC 한 번으로 묶는 것을 검토한다.
