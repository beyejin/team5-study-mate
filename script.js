import { parseProfile, drawMember } from './profiles.mjs';

const members = [
  {
    id: 'taewoong',
    name: '엄태웅',
    cardImage: 'assets/cards/taewoong-card-cutout-v2.png?v=alpha-20260911',
    profilePath: 'team/엄태웅.md',
    kai: '119',
    mbti: 'ENTP',
    signature: 'SMILE QUOKKA',
    intro: '웃음과 아이디어로 팀의 분위기를 움직이는 플레이어입니다.',
    tags: ['#웃음', '#여행', '#아이디어'],
    hints: [
      { label: 'ACADEMY', title: 'COCONE SCHOOL', detail: 'TEAM 5 CREATIVE CAMPUS', image: 'assets/game/cocone-school.svg' },
      { label: 'MAJOR', title: '관광경영학과', detail: 'TOURISM MANAGEMENT' },
      { label: 'SIGNATURE', title: '웃음', detail: 'POSITIVE ENERGY DETECTED' },
    ],
  },
  {
    id: 'youngkwang',
    name: '김영광',
    cardImage: 'assets/cards/youngkwang-card-cutout-v2.png?v=alpha-20260911',
    profilePath: 'team/김영광.md',
    kai: '90',
    mbti: 'INFP',
    signature: 'POSITIVE DRIVE',
    intro: '한 번 물면 놓치지 않는 끈질김과 긍정으로 실행하는 김영광입니다.',
    tags: ['#대구청년', '#Glory', '#초긍정'],
    hints: [
      { label: 'ACADEMY', title: 'COCONE SCHOOL', detail: 'TEAM 5 CREATIVE CAMPUS', image: 'assets/game/cocone-school.svg' },
      { label: 'MAJOR', title: '인공지능전공', detail: 'ARTIFICIAL INTELLIGENCE' },
      { label: 'SIGNATURE', title: '대구청년', detail: 'POSITIVE DRIVE DETECTED' },
    ],
  },
  {
    id: 'yejin',
    name: '한예진',
    cardImage: 'assets/cards/yejin-card-cutout-v2.png?v=alpha-20260911',
    profilePath: 'team/한예진.md',
    kai: '105',
    mbti: 'ENTP',
    signature: 'ORCA',
    intro: '사람들의 페인포인트를 발견하면 분석하고 기록한 뒤 직접 실행해 보는 한예진입니다.',
    tags: ['#문제관찰', '#실행력', '#감응력'],
    hints: [
      { label: 'ACADEMY', title: 'COCONE SCHOOL', detail: 'CREATIVE SOFTWARE CAMPUS', image: 'assets/game/cocone-school.svg' },
      { label: 'MAJOR', title: 'SOFTWARE', detail: 'BUILDING IDEAS INTO PRODUCTS' },
      { label: 'SIGNATURE', title: 'ORCA', detail: 'DEEP OBSERVER · FAST EXECUTOR' },
    ],
  },
];

const experience = document.querySelector('#experience');
const scenes = new Map([...document.querySelectorAll('[data-view]')].map((scene) => [scene.dataset.view, scene]));
const openButton = document.querySelector('#open-pack');
const nextButton = document.querySelector('#next-pack');
const backButton = document.querySelector('#back-to-lobby');
const restartButton = document.querySelector('#restart-pack');
const skipButton = document.querySelector('#skip-reveal');
const flash = document.querySelector('#white-flash');
const announcement = document.querySelector('#announcement');
const tunnelView = document.querySelector('#tunnel-view');
const hintCard = document.querySelector('#hint-card');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const TUNNEL_SETTLE_MS = 1600;
const HINT_HOLD_MS = 3000;

let remaining = [];
let revealed = [];
let currentMember = null;
let sequenceId = 0;
let isOpening = false;
let isFinalizing = false;

const wait = (milliseconds) => new Promise((resolve) => {
  window.setTimeout(resolve, reducedMotion ? Math.min(milliseconds, 90) : milliseconds);
});

function showScene(name) {
  for (const [sceneName, scene] of scenes) scene.hidden = sceneName !== name;
  experience.dataset.scene = name;
}

function updateProgress() {
  openButton.disabled = isOpening || remaining.length === 0;
  nextButton.disabled = isOpening || isFinalizing;
  openButton.setAttribute('aria-label', revealed.length ? '다음 멤버 팩 열기' : '멤버 팩 열기');
}

function restartAnimation(element, className) {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
}

function triggerFlash() {
  restartAnimation(flash, 'is-bursting');
}

function createMemberCard(member) {
  const card = document.createElement('div');
  card.className = 'member-card';
  card.dataset.member = member.id;

  const image = document.createElement('img');
  image.src = member.cardImage;
  image.alt = `${member.name} 얼굴 카드, KAI ${member.kai}, MBTI ${member.mbti}`;
  image.decoding = 'async';
  image.draggable = false;

  card.append(image);
  return card;
}

function setHint(hint, index) {
  document.querySelector('#hint-title').textContent = hint.title;
  hintCard.hidden = false;

  restartAnimation(hintCard, 'is-entering');
  restartAnimation(tunnelView, 'is-rushing');
  announcement.textContent = `${index + 1}번째 힌트: ${hint.title}`;
}

function clearHint() {
  document.querySelector('#hint-title').textContent = '';
  hintCard.hidden = true;
}

function renderReveal(member) {
  document.querySelector('#reveal-card').replaceChildren(createMemberCard(member));
  nextButton.textContent = remaining.length ? '다음 팩' : '카드 모아보기';
}

async function finishReveal(member) {
  if (!member || isFinalizing) return;
  isFinalizing = true;
  if (!revealed.some((item) => item.id === member.id)) revealed.push(member);
  updateProgress();
  triggerFlash();
  await wait(190);
  renderReveal(member);
  showScene('reveal');
  announcement.textContent = `${member.name} 팀원 카드가 공개되었습니다.`;
  await wait(640);
  isOpening = false;
  isFinalizing = false;
  updateProgress();
  nextButton.focus({ preventScroll: true });
}

async function openPack() {
  if (isOpening || isFinalizing || remaining.length === 0) return;
  isOpening = true;
  updateProgress();
  const selectedMember = drawMember(remaining);
  const revealHints = selectedMember.hints.map((hint) => ({ ...hint }));
  currentMember = selectedMember;
  const run = ++sequenceId;
  clearHint();
  announcement.textContent = '멤버 팩이 빛나며 열립니다.';

  triggerFlash();
  await wait(190);
  if (run !== sequenceId) return;
  showScene('tunnel');
  tunnelView.classList.add('is-rushing');
  await wait(TUNNEL_SETTLE_MS);

  for (const [index, hint] of revealHints.entries()) {
    if (run !== sequenceId) return;
    setHint(hint, index);
    await wait(HINT_HOLD_MS);
  }

  if (run !== sequenceId) return;
  await wait(160);
  await finishReveal(selectedMember);
}

async function skipReveal() {
  if (!isOpening || !currentMember || isFinalizing) return;
  const selectedMember = currentMember;
  sequenceId += 1;
  await finishReveal(selectedMember);
}

function renderCollection() {
  const container = document.querySelector('#collection-cards');
  container.replaceChildren();
  revealed.forEach((member) => {
    const card = document.createElement('div');
    card.className = 'collection-card';
    card.append(createMemberCard(member));
    container.append(card);
  });
  announcement.textContent = '세 장의 팀원 카드가 공개되었습니다.';
}

function nextScene() {
  if (isOpening || isFinalizing) return;
  if (remaining.length > 0) {
    currentMember = null;
    showScene('lobby');
    updateProgress();
    openButton.focus({ preventScroll: true });
    return;
  }
  renderCollection();
  showScene('collection');
}

function returnToPreviousScene() {
  if (isOpening || isFinalizing) return;
  if (remaining.length === 0) {
    renderCollection();
    showScene('collection');
    return;
  }
  currentMember = null;
  showScene('lobby');
  updateProgress();
  openButton.focus({ preventScroll: true });
}

function restart() {
  sequenceId += 1;
  remaining = [...members];
  revealed = [];
  currentMember = null;
  isOpening = false;
  isFinalizing = false;
  showScene('lobby');
  updateProgress();
  announcement.textContent = 'TEAM 5 멤버 팩이 준비되었습니다.';
}

async function loadProfiles() {
  await Promise.all(members.map(async (member) => {
    try {
      const response = await fetch(member.profilePath, { cache: 'no-cache' });
      if (!response.ok) return;
      const profile = parseProfile(await response.text(), member.name);
      member.profile = profile;
      if (profile.intro) member.intro = profile.intro;
      if (profile.school) {
        member.hints[0] = {
          label: 'ACADEMY',
          title: profile.school === '코코네스쿨' ? 'COCONE SCHOOL' : profile.school,
          detail: 'TEAM 5 CREATIVE CAMPUS',
          image: profile.schoolLogo || 'assets/game/team5.svg',
        };
      }
      if (profile.major) member.hints[1] = { label: 'MAJOR', title: profile.major, detail: 'PLAYER BACKGROUND' };
      if (profile.keyword) member.hints[2] = { label: 'SIGNATURE', title: profile.keyword, detail: 'IDENTITY CONFIRMED' };
    } catch {
      member.profile = null;
    }
  }));
}

function enableLocalPreviewMode() {
  if (!['127.0.0.1', 'localhost'].includes(window.location.hostname)) return;
  const params = new URLSearchParams(window.location.search);
  const previewScene = params.get('scene');
  const previewMember = members.find((member) => member.id === params.get('member')) ?? members[0];
  if (previewScene) document.documentElement.classList.add('is-static-preview');

  if (previewScene === 'tunnel') {
    currentMember = previewMember;
    setHint(previewMember.hints[Number(params.get('hint') ?? 0)] ?? previewMember.hints[0], Number(params.get('hint') ?? 0));
    showScene('tunnel');
  } else if (previewScene === 'reveal') {
    remaining = members.filter((member) => member.id !== previewMember.id);
    revealed = [previewMember];
    renderReveal(previewMember);
    showScene('reveal');
    updateProgress();
  } else if (previewScene === 'collection') {
    remaining = [];
    revealed = [...members];
    renderCollection();
    showScene('collection');
    updateProgress();
  }

  if (params.get('autoplay') === 'true') {
    remaining = [previewMember];
    revealed = [];
    currentMember = null;
    isOpening = false;
    isFinalizing = false;
    showScene('lobby');
    updateProgress();
    openPack();
  }
}

openButton.addEventListener('click', openPack);
nextButton.addEventListener('click', nextScene);
backButton.addEventListener('click', returnToPreviousScene);
restartButton.addEventListener('click', restart);
skipButton.addEventListener('click', skipReveal);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && experience.dataset.scene === 'tunnel') skipReveal();
});

restart();
loadProfiles().finally(enableLocalPreviewMode);
