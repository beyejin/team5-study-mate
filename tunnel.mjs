const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum);

const CAMERA_TRAVEL = .38;
const FINAL_LIGHT_START = .69;
const LIGHT_PULL_TRAVEL = .26;

function smoothstep(start, end, value) {
  const progress = clamp((value - start) / (end - start), 0, 1);
  return progress * progress * (3 - 2 * progress);
}

function accelerateCamera(progress) {
  const normalized = clamp(progress * 1.1, 0, 1);
  return 1 - Math.pow(1 - normalized, 2.3);
}

function blendLight(cold, warm, progress, alpha) {
  const channels = cold.map((channel, index) => Math.round(channel + (warm[index] - channel) * progress));
  return `rgba(${channels.join(', ')}, ${alpha})`;
}

export function createTunnel(canvas, reducedMotion) {
  const context = canvas.getContext('2d');
  const tunnelTexture = new Image();
  tunnelTexture.decoding = 'async';
  tunnelTexture.src = 'assets/game/stadium-tunnel-v1.png';
  let animationFrame = 0;
  let startTime = 0;
  let duration = 1;
  let active = false;
  let width = 0;
  let height = 0;
  let pixelRatio = 1;

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.round(bounds.width));
    const nextHeight = Math.max(1, Math.round(bounds.height));
    const nextRatio = Math.min(window.devicePixelRatio || 1, 2);
    if (nextWidth === width && nextHeight === height && nextRatio === pixelRatio) return;
    width = nextWidth;
    height = nextHeight;
    pixelRatio = nextRatio;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function drawTunnelTexture(cameraProgress, lightPull) {
    const backdrop = context.createLinearGradient(0, 0, 0, height);
    backdrop.addColorStop(0, '#08131a');
    backdrop.addColorStop(1, '#020608');
    context.fillStyle = backdrop;
    context.fillRect(0, 0, width, height);
    if (!tunnelTexture.complete || !tunnelTexture.naturalWidth) return;

    const scale = Math.max(width / tunnelTexture.naturalWidth, height / tunnelTexture.naturalHeight) * (1 + cameraProgress * CAMERA_TRAVEL + lightPull * LIGHT_PULL_TRAVEL);
    const imageWidth = tunnelTexture.naturalWidth * scale;
    const imageHeight = tunnelTexture.naturalHeight * scale;
    const imageX = (width - imageWidth) / 2;
    const imageY = (height - imageHeight) / 2 + height * (cameraProgress * .055 + lightPull * .04);

    context.save();
    context.imageSmoothingQuality = 'high';
    context.filter = `blur(${lightPull * 1.4}px)`;
    context.drawImage(tunnelTexture, imageX, imageY, imageWidth, imageHeight);
    context.restore();
  }

  function drawLightGrade(finalLight, lightPull) {
    const shade = context.createLinearGradient(0, 0, 0, height);
    shade.addColorStop(0, `rgba(1, 7, 11, ${.3 - lightPull * .2})`);
    shade.addColorStop(.56, `rgba(2, 8, 11, ${.06 - lightPull * .04})`);
    shade.addColorStop(1, `rgba(1, 5, 8, ${.36 - lightPull * .22})`);
    context.fillStyle = shade;
    context.fillRect(0, 0, width, height);

    const exitLight = context.createRadialGradient(width / 2, height * .49, 0, width / 2, height * .49, width * (.26 + lightPull * .82));
    exitLight.addColorStop(0, blendLight([48, 129, 126], [255, 245, 211], finalLight, .08 + finalLight * .26 + lightPull * .58));
    exitLight.addColorStop(.3, blendLight([16, 76, 78], [255, 233, 179], finalLight, .02 + lightPull * .34));
    exitLight.addColorStop(1, 'rgba(5, 10, 13, 0)');
    context.fillStyle = exitLight;
    context.fillRect(0, 0, width, height);
  }

  function drawVignette(lightPull) {
    const vignette = context.createRadialGradient(width / 2, height * .5, height * .18, width / 2, height * .5, Math.max(width, height) * .76);
    vignette.addColorStop(0, 'rgba(2, 7, 10, 0)');
    vignette.addColorStop(.72, 'rgba(2, 7, 10, .12)');
    vignette.addColorStop(1, `rgba(1, 4, 7, ${.64 - lightPull * .3})`);
    context.fillStyle = vignette;
    context.fillRect(0, 0, width, height);
  }

  function draw(progress) {
    resize();
    const cameraProgress = accelerateCamera(progress);
    const finalLight = smoothstep(FINAL_LIGHT_START, 1, progress);
    const lightPull = smoothstep(FINAL_LIGHT_START, .98, progress);
    context.clearRect(0, 0, width, height);
    drawTunnelTexture(cameraProgress, lightPull);
    drawLightGrade(finalLight, lightPull);
    drawVignette(lightPull);
  }

  function render(now) {
    if (!active) return;
    const elapsedProgress = clamp((now - startTime) / duration, 0, 1);
    draw(reducedMotion ? 0 : elapsedProgress);
    if (elapsedProgress < 1) animationFrame = window.requestAnimationFrame(render);
  }

  function start(nextDuration) {
    stop();
    duration = reducedMotion ? 1 : nextDuration;
    startTime = performance.now();
    active = true;
    animationFrame = window.requestAnimationFrame(render);
  }

  function stop() {
    active = false;
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    context.clearRect(0, 0, width, height);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();
  return { start, stop };
}
