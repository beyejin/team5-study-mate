# TEAM 5 | 멤버 팩

> 팩을 열고 힌트를 따라가며 세 명의 팀원을 한 명씩 발견하는 인터랙티브 팀 소개 페이지입니다.

[GitHub Pages 데모](https://beyejin.github.io/team5-study-mate/) | [GitHub 저장소](https://github.com/beyejin/team5-study-mate)

![TEAM 5 멤버 팩 시작 화면](./assets/game/team5-intro-v2.png)

## 발표 한 문장

Team 5는 자기소개를 목록으로 보여주는 대신, 멤버 팩을 열고 힌트를 따라가며 팀원을 발견하는 경험으로 바꿨습니다.

## 발표 구성

발표는 인트로 소개, 팀원별 30초 자기소개, 협업 방식 소개 순서로 진행합니다.

1. **인트로 소개**: Team 5와 멤버 팩의 기획 의도를 설명합니다.
2. **김영광 자기소개 30초**: 팩을 열고 힌트를 확인한 뒤 카드와 자기소개를 소개합니다.
3. **엄태웅 자기소개 30초**: 다음 팩으로 바로 이어서 카드와 자기소개를 소개합니다.
4. **한예진 자기소개 30초**: 마지막 팀원 카드와 자기소개를 소개합니다.
5. **협업 방식 소개**: 세 명의 공개가 끝난 뒤 칸반 보드, GitHub Actions, 가이드 문서를 보여줍니다.

## 핵심 구현

- 팀원 세 명을 중복 없이 한 번씩 공개합니다.
- 세 단계 힌트를 팀원별 Markdown 원본에서 읽습니다.
- 카드 공개 후 발표자가 팀원 자기소개를 말로 이어갑니다.
- 마지막 화면에는 칸반 보드와 실제 협업 기록만 간결하게 보여줍니다.
- GitHub Actions로 테스트와 배포를 자동화하고, `GIT_GUIDE.md`로 브랜치와 PR 작업 기준을 공유합니다.
- 첫 화면 효과음, 힌트 사운드, 카드 공개 사운드를 제공합니다.
- `Escape`와 `연출 건너뛰기`로 공개 연출을 건너뛸 수 있습니다.

## 팀원 소개

| 순서 | 팀원 | 자기소개 원본 |
| --- | --- | --- |
| 01 | 김영광 | [김영광.md](./team/김영광.md) |
| 02 | 엄태웅 | [엄태웅.md](./team/엄태웅.md) |
| 03 | 한예진 | [한예진.md](./team/한예진.md) |

홈페이지는 자기소개 원본을 `team/*.md`에서 읽습니다. 내용을 수정한 뒤 로컬 서버를 새로고침하면 화면에 반영됩니다.

## 팀원 자기소개 작성 안내

모든 팀원은 [자기소개 템플릿](./team/TEMPLATE.md)을 기준으로 자신의 Markdown 파일을 작성합니다.

```bash
git switch -c intro/<이름>
cp team/TEMPLATE.md team/<이름>.md
```

이미 파일이 있다면 복사하지 말고 해당 파일을 열어 아래 항목을 채웁니다.

- 프로필 카드: 이미지, KAI 점수, MBTI, 태그
- 한 줄 소개
- 관심 분야
- 요즘 배우는 것
- 팀원들에게 보여주고 싶은 모습
- 나를 표현하는 키워드
- 공개해도 되는 GitHub 링크

작성 후에는 다음 순서로 팀에 공유합니다.

```bash
git add team/<이름>.md
git commit -m "docs: 자기소개 작성"
git push -u origin intro/<이름>
```

전화번호, 개인 이메일처럼 공개하지 않을 정보는 넣지 않습니다.

## 협업 흐름

```text
Clone → Branch → Markdown 작성 → Commit → Push → Pull Request → Review → Merge → Actions 배포
```

- [팀원용 Git 실습 가이드](./GIT_GUIDE.md)
- [팀원 실행 및 Git 최소 흐름 안내](./RUN_GUIDE.md)
- [화면 캡처 폴더](./docs/screenshots/)

## 과제 #7: 칸반 백엔드와 CLI

기존 Team 5 Supabase 업무 DB(`issues`, `statuses`, `users`, `labels`)를 FastAPI와 Typer CLI로 사용합니다. API는 로컬에서만 실행하고, Supabase 서버 키는 백엔드 `.env`에만 둡니다.

### 준비

Python 3.11과 [`uv`](https://docs.astral.sh/uv/)를 설치한 다음 PowerShell에서 실행합니다.

```powershell
uv sync --locked --no-editable
Copy-Item .env.example .env
```

`.env`의 `SUPABASE_URL`과 `SUPABASE_SECRET_KEY`를 본인 Supabase 프로젝트 값으로 채웁니다. 새 Secret Key를 권장하며, 이전 프로젝트의 `service_role` 키를 쓰면 변수명을 `SUPABASE_SERVICE_ROLE_KEY`로 설정할 수 있습니다. 이 파일을 Git에 커밋하거나 메신저/발표 화면에 공유하지 않습니다.

### API와 CLI 실행

터미널 하나에서 API를 실행합니다.

```powershell
uv run uvicorn ttodo.api:app --app-dir src --host 127.0.0.1 --port 8000
```

`http://127.0.0.1:8000/docs`에서 Swagger UI를 열 수 있습니다. 다른 터미널에서 CLI를 사용합니다.

```powershell
uv run ttodo statuses
uv run ttodo board
uv run ttodo show <issue-id> --json
uv run ttodo add "과제 #7 API 구현" --status Ready --assignee "한예진" --due-date 2026-10-20 --priority high --label assignment-7
uv run ttodo move <issue-id> "In Progress"
uv run ttodo update <issue-id> --title "업무 제목 수정"
uv run ttodo list --status "In Progress" --json
uv run ttodo delete <issue-id>
```

모든 조회 명령은 `--json`을 지원합니다. 업데이트/이동/삭제 시 실행 주체는 `TTODO_ACTOR` 환경변수로 지정할 수 있으며 기본 이름은 `Codex`입니다.

### 문서와 검증

- [요구사항](./docs/PRD.md)
- [기술 명세](./docs/TSD.md)
- [DB 명세와 보안 상태](./docs/DATABASE.md)
- [테스트 케이스](./docs/TEST_CASE.md)
- [3분 발표 흐름](./docs/ASSIGNMENT_7_PRESENTATION.md)
- [Codex 칸반 등록 스킬](./.agents/skills/team-kanban/SKILL.md)

```powershell
uv run ruff check src tests
uv run pytest
```

이 과제 DB는 현재 로그인과 RLS 정책이 설정되어 있지 않습니다. 따라서 API를 공용 네트워크에 배포하지 말고 로컬에서만 실행합니다. RLS 경고와 공개 배포 전 필요한 결정은 [보안 검토](./docs/SECURITY_REVIEW.md)에 기록했습니다.

## 발표용 실행 방법

Markdown 프로필을 화면에 불러오기 위해 정적 서버로 실행합니다.

```bash
python3 -m http.server 8000
```

브라우저에서 [http://localhost:8000](http://localhost:8000)을 열고 다음 순서로 시연합니다.

```text
인트로 소개 → 팩 선택 → 팀원별 30초 자기소개 → 세 명 공개 → 협업 방식 소개
```

## 사용 기술

- HTML
- CSS
- JavaScript ES Modules
- Markdown 기반 프로필 데이터
- Web Audio API 기반 사운드
- GitHub Pages
- 과제 #7: Python 3.11, FastAPI, Typer, Supabase PostgREST

## 주요 파일

```text
.
├── index.html          # 로비, 터널, 카드 공개, 작업 방식 화면
├── styles.css          # 경기장, 터널, 카드와 스카우팅 리포트 스타일
├── script.js           # 팩 공개 흐름과 화면 전환
├── profiles.mjs        # 팀원 Markdown 파싱
├── team/               # 팀원 자기소개 원본
├── src/ttodo/          # 과제 #7 API와 CLI
├── supabase/           # 과제 #7 상태/우선순위 시드 migration
├── .agents/skills/     # Codex 작업 등록 스킬
├── assets/             # 카드, 경기장, 사운드 자산
├── tests/              # 프로필, 공개 흐름, 사운드 테스트
└── dist/               # 정적 배포 산출물
```

## 관련 링크

- [발표용 GitHub Pages](https://beyejin.github.io/team5-study-mate/)
- [GitHub 저장소](https://github.com/beyejin/team5-study-mate)
- [Team 5 과제 보드](https://github.com/users/beyejin/projects/1)
- [과제 결과물 마일스톤](https://github.com/beyejin/team5-study-mate/milestone/1)
- [자기소개 템플릿](./team/TEMPLATE.md)
