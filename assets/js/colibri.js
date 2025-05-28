document.addEventListener("DOMContentLoaded", () => {
  const colibri = document.getElementById('colibri');
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

    return {
      x: rect.left + scrollLeft + rect.width / 2 - 40, // centrar colibrí (80/2)
      y: rect.top + scrollTop - 60 // un poco arriba del título
    };
  }

  // Movimiento en zigzag entre puntos con curva senoidal en Y
  function moveColibriTo(targetPos) {
    const steps = 60; // cantidad de frames para la animación (~2.5s a 24fps)
    let step = 0;

    const startX = currentPos.x;
    const startY = currentPos.y;

    // Diferencia en X e Y
    const deltaX = targetPos.x - startX;
    const deltaY = targetPos.y - startY;

    // Determina si colibrí debe girar (mirar a la derecha o izquierda)
    const facingRight = deltaX >= 0;

    function animate() {
      step++;
      if (step > steps) {
        currentPos = targetPos;
        return;
      }

      // Progreso de 0 a 1
      const t = step / steps;

      // Movimiento X lineal
      const x = startX + deltaX * t;

      // Movimiento Y con curva senoidal (zigzag)
      // Oscila ±10px en Y, 3 ciclos durante el trayecto
      const amplitude = 10;
      const frequency = 3;
      const y = startY + deltaY * t + amplitude * Math.sin(frequency * Math.PI * t * 2);

      // Aplica transform con giro horizontal según dirección
      const scaleX = facingRight ? 1 : -1;

      colibri.style.transform = `translate(${x}px, ${y}px) scaleX(${scaleX})`;

      requestAnimationFrame(animate);
    }

    animate();
  }

  function startFlying() {
    const title = getRandomTitleElement();
    if (!title) return;

    const targetPos = getElementCenterPosition(title);

    if (isFirstMove) {
      // Si es la primera vez, coloca colibrí ahí sin animación
      currentPos = targetPos;
      colibri.style.transform = `translate(${currentPos.x}px, ${currentPos.y}px) scaleX(1)`;
      isFirstMove = false;
    } else {
      moveColibriTo(targetPos);
    }
  }

  setInterval(startFlying, 5000);
  startFlying();
});
