# 보안 검토 메모

## 발견 사항

2026-10-19 점검 시 Supabase 공개 스키마의 9개 테이블에서 RLS가 비활성화되어 있었다. Supabase Security Advisor의 `rls_disabled` 항목은 Critical이며, 공개 anon/authenticated 키로 데이터 행을 읽고 수정할 수 있다고 설명한다.

## 이 구현의 보호 조치

- 백엔드는 공개 키가 아닌 서버 전용 secret/service-role 키를 환경변수에서만 읽는다.
- CLI는 백엔드 API만 호출하고 Supabase 키를 포함하지 않는다.
- 개발 실행은 `127.0.0.1`에 바인딩한다.
- 서버 키는 `.env`에 저장하고 Git에 커밋하지 않는다.

## 공개 배포 전에 필요한 결정

로그인 기능이 없는 수업용 앱에서 보드를 공개 읽기 허용할지, 팀원별 인증과 권한을 추가할지 정한 다음 RLS 정책을 설계해야 한다. 이 저장소 작업에서는 데이터베이스 전체 정책 변경을 수행하지 않았다. 테이블별 접근 모델을 먼저 결정한 뒤 Dashboard/SQL에서 정책을 적용하고 Advisor를 다시 실행한다.

RLS를 시작할 때 사용할 수 있는 보안 설정 문장은 아래와 같다. 이 문장만 실행하면 공개 역할은 모든 테이블에서 차단되므로, 팀 인증 흐름과 허용 정책을 함께 설계한 뒤 적용한다.

```sql
alter table public.users enable row level security;
alter table public.statuses enable row level security;
alter table public.milestones enable row level security;
alter table public.issues enable row level security;
alter table public.labels enable row level security;
alter table public.issue_assignees enable row level security;
alter table public.issue_labels enable row level security;
alter table public.comments enable row level security;
alter table public.status_history enable row level security;
```
