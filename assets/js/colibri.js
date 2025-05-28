document.addEventListener("DOMContentLoaded", () => {
  const colibri = document.getElementById('colibri');
  if (!colibri) return;

  const header = document.querySelector('header');
  const titles = Array.from(document.querySelectorAll('.post-title'));
  const flor = document.getElementById('flor-fondo');
  let currentIndex = 0;

  const BASE_SIZE = 80;   // Tamaño base
  const MAX_SIZE = 200;   // Tamaño máximo cerca del top
  const MIN_SCALE = 0.4;  // Escala mínima
  const MAX_SCALE = 1;    // Escala máxima (cuando tamaño = BASE_SIZE)

  const FOLLOW_RADIUS = 500; // Radio en px para seguir mouse

  colibri.style.position = 'fixed';
  colibri.style.zIndex = '9999';
  colibri.style.width = BASE_SIZE + 'px';
  colibri.style.height = BASE_SIZE + 'px';
  colibri.style.backgroundImage = "url('/assets/img/colibri.gif')";
  colibri.style.backgroundSize = 'cover';
  colibri.style.pointerEvents = 'none';
  colibri.style.transformOrigin = 'center center';
  colibri.style.transform = 'scaleX(1) scaleY(1)';
  colibri.style.top = '0px';
  colibri.style.left = '0px';

  let flipDirection = 1;

  // Colibri espejo para suavizar flip
  let colibriCopy = colibri.cloneNode(true);
  colibriCopy.id = "colibri-copy";
  colibriCopy.style.position = 'fixed';
  colibriCopy.style.zIndex = '9998';
  colibriCopy.style.opacity = '0.6';
  colibriCopy.style.pointerEvents = 'none';
  document.body.appendChild(colibriCopy);

  // Variables control mouse
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let lastMouseMoveTime = Date.now();
  let isFollowingMouse = false;
  let isAnimating = false;

  const centerX = window.innerWidth / 2 - BASE_SIZE / 2;
  const centerY = window.innerHeight / 2 - BASE_SIZE / 2;

  const setPosition = (x, y, size, direction) => {
    colibri.style.width = size + "px";
    colibri.style.height = size + "px";

    colibri.style.transform = `scaleX(${direction}) scaleY(1)`;
    colibri.style.left = `${x}px`;
    colibri.style.top = `${y}px`;

    // Offset pegado para copia, evitar efecto flip raro
    const offsetX = 8 * direction;
    colibriCopy.style.width = size + "px";
    colibriCopy.style.height = size + "px";
    colibriCopy.style.transform = `scaleX(${-direction}) scaleY(1)`;
    colibriCopy.style.left = `${x + offsetX}px`;
    colibriCopy.style.top = `${y}px`;
  };

  // Tamaño proporcional a distancia vertical desde top
  const getSizeByTopDistance = (y) => {
    // Si está cerca de top (y=0), tamaño MAX_SIZE
    // Si está más abajo (y=window.innerHeight), tamaño BASE_SIZE o menos
    // Interpolación lineal inversa
    const maxDistance = window.innerHeight;
    let size = MAX_SIZE - ((y / maxDistance) * (MAX_SIZE - BASE_SIZE));
    return Math.max(BASE_SIZE, Math.min(MAX_SIZE, size));
  };

  // Animación vuelo con zigzag (más tiempo arriba)
  const flyTo = (targetX, targetY, duration = 6, callback) => {
    isAnimating = true;

    const rect = colibri.getBoundingClientRect();
    const startX = rect.left;
    const startY = rect.top;
    const direction = targetX < startX ? -1 : 1;
    flipDirection = direction;

    const distanceY = targetY - startY;
    const midY = startY + distanceY * 0.7 + (Math.sin(Math.random() * Math.PI * 2) * 20);

    gsap.to({}, {
      duration,
      ease: "power1.inOut",
      onUpdate: function () {
        const progress = this.progress();

        const currentX = startX + (targetX - startX) * progress;
        const currentY = progress < 0.7
          ? startY + (midY - startY) * (progress / 0.7)
          : midY + (targetY - midY) * ((progress - 0.7) / 0.3);

        const size = getSizeByTopDistance(currentY);

        setPosition(currentX, currentY, size, direction);
      },
      onComplete: () => {
        isAnimating = false;
        if (callback) setTimeout(callback, 1500);
      }
    });
  };

  // Ciclo animación automática
  const goToTitle = () => {
    if (isAnimating) return; // No interrumpir si ya animando

    if (currentIndex >= titles.length) {
      goToCenter();
      return;
    }

    const title = titles[currentIndex];
    const rect = title.getBoundingClientRect();

    let x = Math.max(10, rect.left - MAX_SIZE - 10);
    let y = rect.top + window.scrollY - (MAX_SIZE / 2);
    y = Math.min(window.innerHeight - MAX_SIZE - 10, Math.max(10, y));

    flyTo(x, y, 6, () => {
      currentIndex++;
      goToTitle();
    });
  };

  const goToCenter = () => {
    if (isAnimating) return;

    flyTo(centerX, centerY, 7, () => {
      goToFlor();
    });
  };

  const goToFlor = () => {
    if (isAnimating) return;

    const x = 10;
    const y = window.innerHeight - MAX_SIZE - 10;

    flyTo(x, y, 7, () => {
      currentIndex = 0;
      goToTitle();
    });
  };

  // Función que mueve el colibri suavemente hacia el mouse dentro del radio
  const followMouse = () => {
    if (isAnimating) return;

    const rect = colibri.getBoundingClientRect();
    const colibriX = rect.left + rect.width / 2;
    const colibriY = rect.top + rect.height / 2;

    const dx = mouseX - colibriX;
    const dy = mouseY - colibriY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < FOLLOW_RADIUS) {
      // Lerp para movimiento suave (0.05 = velocidad)
      const newX = rect.left + dx * 0.05;
      const newY = rect.top + dy * 0.05;

      const size = getSizeByTopDistance(newY);

      // Dirección según el movimiento horizontal
      const direction = dx < 0 ? -1 : 1;
      flipDirection = direction;

      setPosition(newX, newY, size, direction);
      isFollowingMouse = true;
    } else {
      isFollowingMouse = false;
    }
  };

  // Detectar movimiento mouse
  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    lastMouseMoveTime = Date.now();
  });

  // Loop principal
  const mainLoop = () => {
    // Si hace más de 3s que no se mueve mouse, desactivar seguimiento
    const idle = Date.now() - lastMouseMoveTime > 3000;

    if (!isAnimating && !idle) {
      followMouse();
    } else if (!isAnimating && idle) {
      // Reiniciar ciclo animado si está idle
      if (!isAnimating) {
        goToTitle();
      }
    }
    requestAnimationFrame(mainLoop);
  };

  // Iniciar ciclo automático
  goToTitle();
  mainLoop();

  // Evitar duplicados
  window.addEventListener('beforeunload', () => {
    if (colibriCopy && colibriCopy.parentNode) {
      colibriCopy.parentNode.removeChild(colibriCopy);
    }
  });
});
