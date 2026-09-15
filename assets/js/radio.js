(() => {
  const player = document.querySelector('[data-radio-player]');
  const source = document.getElementById('radio-tracks');
  if (!player || !source) return;

  const tracks = JSON.parse(source.textContent || '[]');
  if (!tracks.length) return;

  const elements = {
    cover: player.querySelector('[data-radio-cover]'),
    video: player.querySelector('[data-radio-video]'),
    coverPlay: player.querySelector('[data-radio-play]'),
    mainPlay: player.querySelector('[data-radio-main-play]'),
    previous: player.querySelector('[data-radio-prev]'),
    next: player.querySelector('[data-radio-next]'),
    count: player.querySelector('[data-radio-count]'),
    style: player.querySelector('[data-radio-style]'),
    title: player.querySelector('[data-radio-title]'),
    artist: player.querySelector('[data-radio-artist]'),
    queue: document.querySelector('[data-radio-queue]')
  };
  let currentIndex = 0;

  const getVideoId = (url) => {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('youtu.be')) return parsed.pathname.slice(1);
      return parsed.searchParams.get('v') || parsed.pathname.split('/').filter(Boolean).pop();
    } catch (_) {
      return '';
    }
  };

  const stopVideo = () => {
    elements.video.replaceChildren();
    elements.video.classList.remove('is-playing');
    elements.coverPlay.hidden = false;
  };

  const play = () => {
    const track = tracks[currentIndex];
    const videoId = getVideoId(track.url);
    if (!videoId) return;

    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0`;
    iframe.title = `${track.title} — ${track.artist}`;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    elements.video.replaceChildren(iframe);
    elements.video.classList.add('is-playing');
    elements.coverPlay.hidden = true;
  };

  const render = (index) => {
    currentIndex = (index + tracks.length) % tracks.length;
    const track = tracks[currentIndex];
    const videoId = getVideoId(track.url);
    stopVideo();
    elements.cover.src = `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/maxresdefault.jpg`;
    elements.cover.onerror = () => {
      elements.cover.onerror = null;
      elements.cover.src = `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;
    };
    elements.cover.alt = `Portada de ${track.title}`;
    elements.count.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(tracks.length).padStart(2, '0')}`;
    elements.style.textContent = track.style || 'Beat';
    elements.title.textContent = track.title;
    elements.artist.textContent = track.artist;
    elements.previous.disabled = tracks.length < 2;
    elements.next.disabled = tracks.length < 2;

    elements.queue.querySelectorAll('button').forEach((button, buttonIndex) => {
      button.classList.toggle('is-current', buttonIndex === currentIndex);
      button.setAttribute('aria-current', buttonIndex === currentIndex ? 'true' : 'false');
    });
  };

  tracks.forEach((track, index) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.innerHTML = `<span class="radio_queue-number">${String(index + 1).padStart(2, '0')}</span><span><strong></strong><small></small></span><span class="radio_queue-play" aria-hidden="true">▶</span>`;
    button.querySelector('strong').textContent = track.title;
    button.querySelector('small').textContent = track.artist;
    button.addEventListener('click', () => render(index));
    item.append(button);
    elements.queue.append(item);
  });

  elements.coverPlay.addEventListener('click', play);
  elements.mainPlay.addEventListener('click', play);
  elements.previous.addEventListener('click', () => render(currentIndex - 1));
  elements.next.addEventListener('click', () => render(currentIndex + 1));
  render(0);
})();
