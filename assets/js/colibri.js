const colibri = document.getElementById('colibri');

function randomPosition() {
  const maxX = window.innerWidth - 50;
  const maxY = window.innerHeight - 50;
  const x = Math.random() * maxX;
  const y = Math.random() * maxY;
  return { x, y };
}

function moveColibri() {
  const { x, y } = randomPosition();
  colibri.style.transform = `translate(${x}px, ${y}px)`;
}

// Mueve cada 5 segundos
setInterval(moveColibri, 5000);

// Mover al cargar
moveColibri();
