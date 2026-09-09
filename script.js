const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('#site-nav');

menuToggle?.addEventListener('click', () => {
  const isOpen = siteNav.classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

siteNav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    siteNav.classList.remove('is-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  });
});

const revealDialog = document.querySelector('#member-reveal');
const revealShell = revealDialog?.querySelector('.reveal-shell');
const openRevealButton = document.querySelector('#open-yejin-reveal');
const closeRevealButton = document.querySelector('#close-reveal');
const replayRevealButton = document.querySelector('#replay-reveal');
const revealStatus = document.querySelector('#reveal-status');
const revealPack = revealDialog?.querySelector('.reveal-pack');
const revealPackSheen = revealDialog?.querySelector('.reveal-pack-sheen');
const infoGates = [...(revealDialog?.querySelectorAll('.info-gate') ?? [])];
const revealFlash = revealDialog?.querySelector('.reveal-flash');
const finalReveal = revealDialog?.querySelector('.final-reveal');
const playerCard = revealDialog?.querySelector('.player-card');
const orcaCompanion = revealDialog?.querySelector('.orca-companion-wrap');
const finalCopyItems = [...(revealDialog?.querySelectorAll('.final-copy > *') ?? [])];
const revealProgress = revealDialog?.querySelector('.reveal-progress span');
const tunnelFrames = [...(revealDialog?.querySelectorAll('.tunnel-frame') ?? [])];
const mysteryPackVisual = document.querySelector('.mystery-pack-visual');

const revealThemes = [
  { accent: '#65e7ff', secondary: '#856cff' },
  { accent: '#86ffd0', secondary: '#4b86ff' },
  { accent: '#c38cff', secondary: '#42dbff' },
];

const packBackgrounds = [
  'linear-gradient(145deg, #171a42 0%, #244e82 50%, #4a1d78 100%)',
  'linear-gradient(155deg, #081c2c 0%, #146070 48%, #263270 100%)',
  'linear-gradient(135deg, #22113c 0%, #68417e 48%, #123f5f 100%)',
];

const clueData = infoGates.map((gate) => ({
  label: gate.querySelector('.gate-label')?.textContent ?? '',
  value: gate.querySelector('.gate-value')?.textContent ?? '',
}));

let revealTimeline;
let tunnelTimeline;
let lastFocusedElement;

const shuffled = (items) => {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }

  return result;
};

const randomItem = (items) => items[Math.floor(Math.random() * items.length)];

const randomizeMysteryPack = () => {
  if (!mysteryPackVisual) return;
  mysteryPackVisual.style.background = randomItem(packBackgrounds);
};

const prepareRandomReveal = () => {
  const theme = randomItem(revealThemes);
  revealShell?.style.setProperty('--reveal-accent', theme.accent);
  revealShell?.style.setProperty('--reveal-accent-secondary', theme.secondary);

  shuffled(clueData).forEach((clue, index) => {
    const label = infoGates[index]?.querySelector('.gate-label');
    const value = infoGates[index]?.querySelector('.gate-value');
    if (label) label.textContent = clue.label;
    if (value) value.textContent = clue.value;
  });
};

const showFinalRevealWithoutMotion = () => {
  if (!finalReveal) return;
  revealPack?.setAttribute('hidden', '');
  infoGates.forEach((gate) => gate.setAttribute('hidden', ''));
  finalReveal.style.visibility = 'visible';
  finalReveal.style.opacity = '1';
  if (revealProgress) revealProgress.style.transform = 'scaleX(1)';
  if (revealStatus) revealStatus.textContent = '한예진의 범고래 카드가 공개되었습니다.';
};

const runReveal = () => {
  prepareRandomReveal();

  revealPack?.removeAttribute('hidden');
  infoGates.forEach((gate) => gate.removeAttribute('hidden'));

  if (!window.gsap || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    showFinalRevealWithoutMotion();
    return;
  }

  const { gsap } = window;
  const packRotation = gsap.utils.random(-24, 24, 1);

  revealTimeline?.kill();
  tunnelTimeline?.kill();

  gsap.set(revealPack, { autoAlpha: 0, scale: 0.16, rotationY: packRotation, filter: 'blur(2px)' });
  gsap.set(revealPackSheen, { xPercent: -85 });
  gsap.set(infoGates, { autoAlpha: 0, scale: 0.12, filter: 'blur(4px)' });
  gsap.set(revealFlash, { autoAlpha: 0 });
  gsap.set(finalReveal, { autoAlpha: 0 });
  gsap.set(playerCard, { autoAlpha: 0, scale: 0.28, y: 120, rotationY: -25 });
  gsap.set(orcaCompanion, { autoAlpha: 0, x: -180, y: 80, rotation: -12 });
  gsap.set(finalCopyItems, { autoAlpha: 0, x: 72 });
  gsap.set(revealProgress, { scaleX: 0 });

  tunnelTimeline = gsap.timeline({ repeat: -1 });
  tunnelTimeline
    .to(tunnelFrames, { opacity: 0.9, filter: 'brightness(1.8)', duration: 0.62, stagger: 0.12, ease: 'sine.inOut' })
    .to(tunnelFrames, { opacity: 0.32, filter: 'brightness(1)', duration: 0.62, stagger: 0.12, ease: 'sine.inOut' });

  revealTimeline = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
  revealTimeline
    .call(() => {
      if (revealStatus) revealStatus.textContent = '미스터리 팩이 복도 끝에서 열리고 있습니다.';
    })
    .to(revealProgress, { scaleX: 1, duration: 8.3, ease: 'none' }, 0)
    .to(revealPack, { autoAlpha: 1, scale: 0.38, filter: 'blur(0px)', duration: 0.75, ease: 'power2.out' }, 0.1)
    .to(revealPack, { scale: 0.95, rotationY: -packRotation * 0.25, duration: 0.9, ease: 'power2.inOut' }, 0.82)
    .to(revealPackSheen, { xPercent: 90, duration: 0.75, ease: 'power2.inOut' }, 0.9)
    .to(revealPack, { scale: 3.1, autoAlpha: 0, filter: 'blur(18px)', duration: 0.55, ease: 'power4.in' }, 1.72)
    .to(revealFlash, { autoAlpha: 1, duration: 0.1 }, 2.12)
    .to(revealFlash, { autoAlpha: 0, duration: 0.25 }, 2.22);

  infoGates.forEach((gate, index) => {
    const gateStart = 2.42 + index * 1.22;
    const label = gate.querySelector('.gate-label')?.textContent ?? '팀원 정보';
    const value = gate.querySelector('.gate-value')?.textContent ?? '';

    revealTimeline
      .call(() => {
        if (revealStatus) revealStatus.textContent = `${label}, ${value}`;
      }, [], gateStart)
      .fromTo(
        gate,
        { autoAlpha: 0, scale: 0.12, filter: 'blur(4px)' },
        { autoAlpha: 1, scale: 0.3, filter: 'blur(0px)', duration: 0.22, ease: 'power2.out' },
        gateStart,
      )
      .to(gate, { scale: 4.4, autoAlpha: 0, filter: 'blur(10px)', duration: 1.02, ease: 'power3.in' }, gateStart + 0.22);
  });

  revealTimeline
    .to(revealFlash, { autoAlpha: 1, duration: 0.12 }, 6.15)
    .call(() => {
      if (revealStatus) revealStatus.textContent = '한예진의 범고래 카드가 공개되었습니다.';
    }, [], 6.2)
    .set(finalReveal, { autoAlpha: 1 }, 6.27)
    .to(revealFlash, { autoAlpha: 0, duration: 0.3 }, 6.28)
    .to(playerCard, { autoAlpha: 1, scale: 1, y: 0, rotationY: 0, duration: 1.05, ease: 'back.out(1.35)' }, 6.32)
    .to(orcaCompanion, { autoAlpha: 1, x: 0, y: 0, rotation: 0, duration: 1.08, ease: 'power3.out' }, 6.42)
    .to(finalCopyItems, { autoAlpha: 1, x: 0, duration: 0.68, stagger: 0.11, ease: 'power3.out' }, 6.58);
};

const openReveal = () => {
  if (!revealDialog) return;
  lastFocusedElement = document.activeElement;
  document.body.classList.add('reveal-open');
  revealDialog.showModal();
  runReveal();
};

const closeReveal = () => {
  revealTimeline?.kill();
  tunnelTimeline?.kill();
  revealDialog?.close();
};

openRevealButton?.addEventListener('click', openReveal);
closeRevealButton?.addEventListener('click', closeReveal);
replayRevealButton?.addEventListener('click', runReveal);

revealDialog?.addEventListener('click', (event) => {
  if (event.target === revealDialog) closeReveal();
});

revealDialog?.addEventListener('close', () => {
  revealTimeline?.kill();
  tunnelTimeline?.kill();
  document.body.classList.remove('reveal-open');
  lastFocusedElement?.focus();
});

playerCard?.addEventListener('pointermove', (event) => {
  if (!window.gsap || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const bounds = playerCard.getBoundingClientRect();
  const pointerX = (event.clientX - bounds.left) / bounds.width;
  const pointerY = (event.clientY - bounds.top) / bounds.height;

  playerCard.style.setProperty('--pointer-x', `${pointerX * 100}%`);
  playerCard.style.setProperty('--pointer-y', `${pointerY * 100}%`);
  window.gsap.to(playerCard, {
    rotationY: (pointerX - 0.5) * 13,
    rotationX: (0.5 - pointerY) * 13,
    duration: 0.26,
    ease: 'power2.out',
  });
});

playerCard?.addEventListener('pointerleave', () => {
  if (!window.gsap) return;
  window.gsap.to(playerCard, { rotationY: 0, rotationX: 0, duration: 0.5, ease: 'power3.out' });
});

randomizeMysteryPack();
