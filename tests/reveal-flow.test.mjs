import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getHints, parseProfile } from '../profiles.mjs';

const memberNames = ['엄태웅', '김영광', '한예진'];

test('모든 팀원의 공개 정보는 코코네스쿨, 학과, 키워드 순서다', async () => {
  for (const name of memberNames) {
    const markdown = await readFile(new URL(`../team/${name}.md`, import.meta.url), 'utf8');
    const hintKinds = getHints(parseProfile(markdown, name)).map((hint) => hint.kind);
    assert.deepEqual(hintKinds, ['school', 'major', 'keyword']);
  }
});

test('팩 오픈은 하나의 5초 안팎 타임라인으로 진행한다', async () => {
  const script = await readFile(new URL('../script.js', import.meta.url), 'utf8');

  assert.match(script, /const PACK_IGNITION_MS = 250;/);
  assert.match(script, /const HINT_HOLD_MS = 600;/);
  assert.match(script, /const TUNNEL_DURATION_MS = TUNNEL_SETTLE_MS \+ \(HINT_HOLD_MS \* 3\) \+ \(HINT_GAP_MS \* 2\) \+ TUNNEL_COAST_MS;/);
  assert.match(script, /const selectedMember = drawMember\(remaining\);/);
  assert.match(script, /const revealHints = \[\.\.\.selectedMember\.hints\];/);
  assert.match(script, /tunnel\.start\(TUNNEL_DURATION_MS\);/);
  assert.match(script, /for \(const \[index, hint\] of revealHints\.entries\(\)\)/);
  assert.match(script, /await finishReveal\(selectedMember\);/);
});

test('힌트는 중앙 문구 하나만 교체하며 최종 화면에 남지 않는다', async () => {
  const [page, script] = await Promise.all([
    readFile(new URL('../index.html', import.meta.url), 'utf8'),
    readFile(new URL('../script.js', import.meta.url), 'utf8'),
  ]);

  assert.match(page, /<article id="hint-card" class="hint-card" hidden>\s*<strong id="hint-title"><\/strong>\s*<\/article>/);
  assert.doesNotMatch(page, /hint-(?:label|image|detail)/);
  assert.match(script, /function clearHint\(\) \{\s*hintTitle\.textContent = '';\s*hintCard\.hidden = true;/);
  assert.match(script, /function setHint\(title, index\) \{\s*hintTitle\.textContent = title;/);
  assert.match(script, /clearHint\(\);\s*triggerFlash\(\);/);
});

test('빈 카드 장면과 URL 강제 장면 기능을 사용하지 않는다', async () => {
  const [page, script] = await Promise.all([
    readFile(new URL('../index.html', import.meta.url), 'utf8'),
    readFile(new URL('../script.js', import.meta.url), 'utf8'),
  ]);

  assert.doesNotMatch(page, /impact-view|impact-card-shell|reveal-left|reveal-right/);
  assert.doesNotMatch(script, /enableLocalPreviewMode|URLSearchParams|autoplay|previewScene/);
});

test('터널은 실제 통로 배경을 전진시키는 캔버스 연출이다', async () => {
  const [page, tunnel] = await Promise.all([
    readFile(new URL('../index.html', import.meta.url), 'utf8'),
    readFile(new URL('../tunnel.mjs', import.meta.url), 'utf8'),
  ]);

  assert.match(page, /<canvas id="tunnel-canvas" aria-hidden="true"><\/canvas>/);
  assert.match(tunnel, /export function createTunnel\(canvas, reducedMotion\)/);
  assert.match(tunnel, /window\.requestAnimationFrame\(render\)/);
  assert.match(tunnel, /function drawTunnelTexture\(/);
  assert.match(tunnel, /tunnelTexture\.src = 'assets\/game\/stadium-tunnel-v1\.png';/);
  assert.match(tunnel, /function accelerateCamera\(progress\)/);
  assert.match(tunnel, /const cameraProgress = accelerateCamera\(progress\);/);
  assert.match(tunnel, /const lightPull = smoothstep\(FINAL_LIGHT_START, \.98, progress\);/);
  assert.match(tunnel, /drawTunnelTexture\(cameraProgress, lightPull\);/);
  assert.match(tunnel, /drawLightGrade\(finalLight, lightPull\);/);
  assert.match(tunnel, /function drawLightGrade\(/);
  assert.match(tunnel, /function drawVignette\(/);
  assert.match(tunnel, /const FINAL_LIGHT_START = \.69;/);
  assert.match(tunnel, /function blendLight\(cold, warm, progress, alpha\)/);
  assert.match(tunnel, /draw\(reducedMotion \? 0 : elapsedProgress, now\);/);
  assert.doesNotMatch(tunnel, /stadium-day-v1/);
  assert.match(tunnel, /window\.cancelAnimationFrame\(animationFrame\);/);
  assert.match(tunnel, /return \{ start, stop, pulse \};/);
});

test('기존 제공 카드만 공개하고 화면에서 태그를 중복 출력하지 않는다', async () => {
  const [page, script, styles] = await Promise.all([
    readFile(new URL('../index.html', import.meta.url), 'utf8'),
    readFile(new URL('../script.js', import.meta.url), 'utf8'),
    readFile(new URL('../styles.css', import.meta.url), 'utf8'),
  ]);

  assert.doesNotMatch(page, /id="reveal-tags"|class="tag-stats"/);
  assert.match(script, /assets\/cards\/taewoong-card-cutout-v2\.png/);
  assert.match(script, /assets\/cards\/youngkwang-card-cutout-v2\.png/);
  assert.match(script, /assets\/cards\/yejin-card-cutout-v2\.png/);
  assert.match(script, /image\.alt = `\$\{member\.name\} 팀원 카드`;/);
  assert.doesNotMatch(page, /pack-rings/);
  assert.doesNotMatch(page, /pack-aura/);
  const cardImageRules = styles.slice(styles.indexOf('.member-card img {'), styles.indexOf('.scene-reveal.is-arriving'));
  assert.doesNotMatch(cardImageRules, /box-shadow:/);
});

test('세 장을 뽑은 뒤 팀 작업 방식 홈으로 이동할 수 있다', async () => {
  const [page, script, styles] = await Promise.all([
    readFile(new URL('../index.html', import.meta.url), 'utf8'),
    readFile(new URL('../script.js', import.meta.url), 'utf8'),
    readFile(new URL('../styles.css', import.meta.url), 'utf8'),
  ]);

  assert.match(page, /<section id="home-view" class="scene scene-home" data-view="home"/);
  assert.match(page, /<h1 id="home-title">작업 흐름<\/h1>/);
  assert.match(page, /team5-kanban-snapshot-v1\.svg/);
  assert.doesNotMatch(page, /class="kanban-board"|class="kanban-column"/);
  assert.match(page, /팀원 모두 <strong>commit, push, pull<\/strong>을 직접 해 봤습니다\./);
  assert.match(page, /git-experience-commit[\s\S]*?git-experience-push[\s\S]*?git-experience-pull/);
  assert.match(page, /Team 5 과제 보드 ↗/);
  assert.match(script, /nextButton\.textContent = remaining\.length \? '다음 팩' : '팀 작업 방식 보기';/);
  assert.match(script, /showScene\('home'\);/);
  assert.match(script, /homeRestartButton\.addEventListener\('click', restart\);/);
  assert.match(styles, /\.scene-home:not\(\[hidden\]\) \.kanban-capture \{ animation: kanban-capture-arrive 4\.6s/);
  assert.match(styles, /@keyframes kanban-capture-arrive/);
  assert.match(styles, /\.home-detail-grid \{[\s\S]*?grid-template-columns: minmax\(0, 1\.15fr\) minmax\(250px, \.85fr\);/);
  assert.match(styles, /\.git-experience-commit \{ color: #9de7df; \}/);
  assert.match(styles, /\.git-experience-push \{ color: #69d1d3; \}/);
  assert.match(styles, /\.git-experience-pull \{ color: #7db9d6; \}/);
});
