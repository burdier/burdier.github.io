document.addEventListener("DOMContentLoaded", () => {
  const colibri = document.getElementById('colibri');
  if (!colibri) return;

  // Crear clon para el efecto flip pegadito
  const colibriClone = colibri.cloneNode(true);
  colibriClone.style.position = 'fixed';
  colibriClone.style.top = '0';
  colibriClone.style.left = '0';
  colibriClone.style.pointerEvents = 'none';
  colibriClone.style.zIndex = '9998';
  colibri.parentNode.appendChild(colibriClone);

  const titles = Array.from(document.querySelectorAll('.post-title'));
  let currentIndex = 0;
  const centerX = window.innerWidth / 2 - 40; // Ajustado para tamaño base
  const centerY = window.innerHeight / 2 - 40;

  // Tamaño base del colibri
  const baseWidth = 80;
  const baseHeight = 80;

  // Configuración inicial colibri
  [colibri, colibriClone].forEach(el => {
    el.style.position = 'fixed';
    el.style.zIndex = el === colibri ? '9999' : '9998';
    el.style.width = baseWidth + 'px';
    el.style.height = baseHeight + 'px';
    el.style.backgroundImage = "url('/assets/img/colibri.gif')";
    el.style.backgroundSize = 'contain';
    el.style.backgroundRepeat = 'no-repeat';
    el.style.pointerEvents = 'none';
    el.style.transformOrigin = 'center center';
  });

  // Sincronizar clon con colibri
  function updateClone() {
    const rect = colibri.getBoundingClientRect();
    colibriClone.style.transform = colibri.style.transform;
    colibriClone.style.left = rect.left + 'px';
    colibriClone.style.top = rect.top + 'px';
    colibriClone.style.width = rect.width + 'px';
    colibriClone.style.height = rect.height + 'px';
  }

  const flyTo = (x, y, callback) => {
    const rect = colibri.getBoundingClientRect();
    const currentX = rect.left;
    const currentY = rect.top;
    const direction = x < currentX ? -1 : 1;

    // Calcular distancia al centro para escala (min 0.6, max 1.3)
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const scale = Math.min(1.3, Math.max(0.6, 1.3 - distance / 800));

    // Duración del vuelo proporcional a la distancia
    const distBetween = Math.sqrt((x - currentX) ** 2 + (y - currentY) ** 2);
    const duration = Math.min(4, Math.max(2, distBetween / 250));

    // Flip horizontal + escala con gsap
    gsap.to([colibri, colibriClone], {
      duration: 0.3,
      scaleX: direction * scale,
      scaleY: scale,
      ease: "power1.out",
      onUpdate: updateClone
    });

    // Movimiento zigzag vertical (seno oscilante)
    gsap.to(colibri, {
      duration,
      x,
      y: y + 10 * Math.sin(Date.now() / 200),
      ease: "power1.inOut",
      onUpdate: updateClone,
      onComplete: () => {
        setTimeout(() => {
          if (callback) callback();
        }, 1000);
      }
    });

    gsap.to(colibriClone, {
      duration,
      x,
      y: y + 10 * Math.sin(Date.now() / 200),
      ease: "power1.inOut",
      onUpdate: updateClone
    });
  };

  const goToTitle = () => {
    if (currentIndex >= titles.length) {
      goToCenter();
      return;
    }

    const title = titles[currentIndex];
    const rect = title.getBoundingClientRect();
    const x = rect.left - baseWidth * 1.1 + window.scrollX;
    const y = rect.top + window.scrollY + rect.height / 2 - baseHeight / 2;

    flyTo(x, y, () => {
      currentIndex++;
      goToTitle();
    });
  };

  const goToCenter = () => {
    flyTo(centerX, centerY, () => {
      goToFlor();
    });
  };

  const goToFlor = () => {
    const x = 20;
    const y = window.innerHeight - baseHeight - 20;
    flyTo(x, y, () => {
      currentIndex = 0;
      goToTitle();
    });
  };

  // Posicionar colibri y clon inicialmente en la flor
  colibri.style.left = '20px';
  colibri.style.top = (window.innerHeight - baseHeight - 20) + 'px';
  colibriClone.style.left = '20px';
  colibriClone.style.top = (window.innerHeight - baseHeight - 20) + 'px';

  // Iniciar animación
  goToTitle();
});
