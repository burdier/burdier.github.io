document.addEventListener("DOMContentLoaded", () => {
  const colibri = document.getElementById('colibri');
  if (!colibri) return;

  const BASE_SIZE = 80;
  const MIN_SCALE = 0.6;
  const MAX_SCALE = 1.8;

  // Posición base donde "vuela" el colibrí (centro pantalla)
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  // Parámetros de la oscilación
  const Ax = 200; // amplitud en X (pixeles)
  const Ay = 120; // amplitud en Y (pixeles)

  const omegaX = 0.7; // frecuencia angular en X (rad/s)
  const omegaY = 1.1; // frecuencia angular en Y (rad/s)

  const phiX = Math.random() * 2 * Math.PI; // fase inicial aleatoria
  const phiY = Math.random() * 2 * Math.PI;

  // Configuración inicial del colibrí
  colibri.style.position = 'fixed';
  colibri.style.zIndex = '9999';
  colibri.style.width = BASE_SIZE + 'px';
  colibri.style.height = BASE_SIZE + 'px';
  colibri.style.backgroundImage = "url('/assets/img/colibri.gif')";
  colibri.style.backgroundSize = 'cover';
  colibri.style.pointerEvents = 'none';
  colibri.style.transformOrigin = 'center center';

  let startTime = null;

  function animate(time) {
    if (!startTime) startTime = time;
    const t = (time - startTime) / 1000; // tiempo en segundos

    // Calculamos la posición usando funciones seno y coseno
    const x = centerX + Ax * Math.sin(omegaX * t + phiX);
    const y = centerY + Ay * Math.cos(omegaY * t + phiY);

    // Escala según la altura (más alto = más grande)
    // Normalizamos y para escala (0=base, -Ay=arriba, +Ay=abajo)
    // Queremos que al Y mínimo (más alto), escala = MAX_SCALE
    // Al Y máximo (más bajo), escala = MIN_SCALE
    const scale = MIN_SCALE + ((Ay - (y - centerY)) / (2 * Ay)) * (MAX_SCALE - MIN_SCALE);

    // Determinar dirección para el flip horizontal
    // Calculamos velocidad en X para decidir flip
    const dx = Ax * omegaX * Math.cos(omegaX * t + phiX);
    const flip = dx >= 0 ? 1 : -1;

    // Aplicamos posición y transformación
    colibri.style.left = `${x - (BASE_SIZE/2) * scale}px`;
    colibri.style.top = `${y - (BASE_SIZE/2) * scale}px`;
    colibri.style.transform = `scaleX(${flip}) scale(${scale.toFixed(3)})`;

    requestAnimationFrame(animate);
  }

  animate();
});
