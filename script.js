const members = [
  {
    name: '엄태웅', rating: '119', position: 'CM', mbti: 'ENTP',
    image: 'assets/character-candidates/smile-quokka-v1.png', accent: '#bd8a3c', character: 'SMILE QUOKKA',
    intro: '소개를 준비하고 있어요.', tags: ['#웃음', '#여행', '#아이디어'],
    hints: [['SCHOOL', 'TEAM 5'], ['MAJOR', 'COMING SOON'], ['KEYWORD', 'SMILE QUOKKA']],
  },
  {
    name: '김영광', rating: '90', position: 'RW', mbti: 'INFP',
    image: 'assets/character-candidates/daegu-dog-v1.png', accent: '#b6533c', character: 'SPIRITED DOG',
    intro: '한 번 물면 놓치지 않는 광견, 김영광입니다.', tags: ['#대구청년', '#Glory', '#초긍정'],
    hints: [['SCHOOL', 'TEAM 5'], ['MAJOR', 'COMING SOON'], ['KEYWORD', 'SPIRITED DOG']],
  },
  {
    name: '한예진', rating: '105', position: 'CAM', mbti: 'ENTP',
    image: 'assets/game/yejin-orca-v2.png', accent: '#3989c8', character: 'ORCA',
    intro: '사람들의 페인포인트를 발견하면 분석하고 기록한 뒤 직접 실행해 보는 한예진입니다.', tags: ['#문제관찰', '#실행력', '#감응력'],
    hints: [['SCHOOL', '코코네스쿨'], ['MAJOR', '소프트웨어전공'], ['KEYWORD', 'ORCA']],
  },
];

const screen = document.querySelector('#game-screen');
const views = [...document.querySelectorAll('.view')];
const openButton = document.querySelector('#open-pack');
const nextButton = document.querySelector('#next-pack');
const restartButton = document.querySelector('#restart-pack');
const progress = document.querySelector('#lobby-progress');
const announcement = document.querySelector('#announcement');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let remaining = [];
let revealed = [];
let isOpening = false;

const pause = (time) => new Promise((resolve) => window.setTimeout(resolve, reduceMotion ? 120 : time));

function show(scene) {
  screen.dataset.scene = scene;
  views.forEach((view) => { view.hidden = view.id !== `${scene}-view`; });
}

function updateLobby() {
  progress.textContent = `OPENED ${revealed.length} / ${members.length}`;
  openButton.disabled = !remaining.length || isOpening;
  openButton.querySelector('strong').textContent = remaining.length ? '팩 까기' : 'ALL OPENED';
}

function createCard(member, compact = false) {
  const card = document.createElement('article');
  card.className = `player-card${compact ? ' compact' : ''}`;
  card.style.setProperty('--member-accent', member.accent);
  card.setAttribute('aria-label', `${member.name} 프로필 카드`);
  card.innerHTML = `
    <div class="card-inner">
      <div class="card-meta card-rating"><span>KAI</span><strong>${member.rating}</strong></div>
      <div class="card-meta card-mbti"><span>MBTI</span><strong>${member.mbti}</strong></div>
      <img class="card-character" src="${member.image}" alt="${member.character} 캐릭터 예시">
      <div class="card-copy"><h3>${member.name}</h3><p>${member.intro}</p></div>
      <div class="card-tags">${member.tags.map((tag) => `<span>${tag}</span>`).join('')}</div>
      <div class="card-footer"><i></i><strong>TEAM 5</strong><i></i></div>
    </div>`;
  return card;
}

function revealCard(member) {
  document.querySelector('#reveal-card').replaceChildren(createCard(member));
  nextButton.querySelector('span').textContent = remaining.length ? '다음 팩 까기' : '팀원 카드 3장 전체 보기';
  nextButton.querySelector('small').textContent = remaining.length ? 'OPEN THE SAME PACK AGAIN' : 'VIEW THE COMPLETE TEAM';
  announcement.textContent = `${member.name} 카드가 공개되었습니다.`;
}

async function openPack() {
  if (isOpening || !remaining.length) return;
  isOpening = true;
  updateLobby();
  const member = remaining.splice(Math.floor(Math.random() * remaining.length), 1)[0];
  show('opening');
  announcement.textContent = '팩을 열고 있습니다.';
  await pause(900);

  for (const [index, [label, value]] of member.hints.entries()) {
    document.querySelector('#hint-count').textContent = `HINT 0${index + 1} / 03`;
    document.querySelector('#hint-label').textContent = label;
    document.querySelector('#hint-value').textContent = value;
    show('hint');
    announcement.textContent = `${label} 힌트: ${value}`;
    await pause(1500);
  }
  revealed.push(member);
  revealCard(member);
  show('reveal');
  isOpening = false;
  updateLobby();
  nextButton.focus({ preventScroll: true });
}

function showCollection() {
  document.querySelector('#collection-cards').replaceChildren(...revealed.map((member) => createCard(member, true)));
  show('collection');
  announcement.textContent = '세 명의 팀원 카드가 모두 공개되었습니다.';
  restartButton.focus({ preventScroll: true });
}

function nextPack() {
  if (!remaining.length) return showCollection();
  show('lobby');
  updateLobby();
  openButton.focus({ preventScroll: true });
}

function restart() {
  remaining = [...members];
  revealed = [];
  isOpening = false;
  show('lobby');
  updateLobby();
  announcement.textContent = '멤버 팩을 처음부터 다시 시작합니다.';
}

openButton.addEventListener('click', openPack);
nextButton.addEventListener('click', nextPack);
restartButton.addEventListener('click', restart);
restart();
