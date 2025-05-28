document.addEventListener("DOMContentLoaded", () => {
  const colibri = document.getElementById('colibri');
  if (!colibri) return;

  // Clon para efecto flip pegado (evita efecto fantasma)
  const colibriClone = colibri.cloneNode(true);
  colibriClone.style.position = 'fixed';
  colibriClone.style.top = '0';
  colibriClone.style.left = '0';
  colibriClone.style.pointerEvents = 'none';
  colibriClone.style.zIndex = '9998';
  colibri.parentNode.appendChild(colibriClone);

  const titles = Array.from(document.querySelectorAll('.post-title'));
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  let currentIndex = 0;

  // Estilos base colibri
  const baseWidth = 80; // base tamaño
  const baseHeight = 80;
  colibri.style.position = 'fixed';
  colibri.style.zIndex = '9999';
  colibri.style.width = baseWidth + 'px';
  colibri.style.height = baseHeight + 'px';
  colibri.style.backgroundImage = "url('/assets/img/colibri.gif')";
  colibri.style.backgroundSize = 'contain';
  colibri.style.backgroundRepeat = 'no-repeat';
  colibri.style.pointerEvents = 'none';
  colibri.style.transformOrigin = 'center center';

  colibriClone.style.width = baseWidth + 'px';
  colibriClone.style.height = baseHeight + 'px';
  colibriClone.style.backgroundImage = "url('/assets/img/colibri.gif')";
  colibriClone.style.backgroundSize = 'contain';
  colibriClone.style.backgroundRepeat = 'no-repeat';
  colibriClone.style.transformOrigin = 'center center';

  // Función para actualizar posición y tamaño del clon igual que el original
  function updateClone() {
    const rect = colibri.getBoundingClientRect();
    colibriClone.style.transform = colibri.style.transform;
    colibriClone.style.left = rect.left + 'px';
    colibriClone.style.top = rect.top + 'px';
    colibriClone.style.width = rect.width + 'px';
    colibriClone.style.height = rect.height + 'px';
  }

  // Animar vuelo con escala y flip natural + zigzag vertical
  const flyTo = (x, y, callback) => {
    const rect = colibri.getBoundingClientRect();
    const currentX = rect.left;
    const currentY = rect.top;
    const direction = x < currentX ? -1 : 1;

    // Distancia al centro para escala (min 0.6, max 1.3)
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const scale = Math.min(1.3, Math.max(0.6, 1.3 - distance / 800));

    // Duración proporcional a la distancia para movimiento natural
    const distBetween = Math.sqrt((x - currentX) ** 2 + (y - currentY) ** 2);
    const duration = Math.min(4, Math.max(2, distBetween / 250));

    // Flip horizontal y escala con gsap (a colibri y su clon)
    gsap.to([colibri, colibriClone], {
      duration: 0.3,
      scaleX: direction * scale,
      scaleY: scale,
      ease: "power1.out",
      onUpdate: updateClone
    });

    // Movimiento zigzag: y + seno oscilante para efecto de vuelo más natural
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

    // Mismo movimiento para el clon (sin desfase de tiempo para evitar duplicados raros)
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

    // Posicionar un poco a la izquierda del título y centrado vertical en el texto
    const x = rect.left - baseWidth * 1.1 + window.scrollX;
    const y = rect.top + window.scrollY + rect.height / 2 - baseHeight / 2;

    flyTo(x, y, () => {
      currentIndex++;
      goToTitle();
    });
  };

  const goToCenter = () => {
    const x = centerX - baseWidth / 2;
    const y = centerY - baseHeight / 2;
    flyTo(x, y, () => {
      goToFlor();
    });
  };

  const goToFlor = () => {
    const x = 20; // cerca esquina inferior izquierda
    const y = window.innerHeight - baseHeight - 20;
    flyTo(x, y, () => {
      currentIndex = 0;
      goToTitle();
    });
  };

  // Iniciar vuelo
  // Posicionamos colibri inicialmente en la flor
  colibri.style.left = '20px';
  colibri.style.top = (window.innerHeight - baseHeight - 20) + 'px';
  colibriClone.style.left = '20px';
  colibriClone.style.top = (window.innerHeight - baseHeight - 20) + 'px';
  goToTitle();

  // Actualizar posiciones al hacer scroll y resize
  window.addEventListener('scroll', () => {
    // Opcional: actualizar animación o pausar para que no se descontrole
  });
  window.addEventListener('resize', () => {
    // Actualiza centro
  });
});
