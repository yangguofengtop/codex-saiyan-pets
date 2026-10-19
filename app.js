'use strict';

(() => {
  const CELL = { width: 192, height: 208 };
  const RELEASE = 'https://github.com/yangguofengtop/codex-saiyan-pets/releases/download/v1.0.0/';
  const PETS = {
    'super-saiyan': { name: '超级赛亚人', sheet: './super-saiyan.webp' },
    'ultra-instinct': { name: '自在极意功', sheet: './ultra-instinct.webp' },
  };
  const ACTIONS = [
    { id: 'idle', label: '待机', status: '自在待机', row: 0, times: [280, 110, 110, 140, 140, 320], icon: '<path d="M4 12a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v5H4z"/><path d="M8 8V5m8 3V5M8 13h.01M16 13h.01M8 20h8"/>' },
    { id: 'waving', label: '挥手', status: '跟你打招呼', row: 3, times: [140, 140, 140, 280], icon: '<path d="M8 13V6a1.5 1.5 0 0 1 3 0v6M11 12V4a1.5 1.5 0 0 1 3 0v8M14 12V6a1.5 1.5 0 0 1 3 0v7M17 12V9a1.5 1.5 0 0 1 3 0v6a6 6 0 0 1-10.5 4L5 14a1.5 1.5 0 0 1 2-2z"/>' },
    { id: 'jumping', label: '跳跃', status: '向上突破', row: 4, times: [140, 140, 140, 140, 280], icon: '<path d="M12 18V4m-5 5 5-5 5 5M5 20h14"/>' },
    { id: 'running-left', label: '左跑', status: '向左出发', row: 2, times: [120, 120, 120, 120, 120, 120, 120, 220], icon: '<path d="M20 12H4m6-6-6 6 6 6"/>' },
    { id: 'running-right', label: '右跑', status: '向右出发', row: 1, times: [120, 120, 120, 120, 120, 120, 120, 220], icon: '<path d="M4 12h16m-6-6 6 6-6 6"/>' },
    { id: 'waiting', label: '等待', status: '等你回应', row: 6, times: [150, 150, 150, 150, 150, 260], icon: '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>' },
    { id: 'running', label: '工作', status: '专注工作中', row: 7, times: [120, 120, 120, 120, 120, 220], icon: '<rect x="4" y="7" width="16" height="13" rx="2"/><path d="M8 7V4h8v3M4 12h16m-9 0v3h2v-3"/>' },
    { id: 'review', label: '思考', status: '认真想一想', row: 8, times: [150, 150, 150, 150, 150, 280], icon: '<path d="M8 15a7 7 0 1 1 8 0l-1 3H9zM9 21h6M12 7v4"/>' },
    { id: 'failed', label: '失落', status: '休息一下，再出发', row: 5, times: [140, 140, 140, 140, 140, 140, 140, 240], icon: '<circle cx="12" cy="12" r="8"/><path d="M8 9h.01M16 9h.01M8 16c2-3 6-3 8 0"/>' },
  ];
  const BY_ID = Object.fromEntries(ACTIONS.map(action => [action.id, action]));
  const GAZE_LABELS = ['看向上方', '看向右上方', '看向右上方', '看向右上方', '看向右侧', '看向右下方', '看向右下方', '看向右下方', '看向下方', '看向左下方', '看向左下方', '看向左下方', '看向左侧', '看向左上方', '看向左上方', '看向左上方'];
  const $ = selector => document.querySelector(selector);
  const canvas = $('#pet-canvas');
  const context = canvas.getContext('2d');
  const stage = $('#stage');
  const pointerDot = $('#pointer-dot');
  const loadState = $('#loading-state');
  const loadingMessage = $('#loading-message');
  const retryButton = $('#retry-load');
  const status = $('#action-status');
  const followToggle = $('#follow-toggle');
  const pauseButton = $('#pause-button');
  const sizeRange = $('#size-range');
  const speedSelect = $('#speed-select');
  const imageCache = new Map();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let selectedPet = 'super-saiyan';
  let selectedAction = 'idle';
  let image = null;
  let gaze = null;
  let greeting = false;
  let paused = reducedMotion.matches;
  let elapsed = 0;
  let lastTime = null;
  let frameRequest = 0;
  let requestVersion = 0;

  $('#action-buttons').innerHTML = ACTIONS.map(action => `<button type="button" class="action-button${action.id === selectedAction ? ' active' : ''}" data-action="${action.id}" aria-pressed="${action.id === selectedAction}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${action.icon}</svg><span>${action.label}</span></button>`).join('');

  function setStatus(text) {
    if (status.textContent !== text) status.textContent = text;
  }

  function updateActionButtons() {
    const active = greeting ? 'waving' : selectedAction;
    document.querySelectorAll('[data-action]').forEach(button => {
      const isActive = button.dataset.action === active;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  }

  function paint(target, sprite, row, column) {
    const ctx = target.getContext('2d');
    ctx.clearRect(0, 0, target.width, target.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sprite, column * CELL.width, row * CELL.height, CELL.width, CELL.height, 0, 0, target.width, target.height);
  }

  function frameAt(action, time) {
    const total = action.times.reduce((sum, value) => sum + value, 0);
    let remaining = time % total;
    for (let i = 0; i < action.times.length; i++) {
      if (remaining < action.times[i]) return i;
      remaining -= action.times[i];
    }
    return 0;
  }

  function draw() {
    if (!image) return;
    if (gaze !== null && !greeting) {
      paint(canvas, image, 9 + Math.floor(gaze / 8), gaze % 8);
      setStatus(GAZE_LABELS[gaze]);
      return;
    }
    const action = BY_ID[greeting ? 'waving' : selectedAction];
    paint(canvas, image, action.row, frameAt(action, elapsed));
    setStatus(action.status);
  }

  function animate(timestamp) {
    frameRequest = 0;
    if (document.hidden) { lastTime = null; return; }
    if (lastTime === null) lastTime = timestamp;
    if (!paused && image && gaze === null) {
      elapsed += Math.min(timestamp - lastTime, 250) * Number(speedSelect.value);
      if (greeting && elapsed >= BY_ID.waving.times.reduce((a, b) => a + b, 0)) {
        greeting = false;
        elapsed = 0;
        updateActionButtons();
      }
    }
    lastTime = timestamp;
    draw();
    if (!paused) frameRequest = requestAnimationFrame(animate);
  }

  function startAnimation() {
    lastTime = null;
    if (!frameRequest && !paused && !document.hidden) frameRequest = requestAnimationFrame(animate);
    draw();
  }

  function clearGaze() {
    gaze = null;
    pointerDot.hidden = true;
  }

  function setPaused(value) {
    paused = value;
    pauseButton.setAttribute('aria-pressed', String(paused));
    $('#pause-icon').textContent = paused ? '▷' : 'Ⅱ';
    $('#pause-label').textContent = paused ? '继续' : '暂停';
    pauseButton.setAttribute('aria-label', paused ? '继续播放宠物动画' : '暂停宠物动画');
    if (paused && frameRequest) { cancelAnimationFrame(frameRequest); frameRequest = 0; }
    startAnimation();
  }

  function loadImage(pet) {
    if (imageCache.has(pet)) return imageCache.get(pet);
    const promise = new Promise((resolve, reject) => {
      const sprite = new Image();
      const timer = setTimeout(() => { sprite.onload = sprite.onerror = null; reject(new Error('图片加载超时')); }, 25000);
      sprite.onload = () => {
        clearTimeout(timer);
        if (sprite.naturalWidth !== 1536 || sprite.naturalHeight !== 2288) {
          reject(new Error('图片尺寸不符合宠物格式'));
          return;
        }
        document.querySelectorAll(`[data-thumbnail="${pet}"]`).forEach(target => paint(target, sprite, 0, 0));
        resolve(sprite);
      };
      sprite.onerror = () => { clearTimeout(timer); reject(new Error('伙伴暂时没能赶来')); };
      sprite.src = PETS[pet].sheet;
    });
    imageCache.set(pet, promise);
    promise.catch(() => { if (imageCache.get(pet) === promise) imageCache.delete(pet); });
    return promise;
  }

  async function selectPet(pet) {
    if (!PETS[pet]) return;
    selectedPet = pet;
    const version = ++requestVersion;
    image = null;
    elapsed = 0;
    greeting = false;
    clearGaze();
    const name = PETS[pet].name;
    document.querySelectorAll('[data-pet]').forEach(button => {
      const active = button.dataset.pet === pet;
      button.classList.toggle('selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
    $('#stage-pet-name').textContent = name;
    canvas.setAttribute('aria-label', `${name}，点击或按回车挥手`);
    $('#download-description').textContent = `下载${name}，成为你的 Codex 桌面伙伴。`;
    $('#download-button').innerHTML = `下载${name} <span aria-hidden="true">↘</span>`;
    $('#download-button').href = `${RELEASE}${pet}-v1.0.0.zip`;
    loadState.hidden = false;
    loadState.classList.remove('load-error');
    retryButton.hidden = true;
    loadingMessage.textContent = '伙伴正在赶来…';
    canvas.classList.remove('loaded');
    canvas.setAttribute('aria-disabled', 'true');
    updateActionButtons();
    try {
      const sprite = await loadImage(pet);
      if (version !== requestVersion) return;
      image = sprite;
      canvas.classList.add('loaded');
      canvas.setAttribute('aria-disabled', 'false');
      loadState.hidden = true;
      startAnimation();
    } catch (error) {
      if (version !== requestVersion) return;
      loadingMessage.textContent = `${error.message}，请检查网络后重试。`;
      loadState.classList.add('load-error');
      retryButton.hidden = false;
      setStatus('加载未完成');
    }
  }

  function chooseAction(id) {
    if (!BY_ID[id]) return;
    selectedAction = id;
    greeting = false;
    clearGaze();
    elapsed = 0;
    updateActionButtons();
    draw();
  }

  function greet() {
    if (!image) return;
    clearGaze();
    greeting = true;
    elapsed = 0;
    setPaused(false);
    updateActionButtons();
    draw();
  }

  function followPointer(event) {
    if (!followToggle.checked || paused || !image || greeting) return;
    const petRect = canvas.getBoundingClientRect();
    const dx = event.clientX - (petRect.left + petRect.width * 0.5);
    const dy = event.clientY - (petRect.top + petRect.height * 0.3);
    if (Math.hypot(dx, dy) < Math.max(22, petRect.width * 0.13)) {
      clearGaze();
    } else {
      const degrees = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
      gaze = Math.round(degrees / 22.5) % 16;
      const stageRect = stage.getBoundingClientRect();
      pointerDot.style.left = `${event.clientX - stageRect.left}px`;
      pointerDot.style.top = `${event.clientY - stageRect.top}px`;
      pointerDot.hidden = event.pointerType === 'touch';
    }
    draw();
  }

  function updateSize() {
    const value = Number(sizeRange.value);
    const availableWidth = Math.min(stage.clientWidth * 0.7, (stage.clientHeight - 100) * CELL.width / CELL.height);
    stage.style.setProperty('--pet-width', `${Math.min(CELL.width * value / 100, availableWidth)}px`);
    $('#size-value').value = `${value}%`;
  }

  function setTheme(theme) {
    if (!['cream', 'sage', 'night'].includes(theme)) return;
    stage.className = `stage theme-${theme}`;
    document.querySelectorAll('[data-theme]').forEach(button => {
      const active = button.dataset.theme === theme;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  document.querySelectorAll('[data-pet]').forEach(button => button.addEventListener('click', () => selectPet(button.dataset.pet)));
  document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => chooseAction(button.dataset.action)));
  document.querySelectorAll('[data-theme]').forEach(button => button.addEventListener('click', () => setTheme(button.dataset.theme)));
  stage.addEventListener('pointermove', followPointer);
  stage.addEventListener('pointerdown', followPointer);
  stage.addEventListener('pointerleave', () => { if (!paused) { clearGaze(); draw(); } });
  stage.addEventListener('pointerup', event => { if (event.pointerType === 'touch') { clearGaze(); draw(); } });
  stage.addEventListener('pointercancel', () => { clearGaze(); draw(); });
  canvas.addEventListener('click', greet);
  canvas.addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); greet(); }
  });
  followToggle.addEventListener('change', () => { clearGaze(); draw(); });
  pauseButton.addEventListener('click', () => setPaused(!paused));
  speedSelect.addEventListener('change', () => { lastTime = null; });
  sizeRange.addEventListener('input', updateSize);
  new ResizeObserver(updateSize).observe(stage);
  retryButton.addEventListener('click', () => selectPet(selectedPet));
  $('#reset-button').addEventListener('click', () => {
    followToggle.checked = true;
    speedSelect.value = '1';
    sizeRange.value = '110';
    updateSize();
    setTheme('cream');
    chooseAction('idle');
    setPaused(reducedMotion.matches);
  });
  document.addEventListener('keydown', event => {
    if (event.code !== 'Space' || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.target.closest('input,select,textarea,button,a,[contenteditable="true"]')) return;
    event.preventDefault();
    setPaused(!paused);
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) startAnimation();
    else { if (frameRequest) cancelAnimationFrame(frameRequest); frameRequest = 0; lastTime = null; }
  });
  reducedMotion.addEventListener('change', event => { if (event.matches) setPaused(true); });

  if (matchMedia('(any-pointer: coarse)').matches) $('#stage-hint').textContent = '在空白处滑动，看看它的目光';
  if (!context) {
    loadingMessage.textContent = '当前浏览器不支持互动试玩，你仍可以下载宠物。';
    loadState.classList.add('load-error');
    return;
  }
  updateSize();
  setPaused(paused);
  selectPet(selectedPet);
  loadImage('ultra-instinct').catch(() => {});
})();
