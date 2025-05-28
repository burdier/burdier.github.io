document.addEventListener("DOMContentLoaded", () => {
  const colibri = document.getElementById('colibri');
  if (!colibri) return;

  const header = document.querySelector('header');
  const BASE_SIZE = 80;
  const MIN_SCALE = 0.6;
  const MAX_SCALE = 1.5;
  const MAX_HEADER_DISTANCE = 600;

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

  let currentRotationY = 0;
  let flipDirection = 1;

  // Parámetros de la oscilación
  const Ax = 30; // Amplitud en X
  const Ay = 20; // Amplitud en Y
  const Az = 25; // Amplitud en Z (altura)
  const omegaX = 2 * Math.PI / 4.5; // frecuencia X (4.5 seg)
  const omegaY = 2 * Math.PI / 5;   // frecuencia Y (5 seg)
  const omegaZ = 2 * Math.PI / 3.5; // frecuencia Z (3.5 seg)
  const phiX = Math.random() * 2 * Math.PI;
  const phiY = Math.random() * 2 * Math.PI;
  const phiZ = Math.random() * 2 * Math.PI;
  const h = window.innerHeight / 2; // Altura promedio (puedes ajustarlo)

  // Estado para ciclo mouse/random
  let followMouse = true;
  let lastMousePos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  let startTime = performance.now();

  // Calcula escala según distancia al header (usando posición Z)
  const getScaleByHeaderDistance = (z) => {
    const headerRect = header?.getBoundingClientRect();
    if (!headerRect) return 1;
    const headerBottom = headerRect.bottom;
    const distance = Math.abs(z - headerBottom);
    const scale = MAX_SCALE - ((distance / MAX_HEADER_DISTANCE) * (MAX_SCALE - MIN_SCALE));
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
  };

  // Animación flip con rotación 3D suave
  const updateFlip = (targetDirection) => {
    const targetRotation = targetDirection === 1 ? 0 : 180;
    gsap.to({ rot: currentRotationY }, {
      rot: targetRotation,
      duration: 0.5,
      ease: "power1.out",
      onUpdate: function() {
        currentRotationY = this.targets()[0].rot;
        // La escala se actualiza en updatePosition
      }
    });
  };

  // Actualiza posición y transform del colibri con la fórmula paramétrica
  const updatePosition = (baseX, baseY, elapsedTime) => {
    // Calcula posiciones oscilantes
    const x = baseX + Ax * Math.sin(omegaX * elapsedTime + phiX);
    const y = baseY + Ay * Math.cos(omegaY * elapsedTime + phiY);
    const z = h + Az * Math.sin(omegaZ * elapsedTime + phiZ);

    // Limitar dentro de pantalla
    const clampedX = Math.min(window.innerWidth - BASE_SIZE, Math.max(0, x));
    const clampedY = Math.min(window.innerHeight - BASE_SIZE, Math.max(0, y));

    // Decide dirección para flip (según movimiento horizontal)
    flipDirection = (clampedX < (parseFloat(colibri.style.left) || 0)) ? -1 : 1;
    updateFlip(flipDirection);

    // Actualiza posición y escala
    colibri.style.left = clampedX + 'px';
    colibri.style.top = clampedY + 'px';

    const scale = getScaleByHeaderDistance(z);
    colibri.style.transform = `rotateY(${currentRotationY}deg) scale(${scale})`;
  };

  // Movimiento random para cuando no sigue el mouse
  const randomMovementPoint = () => {
    return {
      x: gsap.utils.random(100, window.innerWidth - 100),
      y: gsap.utils.random(100, window.innerHeight - 100),
    };
  };

  // Ciclo principal: 3 seg sigue mouse, 3 seg random (vuelvo a punto random cada vez que toca)
  const mainLoop = async () => {
    while (true) {
      followMouse = true;
      startTime = performance.now();
      await new Promise(r => setTimeout(r, 3000));

      followMouse = false;
      // nuevo punto random para base
      let randomPoint = randomMovementPoint();
      startTime = performance.now();
      // cambiar randomPoint cada 3 seg mientras sigue random
      for (let i = 0; i < 3; i++) {
        randomPoint = randomMovementPoint();
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  };

  // Evento mouse
  window.addEventListener('mousemove', (e) => {
    lastMousePos.x = e.clientX;
    lastMousePos.y = e.clientY;
  });

  // Loop para animar constantemente la posición del colibri
  const animate = () => {
    const elapsed = (performance.now() - startTime) / 1000; // segundos
    if (followMouse) {
      updatePosition(lastMousePos.x - BASE_SIZE / 2, lastMousePos.y - BASE_SIZE / 2, elapsed);
    } else {
      // Cuando no sigue mouse, el punto base es random, simulado con último lastMousePos para no cambiar mucho
      updatePosition(lastMousePos.x - BASE_SIZE / 2, lastMousePos.y - BASE_SIZE / 2, elapsed);
    }
    requestAnimationFrame(animate);
  };

  // Iniciar en centro
  colibri.style.left = (window.innerWidth / 2 - BASE_SIZE / 2) + 'px';
  colibri.style.top = (window.innerHeight / 2 - BASE_SIZE / 2) + 'px';

  mainLoop();
  animate();

  // Actualizar altura promedio h si se redimensiona
  window.addEventListener('resize', () => {
    // Ajustar altura promedio
    // Solo si quieres que el vuelo se adapte al alto de la ventana:
    h = window.innerHeight / 2;
  });
});
