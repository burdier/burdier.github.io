document.addEventListener("DOMContentLoaded", () => {
  const colibri = document.getElementById('colibri');
  if (!colibri) return;

  const centerX = window.innerWidth / 2 - 30;
  const centerY = window.innerHeight / 2 - 30;
  const MAX_DISTANCE = 500;

  // Clon para efecto flip natural
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

  let mouseX = centerX;
  let mouseY = centerY;
  let followingMouse = true;

  const updateClone = () => {
    const style = window.getComputedStyle(colibri);
    colibriClone.style.left = style.left;
    colibriClone.style.top = style.top;
    colibriClone.style.transform = style.transform;
  };

  // Función para volar a una posición con animaciones
  const flyTo = (x, y, duration = 2, callback) => {
    const rect = colibri.getBoundingClientRect();
    const currentX = rect.left;
    const direction = x < currentX ? -1 : 1;

    // Distancia para escala
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const scale = Math.min(1.3, Math.max(0.6, 1.3 - distance / 800));

    // Flip y escala
    gsap.to([colibri, colibriClone], {
      duration: 0.3,
      scaleX: direction * scale,
      scaleY: scale,
      ease: "power1.out",
      onUpdate: updateClone
    });

    // Timeline para movimiento
    const tl = gsap.timeline({
      onComplete: () => {
        if (callback) callback();
      }
    });

    tl.to([colibri, colibriClone], {
      duration: duration,
      x: x,
      ease: "power1.inOut",
      onUpdate: updateClone
    }, 0);

    tl.to([colibri, colibriClone], {
      duration: duration * 0.7,
      y: y - 20, // más tiempo arriba
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

  // Movimiento random dentro de ventana
  const randomMove = () => {
    const x = Math.random() * (window.innerWidth - 60);
    const y = Math.random() * (window.innerHeight - 60);
    const duration = 2 + Math.random() * 2;
    flyTo(x, y, duration, () => {
      // Tras movimiento random espera y decide seguir mouse otra vez o seguir random
      setTimeout(() => {
        if (Math.random() < 0.5) {
          followingMouse = true;
        } else {
          randomMove();
        }
      }, 1500);
    });
  };

  // Loop que sigue al mouse dentro de un radio o se mueve random
  const followLoop = () => {
    if (followingMouse) {
      // Calcula distancia del colibri al mouse
      const rect = colibri.getBoundingClientRect();
      const colX = rect.left;
      const colY = rect.top;

      const dx = mouseX - colX;
      const dy = mouseY - colY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Si está lejos más de MAX_DISTANCE, mueve hacia el mouse pero dentro del radio
      if (distance > MAX_DISTANCE) {
        // calcula punto en la línea del colibri al mouse a MAX_DISTANCE
        const angle = Math.atan2(dy, dx);
        const targetX = colX + Math.cos(angle) * MAX_DISTANCE;
        const targetY = colY + Math.sin(angle) * MAX_DISTANCE;
        flyTo(targetX, targetY, 1, () => {
          setTimeout(followLoop, 300);
        });
      } else {
        // Si está dentro del radio, volar directamente al mouse (más lento)
        flyTo(mouseX, mouseY, 1.5, () => {
          setTimeout(followLoop, 300);
        });
      }
      // Después de un rato deja de seguir el mouse y hace random
      if (Math.random() < 0.02) { // 2% chance de hacer random
        followingMouse = false;
      }
    } else {
      randomMove();
    }
  };

  // Actualiza posición del mouse
  window.addEventListener('mousemove', e => {
    mouseX = e.clientX - 30; // centrar el colibri
    mouseY = e.clientY - 30;
  });

  // Iniciar desde centro
  gsap.set([colibri, colibriClone], {x: centerX, y: centerY});
  followLoop();

  // Actualizar centro en resize
  window.addEventListener('resize', () => {
    // opcional: actualizar center si quieres que cambie según tamaño ventana
  });
});
