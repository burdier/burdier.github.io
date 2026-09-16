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
    queue: document.querySelector('[data-radio-queue]'),
    queuePanel: document.querySelector('[data-radio-queue-panel]'),
    queueToggle: player.querySelector('[data-radio-queue-toggle]'),
    queueClose: document.querySelector('[data-radio-queue-close]'),
    queueBackdrop: document.querySelector('[data-radio-queue-backdrop]'),
    queuePrevious: document.querySelector('[data-radio-queue-prev]'),
    queueNext: document.querySelector('[data-radio-queue-next]'),
    queuePage: document.querySelector('[data-radio-queue-page]')
  };

  const audio = new Audio();
  audio.preload = 'metadata';
  let currentIndex = 0;
  let queuePage = 0;
  let pageSize = window.matchMedia('(max-width: 760px)').matches ? 5 : 6;

  const pageCount = () => Math.ceil(tracks.length / pageSize);

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
    tracks.slice(start, start + pageSize).forEach((track, offset) => {
      fragment.append(makeQueueItem(track, start + offset));
    });
    elements.queue.replaceChildren(fragment);
    elements.queuePage.textContent = `${queuePage + 1} / ${pages}`;
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

    elements.cover.hidden = true;
    elements.cover.removeAttribute('src');
    elements.cover.alt = '';
    elements.placeholder.hidden = false;
    elements.placeholderTitle.textContent = track.title;
    elements.count.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(tracks.length).padStart(2, '0')}`;
    elements.style.textContent = track.style || 'Trap';
    elements.title.textContent = track.title;
    elements.artist.textContent = track.artist || 'Don 3B';
    elements.previous.disabled = tracks.length < 2;
    elements.next.disabled = tracks.length < 2;

    queuePage = Math.floor(currentIndex / pageSize);
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
  elements.queuePrevious.addEventListener('click', () => {
    queuePage--;
    renderQueue();
  });
  elements.queueNext.addEventListener('click', () => {
    queuePage++;
    renderQueue();
  });
  elements.queueToggle.addEventListener('click', () => setQueueOpen(true));
  elements.queueClose.addEventListener('click', () => setQueueOpen(false));
  elements.queueBackdrop.addEventListener('click', () => setQueueOpen(false));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setQueueOpen(false);
  });
  window.addEventListener('resize', () => {
    const nextPageSize = window.matchMedia('(max-width: 760px)').matches ? 5 : 6;
    if (nextPageSize === pageSize) return;
    pageSize = nextPageSize;
    queuePage = Math.floor(currentIndex / pageSize);
    renderQueue();
  });
  window.addEventListener('pagehide', () => audio.pause());

  render(0);
})();
