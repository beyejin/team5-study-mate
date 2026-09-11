import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getHints, parseProfile } from '../profiles.mjs';

const memberNames = ['엄태웅', '김영광', '한예진'];

test('모든 팀원의 힌트는 코코네스쿨, 학과, 키워드 순서다', async () => {
  for (const name of memberNames) {
    const markdown = await readFile(new URL(`../team/${name}.md`, import.meta.url), 'utf8');
    const hintKinds = getHints(parseProfile(markdown, name)).map((hint) => hint.kind);
    assert.deepEqual(hintKinds, ['school', 'major', 'keyword']);
  }
});

test('팩을 열 때 선택한 팀원과 힌트 묶음을 고정한다', async () => {
  const script = await readFile(new URL('../script.js', import.meta.url), 'utf8');

  assert.match(script, /const selectedMember = drawMember\(remaining\);/);
  assert.match(script, /const revealHints = selectedMember\.hints\.map\(\(hint\) => \(\{ \.\.\.hint \}\)\);/);
  assert.match(script, /for \(const \[index, hint\] of revealHints\.entries\(\)\)/);
  assert.match(script, /await finishReveal\(selectedMember\);/);
});

test('힌트 화면은 핵심 정보 하나만 보여 준다', async () => {
  const [page, script] = await Promise.all([
    readFile(new URL('../index.html', import.meta.url), 'utf8'),
    readFile(new URL('../script.js', import.meta.url), 'utf8'),
  ]);

  assert.match(page, /<article id="hint-card" class="hint-card">\s*<strong id="hint-title">TEAM 5<\/strong>\s*<\/article>/);
  assert.doesNotMatch(page, /id="hint-(?:label|image|detail)"/);
  assert.doesNotMatch(script, /hint\.(?:label|detail|image)/);
});

test('다음 팩의 터널에 이전 마지막 힌트가 남지 않는다', async () => {
  const script = await readFile(new URL('../script.js', import.meta.url), 'utf8');

  assert.match(script, /function clearHint\(\) \{\s*document\.querySelector\('#hint-title'\)\.textContent = '';\s*hintCard\.hidden = true;\s*\}/);
  assert.match(script, /function setHint\(hint, index\) \{\s*document\.querySelector\('#hint-title'\)\.textContent = hint\.title;\s*hintCard\.hidden = false;/);
  assert.match(script, /const run = \+\+sequenceId;\s*clearHint\(\);\s*announcement\.textContent = '멤버 팩이 빛나며 열립니다\.'/);
});

test('공개 화면에서 팩 선택으로 돌아갈 수 있고 카드는 화면 높이를 넘지 않는다', async () => {
  const [page, script, styles] = await Promise.all([
    readFile(new URL('../index.html', import.meta.url), 'utf8'),
    readFile(new URL('../script.js', import.meta.url), 'utf8'),
    readFile(new URL('../styles.css', import.meta.url), 'utf8'),
  ]);

  assert.match(page, /<button id="back-to-lobby" class="reveal-back" type="button">← 이전으로<\/button>/);
  assert.match(script, /backButton\.addEventListener\('click', returnToPreviousScene\);/);
  assert.match(styles, /\.reveal-composition \{[\s\S]*?width: min\(470px, 82vw, 55\.5dvh\);/);
  assert.match(styles, /@media \(max-width: 980px\) \{[\s\S]*?\.reveal-composition \{ width: min\(430px, 84vw, 55\.5dvh\); \}/);
  assert.match(styles, /@media \(max-width: 680px\) \{[\s\S]*?\.reveal-composition \{\s*width: min\(330px, 82vw, 55\.5dvh\);/);
});

test('마지막 카드 모아보기에서 팩 선택으로 돌아가고 세 카드를 정렬한다', async () => {
  const [page, script, styles] = await Promise.all([
    readFile(new URL('../index.html', import.meta.url), 'utf8'),
    readFile(new URL('../script.js', import.meta.url), 'utf8'),
    readFile(new URL('../styles.css', import.meta.url), 'utf8'),
  ]);

  assert.match(page, /<button id="restart-pack" class="collection-back" type="button">← 팩 선택<\/button>/);
  assert.match(script, /restartButton\.addEventListener\('click', restart\);/);
  assert.match(styles, /\.collection-cards \{[\s\S]*?gap: clamp\(6px, 1\.6vw, 24px\);/);
  assert.doesNotMatch(styles, /\.collection-card \+ \.collection-card \{ margin-left:/);
  assert.doesNotMatch(styles, /\.collection-card:nth-child\(\d\) \{ z-index: \d; transform: rotate/);
});
