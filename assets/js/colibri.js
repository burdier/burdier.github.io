document.addEventListener("DOMContentLoaded", () => {
  const colibri = document.getElementById('colibri');
  if (!colibri) return; // seguridad
  const titles = Array.from(document.querySelectorAll('.post-title'));
  const flor = document.getElementById('flor-fondo');
  let currentIndex = 0;
  let centerX = window.innerWidth / 2 - 30;
  let centerY = window.innerHeight / 2 - 30;

  colibri.style.position = 'fixed';
  colibri.style.zIndex = '9999';
  colibri.style.width = '60px';
  colibri.style.height = '60px';
  colibri.style.backgroundImage = "url('/assets/images/colibri.gif')";
  colibri.style.backgroundSize = 'cover';
  colibri.style.pointerEvents = 'none';

  const flyTo = (x, y, callback) => {
    const colX = colibri.getBoundingClientRect().left;
    const direction = x < colX ? -1 : 1;
    gsap.to(colibri, {
      duration: 2,
      x: x,
      y: y + Math.sin(Math.random() * Math.PI) * 30,
      ease: "power1.inOut",
      onStart: () => {
        colibri.style.transform = `scaleX(${direction})`;
      },
      onComplete: () => {
        setTimeout(callback, 1200);
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

  goToTitle();
});
