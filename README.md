# Team 5 팀원 소개

> Team 5의 팀원과 각자의 이야기를 소개하는 README입니다.

## 페이지 소개

이번 과제에서는 Team 5 구성원 소개를 중심으로 README와 홈페이지를 구성합니다.

각 팀원은 같은 템플릿으로 자기소개를 작성하고, 최종 내용을 이 README와 홈페이지에 함께 반영합니다.

## 팀원

| 이름 | 소개 상태 |
| --- | --- |
| 김영광 | 자기소개 작성 예정 |
| 엄태웅 | 자기소개 작성 예정 |
| 한예진 | 자기소개 작성 예정 |

## 자기소개 작성 방법

1. 저장소를 clone합니다.
2. `team/TEMPLATE.md`를 복사해 자신의 이름으로 파일을 만듭니다.
3. 한 줄 소개, 관심 분야, 요즘 배우는 것, 프로젝트에서 하고 싶은 일을 작성합니다.
4. 자신의 브랜치에 commit하고 Pull Request를 올립니다.
5. 팀원 확인 후 내용을 README와 홈페이지에 반영합니다.

```bash
git clone https://github.com/beyejin/team5-study-mate.git
cd team5-study-mate
git switch -c intro/<이름>
cp team/TEMPLATE.md team/<이름>.md
```

작성할 때 전화번호, 개인 이메일과 같은 공개하지 않을 정보는 넣지 않습니다.

## 홈페이지

- [Team 5 팀원 소개 홈페이지](https://beyejin.github.io/team5-study-mate/)
- [홈페이지 소스](./index.html)
- [자기소개 템플릿](./team/TEMPLATE.md)

## 과제 보드

- [Team 5 과제 보드](https://github.com/users/beyejin/projects/1)
- [과제 #3 결과물 준비 마일스톤](https://github.com/beyejin/team5-study-mate/milestone/1)

보드의 상태는 `Backlog`, `Ready`, `In Progress`, `Done`으로 관리합니다.

## 실행 방법

정적 페이지이므로 `index.html`을 브라우저에서 열거나 간단한 서버로 실행합니다.

```bash
python3 -m http.server 8000
```

브라우저에서 `http://localhost:8000`을 엽니다.

## 프로젝트 구성

```text
.
├── index.html
├── styles.css
├── script.js
├── team/
│   └── TEMPLATE.md
└── .github/
    └── workflows/
        └── deploy-pages.yml
```
