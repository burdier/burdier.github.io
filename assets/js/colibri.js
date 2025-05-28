document.addEventListener("DOMContentLoaded", () => {
  const colibri = document.getElementById('colibri');
  if (!colibri) return;

  const header = document.querySelector('header');
  const titles = Array.from(document.querySelectorAll('.post-title'));
  const flor = document.getElementById('flor-fondo');
  let currentIndex = 0;

  const BASE_SIZE = 80; // tamaño base en px
  const MIN_SCALE = 0.6;
  const MAX_SCALE = 1.5;
  const MAX_HEADER_DISTANCE = 600; // px

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

  // Para flip natural con duplicado pegado
  let flipDirection = 1; // 1 = derecha, -1 = izquierda

  // Crear colibrí espejo para suavizar flip
  let colibriCopy = colibri.cloneNode(true);
  colibriCopy.id = "colibri-copy";
  colibriCopy.style.position = 'fixed';
  colibriCopy.style.zIndex = '9998';
  colibriCopy.style.opacity = '0.6';
  colibriCopy.style.pointerEvents = 'none';
  document.body.appendChild(colibriCopy);

  const setPosition = (x, y, scale, direction) => {
    // Ajustamos posición y escala
    colibri.style.transform = `scaleX(${direction}) scale(${scale})`;
    colibri.style.left = `${x}px`;
    colibri.style.top = `${y}px`;

    // Colibri espejo pegado a la derecha (offset pequeño)
    const offsetX = 8 * direction;
    colibriCopy.style.transform = `scaleX(${-direction}) scale(${scale})`;
    colibriCopy.style.left = `${x + offsetX}px`;
    colibriCopy.style.top = `${y}px`;
  };

  // Escala según distancia vertical al header
  const getScaleByHeaderDistance = (y) => {
    const headerRect = header.getBoundingClientRect();
    const headerBottom = headerRect.bottom;
    const distance = Math.abs(y - headerBottom);
    const scale = MAX_SCALE - ((distance / MAX_HEADER_DISTANCE) * (MAX_SCALE - MIN_SCALE));
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
  };

  const flyTo = (x, y, duration = 5, callback) => {
    const rect = colibri.getBoundingClientRect();
    const currentX = rect.left;
    const currentY = rect.top;
    const direction = x < currentX ? -1 : 1;
    flipDirection = direction;

    const distanceY = y - currentY;
    // Zigzag: más tiempo arriba, poco abajo, simulando vuelo natural
    const midY = currentY + distanceY * 0.7 + (Math.sin(Math.random() * Math.PI * 2) * 20);

    // Calculamos escala inicial y final
    const startScale = getScaleByHeaderDistance(currentY);
    const endScale = getScaleByHeaderDistance(y);

    gsap.to({}, {
      duration,
      ease: "power1.inOut",
      onUpdate: function () {
        const progress = this.progress();
        // Interpolamos la posición X, y con zigzag vertical
        const currentPosX = currentX + (x - currentX) * progress;
        const currentPosY = progress < 0.7
          ? currentY + (midY - currentY) * (progress / 0.7)
          : midY + (y - midY) * ((progress - 0.7) / 0.3);
        // Interpolamos escala lineal
        const currentScale = startScale + (endScale - startScale) * progress;

        setPosition(currentPosX, currentPosY, currentScale, direction);
      },
      onComplete: () => {
        if (callback) setTimeout(callback, 1200);
      }
    });
  };

  const goToTitle = () => {
    if (currentIndex >= titles.length) {
      goToCenter();
      return;
    }
    const title = titles[currentIndex];
    const rect = title.getBoundingClientRect();

    // Posicionar colibri a la izquierda y un poco arriba del título (para que "se siente")
    let x = Math.max(10, rect.left - BASE_SIZE - 10);
    let y = rect.top + window.scrollY - BASE_SIZE / 2;

    // Limitar que no se salga del viewport verticalmente
    y = Math.min(window.innerHeight - BASE_SIZE - 10, Math.max(10, y));

    flyTo(x, y, 5, () => {
      currentIndex++;
      goToTitle();
    });
  };

  const goToCenter = () => {
    const x = centerX;
    const y = centerY;

    flyTo(x, y, 6, () => {
      goToFlor();
    });
  };

  const goToFlor = () => {
    const x = 10;
    const y = window.innerHeight - BASE_SIZE - 10;

    flyTo(x, y, 6, () => {
      currentIndex = 0;
      goToTitle();
    });
  };

  // Iniciar animación
  goToTitle();

  // Evitar que se creen duplicados
  window.addEventListener('beforeunload', () => {
    if (colibriCopy && colibriCopy.parentNode) {
      colibriCopy.parentNode.removeChild(colibriCopy);
    }
  });
});
