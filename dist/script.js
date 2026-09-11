import { parseProfile, drawMember } from './profiles.mjs';

const members = [
  {
    id: 'taewoong',
    name: '엄태웅',
    cardImage: 'assets/cards/taewoong-card.jpg',
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
    cardImage: 'assets/cards/youngkwang-card.jpg',
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
    cardImage: 'assets/cards/yejin-card.jpg',
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
const restartButton = document.querySelector('#restart-pack');
const homeButton = document.querySelector('#home-button');
const skipButton = document.querySelector('#skip-reveal');
const flash = document.querySelector('#white-flash');
const announcement = document.querySelector('#announcement');
const tunnelView = document.querySelector('#tunnel-view');
const hintCard = document.querySelector('#hint-card');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  document.querySelector('#hud-status').textContent = {
    lobby: 'MEMBER PACK',
    tunnel: 'IDENTIFYING PLAYER',
    reveal: 'NEW MEMBER',
    collection: 'SQUAD COMPLETE',
  }[name];
  homeButton.disabled = name === 'tunnel';
}

function updateProgress() {
  document.querySelector('#hud-count').textContent = `${revealed.length} / ${members.length}`;
  const dots = [...document.querySelectorAll('#revealed-dots span')];
  dots.forEach((dot, index) => {
    dot.classList.toggle('is-open', index < revealed.length);
    dot.classList.toggle('is-current', index === revealed.length && remaining.length > 0);
  });

  const action = openButton.querySelector('.pack-cta strong');
  action.textContent = revealed.length ? '다음 팩 오픈' : '팩 오픈';
  openButton.disabled = isOpening || remaining.length === 0;
  document.querySelector('#pack-instruction').innerHTML = remaining.length
    ? `<kbd>ENTER</kbd> 또는 클릭 · ${remaining.length}장 남음`
    : '모든 카드 공개 완료';
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

  const shine = document.createElement('span');
  shine.className = 'card-shine';
  shine.setAttribute('aria-hidden', 'true');
  card.append(image, shine);
  return card;
}

function setHint(hint, index) {
  document.querySelector('#hint-step').textContent = `SIGNAL 0${index + 1} / 03`;
  document.querySelector('#hint-progress').style.width = `${((index + 1) / 3) * 100}%`;
  document.querySelector('#hint-label').textContent = hint.label;
  document.querySelector('#hint-title').textContent = hint.title;
  document.querySelector('#hint-detail').textContent = hint.detail;

  const image = document.querySelector('#hint-image');
  hintCard.classList.toggle('has-image', Boolean(hint.image));
  if (hint.image) {
    image.src = hint.image;
    image.alt = `${hint.title} 힌트 이미지`;
  } else {
    image.removeAttribute('src');
    image.alt = '';
  }

  restartAnimation(hintCard, 'is-entering');
  restartAnimation(tunnelView, 'is-rushing');
  announcement.textContent = `${index + 1}번째 힌트, ${hint.label}: ${hint.title}`;
}

function fillWing(container, content) {
  container.replaceChildren();
  for (const item of content) {
    const element = document.createElement(item.tag);
    element.className = item.className;
    if (item.className === 'wing-tags') {
      for (const tag of item.value) {
        const chip = document.createElement('span');
        chip.textContent = tag;
        element.append(chip);
      }
    } else if (item.className === 'wing-stat') {
      const label = document.createElement('small');
      const value = document.createElement('strong');
      label.textContent = item.label;
      value.textContent = item.value;
      element.append(label, value);
    } else {
      element.textContent = item.value;
    }
    container.append(element);
  }
}

function renderReveal(member) {
  document.querySelector('#reveal-card').replaceChildren(createMemberCard(member));
  fillWing(document.querySelector('#reveal-left'), [
    { tag: 'p', className: 'wing-label', value: 'TEAM MEMBER' },
    { tag: 'h3', className: 'wing-value', value: member.name },
    { tag: 'p', className: 'wing-sub', value: `${member.signature} · TEAM 5` },
    { tag: 'div', className: 'wing-stat', label: 'KAI', value: member.kai },
  ]);
  fillWing(document.querySelector('#reveal-right'), [
    { tag: 'p', className: 'wing-label', value: 'PLAYER PROFILE' },
    { tag: 'h3', className: 'wing-value', value: member.mbti },
    { tag: 'p', className: 'wing-sub', value: 'SPECIAL MEMBER CARD' },
    { tag: 'div', className: 'wing-tags', value: member.tags },
  ]);

  const label = nextButton.querySelector('span');
  const subLabel = nextButton.querySelector('small');
  label.textContent = remaining.length ? '다음 팩 열기' : '완성된 스쿼드 보기';
  subLabel.textContent = remaining.length ? 'NEXT MEMBER' : 'VIEW THE COMPLETE TEAM';
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
  currentMember = drawMember(remaining);
  const run = ++sequenceId;
  announcement.textContent = '멤버 팩이 빛나며 열립니다.';

  triggerFlash();
  await wait(190);
  if (run !== sequenceId) return;
  showScene('tunnel');
  tunnelView.classList.add('is-rushing');
  await wait(520);

  for (const [index, hint] of currentMember.hints.entries()) {
    if (run !== sequenceId) return;
    setHint(hint, index);
    await wait(980);
  }

  if (run !== sequenceId) return;
  await wait(160);
  await finishReveal(currentMember);
}

async function skipReveal() {
  if (!isOpening || !currentMember || isFinalizing) return;
  sequenceId += 1;
  await finishReveal(currentMember);
}

function addMeta(label, value) {
  const wrapper = document.createElement('div');
  const term = document.createElement('dt');
  const description = document.createElement('dd');
  term.textContent = label;
  description.textContent = value;
  wrapper.append(term, description);
  return wrapper;
}

function getGithub(member) {
  return (member.profile?.sections?.GitHub ?? []).find((line) => /^https:\/\/github\.com\//i.test(line)) ?? '';
}

function selectMember(member, index) {
  for (const button of document.querySelectorAll('.collection-card')) {
    button.setAttribute('aria-pressed', String(button.dataset.member === member.id));
  }

  document.querySelector('.detail-number').textContent = String(index + 1).padStart(2, '0');
  document.querySelector('#detail-name').textContent = member.name;
  document.querySelector('#detail-intro').textContent = member.intro;
  document.querySelector('#detail-meta').replaceChildren(
    addMeta('KAI', member.kai),
    addMeta('MBTI', member.mbti),
    addMeta('SIGNATURE', member.signature),
  );

  const sectionContainer = document.querySelector('#detail-sections');
  sectionContainer.replaceChildren();
  const sectionNames = ['관심 분야', '요즘 배우는 것', '팀원들에게 보여주고 싶은 모습'];
  const availableSections = sectionNames
    .map((name) => ({ name, values: member.profile?.sections?.[name] ?? [] }))
    .filter((section) => section.values.length > 0);

  if (availableSections.length === 0) {
    const section = document.createElement('section');
    section.className = 'detail-section';
    const heading = document.createElement('h4');
    const copy = document.createElement('p');
    heading.textContent = 'PROFILE UPDATE';
    copy.textContent = '더 자세한 소개를 준비하고 있습니다.';
    section.append(heading, copy);
    sectionContainer.append(section);
  } else {
    for (const { name, values } of availableSections) {
      const section = document.createElement('section');
      section.className = 'detail-section';
      const heading = document.createElement('h4');
      const copy = document.createElement('p');
      heading.textContent = name;
      copy.textContent = values.join(' · ');
      section.append(heading, copy);
      sectionContainer.append(section);
    }
  }

  const github = document.querySelector('#detail-github');
  const githubUrl = getGithub(member);
  github.hidden = !githubUrl;
  if (githubUrl) github.href = githubUrl;
  announcement.textContent = `${member.name} 팀원 정보가 선택되었습니다.`;
}

function renderCollection() {
  const container = document.querySelector('#collection-cards');
  container.replaceChildren();
  revealed.forEach((member, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'collection-card';
    button.dataset.member = member.id;
    button.setAttribute('aria-pressed', String(index === 0));
    button.setAttribute('aria-label', `${member.name} 카드 선택`);
    button.append(createMemberCard(member));
    button.addEventListener('click', () => selectMember(member, index));
    container.append(button);
  });
  selectMember(revealed[0], 0);
}

function nextScene() {
  if (remaining.length > 0) {
    currentMember = null;
    showScene('lobby');
    updateProgress();
    openButton.focus({ preventScroll: true });
    return;
  }
  renderCollection();
  showScene('collection');
  document.querySelector('.collection-card')?.focus({ preventScroll: true });
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
restartButton.addEventListener('click', restart);
skipButton.addEventListener('click', skipReveal);
homeButton.addEventListener('click', () => {
  if (isOpening || isFinalizing) return;
  if (remaining.length === 0) {
    renderCollection();
    showScene('collection');
  } else {
    showScene('lobby');
    updateProgress();
  }
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && experience.dataset.scene === 'tunnel') skipReveal();
});

restart();
loadProfiles().finally(enableLocalPreviewMode);
