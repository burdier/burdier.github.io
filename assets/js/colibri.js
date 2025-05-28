document.addEventListener("DOMContentLoaded", () => {
  const colibri = document.getElementById('colibri');
  const colibriWidth = 80;
  const colibriHeight = 80;
  let currentPos = { x: 0, y: 0 };
  let isFirstMove = true;

  function getRandomTitleElement() {
    const titles = Array.from(document.querySelectorAll('h1, h2, h3'));
    if (titles.length === 0) return null;
    return titles[Math.floor(Math.random() * titles.length)];
  }

  function getElementCenterPosition(el) {
    const rect = el.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    let x = rect.left + scrollLeft + rect.width / 2 - colibriWidth / 2;
    let y = rect.top + scrollTop - colibriHeight - 10;

    // Limitar para que no salga del viewport visible
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const maxX = scrollLeft + viewportWidth - colibriWidth;
    const maxY = scrollTop + viewportHeight - colibriHeight;

    if (x < scrollLeft) x = scrollLeft;
    else if (x > maxX) x = maxX;

    if (y < scrollTop) y = scrollTop;
    else if (y > maxY) y = maxY;

    return { x, y };
  }

  function getCenterOfViewport() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    return {
      x: scrollLeft + viewportWidth / 2 - colibriWidth / 2,
      y: scrollTop + viewportHeight / 2 - colibriHeight / 2
    };
  }

  function getCornerPosition() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    return {
      x: scrollLeft + 20,
      y: scrollTop + viewportHeight - colibriHeight - 20
    };
  }

  function moveColibriTo(targetPos, callback) {
    const steps = 90; // vuelo un poco más lento
    let step = 0;

    const startX = currentPos.x;
    const startY = currentPos.y;

    const deltaX = targetPos.x - startX;
    const deltaY = targetPos.y - startY;

    const facingRight = deltaX >= 0;

    // El colibrí gira hacia el destino antes de moverse
    colibri.style.transition = 'transform 0.3s ease';
    colibri.style.transform = `translate(${startX}px, ${startY}px) scaleX(${facingRight ? 1 : -1})`;

    setTimeout(() => {
      colibri.style.transition = ''; // quitar transición para animación frame a frame

      const amplitude = 15; // más pronunciado zigzag vertical

      function animate() {
        step++;
        if (step > steps) {
          currentPos = targetPos;
          if (callback) callback();
          return;
        }

        const t = step / steps;

        const x = startX + deltaX * t;
        // Zigzag vertical con seno, frecuencia y amplitud
        let y = startY + deltaY * t + amplitude * Math.sin(6 * Math.PI * t);

        // Limitar dentro del viewport vertical
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const viewportHeight = window.innerHeight;
        const minY = scrollTop;
        const maxY = scrollTop + viewportHeight - colibriHeight;
        if (y < minY) y = minY;
        else if (y > maxY) y = maxY;

        colibri.style.transform = `translate(${x}px, ${y}px) scaleX(${facingRight ? 1 : -1})`;

        requestAnimationFrame(animate);
      }

      animate();
    }, 300);
  }

  function flightCycle() {
    const titles = Array.from(document.querySelectorAll('h1, h2, h3'));
    if (titles.length === 0) return;

    if (isFirstMove) {
      // Primera posición al centro del viewport, escala 1 mirando a la derecha
      currentPos = getCenterOfViewport();
      colibri.style.transform = `translate(${currentPos.x}px, ${currentPos.y}px) scaleX(1)`;
      isFirstMove = false;
      setTimeout(flightCycle, 3000);
      return;
    }

    // Elegir un título random
    let targetTitle = titles[Math.floor(Math.random() * titles.length)];
    let targetPos = getElementCenterPosition(targetTitle);

    // Mover al título
    moveColibriTo(targetPos, () => {
      setTimeout(() => {
        // Luego a la esquina inferior izquierda (flor)
        const cornerPos = getCornerPosition();
        moveColibriTo(cornerPos, () => {
          setTimeout(() => {
            // Volar a otro título distinto
            let nextTitle;
            do {
              nextTitle = titles[Math.floor(Math.random() * titles.length)];
            } while (nextTitle === targetTitle && titles.length > 1);

            const nextPos = getElementCenterPosition(nextTitle);
            moveColibriTo(nextPos, () => {
              setTimeout(flightCycle, 3000);
            });
          }, 3000);
        });
      }, 3000);
    });
  }

  flightCycle();

  // Ajustar posición si se hace scroll o resize
  window.addEventListener('scroll', () => {
    // Opcional: actualizar currentPos para que no se pierda el colibri
  });
  window.addEventListener('resize', () => {
    // Opcional: ajustar posición actual para que no se pierda
  });
});
