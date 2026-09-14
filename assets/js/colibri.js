document.addEventListener('DOMContentLoaded', () => {
  const colibri = document.getElementById('colibri');
  if (!colibri) return;

  const SIZE = 80;
  const EDGE = 22;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let position = { x: window.innerWidth * 0.75, y: window.innerHeight * 0.25 };
  let animationFrame;
  let pauseTimer;

  colibri.style.backgroundImage = `url("${colibri.dataset.imageUrl}")`;

  function randomPoint() {
    return {
      x: EDGE + Math.random() * Math.max(1, window.innerWidth - SIZE - EDGE * 2),
      y: EDGE + Math.random() * Math.max(1, window.innerHeight - SIZE - EDGE * 2)
    };
  }

  // Elige texto visible en la ventana y usa su borde superior como una ramita.
  function textPerch() {
    const candidates = [...document.querySelectorAll(
      '.post_title, .post_content p, .post_content li, .post_content h2, .post_content h3, .page p, .archive_title'
    )].filter(element => {
      const rect = element.getBoundingClientRect();
      return rect.width > 80 && rect.top > SIZE && rect.top < window.innerHeight - 20;
    });

    if (!candidates.length) return null;
    const rect = candidates[Math.floor(Math.random() * candidates.length)].getBoundingClientRect();
    const availableWidth = Math.max(0, rect.width - SIZE);
    return {
      x: Math.max(EDGE, Math.min(window.innerWidth - SIZE - EDGE, rect.left + Math.random() * availableWidth)),
      y: Math.max(EDGE, rect.top - SIZE * 0.72)
    };
  }

  function draw(point, flip, resting = false) {
    colibri.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) scaleX(${flip})`;
    colibri.classList.toggle('is-resting', resting);
  }

  function flyTo(destination, shouldRest) {
    const origin = { ...position };
    const dx = destination.x - origin.x;
    const dy = destination.y - origin.y;
    const distance = Math.hypot(dx, dy);
    const duration = Math.min(4200, Math.max(1700, distance * 5));
    const startedAt = performance.now();
    const flip = dx >= 0 ? 1 : -1;

    function frame(now) {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 0.5 - Math.cos(progress * Math.PI) / 2;
      // La curva y el aleteo hacen que pueda viajar arriba, abajo, izquierda y derecha.
      const arc = Math.sin(progress * Math.PI) * Math.min(70, distance * 0.16);
      position = {
        x: origin.x + dx * eased,
        y: origin.y + dy * eased - arc + Math.sin(progress * Math.PI * 8) * 4
      };
      draw(position, flip);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(frame);
      } else if (shouldRest) {
        position = destination;
        rest(flip);
      } else {
        pauseTimer = window.setTimeout(nextFlight, 250 + Math.random() * 650);
      }
    }

    animationFrame = requestAnimationFrame(frame);
  }

  function rest(flip) {
    draw(position, flip, true);
    pauseTimer = window.setTimeout(() => {
      colibri.classList.remove('is-resting');
      nextFlight();
    }, 1800 + Math.random() * 2600);
  }

  function nextFlight() {
    const perch = Math.random() < 0.38 ? textPerch() : null;
    flyTo(perch || randomPoint(), Boolean(perch));
  }

  if (reducedMotion) {
    position = textPerch() || position;
    draw(position, 1, true);
  } else {
    draw(position, -1);
    nextFlight();
  }

  window.addEventListener('resize', () => {
    window.cancelAnimationFrame(animationFrame);
    window.clearTimeout(pauseTimer);
    position.x = Math.min(position.x, window.innerWidth - SIZE - EDGE);
    position.y = Math.min(position.y, window.innerHeight - SIZE - EDGE);
    if (reducedMotion) draw(position, 1, true);
    else nextFlight();
  });
});
