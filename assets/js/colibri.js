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
  colibri.style.transform = 'rotateY(0deg) scale(1)';
  colibri.style.top = '0px';
  colibri.style.left = '0px';

  // Variable para rotación Y (flip suave)
  let currentRotationY = 0; // 0 = mirando derecha, 180 = mirando izquierda
  let flipDirection = 1; // 1 = derecha, -1 = izquierda

  // Función para calcular escala basada en distancia al header
  const getScaleByHeaderDistance = (y) => {
    const headerRect = header?.getBoundingClientRect();
    if (!headerRect) return 1;
    
    const headerBottom = headerRect.bottom;
    const distance = Math.abs(y - headerBottom);
    const scale = MAX_SCALE - ((distance / MAX_HEADER_DISTANCE) * (MAX_SCALE - MIN_SCALE));
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
  };

  // Función para hacer el flip con rotación 3D suave
  const updateFlip = (targetDirection) => {
    const targetRotation = targetDirection === 1 ? 0 : 180;
    gsap.to({ rot: currentRotationY }, {
      rot: targetRotation,
      duration: 0.5,
      ease: "power1.out",
      onUpdate: function() {
        currentRotationY = this.targets()[0].rot;
        const currentYPos = parseFloat(colibri.style.top) || 0;
        const scale = getScaleByHeaderDistance(currentYPos);
        colibri.style.transform = `rotateY(${currentRotationY}deg) scale(${scale})`;
      }
    });
  };

  // Variables para control de movimiento y estado
  let isAnimating = false;
  let followMouse = true;
  let lastMousePos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

  // Movimiento suave hacia un punto
  const moveSmoothlyTo = (targetX, targetY) => {
    if (isAnimating) return;
    isAnimating = true;

    const rect = colibri.getBoundingClientRect();
    let currentX = rect.left;
    let currentY = rect.top;

    let dx = targetX - currentX;
    let dy = targetY - currentY;

    const factor = 0.07;

    let newX = currentX + dx * factor;
    let newY = currentY + dy * factor;

    newX = Math.min(window.innerWidth - BASE_SIZE, Math.max(0, newX));
    newY = Math.min(window.innerHeight - BASE_SIZE, Math.max(0, newY));

    flipDirection = dx < 0 ? -1 : 1;
    updateFlip(flipDirection);

    colibri.style.left = newX + 'px';
    colibri.style.top = newY + 'px';

    isAnimating = false;
  };

  // Movimiento random para cuando no sigue el mouse
  const randomMovement = () => {
    if (followMouse) return Promise.resolve();

    return new Promise((resolve) => {
      const duration = gsap.utils.random(2, 4);
      const targetX = gsap.utils.random(0, window.innerWidth - BASE_SIZE);
      const targetY = gsap.utils.random(0, window.innerHeight - BASE_SIZE);

      gsap.to(colibri, {
        duration,
        left: targetX,
        top: targetY,
        ease: "power1.inOut",
        onUpdate: () => {
          const currentX = parseFloat(colibri.style.left);
          const currentY = parseFloat(colibri.style.top);
          flipDirection = (targetX < currentX) ? -1 : 1;
          updateFlip(flipDirection);
        },
        onComplete: () => {
          resolve();
        }
      });
    });
  };

  // Ciclo principal: sigue mouse por 3 seg, luego random por 3 seg, y repite
  const mainLoop = async () => {
    while (true) {
      followMouse = true;
      await new Promise(resolve => setTimeout(resolve, 3000));

      followMouse = false;
      await randomMovement();
    }
  };

  // Evento para capturar posición del mouse
  window.addEventListener('mousemove', (e) => {
    lastMousePos.x = e.clientX;
    lastMousePos.y = e.clientY;
  });

  // Loop para actualizar posición del colibrí cuando sigue mouse
  const followLoop = () => {
    if (followMouse) {
      const rect = colibri.getBoundingClientRect();
      const currentX = rect.left;
      const currentY = rect.top;
      const dx = lastMousePos.x - currentX;
      const dy = lastMousePos.y - currentY;

      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > 1) {
        moveSmoothlyTo(lastMousePos.x - BASE_SIZE / 2, lastMousePos.y - BASE_SIZE / 2);
      }
    }
    requestAnimationFrame(followLoop);
  };

  // Ajustar posición central al redimensionar
  window.addEventListener('resize', () => {
    centerX = window.innerWidth / 2 - 40;
    centerY = window.innerHeight / 2 - 40;
  });

  // Inicializamos
  colibri.style.left = (window.innerWidth / 2 - BASE_SIZE / 2) + 'px';
  colibri.style.top = (window.innerHeight / 2 - BASE_SIZE / 2) + 'px';

  mainLoop();
  followLoop();
});
