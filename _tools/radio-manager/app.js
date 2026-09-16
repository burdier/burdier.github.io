'use strict';

const elements = {
  tracks: document.getElementById('tracks'),
  count: document.getElementById('track-count'),
  search: document.getElementById('search'),
  state: document.getElementById('state'),
  save: document.getElementById('save-button'),
  publish: document.getElementById('publish-button'),
  commitMessage: document.getElementById('commit-message'),
  add: document.getElementById('add-button'),
  dialog: document.getElementById('add-dialog'),
  addForm: document.getElementById('add-form'),
  toast: document.getElementById('toast')
};

let tracks = [];
let dirty = false;
let savedUnpublished = false;
let deleted = null;
let toastTimer = null;

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const normalize = (value) => String(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

function setDirty(value) {
  dirty = value;
  elements.state.dataset.state = value || savedUnpublished ? 'dirty' : 'clean';
  elements.state.textContent = value
    ? 'Cambios sin guardar'
    : (savedUnpublished ? 'Guardado local · falta publicar' : 'Todo publicado');
}

function showToast(message, undo = false) {
  window.clearTimeout(toastTimer);
  elements.toast.innerHTML = `${escapeHtml(message)}${undo ? ' <button type="button" data-undo>Deshacer</button>' : ''}`;
  elements.toast.classList.add('is-visible');
  toastTimer = window.setTimeout(() => elements.toast.classList.remove('is-visible'), 3500);
}

function render() {
  const query = normalize(elements.search.value.trim());
  const visible = tracks
    .map((track, index) => ({ track, index }))
    .filter(({ track }) => !query || normalize(`${track.title} ${track.artist} ${track.style} ${track.url}`).includes(query));

  elements.count.textContent = query
    ? `${visible.length} de ${tracks.length}`
    : `${tracks.length} pistas`;

  if (!visible.length) {
    elements.tracks.innerHTML = '<div class="empty">No encontré ninguna pista.</div>';
    return;
  }

  elements.tracks.innerHTML = visible.map(({ track, index }) => `
    <article class="track" data-index="${index}">
      <span class="number">${String(index + 1).padStart(3, '0')}</span>
      <div class="fields">
        <label class="title-field">Título<input data-field="title" value="${escapeHtml(track.title)}"></label>
        <label class="url-field">URL<input data-field="url" type="url" value="${escapeHtml(track.url)}"></label>
        <label>Artista<input data-field="artist" value="${escapeHtml(track.artist || 'Don 3B')}"></label>
        <label>Estilo<input data-field="style" value="${escapeHtml(track.style || 'Trap')}"></label>
      </div>
      <button class="delete" type="button" data-delete aria-label="Eliminar ${escapeHtml(track.title)}">BORRAR</button>
    </article>
  `).join('');
}

async function request(path, body) {
  const response = await fetch(path, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'La operación falló.');
  return data;
}

function setBusy(value) {
  elements.save.disabled = value;
  elements.publish.disabled = value;
  elements.add.disabled = value;
  elements.state.dataset.state = value ? 'busy' : (dirty ? 'dirty' : 'clean');
  if (value) elements.state.textContent = 'Trabajando…';
  else setDirty(dirty);
}

async function save() {
  setBusy(true);
  try {
    const result = await request('/api/save', { tracks });
    savedUnpublished = true;
    setDirty(false);
    showToast(`${result.count} pistas guardadas en radio.yml.`);
  } catch (error) {
    showToast(error.message);
  } finally {
    setBusy(false);
  }
}

async function publish() {
  setBusy(true);
  try {
    const result = await request('/api/publish', {
      tracks,
      message: elements.commitMessage.value
    });
    savedUnpublished = false;
    setDirty(false);
    showToast(result.changed ? `Publicado en master · ${result.hash}` : result.message);
  } catch (error) {
    showToast(`No se pudo publicar: ${error.message}`);
  } finally {
    setBusy(false);
  }
}

elements.tracks.addEventListener('input', (event) => {
  const field = event.target.dataset.field;
  if (!field) return;
  const item = event.target.closest('[data-index]');
  tracks[Number(item.dataset.index)][field] = event.target.value;
  setDirty(true);
});

elements.tracks.addEventListener('click', (event) => {
  const button = event.target.closest('[data-delete]');
  if (!button) return;
  const item = button.closest('[data-index]');
  const index = Number(item.dataset.index);
  deleted = { track: tracks[index], index };
  tracks.splice(index, 1);
  setDirty(true);
  render();
  showToast(`“${deleted.track.title}” eliminada.`, true);
});

elements.toast.addEventListener('click', (event) => {
  if (!event.target.matches('[data-undo]') || !deleted) return;
  tracks.splice(deleted.index, 0, deleted.track);
  deleted = null;
  setDirty(true);
  render();
  showToast('Pista restaurada.');
});

elements.search.addEventListener('input', render);
elements.save.addEventListener('click', save);
elements.publish.addEventListener('click', publish);
elements.add.addEventListener('click', () => elements.dialog.showModal());
document.querySelector('[data-close-dialog]').addEventListener('click', () => elements.dialog.close());

elements.addForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(elements.addForm);
  tracks.push({
    title: String(form.get('title') || '').trim(),
    url: String(form.get('url') || '').trim(),
    artist: String(form.get('artist') || 'Don 3B').trim(),
    style: String(form.get('style') || 'Trap').trim(),
    platform: 'audio'
  });
  elements.dialog.close();
  elements.addForm.reset();
  elements.addForm.elements.namedItem('artist').value = 'Don 3B';
  elements.addForm.elements.namedItem('style').value = 'Trap';
  elements.search.value = '';
  setDirty(true);
  render();
  showToast('Pista añadida. Publica cuando termines.');
});

window.addEventListener('beforeunload', (event) => {
  if (!dirty) return;
  event.preventDefault();
  event.returnValue = '';
});

request('/api/tracks')
  .then((data) => {
    tracks = data.tracks;
    savedUnpublished = Boolean(data.dirtyOnDisk);
    setDirty(false);
    render();
  })
  .catch((error) => {
    elements.state.dataset.state = 'error';
    elements.state.textContent = error.message;
    showToast(error.message);
  });
