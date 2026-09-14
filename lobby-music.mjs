export function createLobbyMusic(effects) {
  const audio = document.querySelector('#lobby-music');
  const bar = document.querySelector('#sound-bar');
  const toggle = document.querySelector('#music-toggle');
  const volume = document.querySelector('#music-volume');
  let active = false;
  let enabled = true;
  let pending = false;

  audio.volume = Number(volume.value) / 100;
  effects.setVolume(audio.volume);

  function update() {
    const playing = active ? !audio.paused : enabled;
    const label = playing ? '전체 사운드 끄기' : '전체 사운드 켜기';
    toggle.setAttribute('aria-pressed', String(playing));
    toggle.setAttribute('aria-label', label);
    toggle.title = label;
  }

  function unlockEffects() {
    if (enabled && !document.hidden) void effects.setEnabled(true);
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
    if (pending || !audio.paused || (!active && enabled)) {
      enabled = false;
      audio.pause();
      void effects.setEnabled(false);
    } else {
      enabled = true;
      unlockEffects();
      void play();
    }
    update();
  });

  volume.addEventListener('input', () => {
    audio.volume = Number(volume.value) / 100;
    effects.setVolume(audio.volume);
    volume.setAttribute('aria-valuetext', `${volume.value}%`);
    volume.title = `볼륨 ${volume.value}%`;
  });

  // Keep automatic retries separate from the explicit sound controls.
  function startOnGesture(event) {
    if (!bar.contains(event.target)) {
      unlockEffects();
      void play();
    }
  }
  document.addEventListener('click', startOnGesture);
  document.addEventListener('keydown', (event) => {
    if (!event.repeat && ['Enter', ' '].includes(event.key)) startOnGesture(event);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      audio.pause();
      effects.stop();
    }
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
    unlockEffects,
    setActive(value) {
      active = value;
      if (active) void play();
      else audio.pause();
      update();
    },
  };
}
