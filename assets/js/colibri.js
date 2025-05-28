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
    const currentX = parseFloat(colibri.style.left) || 0;
    const currentY = parseFloat(colibri.style.top) || 0;
    const direction = x < currentX ? -1 : 1;
    flipDirection = direction;

    // Calculamos trayectoria con curva suave
    const controlY = currentY - 100;
    const progressY = (t) => {
      return currentY + (y - currentY) * t;
    };

    // Animación principal con GSAP
    gsap.to(colibri, {
      duration,
      left: x + 'px',
      top: {
        value: y + 'px',
        ease: "sine.inOut"
      },
      ease: "power1.inOut",
      onUpdate: function() {
        // Ajuste de escala durante el vuelo
        const currentYPos = parseFloat(colibri.style.top);
        const scale = getScaleByHeaderDistance(currentYPos);
        colibri.style.transform = `scaleX(${direction}) scale(${scale})`;
      },
      onComplete: () => {
        if (callback) setTimeout(callback, 800);
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
    const x = Math.max(10, rect.left - BASE_SIZE - 10);
    const y = Math.min(
      window.innerHeight - BASE_SIZE - 10, 
      Math.max(10, rect.top + window.scrollY - BASE_SIZE/2)
    );

    flyTo(x, y, 2, () => {
      currentIndex++;
      goToTitle();
    });
  };

  const goToCenter = () => {
    flyTo(centerX, centerY, 3, () => {
      goToFlor();
    });
  };

  const goToFlor = () => {
    const x = 10;
    const y = window.innerHeight - BASE_SIZE - 10;
    
    flyTo(x, y, 3, () => {
      currentIndex = 0;
      setTimeout(goToTitle, 1500);
    });
  };

  // Iniciar animación
  goToTitle();

  // Ajustar posición central al redimensionar
  window.addEventListener('resize', () => {
    centerX = window.innerWidth / 2 - 40;
    centerY = window.innerHeight / 2 - 40;
  });
});