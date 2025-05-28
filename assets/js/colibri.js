document.addEventListener("DOMContentLoaded", () => {
  const colibri = document.getElementById('colibri');
  const colibriWidth = 80;
  const colibriHeight = 80;
  let currentPos = { x: 0, y: 0 };
  let isFirstMove = true;

  function getRandomTitlePosition() {
    const titles = Array.from(document.querySelectorAll('h1, h2, h3'));
    if (titles.length === 0) return getCenterOfViewport();

    const title = titles[Math.floor(Math.random() * titles.length)];
    const rect = title.getBoundingClientRect();

    const x = Math.min(
      window.innerWidth - colibriWidth,
      Math.max(0, rect.left + rect.width / 2 - colibriWidth / 2)
    );
    const y = Math.min(
      window.innerHeight - colibriHeight - 20,
      Math.max(0, rect.top - colibriHeight - 10)
    );

    return { x, y };
  }

  function getCenterOfViewport() {
    return {
      x: window.innerWidth / 2 - colibriWidth / 2,
      y: window.innerHeight / 2 - colibriHeight / 2
    };
  }

  function getCornerPosition() {
    return {
      x: 20,
      y: window.innerHeight - colibriHeight - 20
    };
  }

  function moveColibriTo(targetPos, callback) {
    const steps = 90;
    let step = 0;

    const startX = currentPos.x;
    const startY = currentPos.y;

    const deltaX = targetPos.x - startX;
    const deltaY = targetPos.y - startY;

    const facingRight = deltaX >= 0;
    colibri.style.transition = 'transform 0.3s ease';
    colibri.style.transform = `translate(${startX}px, ${startY}px) scaleX(${facingRight ? 1 : -1})`;

    setTimeout(() => {
      colibri.style.transition = '';

      function animate() {
        step++;
        if (step > steps) {
          currentPos = targetPos;
          if (callback) callback();
          return;
        }

        const t = step / steps;
        const amplitude = 12;
        const x = startX + deltaX * t;
        let y = startY + deltaY * t + amplitude * Math.sin(6 * Math.PI * t);

        // Clamping para evitar salir del viewport
        const clampedX = Math.min(window.innerWidth - colibriWidth, Math.max(0, x));
        const clampedY = Math.min(window.innerHeight - colibriHeight, Math.max(0, y));

        colibri.style.transform = `translate(${clampedX}px, ${clampedY}px) scaleX(${facingRight ? 1 : -1})`;
        requestAnimationFrame(animate);
      }

      animate();
    }, 300);
  }

  function flightCycle() {
    const nextPos = isFirstMove ? getCenterOfViewport() :
      (Math.random() > 0.5 ? getCornerPosition() : getRandomTitlePosition());

    moveColibriTo(nextPos, () => {
      setTimeout(flightCycle, 3000);
    });

    isFirstMove = false;
  }

  // Inicializar
  const initPos = getCenterOfViewport();
  currentPos = initPos;
  colibri.style.transform = `translate(${initPos.x}px, ${initPos.y}px) scaleX(1)`;
  setTimeout(flightCycle, 2000);
});
