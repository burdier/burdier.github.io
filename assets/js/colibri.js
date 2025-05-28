document.addEventListener("DOMContentLoaded", () => {
  const colibri = document.getElementById('colibri');
  if (!colibri) return;

  const header = document.querySelector('header');
  const titles = Array.from(document.querySelectorAll('.post-title'));
  let currentIndex = 0;
  let centerX = window.innerWidth / 2 - 40;
  let centerY = window.innerHeight / 2 - 40;

  const BASE_SIZE = 80;
  const MIN_SCALE = 0.6;
  const MAX_SCALE = 1.5;
  const MAX_HEADER_DISTANCE = 600;
  const FOLLOW_RADIUS = 200;

  colibri.style.position = 'fixed';
  colibri.style.zIndex = '9999';
  colibri.style.width = BASE_SIZE + 'px';
  colibri.style.height = BASE_SIZE + 'px';
  colibri.style.backgroundImage = "url('/assets/img/colibri.gif')";
  colibri.style.backgroundSize = 'cover';
  colibri.style.pointerEvents = 'none';
  colibri.style.transformOrigin = 'center center';
  colibri.style.transform = 'scaleX(1)';
  colibri.style.top = '0px';
  colibri.style.left = '0px';

  let flipDirection = 1;
  let isAnimating = false;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;

  // Estado para controlar ciclos seguir mouse / random
  let followMode = true;

  // Función para escala según distancia al header
  const getScaleByHeaderDistance = (y) => {
    const headerRect = header?.getBoundingClientRect();
    if (!headerRect) return 1;
    const headerBottom = headerRect.bottom;
    const distance = Math.abs(y - headerBottom);
    const scale = MAX_SCALE - ((distance / MAX_HEADER_DISTANCE) * (MAX_SCALE - MIN_SCALE));
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
  };

  // Movimiento suave hacia punto (x,y)
  const moveSmoothlyTo = (targetX, targetY) => {
    const rect = colibri.getBoundingClientRect();
    let currentX = rect.left;
    let currentY = rect.top;

    let dx = targetX - currentX;
    let dy = targetY - currentY;

    // Limitar movimiento suave con factor (más chico = más lento)
    const factor = 0.07;

    let newX = currentX + dx * factor;
    let newY = currentY + dy * factor;

    // Limitar dentro ventana
    newX = Math.min(window.innerWidth - BASE_SIZE, Math.max(0, newX));
    newY = Math.min(window.innerHeight - BASE_SIZE, Math.max(0, newY));

    flipDirection = dx < 0 ? -1 : 1;

    const scale = getScaleByHeaderDistance(newY);

    colibri.style.left = newX + 'px';
    colibri.style.top = newY + 'px';
    colibri.style.transform = `scaleX(${flipDirection}) scale(${scale})`;
  };

  // Movimiento random suave para un tiempo random
  const randomMovement = () => {
    isAnimating = true;

    // Generar un punto random dentro de ventana, con margen para que no salga
    const targetX = Math.random() * (window.innerWidth - BASE_SIZE);
    const targetY = Math.random() * (window.innerHeight - BASE_SIZE);

    // Duración random entre 1.5 y 3 segundos
    const duration = 1.5 + Math.random() * 1.5;

    return new Promise((resolve) => {
      gsap.to(colibri, {
        duration,
        left: targetX,
        top: targetY,
        ease: "power1.inOut",
        onUpdate: () => {
          const currentX = parseFloat(colibri.style.left);
          const currentY = parseFloat(colibri.style.top);
          flipDirection = (targetX < currentX) ? -1 : 1;
          const scale = getScaleByHeaderDistance(currentY);
          colibri.style.transform = `scaleX(${flipDirection}) scale(${scale})`;
        },
        onComplete: () => {
          isAnimating = false;
          resolve();
        }
      });
    });
  };

  // Ciclo principal de alternar entre seguir mouse y movimiento random
  const mainLoop = async () => {
    while (true) {
      followMode = true;
      // Seguir mouse 3 segundos
      const followStart = performance.now();
      while (performance.now() - followStart < 3000) {
        if (!isAnimating) {
          // Solo seguir mouse si está dentro radio
          const rect = colibri.getBoundingClientRect();
          const colibriX = rect.left + rect.width / 2;
          const colibriY = rect.top + rect.height / 2;

          const dx = mouseX - colibriX;
          const dy = mouseY - colibriY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < FOLLOW_RADIUS) {
            moveSmoothlyTo(mouseX - BASE_SIZE / 2, mouseY - BASE_SIZE / 2);
          }
        }
        await new Promise(r => setTimeout(r, 16)); // ~60fps
      }

      followMode = false;
      // Movimiento random por un tiempo aleatorio entre 2 y 4 segundos
      await randomMovement();

      // Pausa entre movimientos random y volver a seguir mouse (0.5-1.5s)
      await new Promise(r => setTimeout(r, 500 + Math.random() * 1000));
    }
  };

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // Iniciar en centro
  colibri.style.left = centerX + 'px';
  colibri.style.top = centerY + 'px';

  mainLoop();

  window.addEventListener('resize', () => {
    centerX = window.innerWidth / 2 - 40;
    centerY = window.innerHeight / 2 - 40;
  });
});
