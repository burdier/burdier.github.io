(() => {
  const player = document.querySelector('[data-radio-player]');
  const source = document.getElementById('radio-tracks');
  if (!player || !source) return;

  const tracks = JSON.parse(source.textContent || '[]');
  if (!tracks.length) return;

  const elements = {
    cover: player.querySelector('[data-radio-cover]'),
    placeholder: player.querySelector('[data-radio-placeholder]'),
    placeholderTitle: player.querySelector('[data-radio-placeholder-title]'),
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
  let activePlayer = null;
  let playbackRequest = 0;
  let youtubeApiPromise = null;

  const loadYouTubeApi = () => {
    if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
    if (youtubeApiPromise) return youtubeApiPromise;

    youtubeApiPromise = new Promise((resolve, reject) => {
      const previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof previousReady === 'function') previousReady();
        resolve(window.YT);
      };

      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.dataset.youtubeIframeApi = '';
      script.onerror = () => reject(new Error('No se pudo cargar el reproductor de YouTube.'));
      document.head.append(script);
    });
    return youtubeApiPromise;
  };

  const getVideoId = (url) => {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('youtu.be')) return parsed.pathname.slice(1);
      return parsed.searchParams.get('v') || parsed.pathname.split('/').filter(Boolean).pop();
    } catch (_) {
      return '';
    }
  };

  const getPlatform = (track) => {
    if (track.platform) return track.platform.toLowerCase();
    return track.url.includes('audiomack.com') ? 'audiomack' : 'youtube';
  };

  const getAudiomackEmbed = (url) => {
    try {
      const parsed = new URL(url);
      const [artist, kind, ...slug] = parsed.pathname.split('/').filter(Boolean);
      return artist && slug.length ? `https://audiomack.com/embed/${kind === 'album' ? 'album' : 'song'}/${artist}/${slug.join('/')}` : '';
    } catch (_) {
      return '';
    }
  };

  const stopVideo = () => {
    playbackRequest += 1;
    if (activePlayer && typeof activePlayer.destroy === 'function') activePlayer.destroy();
    activePlayer = null;
    elements.video.replaceChildren();
    elements.video.classList.remove('is-playing');
    elements.coverPlay.hidden = false;
  };

  const play = async () => {
    const requestId = playbackRequest;
    const track = tracks[currentIndex];
    if (track.available === false) return;
    const platform = getPlatform(track);
    const videoId = platform === 'youtube' ? getVideoId(track.url) : '';
    if (platform === 'youtube' && !videoId) return;

    elements.video.classList.add('is-playing');
    elements.coverPlay.hidden = true;

    if (platform === 'youtube') {
      try {
        const YT = await loadYouTubeApi();
        if (requestId !== playbackRequest) return;
        const mount = document.createElement('div');
        elements.video.replaceChildren(mount);
        activePlayer = new YT.Player(mount, {
          host: 'https://www.youtube-nocookie.com',
          videoId,
          playerVars: { autoplay: 1, rel: 0 },
          events: {
            onReady: (event) => { if (requestId === playbackRequest) event.target.playVideo(); },
            onStateChange: (event) => {
              if (requestId === playbackRequest && event.data === YT.PlayerState.ENDED) playNext();
            }
          }
        });
      } catch (_) {
        if (requestId !== playbackRequest) return;
        elements.video.classList.remove('is-playing');
        elements.coverPlay.hidden = false;
      }
      return;
    }

    const embedUrl = getAudiomackEmbed(track.url);
    if (!embedUrl) return;
    const iframe = document.createElement('iframe');
    iframe.src = `${embedUrl}?autoplay=1`;
    iframe.title = `${track.title} — ${track.artist}`;
    iframe.allow = 'autoplay; encrypted-media';
    iframe.allowFullscreen = true;
    elements.video.replaceChildren(iframe);
  };

  const adjacentIndex = (direction) => {
    let index = currentIndex;
    for (let i = 0; i < tracks.length; i += 1) {
      index = (index + direction + tracks.length) % tracks.length;
      if (tracks[index].available !== false) return index;
    }
    return currentIndex;
  };

  const playNext = () => {
    render(adjacentIndex(1));
    play();
  };

  const render = (index) => {
    currentIndex = (index + tracks.length) % tracks.length;
    const track = tracks[currentIndex];
    const platform = getPlatform(track);
    const videoId = platform === 'youtube' ? getVideoId(track.url) : '';
    stopVideo();
    player.dataset.format = platform === 'audiomack' && new URL(track.url).pathname.includes('/album/') ? 'album' : 'song';
    elements.placeholderTitle.textContent = track.title;
    elements.placeholder.hidden = platform === 'youtube';
    elements.cover.hidden = platform !== 'youtube';
    if (platform === 'youtube') {
      elements.cover.src = `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/maxresdefault.jpg`;
      elements.cover.onerror = () => {
        elements.cover.onerror = null;
        elements.cover.src = `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;
      };
      elements.cover.alt = `Portada de ${track.title}`;
    } else {
      elements.cover.removeAttribute('src');
      elements.cover.alt = '';
    }
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
    button.querySelector('small').textContent = track.available === false ? 'No disponible en Audiomack' : `${track.artist} · ${track.style || 'Trap'}`;
    button.disabled = track.available === false;
    button.addEventListener('click', () => {
      render(index);
      play();
    });
    item.append(button);
    elements.queue.append(item);
  });

  elements.coverPlay.addEventListener('click', play);
  elements.mainPlay.addEventListener('click', play);
  elements.previous.addEventListener('click', () => {
    render(adjacentIndex(-1));
    play();
  });
  elements.next.addEventListener('click', playNext);
  render(0);
})();
