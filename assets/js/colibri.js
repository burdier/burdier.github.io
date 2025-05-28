document.addEventListener("DOMContentLoaded", () => {
  const colibri = document.getElementById('colibri');
  const colibriWidth = 80;
  const colibriHeight = 80;
  let currentPos = { x: 0, y: 0 };
  let isFirstMove = true;
  let flightAnimation;

  function getRandomTitlePosition() {
    const titles = Array.from(document.querySelectorAll('h1, h2, h3'));
    if (titles.length === 0) return getCenterOfViewport();

    const title = titles[Math.floor(Math.random() * titles.length)];
    const rect = title.getBoundingClientRect();

    const x = Math.min(
      window.innerWidth - colibriWidth,
      Math.max(0, rect.left + rect.width / 2 - colibriWidth / 2)
    );
    const y = Math.min(
      window.innerHeight - colibriHeight - 20,
      Math.max(0, rect.top - colibriHeight - 10)
    );

    return { x, y };
  }

  function getCenterOfViewport() {
    return {
      x: window.innerWidth / 2 - colibriWidth / 2,
      y: window.innerHeight / 2 - colibriHeight / 2
    };
  }

  function getCornerPosition() {
    return {
      x: 20,
      y: window.innerHeight - colibriHeight - 20
    };
  }

  function moveColibriTo(targetPos, callback) {
    // Clear any existing animation
    if (flightAnimation) flightAnimation.kill();
    
    const facingRight = targetPos.x >= currentPos.x;
    
    // Create more realistic flight path with GSAP
    flightAnimation = gsap.to(colibri, {
      x: targetPos.x,
      y: targetPos.y,
      duration: 2 + Math.random() * 1, // Random duration between 2-3 seconds
      ease: "sine.inOut",
      onUpdate: function() {
        // Add subtle wing flapping effect
        const waveHeight = 10;
        const waveSpeed = 0.05;
        const waveOffset = Math.sin(performance.now() * waveSpeed) * waveHeight;
        gsap.set(colibri, { y: "+=" + waveOffset });
        
        // Update facing direction
        gsap.set(colibri, { scaleX: facingRight ? 1 : -1 });
      },
      onComplete: function() {
        currentPos = targetPos;
        if (callback) callback();
      }
    });
  }

  function flightCycle() {
    const nextPos = isFirstMove ? getCenterOfViewport() :
      (Math.random() > 0.5 ? getCornerPosition() : getRandomTitlePosition());

    moveColibriTo