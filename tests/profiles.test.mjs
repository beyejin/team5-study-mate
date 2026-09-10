import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseProfile, getHints, drawMember } from '../profiles.mjs';

test('팀원 md의 KAI, MBTI, 태그와 이미지가 카드에 전달된다', async () => {
  for (const [name, kai, mbti] of [['엄태웅', '120', 'ENTP'], ['김영광', '90', 'INFP'], ['한예진', '105', 'ENTP']]) {
    const markdown = await readFile(new URL(`../team/${name}.md`, import.meta.url), 'utf8');
    const member = parseProfile(markdown, name);
    assert.equal(member.kai, kai);
    assert.equal(member.mbti, mbti);
    assert.ok(member.tags.every((tag) => /^#[^\s+]+$/.test(tag)));
    assert.ok((await readFile(new URL(`../${member.image}`, import.meta.url))).length > 0);
  }
});

test('예진의 등장 힌트는 학교, 학과, 키워드 순서다', async () => {
  const markdown = await readFile(new URL('../team/한예진.md', import.meta.url), 'utf8');
  assert.deepEqual(getHints(parseProfile(markdown, '한예진')).map((hint) => hint.text), ['코코네스쿨', '소프트웨어전공', '범고래']);
});

test('빈 학과와 작성 안내는 화면에 노출하지 않는다', () => {
  const member = parseProfile('# 이름\n## 프로필 카드\n- **MBTI:** 확인 필요\n- **Tag:** `#태그1` `#태그2`\n## 등장 힌트\n- **학교:** 코코네스쿨\n- **학과:**\n- **등장 키워드:** 범고래\n## 한 줄 소개\n<!-- 작성해주세요 -->\n## 나를 표현하는 키워드\n`키워드1` `키워드2` `키워드3`', '이름');
  assert.equal(member.mbti, '');
  assert.deepEqual(member.tags, []);
  assert.equal(member.intro, '');
  assert.deepEqual(member.sections['나를 표현하는 키워드'], []);
  assert.deepEqual(getHints(member).map((hint) => hint.kind), ['school', 'keyword']);
});

test('기존 두 단계와 새 세 단계 제목의 자기소개를 모두 읽는다', () => {
  for (const prefix of ['##', '###']) {
    const member = parseProfile(`${prefix} 한 줄 소개\n소개 문장\n${prefix} 관심 분야\n-금융\n- 교육\n${prefix} GitHub\nhttps://github.com/beyejin`, '팀원');
    assert.equal(member.intro, '소개 문장');
    assert.deepEqual(member.sections['관심 분야'], ['금융', '교육']);
    assert.equal(member.sections.GitHub[0], 'https://github.com/beyejin');
  }
});

test('어느 난수 경계에서도 중복 없이 세 명을 뽑는다', (t) => {
  const original = ['엄태웅', '김영광', '한예진'];
  for (const random of [0, .5, .999999]) {
    t.mock.method(Math, 'random', () => random);
    const remaining = [...original];
    const results = Array.from({ length: 3 }, () => drawMember(remaining));
    assert.equal(remaining.length, 0);
    assert.deepEqual([...results].sort(), [...original].sort());
    t.mock.restoreAll();
  }
  assert.deepEqual(original, ['엄태웅', '김영광', '한예진']);
});
