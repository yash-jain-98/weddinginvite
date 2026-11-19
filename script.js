document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('.sa-root');
  const html = document.documentElement;
  const env = document.querySelector('.sa-env');
  const sealBtn = document.querySelector('.sa-env-seal');
  const logoCard = document.querySelector('.sa-logo');
  const audio = document.getElementById('bg-music');
  const audioToggle = document.getElementById('audio-toggle');
  const scratchContainer = document.querySelector('.sa-scratch');
  const scratchCanvas = document.querySelector('.sa-scratch-gold');

  html.setAttribute('data-sa-io', '');

  // ----------------------------------------------------
  // 1. Audio Handling
  // ----------------------------------------------------
  let isPlaying = false;

  function playAudio() {
    if (!audio) return;
    audio.play().then(() => {
      isPlaying = true;
      if (audioToggle) audioToggle.classList.add('playing');
    }).catch(err => {
      console.log('Audio autoplay prevented:', err);
    });
  }

  function toggleAudio() {
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      isPlaying = false;
      if (audioToggle) audioToggle.classList.remove('playing');
    } else {
      playAudio();
    }
  }

  if (audioToggle) {
    audioToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleAudio();
    });
  }

  // ----------------------------------------------------
  // 2. Envelope Opening Sequence
  // ----------------------------------------------------
  let isOpening = false;

  function openEnvelope() {
    if (isOpening) return;
    isOpening = true;

    // Start background music on user interaction
    playAudio();

    if (env) {
      env.setAttribute('data-state', 'opening');
    }
    if (root) {
      root.setAttribute('data-stage', 'opening');
    }

    // Step 2: Transition from Logo to Card
    setTimeout(() => {
      if (root) root.setAttribute('data-stage', 'leaving');
    }, 2700);

    // Step 3: Full Card view
    setTimeout(() => {
      html.setAttribute('data-sa-open', '');
      if (root) root.setAttribute('data-stage', 'card');
      initAmbientPetals();
    }, 3400);
  }

  if (sealBtn) {
    sealBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openEnvelope();
    });
  }

  if (env) {
    env.addEventListener('click', openEnvelope);
  }

  if (logoCard) {
    logoCard.addEventListener('click', () => {
      html.setAttribute('data-sa-open', '');
      if (root) root.setAttribute('data-stage', 'card');
    });
  }

  // ----------------------------------------------------
  // 3. Scroll Reveal (IntersectionObserver)
  // ----------------------------------------------------
  const revealElements = document.querySelectorAll('.sa-rv');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.setAttribute('data-seen', '');
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(el => observer.observe(el));

  // ----------------------------------------------------
  // 4. Scratch Card Canvas
  // ----------------------------------------------------
  if (scratchCanvas && scratchContainer) {
    const ctx = scratchCanvas.getContext('2d', { willReadFrequently: true });
    const rect = scratchCanvas.getBoundingClientRect();
    const width = (scratchCanvas.width = 253);
    const height = (scratchCanvas.height = 83);

    // Paint gold scratch foil
    function paintGold() {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#b98a2c');
      grad.addColorStop(0.25, '#e2c063');
      grad.addColorStop(0.5, '#c99d3b');
      grad.addColorStop(0.75, '#e7c96d');
      grad.addColorStop(1, '#b07f25');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Gold shimmer border
      ctx.strokeStyle = 'rgba(255, 245, 210, 0.6)';
      ctx.lineWidth = 3;
      ctx.strokeRect(2, 2, width - 4, height - 4);

      // Calligraphy hint text
      ctx.font = 'bold 22px "Great Vibes", cursive';
      ctx.fillStyle = '#7a1f14';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Scratch here', width / 2, height / 2);

      scratchContainer.setAttribute('data-painted', '');
    }

    paintGold();

    let isScratching = false;
    let scratchedPixels = 0;
    const totalPixels = width * height;

    function getCoords(e) {
      const b = scratchCanvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: (clientX - b.left) * (width / b.width),
        y: (clientY - b.top) * (height / b.height)
      };
    }

    function scratch(e) {
      if (!isScratching) return;
      const { x, y } = getCoords(e);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 16, 0, Math.PI * 2);
      ctx.fill();

      scratchedPixels += 250;
      if (scratchedPixels / totalPixels > 0.35) {
        completeScratch();
      }
    }

    function completeScratch() {
      scratchContainer.setAttribute('data-state', 'done');
      triggerConfetti(scratchContainer);
    }

    scratchCanvas.addEventListener('mousedown', (e) => {
      isScratching = true;
      scratch(e);
    });
    window.addEventListener('mouseup', () => (isScratching = false));
    scratchCanvas.addEventListener('mousemove', scratch);

    scratchCanvas.addEventListener('touchstart', (e) => {
      isScratching = true;
      scratch(e);
    }, { passive: true });
    window.addEventListener('touchend', () => (isScratching = false));
    scratchCanvas.addEventListener('touchmove', scratch, { passive: true });

    // Fallback: Click to reveal
    scratchContainer.addEventListener('click', () => {
      if (scratchContainer.getAttribute('data-state') !== 'done') {
        completeScratch();
      }
    });
  }

  // ----------------------------------------------------
  // 5. Confetti Sprinkle
  // ----------------------------------------------------
  function triggerConfetti(parent) {
    const sprinkle = document.createElement('div');
    sprinkle.className = 'sa-at sa-sprinkle';
    sprinkle.style.cssText = '--x: 85; --y: 980; --w: 206;';

    const colors = ['#b20e00', '#d4af37', '#e2c063', '#6c2118', '#f8bbd0', '#ffd54f'];

    for (let i = 0; i < 24; i++) {
      const span = document.createElement('span');
      const inner = document.createElement('span');
      const icon = document.createElement('i');

      const angle = (Math.PI * 2 * i) / 24;
      const dist = 60 + Math.random() * 50;
      const dx = Math.cos(angle) * dist;
      const up = -40 - Math.random() * 40;
      const fall = 70 + Math.random() * 40;
      const dur = (0.7 + Math.random() * 0.5) + 's';
      const dl = (Math.random() * 0.1) + 's';
      const rot = (Math.random() * 720 - 360) + 'deg';
      const color = colors[i % colors.length];

      span.style.cssText = `--dx:${dx};--dur:${dur};--dl:${dl};`;
      inner.style.cssText = `--up:${up};--fall:${fall};--dur:${dur};--dl:${dl};`;
      icon.style.cssText = `--w:${6 + Math.random() * 5};--rot:${rot};--dur:${dur};--dl:${dl};background:${color};border-radius:${Math.random() > 0.5 ? '50%' : '2px'};`;

      inner.appendChild(icon);
      span.appendChild(inner);
      sprinkle.appendChild(span);
    }

    parent.appendChild(sprinkle);
    setTimeout(() => sprinkle.remove(), 2000);
  }

  // ----------------------------------------------------
  // 6. Live Countdown Timer (Target: Nov 12, 2027 11:30 AM)
  // ----------------------------------------------------
  const targetDate = new Date('2027-11-12T11:30:00+05:30').getTime();

  function updateCountdown() {
    const now = new Date().getTime();
    const diff = Math.max(0, targetDate - now);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const elDays = document.getElementById('count-days');
    const elHours = document.getElementById('count-hours');
    const elMinutes = document.getElementById('count-minutes');
    const elSeconds = document.getElementById('count-seconds');

    if (elDays) elDays.textContent = String(days);
    if (elHours) elHours.textContent = String(hours).padStart(2, '0');
    if (elMinutes) elMinutes.textContent = String(minutes).padStart(2, '0');
    if (elSeconds) elSeconds.textContent = String(seconds).padStart(2, '0');
  }

  setInterval(updateCountdown, 1000);
  updateCountdown();

  // ----------------------------------------------------
  // 7. Ambient Petals Generator
  // ----------------------------------------------------
  function initAmbientPetals() {
    const col = document.querySelector('.sa-ambient-col');
    if (!col || col.children.length > 0) return;

    // SVG petals with delicate watercolor curves
    const petalSvgs = [
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 40"><path d="M15,0 C25,12 28,28 15,38 C2,28 5,12 15,0 Z" fill="%23e87a7a" opacity="0.85"/></svg>',
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 40"><path d="M15,0 C27,10 26,26 15,36 C4,26 3,10 15,0 Z" fill="%23d64b4b" opacity="0.8"/></svg>',
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 35"><path d="M12,0 C22,8 24,24 12,32 C0,24 2,8 12,0 Z" fill="%23f2b705" opacity="0.85"/></svg>',
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 35"><path d="M12,0 C24,10 20,26 12,34 C4,26 0,10 12,0 Z" fill="%236e9c56" opacity="0.75"/></svg>'
    ];

    for (let i = 0; i < 14; i++) {
      const amb = document.createElement('div');
      amb.className = 'sa-amb';
      const left = Math.random() * 375;
      const dx = (Math.random() - 0.5) * 80;
      const t = (6 + Math.random() * 6) + 's';
      const d = (Math.random() * 8) + 's';
      const t2 = (1.5 + Math.random() * 1.5) + 's';
      const w = 9 + Math.random() * 8;
      const svg = petalSvgs[i % petalSvgs.length];

      amb.style.left = `${left}px`;
      amb.style.cssText += `--dx:${dx};--t:${t};--d:${d};--t2:${t2};--w:${w};`;

      const icon = document.createElement('i');
      icon.style.backgroundImage = `url("${svg}")`;
      amb.appendChild(icon);
      col.appendChild(amb);
    }
  }
});
