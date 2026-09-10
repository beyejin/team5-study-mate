import { parseProfile, getHints, drawMember } from './profiles.mjs';

const screen = document.querySelector('#game-screen');
const views = [...document.querySelectorAll('.view')];
const progress = document.querySelector('#progress');
const packRow = document.querySelector('#pack-row');
const nextButton = document.querySelector('#next-pack');
const dialog = document.querySelector('#profile-dialog');
const announcement = document.querySelector('#announcement');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const names = ['엄태웅', '김영광', '한예진'];
let members = [];
let remaining = [];
let revealed = [];

const pause = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));
const textElement = (tag, text, className) => {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  return element;
};

function showView(scene) {
  screen.dataset.scene = scene;
  views.forEach((view) => { view.hidden = view.id !== `${scene}-view`; });
}

function showSelection(moveFocus = true) {
  packRow.replaceChildren();
  document.querySelector('#selection-description').textContent = revealed.length
    ? `아직 만나지 않은 ${remaining.length}명의 팀원이 기다리고 있어요.`
    : '세 명의 팀원을 만나보세요.';
  remaining.forEach((_, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pack-button';
    button.setAttribute('aria-label', `팩 ${index + 1} 열기`);
    const image = document.createElement('img');
    image.src = 'assets/game/member-pack-v1.png';
    image.alt = '';
    image.draggable = false;
    button.append(image);
    button.addEventListener('click', openPack);
    packRow.append(button);
  });
  showView('selection');
  if (moveFocus) packRow.querySelector('button').focus({ preventScroll: true });
}

async function openPack() {
  if (screen.dataset.scene !== 'selection') return;
  const member = drawMember(remaining);
  showView('opening');
  announcement.textContent = '팩을 열고 있어요.';
  await pause(reducedMotion.matches ? 250 : 3000);

  for (const hint of getHints(member)) {
    const panel = document.createElement('article');
    panel.className = `hint-panel hint-${hint.kind}`;
    if (hint.image) {
      const image = document.createElement('img');
      image.src = hint.image;
      image.alt = hint.text;
      panel.append(image);
    }
    panel.append(textElement('h2', hint.text));
    document.querySelector('#hint-view').replaceChildren(panel);
    showView('hint');
    announcement.textContent = hint.text;
    await pause(1500);
  }

  revealed.push(member);
  progress.textContent = revealed.length;
  document.querySelector('#revealed-card').replaceChildren(createCard(member));
  nextButton.querySelector('span').textContent = remaining.length ? '다음 팩 고르기' : '우리 팀 만나보기';
  showView('reveal');
  announcement.textContent = `${member.name}님을 만났어요. KAI ${member.kai}, ${member.mbti}.`;
  nextButton.focus({ preventScroll: true });
}

function createCard(member) {
  const card = document.querySelector('#member-card-template').content.firstElementChild.cloneNode(true);
  card.setAttribute('aria-label', `${member.name} 상세 소개`);
  card.querySelector('.card-kai').textContent = member.kai || '—';
  card.querySelector('.card-mbti').textContent = member.mbti || '—';
  card.querySelector('.card-name').textContent = member.name;
  card.querySelector('.card-intro').textContent = member.intro;
  const image = card.querySelector('.card-art img');
  image.src = member.image;
  image.alt = member.keyword ? `${member.name}님의 ${member.keyword} 캐릭터` : `${member.name}님의 프로필`;
  member.tags.forEach((tag) => card.querySelector('.card-tags').append(textElement('span', tag)));
  card.addEventListener('click', () => showProfile(member));
  return card;
}

function showProfile(member) {
  document.querySelector('#profile-title').textContent = member.name;
  document.querySelector('#profile-facts').textContent = `KAI ${member.kai || '—'} / ${member.mbti || '—'}`;
  const content = document.querySelector('#profile-content');
  content.replaceChildren();
  const titles = ['한 줄 소개', '관심 분야', '요즘 배우는 것', '팀원들에게 보여주고 싶은 모습', '나를 표현하는 키워드'];
  for (const title of titles) {
    const lines = member.sections[title];
    if (!lines?.length) continue;
    const section = document.createElement('section');
    section.append(textElement('h3', title), textElement('p', lines.join('\n')));
    content.append(section);
  }
  if (!content.children.length) content.append(textElement('p', '자세한 자기소개는 곧 만나볼 수 있어요.'));
  const github = member.sections.GitHub?.find((line) => /^https:\/\/github\.com\/[\w-]+\/?$/.test(line));
  if (github) {
    const link = textElement('a', 'GitHub에서 만나기 ↗');
    link.href = github;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    content.append(link);
  }
  dialog.showModal();
}

function resetDeck(moveFocus = true) {
  remaining = [...members];
  revealed = [];
  progress.textContent = '0';
  document.querySelector('#revealed-card').replaceChildren();
  document.querySelector('#collection-row').replaceChildren();
  document.querySelector('#hint-view').replaceChildren();
  announcement.textContent = '';
  showSelection(moveFocus);
}

nextButton.addEventListener('click', () => {
  if (screen.dataset.scene !== 'reveal') return;
  if (remaining.length) return showSelection();
  document.querySelector('#collection-row').replaceChildren(...revealed.map(createCard));
  showView('collection');
  announcement.textContent = '세 명의 팀원을 모두 만났어요. 카드를 눌러 자세한 소개를 확인하세요.';
  document.querySelector('#collection-title').focus({ preventScroll: true });
});

document.querySelector('#reset-deck').addEventListener('click', () => resetDeck());
document.querySelector('#close-profile').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  const rect = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
});

async function loadMembers() {
  const retry = document.querySelector('#retry-load');
  const message = document.querySelector('#loading-message');
  retry.hidden = true;
  showView('loading');
  message.textContent = '카드를 준비하고 있어요.';
  try {
    members = await Promise.all(names.map(async (name) => {
      const response = await fetch(`team/${encodeURIComponent(name)}.md`);
      if (!response.ok) throw new Error(`${name}: ${response.status}`);
      return parseProfile(await response.text(), name);
    }));
    const imagePaths = new Set(members.flatMap((member) => [member.image, member.schoolLogo]).filter(Boolean));
    await Promise.all([...imagePaths].map((path) => {
      const image = new Image();
      image.src = path;
      return image.decode();
    }));
    resetDeck(false);
  } catch (error) {
    message.textContent = '카드를 불러오지 못했어요. 연결을 확인한 뒤 다시 시도해주세요.';
    retry.hidden = false;
    console.error('팀원 카드 불러오기 실패', error);
  }
}

document.querySelector('#retry-load').addEventListener('click', loadMembers);
loadMembers();
