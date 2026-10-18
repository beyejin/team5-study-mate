# 과제 #7 데이터베이스 명세

## 기존 데이터베이스

Supabase 프로젝트 `project-DB-7팀`의 기존 정규화 스키마를 재사용한다. 새 `kanban_cards` 테이블이나 중복 SQLite 파일은 만들지 않는다.

| 테이블 | 용도 |
| --- | --- |
| `issues` | 카드 제목, 설명, 상태, 마감일, 상위 업무, 생성/완료 시간 |
| `statuses` | 칸반 열 이름과 순서 |
| `users` | 팀원 이름 |
| `issue_assignees` | 업무와 담당자 연결 |
| `labels` | 라벨 이름과 색상 |
| `issue_labels` | 업무와 라벨 연결 |
| `status_history` | 상태 변경과 변경자 기록 |
| `milestones` | 마일스톤과 마감일 |
| `comments` | 업무 댓글 |

업무 삭제 시 댓글, 담당자 연결, 라벨 연결, 상태 이력은 기존 FK `ON DELETE CASCADE`에 따라 정리된다. `parent_issue_id`, 상태, 마일스톤은 기존 FK의 제한을 따른다.

## 상태와 우선순위

새 migration은 다음 상태를 `statuses`에 넣고 이름이 이미 있으면 중복 생성하지 않는다.

| 순서 | 상태 |
| ---: | --- |
| 1 | Backlog |
| 2 | Ready |
| 3 | In Progress |
| 4 | Done |

실제 DB migration 적용 후 확인된 순서는 1부터 4까지다. `sort_order`는 시작값보다 정렬 순서가 중요하다.

우선순위 전용 컬럼은 없으므로 `priority:low`, `priority:medium`, `priority:high` 라벨을 사용한다. CLI의 `--priority high`는 `priority:high` 라벨로 저장되며 일반 라벨 목록에는 노출하지 않는다.

## RLS 보안 상태

현재 DB 점검에서 기존 공개 스키마 9개 테이블(`users`, `statuses`, `milestones`, `issues`, `labels`, `issue_assignees`, `issue_labels`, `comments`, `status_history`)의 RLS가 꺼져 있음을 확인했다. Supabase Advisor는 이를 Critical로 분류하며 공개 `anon`/`authenticated` 키로 전체 행을 읽고 바꿀 수 있다고 경고한다.

이 과제 구현에서는 기존 정책을 임의로 바꾸지 않았다. 백엔드는 서버 전용 secret/service-role 키를 사용하고 로컬 전용으로 실행한다. 공개 배포 전에 소유자/팀 권한 정책을 정한 뒤 RLS를 켜야 한다. 보안 정책 초안은 `docs/SECURITY_REVIEW.md`를 참고한다.

## Migration

`supabase/migrations/20261018164111_seed_team5_statuses.sql`은 기존 데이터 구조를 변경하지 않고 상태와 우선순위 라벨을 준비한다.
