document.addEventListener("DOMContentLoaded", () => {
  const colibri = document.getElementById('colibri');
  let currentPos = { x: 0, y: 0 };
  let isFirstMove = true;
  const colibriWidth = 80;
  const colibriHeight = 80;

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

  // Posición fija de la esquina inferior izquierda (donde está la flor)
  function getCornerPosition() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    return {
      x: scrollLeft + 20,                          // margen 20px desde la izquierda
      y: scrollTop + viewportHeight - colibriHeight - 20 // margen 20px desde abajo
    };
  }

  function moveColibriTo(targetPos, callback) {
    const steps = 60;
    let step = 0;

    const startX = currentPos.x;
    const startY = currentPos.y;

    const deltaX = targetPos.x - startX;
    const deltaY = targetPos.y - startY;

    const facingRight = deltaX >= 0;
    const amplitude = 10;

    function animate() {
      step++;
      if (step > steps) {
        currentPos = targetPos;
        if (callback) callback();
        return;
      }

      const t = step / steps;

      const x = startX + deltaX * t;
      let y = startY + deltaY * t + amplitude * Math.sin(3 * Math.PI * t * 2);

      // Limitar Y dentro viewport vertical
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
  }

  // Ciclo: título → esquina inferior izquierda → otro título → ...
  function flightCycle() {
    const titles = Array.from(document.querySelectorAll('h1, h2, h3'));
    if (titles.length === 0) return;

    // Primer destino: un título random
    let targetTitle = titles[Math.floor(Math.random() * titles.length)];
    let targetPos = getElementCenterPosition(targetTitle);

    // Si es la primera vez, posicionar sin animar
    if (isFirstMove) {
      currentPos = targetPos;
      colibri.style.transform = `translate(${currentPos.x}px, ${currentPos.y}px) scaleX(1)`;
      isFirstMove = false;

      // Después de 3s, inicia el ciclo completo
      setTimeout(flightCycle, 3000);
      return;
    }

    // Mover al título
    moveColibriTo(targetPos, () => {
      // Esperar 3 segundos posado
      setTimeout(() => {
        // Luego volar a la esquina inferior izquierda (flor)
        const cornerPos = getCornerPosition();
        moveColibriTo(cornerPos, () => {
          // Esperar 3 segundos posado en la flor
          setTimeout(() => {
            // Volar a otro título distinto al actual
            let nextTitle;
            do {
              nextTitle = titles[Math.floor(Math.random() * titles.length)];
            } while (nextTitle === targetTitle && titles.length > 1);

            const nextPos = getElementCenterPosition(nextTitle);
            moveColibriTo(nextPos, () => {
              // Repetir ciclo
              setTimeout(flightCycle, 3000);
            });
          }, 3000);
        });
      }, 3000);
    });
  }

  flightCycle();
});
