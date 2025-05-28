document.addEventListener("DOMContentLoaded", () => {
  const colibri = document.getElementById('colibri');
  if (!colibri) return;

  const titles = Array.from(document.querySelectorAll('.post-title'));
  const flor = document.getElementById('flor-fondo');
  let currentIndex = 0;
  let centerX = window.innerWidth / 2 - 30;
  let centerY = window.innerHeight / 2 - 30;

  // Crear clon para efecto flip intermedio
  const colibriClone = colibri.cloneNode(true);
  colibriClone.style.position = 'fixed';
  colibriClone.style.zIndex = '9998';
  colibriClone.style.pointerEvents = 'none';
  document.body.appendChild(colibriClone);

  // Configuración inicial
  [colibri, colibriClone].forEach(el => {
    el.style.position = 'fixed';
    el.style.width = '60px';
    el.style.height = '60px';
    el.style.backgroundImage = "url('/assets/img/colibri.gif')";
    el.style.backgroundSize = 'cover';
    el.style.transformOrigin = 'center center';
    el.style.transform = 'scaleX(1) scaleY(1)';
    el.style.top = '0px';
    el.style.left = '0px';
  });

  // Actualizar clon según colibri principal
  const updateClone = () => {
    const style = window.getComputedStyle(colibri);
    colibriClone.style.left = style.left;
    colibriClone.style.top = style.top;
    colibriClone.style.transform = style.transform;
  };

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

    // Timeline para movimiento horizontal + vertical con subida lenta y bajada rápida
    const tl = gsap.timeline({
      onComplete: () => {
        setTimeout(() => {
          if (callback) callback();
        }, 1000);
      }
    });

    // Movimiento horizontal lineal
    tl.to([colibri, colibriClone], {
      duration: duration,
      x: x,
      ease: "power1.inOut",
      onUpdate: updateClone
    }, 0);

    // Movimiento vertical oscilante con subida lenta y bajada rápida
    tl.to([colibri, colibriClone], {
      duration: duration * 0.7,
      y: y - 20, // más tiempo arriba (20px arriba)
      ease: "power1.out",
      onUpdate: updateClone
    }, 0);

    tl.to([colibri, colibriClone], {
      duration: duration * 0.3,
      y: y,
      ease: "power1.in",
      onUpdate: updateClone
    }, duration * 0.7);
  };

  const goToTitle = () => {
    if (currentIndex >= titles.length) {
      goToCenter();
      return;
    }

    const title = titles[currentIndex];
    const rect = title.getBoundingClientRect();
    const x = rect.left - 60;
    const y = rect.top + window.scrollY - 10;

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
    const x = 10;
    const y = window.innerHeight - 80;
    flyTo(x, y, () => {
      currentIndex = 0;
      goToTitle();
    });
  };

  // Iniciar animación
  goToTitle();

  // Actualizar centro si se redimensiona ventana
  window.addEventListener('resize', () => {
    centerX = window.innerWidth / 2 - 30;
    centerY = window.innerHeight / 2 - 30;
  });
});
