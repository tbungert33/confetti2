(function () {
  const svgNamespace = "http://www.w3.org/2000/svg";

  /** @type {SVGSVGElement | null} */
  const confettiSvg = document.getElementById("confetti");
  /** @type {HTMLButtonElement | null} */
  const button = document.getElementById("confettiButton");

  if (!confettiSvg || !button) return;

  /** Active confetti pieces */
  /** @type {Array<{el: SVGCircleElement, x: number, y: number, vx: number, vy: number, spin: number, angle: number, r: number, life: number, ttl: number}>>} */
  const pieces = [];

  const GRAVITY = 1800; // px/s^2
  const AIR_DRAG = 1.8; // higher -> more drag
  const SPIN_MIN = -540; // deg/s
  const SPIN_MAX = 540;  // deg/s

  const colors = [
    // Blues
    "#1e3a8a", "#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd",
    // Greens
    "#065f46", "#047857", "#059669", "#10b981", "#34d399", "#6ee7b7"
  ];

  button.addEventListener("click", () => {
    const rect = button.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;
    spawnConfetti({ x: originX, y: originY, count: 140 });
  });

  /**
   * @param {{ x: number; y: number; count?: number }} options
   */
  function spawnConfetti(options) {
    const count = Math.max(20, Math.min(options.count || 100, 500));
    for (let i = 0; i < count; i++) {
      const circle = document.createElementNS(svgNamespace, "circle");
      const radius = randomInRange(3, 6);
      circle.setAttribute("r", String(radius));
      circle.setAttribute("cx", "0");
      circle.setAttribute("cy", "0");
      circle.setAttribute("fill", colors[(Math.random() * colors.length) | 0]);
      circle.setAttribute("class", "piece");

      const angleDeg = -90 + randomInRange(-18, 18);
      const angle = (angleDeg * Math.PI) / 180;
      const speed = randomInRange(900, 1400); // initial burst
      const vx = Math.cos(angle) * speed + randomSigned(randomInRange(0, 60));
      const vy = Math.sin(angle) * speed; // negative is upwards

      const piece = {
        el: circle,
        x: options.x,
        y: options.y,
        vx: vx,
        vy: vy,
        spin: randomInRange(SPIN_MIN, SPIN_MAX),
        angle: randomInRange(0, 360),
        r: radius,
        life: 0,
        ttl: randomInRange(2.8, 4.2) // seconds
      };

      pieces.push(piece);
      confettiSvg.appendChild(circle);
    }
    startAnimating();
  }

  let animating = false;
  let lastTs = 0;
  function startAnimating() {
    if (animating) return;
    animating = true;
    lastTs = performance.now();
    requestAnimationFrame(tick);
  }

  function tick(now) {
    const dt = Math.min(0.032, Math.max(0.001, (now - lastTs) / 1000));
    lastTs = now;

    for (let i = pieces.length - 1; i >= 0; i--) {
      const p = pieces[i];
      p.life += dt;

      // Air drag (approximate exponential decay)
      const dragFactor = Math.exp(-AIR_DRAG * dt);
      p.vx *= dragFactor;
      p.vy = p.vy * dragFactor + GRAVITY * dt;

      // Integrate position
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Spin
      p.angle += p.spin * dt;

      // Apply CSS transform in pixels
      p.el.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px) rotate(' + p.angle + 'deg)';

      // Fade out near end of life
      if (p.life > p.ttl - 0.6) {
        const t = Math.max(0, Math.min(1, (p.ttl - p.life) / 0.6));
        p.el.style.opacity = String(t);
      }

      // Cull when off-screen or time-to-live exceeded
      if (p.life > p.ttl || p.y - p.r > window.innerHeight + 80) {
        if (p.el.parentNode === confettiSvg) confettiSvg.removeChild(p.el);
        pieces.splice(i, 1);
      }
    }

    if (pieces.length > 0) {
      requestAnimationFrame(tick);
    } else {
      animating = false;
    }
  }

  function randomInRange(min, max) { return Math.random() * (max - min) + min; }
  function randomSigned(value) { return Math.random() < 0.5 ? -value : value; }
})();
