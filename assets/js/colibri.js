document.addEventListener("DOMContentLoaded", () => {
  const colibri = document.getElementById('colibri');
  if (!colibri) return;

  const titles = Array.from(document.querySelectorAll('.post-title'));
  const flor = document.getElementById('flor-fondo');
  let currentIndex = 0;
  let centerX = window.innerWidth / 2 - 30;
  let centerY = window.innerHeight / 3;

  // Crear clon para el efecto suave de giro
  const colibriClone = colibri.cloneNode(true);
  colibriClone.id = 'colibri-clone';
  colibri.parentNode.appendChild(colibriClone);

  // Estilos comunes
  [colibri, colibriClone].forEach(el => {
    el.style.position = 'fixed';
    el.style.zIndex = '9999';
    el.style.width = '60px';
    el.style.height = '60px';
    el.style.backgroundImage = "url('/assets/img/colibri.gif')";
    el.style.backgroundSize = 'cover';
    el.style.pointerEvents = 'none';
    el.style.transformOrigin = 'center center';
  });

  colibriClone.style.opacity = '0';
  colibriClone.style.transition = 'opacity 0.2s ease';

  const flyTo = (x, y, callback) => {
    const currentX = colibri.getBoundingClientRect().left;
    const currentY = colibri.getBoundingClientRect().top;
    const direction = x < currentX ? -1 : 1;

    // Posicionar el clon exactamente encima con leve offset
    colibriClone.style.opacity = '0.3';
    colibriClone.style.transform = `scaleX(${direction})`;
    colibriClone.style.left = `${currentX + 4}px`;  // muy leve desplazamiento
    colibriClone.style.top = `${currentY}px`;

    // Flip del original
    gsap.to(colibri, {
      duration: 0.3,
      scaleX: direction,
      ease: "power1.out",
      onComplete: () => {
        colibriClone.style.opacity = '0';
      }
    });

    // Vuelo elevado y natural
    const elevation = y - 100 < 50 ? 50 : y - 100;
    gsap.to(colibri, {
      duration: 2,
      x: x,
      y: elevation + Math.sin(Math.random() * Math.PI) * 20,
      ease: "power1.inOut",
      onComplete: () => {
        if (callback) setTimeout(callback, 1000);
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
    const x = rect.left - 60;
    const y = rect.top + window.scrollY - 20;

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
    const y = window.innerHeight - 100;
    flyTo(x, y, () => {
      currentIndex = 0;
      goToTitle();
    });
  };

  goToTitle();
});
