// Nueva variable para rotación Y
let currentRotationY = 0; // 0 grados mirando derecha, 180 grados mirando izquierda

// Función para actualizar la rotación suavemente según dirección
const updateFlip = (targetDirection) => {
  const targetRotation = targetDirection === 1 ? 0 : 180;
  gsap.to({ rot: currentRotationY }, {
    rot: targetRotation,
    duration: 0.5,
    ease: "power1.out",
    onUpdate: function() {
      currentRotationY = this.targets()[0].rot;
      const scale = getScaleByHeaderDistance(parseFloat(colibri.style.top));
      colibri.style.transform = `rotateY(${currentRotationY}deg) scale(${scale})`;
    }
  });
};

// Dentro moveSmoothlyTo
const moveSmoothlyTo = (targetX, targetY) => {
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
};

// Dentro randomMovement onUpdate
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
    isAnimating = false;
    resolve();
  }
});
