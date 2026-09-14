export function createLobbyMusic() {
  const audio = document.querySelector('#lobby-music');
  const bar = document.querySelector('#sound-bar');
  const toggle = document.querySelector('#music-toggle');
  const volume = document.querySelector('#music-volume');
  let active = false;
  let enabled = true;
  let pending = false;

  audio.volume = Number(volume.value) / 100;

  function update() {
    const playing = !audio.paused;
    const label = playing ? '배경음악 일시정지' : '배경음악 재생';
    toggle.setAttribute('aria-pressed', String(playing));
    toggle.setAttribute('aria-label', label);
    toggle.title = label;
  }

  async function play() {
    if (!active || !enabled || document.hidden || pending || !audio.paused) return;
    pending = true;
    try {
      await audio.play();
      if (!active || !enabled || document.hidden) audio.pause();
    } catch {
      // A blocked start can be retried by the next user gesture.
    } finally {
      pending = false;
      update();
    }
  }

  toggle.addEventListener('click', () => {
    if (pending || !audio.paused) {
      enabled = false;
      audio.pause();
    } else {
      enabled = true;
      void play();
    }
    update();
  });

  volume.addEventListener('input', () => {
    audio.volume = Number(volume.value) / 100;
    volume.setAttribute('aria-valuetext', `${volume.value}%`);
    volume.title = `볼륨 ${volume.value}%`;
  });

  // Keep automatic retries separate from the explicit sound controls.
  function startOnGesture(event) {
    if (!bar.contains(event.target)) void play();
  }
  document.addEventListener('click', startOnGesture);
  document.addEventListener('keydown', (event) => {
    if (!event.repeat && ['Enter', ' '].includes(event.key)) startOnGesture(event);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) audio.pause();
    else void play();
  });
  audio.addEventListener('play', update);
  audio.addEventListener('pause', update);
  audio.addEventListener('error', () => {
    audio.pause();
    update();
    toggle.title = '음악을 불러오지 못했습니다. 눌러서 다시 재생';
  });

  return {
    setActive(value) {
      active = value;
      if (active) void play();
      else audio.pause();
    },
  };
}
