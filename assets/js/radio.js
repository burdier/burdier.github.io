(() => {
  const player = document.querySelector('[data-radio-player]');
  const source = document.getElementById('radio-tracks');
  if (!player || !source) return;

  let tracks;
  try {
    tracks = JSON.parse(source.textContent || '[]');
  } catch (_) {
    return;
  }
  if (!Array.isArray(tracks) || !tracks.length) return;

  // La emisora comienza en una rotación distinta en cada visita y no repite
  // pistas hasta completar la cola barajada.
  for (let index = tracks.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [tracks[index], tracks[randomIndex]] = [tracks[randomIndex], tracks[index]];
  }

  const trackId = (track) => {
    try {
      return decodeURIComponent(new URL(track.url, window.location.href).pathname.split('/').pop());
    } catch (_) {
      return track.title;
    }
  };

  const requestedTrack = new URLSearchParams(window.location.search).get('track');
  const requestedIndex = requestedTrack
    ? tracks.findIndex((track) => trackId(track).toLowerCase() === requestedTrack.toLowerCase())
    : -1;

  const elements = {
    cover: player.querySelector('[data-radio-cover]'),
    placeholder: player.querySelector('[data-radio-placeholder]'),
    placeholderTitle: player.querySelector('[data-radio-placeholder-title]'),
    coverPlay: player.querySelector('[data-radio-play]'),
    mainPlay: player.querySelector('[data-radio-main-play]'),
    previous: player.querySelector('[data-radio-prev]'),
    next: player.querySelector('[data-radio-next]'),
    count: player.querySelector('[data-radio-count]'),
    style: player.querySelector('[data-radio-style]'),
    title: player.querySelector('[data-radio-title]'),
    artist: player.querySelector('[data-radio-artist]'),
    share: player.querySelector('[data-radio-share]'),
    shareLabel: player.querySelector('[data-radio-share-label]'),
    queue: document.querySelector('[data-radio-queue]'),
    queuePanel: document.querySelector('[data-radio-queue-panel]'),
    queueToggle: player.querySelector('[data-radio-queue-toggle]'),
    queueClose: document.querySelector('[data-radio-queue-close]'),
    queueBackdrop: document.querySelector('[data-radio-queue-backdrop]'),
    queueSearch: document.querySelector('[data-radio-queue-search]'),
    queuePrevious: document.querySelector('[data-radio-queue-prev]'),
    queueNext: document.querySelector('[data-radio-queue-next]'),
    queuePage: document.querySelector('[data-radio-queue-page]')
  };

  const audio = new Audio();
  audio.preload = 'metadata';
  const defaultCover = elements.cover.dataset.defaultCover || '';
  let currentIndex = requestedIndex >= 0 ? requestedIndex : 0;
  let queuePage = 0;
  const pageSize = 5;
  let filteredTrackIndexes = tracks.map((_, index) => index);

  const pageCount = () => Math.max(1, Math.ceil(filteredTrackIndexes.length / pageSize));

  const normalizeText = (value) => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  const trackUrl = (track) => {
    const url = new URL(window.location.href);
    url.searchParams.set('track', trackId(track));
    url.hash = '';
    return url;
  };

  const syncTrackUrl = (track) => {
    window.history.replaceState({}, '', trackUrl(track));
  };

  const copyTrackUrl = async (url) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url);
      return;
    }
    const input = document.createElement('textarea');
    input.value = url;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.append(input);
    input.select();
    document.execCommand('copy');
    input.remove();
  };

  const shareCurrentTrack = async () => {
    const track = tracks[currentIndex];
    const url = trackUrl(track).toString();
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${track.title} · Don 3B Radio`,
          text: `Escucha ${track.title} en Don 3B Radio`,
          url
        });
      } else {
        await copyTrackUrl(url);
        elements.shareLabel.textContent = 'LINK COPIADO';
        window.setTimeout(() => { elements.shareLabel.textContent = 'COMPARTIR'; }, 1800);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        await copyTrackUrl(url);
        elements.shareLabel.textContent = 'LINK COPIADO';
        window.setTimeout(() => { elements.shareLabel.textContent = 'COMPARTIR'; }, 1800);
      }
    }
  };

  const setQueueOpen = (open) => {
    elements.queuePanel.classList.toggle('is-open', open);
    elements.queueBackdrop.classList.toggle('is-open', open);
    elements.queueToggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('radio-queue-open', open);
    if (open) elements.queueClose.focus();
  };

  const makeQueueItem = (track, index) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.trackIndex = String(index);
    button.innerHTML = `<span class="radio_queue-number">${String(index + 1).padStart(2, '0')}</span><span><strong></strong><small></small></span><span class="radio_queue-play" aria-hidden="true">▶</span>`;
    button.querySelector('strong').textContent = track.title;
    button.querySelector('small').textContent = `${track.artist || 'Don 3B'} · ${track.style || 'Trap'}`;
    button.setAttribute('aria-label', `Reproducir ${track.title}`);
    button.addEventListener('click', () => {
      playAt(index);
      if (window.matchMedia('(max-width: 760px)').matches) setQueueOpen(false);
    });
    item.append(button);
    return item;
  };

  const renderQueue = () => {
    const pages = pageCount();
    queuePage = (queuePage + pages) % pages;
    const start = queuePage * pageSize;
    const fragment = document.createDocumentFragment();
    const visibleIndexes = filteredTrackIndexes.slice(start, start + pageSize);
    if (visibleIndexes.length) {
      visibleIndexes.forEach((trackIndex) => {
        fragment.append(makeQueueItem(tracks[trackIndex], trackIndex));
      });
    } else {
      const empty = document.createElement('li');
      empty.className = 'radio_queue-empty';
      empty.textContent = 'No encontré esa pista.';
      fragment.append(empty);
    }
    elements.queue.replaceChildren(fragment);
    elements.queuePage.textContent = filteredTrackIndexes.length
      ? `${queuePage + 1} / ${pages}`
      : '0 resultados';
    elements.queuePrevious.disabled = filteredTrackIndexes.length === 0;
    elements.queueNext.disabled = filteredTrackIndexes.length === 0;
    setPlayingState(!audio.paused);
  };

  const setPlayingState = (isPlaying) => {
    player.classList.toggle('is-playing', isPlaying);
    elements.coverPlay.hidden = isPlaying;
    elements.mainPlay.innerHTML = isPlaying
      ? '<span aria-hidden="true">Ⅱ</span> PAUSE'
      : '<span aria-hidden="true">▶</span> PLAY';
    elements.mainPlay.setAttribute('aria-label', isPlaying ? 'Pausar beat' : 'Reproducir beat');
    elements.queue.querySelectorAll('button').forEach((button) => {
      const icon = button.querySelector('.radio_queue-play');
      const buttonIndex = Number(button.dataset.trackIndex);
      if (icon) icon.textContent = isPlaying && buttonIndex === currentIndex ? 'Ⅱ' : '▶';
    });
  };

  const render = (index) => {
    currentIndex = (index + tracks.length) % tracks.length;
    const track = tracks[currentIndex];
    audio.pause();
    audio.src = track.url;
    audio.load();
    setPlayingState(false);

    const cover = track.cover || defaultCover;
    elements.cover.hidden = !cover;
    if (cover) elements.cover.src = cover;
    else elements.cover.removeAttribute('src');
    elements.cover.alt = cover ? `Portada de ${track.title}` : '';
    elements.placeholder.hidden = Boolean(cover);
    elements.placeholderTitle.textContent = track.title;
    elements.count.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(tracks.length).padStart(2, '0')}`;
    elements.style.textContent = track.style || 'Trap';
    elements.title.textContent = track.title;
    elements.artist.textContent = track.artist || 'Don 3B';
    elements.shareLabel.textContent = 'COMPARTIR';
    elements.previous.disabled = tracks.length < 2;
    elements.next.disabled = tracks.length < 2;
    syncTrackUrl(track);

    const filteredPosition = filteredTrackIndexes.indexOf(currentIndex);
    if (filteredPosition >= 0) queuePage = Math.floor(filteredPosition / pageSize);
    renderQueue();
    elements.queue.querySelectorAll('button').forEach((button) => {
      const current = Number(button.dataset.trackIndex) === currentIndex;
      button.classList.toggle('is-current', current);
      if (current) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
  };

  const play = async () => {
    if (!audio.paused) {
      audio.pause();
      return;
    }
    try {
      await audio.play();
    } catch (_) {
      setPlayingState(false);
    }
  };

  const playAt = async (index) => {
    render(index);
    await play();
  };

  audio.addEventListener('play', () => setPlayingState(true));
  audio.addEventListener('pause', () => setPlayingState(false));
  audio.addEventListener('ended', () => playAt(currentIndex + 1));
  audio.addEventListener('error', () => setPlayingState(false));
  elements.coverPlay.addEventListener('click', play);
  elements.mainPlay.addEventListener('click', play);
  elements.previous.addEventListener('click', () => playAt(currentIndex - 1));
  elements.next.addEventListener('click', () => playAt(currentIndex + 1));
  elements.share.addEventListener('click', shareCurrentTrack);
  elements.queuePrevious.addEventListener('click', () => {
    queuePage--;
    renderQueue();
  });
  elements.queueNext.addEventListener('click', () => {
    queuePage++;
    renderQueue();
  });
  elements.queueSearch.addEventListener('input', () => {
    const query = normalizeText(elements.queueSearch.value);
    filteredTrackIndexes = tracks.reduce((matches, track, index) => {
      const searchable = normalizeText(`${track.title} ${track.artist || ''} ${track.style || ''}`);
      if (!query || searchable.includes(query)) matches.push(index);
      return matches;
    }, []);
    queuePage = 0;
    renderQueue();
  });
  elements.queueToggle.addEventListener('click', () => setQueueOpen(true));
  elements.queueClose.addEventListener('click', () => setQueueOpen(false));
  elements.queueBackdrop.addEventListener('click', () => setQueueOpen(false));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setQueueOpen(false);
  });
  window.addEventListener('pagehide', () => audio.pause());

  render(currentIndex);
  if (requestedIndex >= 0) play();
})();
