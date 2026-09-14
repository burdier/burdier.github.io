document.addEventListener('DOMContentLoaded', () => {
  const garden = document.getElementById('flor-fondo');
  if (!garden || garden.firstElementChild) return;

  const scriptUrl = [...document.scripts]
    .map(script => script.src)
    .find(src => src.endsWith('/assets/js/garden.js'));
  const flowerUrl = scriptUrl
    ? scriptUrl.replace('/js/garden.js', '/img/flower.gif')
    : '/assets/img/flower.gif';

  garden.setAttribute('aria-hidden', 'true');
  garden.style.setProperty('--flower-image', `url("${flowerUrl}")`);
  garden.innerHTML = [
    '<span class="garden_grass"></span>',
    '<span class="garden_flower garden_flower--left"></span>',
    '<span class="garden_flower garden_flower--middle"></span>',
    '<span class="garden_flower garden_flower--right"></span>'
  ].join('');
});
