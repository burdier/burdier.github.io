document.addEventListener("DOMContentLoaded", () => {
  const colibri = document.getElementById('colibri');
  if (!colibri) return;

  const header = document.querySelector('header');
  const titles = Array.from(document.querySelectorAll('.post-title'));
  const flor = document.getElementById('flor-fondo');
  let currentIndex = 0;
  let centerX = window.innerWidth / 2 - 40;
  let centerY = window.innerHeight / 2 - 40;

  // Configuración de tamaño y escala
  const BASE_SIZE = 80;
  const MIN_SCALE = 0.6;
  const MAX_SCALE = 1.5;
  const MAX_HEADER_DISTANCE = 600;

  // Rango para seguir mouse
  const FOLLOW_RADIUS = 200;

  // Estilos iniciales del colibrí principal
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

  // Variable de dirección
  let flipDirection = 1;

  // Variables para control de estado y posición del mouse
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let isAnimating = false;
  let followMouseEnabled = false;

  // Función para calcular escala basada en distancia al header
  const getScaleByHeaderDistance = (y) => {
    const headerRect = header?.getBoundingClientRect();
    if (!headerRect) return 1;

    const headerBottom = headerRect.bottom;
    const distance = Math.abs(y - headerBottom);
    const scale = MAX_SCALE - ((distance / MAX_HEADER_DISTANCE) * (MAX_SCALE - MIN_SCALE));
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
  };

  const flyTo = (x, y, duration = 3, callback) => {
    isAnimating = true;

    const currentX = parseFloat(colibri.style.left) || 0;
    const currentY = parseFloat(colibri.style.top) || 0;
    const direction = x < currentX ? -1 : 1;
    flipDirection = direction;

    // Animación principal con GSAP
    gsap.to(colibri, {
      duration,
      left: x + 'px',
      top: y + 'px',
      ease: "power1.inOut",
      onUpdate: function () {
        // Ajuste de escala durante el vuelo
        const currentYPos = parseFloat(colibri.style.top);
        const scale = getScaleByHeaderDistance(currentYPos);
        colibri.style.transform = `scaleX(${direction}) scale(${scale})`;
      },
      onComplete: () => {
        isAnimating = false;
        if (callback) setTimeout(callback, 800);
      }
    });
  };

  const goToTitle = () => {
    if (isAnimating) return; // No interrumpir animación en curso
    if (currentIndex >= titles.length) {
      goToCenter();
      return;
    }

    const title = titles[currentIndex];
    const rect = title.getBoundingClientRect();
    const x = Math.max(10, rect.left - BASE_SIZE - 10);
    const y = Math.min(
      window.innerHeight - BASE_SIZE - 10,
      Math.max(10, rect.top + window.scrollY - BASE_SIZE / 2)
    );

    flyTo(x, y, 2, () => {
      currentIndex++;
      goToTitle();
    });
  };

  const goToCenter = () => {
    if (isAnimating) return;
    flyTo(centerX, centerY, 3, () => {
      goToFlor();
    });
  };

  const goToFlor = () => {
    if (isAnimating) return;
    const x = 10;
    const y = window.innerHeight - BASE_SIZE - 10;

    flyTo(x, y, 3, () => {
      currentIndex = 0;
      setTimeout(goToTitle, 1500);
    });
  };

  // Función para seguir mouse suavemente si está dentro del radio
  const followMouse = () => {
    if (isAnimating) return;

    const rect = colibri.getBoundingClientRect();
    const colibriX = rect.left + rect.width / 2;
    const colibriY = rect.top + rect.height / 2;

    const dx = mouseX - colibriX;
    const dy = mouseY - colibriY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < FOLLOW_RADIUS) {
      // Mover suavemente hacia mouse
      let newX = rect.left + dx * 0.05;
      let newY = rect.top + dy * 0.05;

      // Limitar para que no se salga de ventana
      newX = Math.min(window.innerWidth - BASE_SIZE, Math.max(0, newX));
      newY = Math.min(window.innerHeight - BASE_SIZE, Math.max(0, newY));

      const direction = dx < 0 ? -1 : 1;
      flipDirection = direction;

      const scale = getScaleByHeaderDistance(newY);

      colibri.style.left = newX + 'px';
      colibri.style.top = newY + 'px';
      colibri.style.transform = `scaleX(${direction}) scale(${scale})`;

      followMouseEnabled = true;
    } else {
      followMouseEnabled = false;
    }
  };

  // Evento mousemove para actualizar posición del mouse
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // Loop para actualizar posición según mouse o animación
  function animationLoop() {
    if (!isAnimating) {
      followMouse();
      if (!followMouseEnabled) {
        // Si no sigue mouse, animación automática
        if (!isAnimating) {
          if (currentIndex >= titles.length) {
            goToCenter();
          } else {
            goToTitle();
          }
        }
      }
    }

    requestAnimationFrame(animationLoop);
  }

  // Inicializar ciclo
  goToTitle();
  animationLoop();

  // Ajustar posición central al redimensionar
  window.addEventListener('resize', () => {
    centerX = window.innerWidth / 2 - 40;
    centerY = window.innerHeight / 2 - 40;
  });
});
