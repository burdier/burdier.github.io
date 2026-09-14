document.addEventListener("DOMContentLoaded", () => {
  const colibri = document.getElementById('colibri');
  if (!colibri) return;

  const BASE_SIZE = 80;
  const MIN_SCALE = 0.6;
  const MAX_SCALE = 1.8;

  // Parámetros de la oscilación
  const Ax = 200; // amplitud en X (pixeles)
  const Ay = 120; // amplitud en Y (pixeles)

  const omegaX = 0.7; // frecuencia angular en X (rad/s)
  const omegaY = 1.1; // frecuencia angular en Y (rad/s)

  const phiX = Math.random() * 2 * Math.PI; // fase inicial aleatoria
  const phiY = Math.random() * 2 * Math.PI;

  // Margen para que el colibrí no salga de la pantalla
  const margin = 150;

  // Posición base inicial (centro pantalla)
  let baseX = window.innerWidth / 2;
  let baseY = window.innerHeight / 2;

  // Punto objetivo inicial
  let targetX = getRandomX();
  let targetY = getRandomY();

  // Velocidad de movimiento hacia objetivo (pixeles por segundo)
  const moveSpeed = 100; 

  // Configuración inicial del colibrí
  colibri.style.position = 'fixed';
  colibri.style.zIndex = '9999';
  colibri.style.width = BASE_SIZE + 'px';
  colibri.style.height = BASE_SIZE + 'px';
  colibri.style.backgroundImage = "url('/assets/img/colibri.gif')";
  colibri.style.backgroundSize = 'cover';
  colibri.style.pointerEvents = 'none';
  colibri.style.transformOrigin = 'center center';

  let startTime = null;
  let lastFrameTime = null;

  function getRandomX() {
    return Math.random() * (window.innerWidth - 2 * margin) + margin;
  }

  function getRandomY() {
    return Math.random() * (window.innerHeight - 2 * margin) + margin;
  }

  function moveBase(deltaTime) {
    const dx = targetX - baseX;
    const dy = targetY - baseY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 5) {
      // Llegó cerca, elegir nuevo objetivo
      targetX = getRandomX();
      targetY = getRandomY();
    } else {
      // Mover base hacia target suavemente
      const moveDist = moveSpeed * deltaTime;
      if (moveDist >= dist) {
        baseX = targetX;
        baseY = targetY;
      } else {
        baseX += (dx / dist) * moveDist;
        baseY += (dy / dist) * moveDist;
      }
    }
  }

  function animate(time) {
    if (!startTime) startTime = time;
    if (!lastFrameTime) lastFrameTime = time;
    const t = (time - startTime) / 1000; // tiempo en segundos
    const deltaTime = (time - lastFrameTime) / 1000;
    lastFrameTime = time;

    // Mover la posición base hacia el objetivo
    moveBase(deltaTime);

    // Posición con oscilación respecto a la base
    const x = baseX + Ax * Math.sin(omegaX * t + phiX);
    const y = baseY + Ay * Math.cos(omegaY * t + phiY);

    // Escala según la altura (más alto = más grande)
    const scale = MIN_SCALE + ((Ay - (y - baseY)) / (2 * Ay)) * (MAX_SCALE - MIN_SCALE);

    // Dirección para flip horizontal según velocidad X instantánea
    const dx = Ax * omegaX * Math.cos(omegaX * t + phiX);
    const flip = dx >= 0 ? 1 : -1;

    colibri.style.left = `${x - (BASE_SIZE/2) * scale}px`;
    colibri.style.top = `${y - (BASE_SIZE/2) * scale}px`;
    colibri.style.transform = `scaleX(${flip}) scale(${scale.toFixed(3)})`;

    requestAnimationFrame(animate);
  }

  animate();

  // Actualizar márgenes al redimensionar ventana
  window.addEventListener('resize', () => {
    if (baseX > window.innerWidth - margin) baseX = window.innerWidth - margin;
    if (baseX < margin) baseX = margin;
    if (baseY > window.innerHeight - margin) baseY = window.innerHeight - margin;
    if (baseY < margin) baseY = margin;
    targetX = getRandomX();
    targetY = getRandomY();
  });
});
