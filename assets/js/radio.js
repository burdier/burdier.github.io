(() => {
  const radio = document.querySelector('.radio');
  const source = document.getElementById('radio-tracks');
  if (!radio || !source) return;
  const find = (name) => radio.querySelector(`[data-radio-${name}]`);
  const el = Object.fromEntries(['player', 'cover', 'placeholder', 'placeholder-title', 'video', 'play', 'main-play', 'prev', 'next', 'count', 'style', 'title', 'artist', 'queue', 'link', 'status', 'progress', 'seek', 'elapsed', 'duration', 'up-next', 'autoplay'].map((name) => [name, find(name)]));
  let tracks;
  try {
    tracks = JSON.parse(source.textContent || '[]');
    if (!Array.isArray(tracks)) throw new Error('Invalid playlist');
    tracks = tracks.filter((track) => {
      try {
        const url = new URL(track.url);
        return ['https:', 'http:'].includes(url.protocol) && typeof track.title === 'string' && /^(www\.)?(youtube\.com|youtu\.be|audiomack\.com)$/.test(url.hostname);
      } catch (_) { return false; }
    });
  } catch (_) {
    el.status.textContent = 'No pudimos cargar la selección. Vuelve a intentarlo recargando la página.';
    return;
  }
  if (!tracks.length) {
    el.title.textContent = 'Nuevos sonidos en camino';
    el.status.textContent = 'Todavía no hay lanzamientos en esta selección. Vuelve pronto.';
    return;
  }

  const platform = (track) => new URL(track.url).hostname.replace(/^www\./, '') === 'audiomack.com' ? 'audiomack' : 'youtube';
  const platformLabel = (track) => platform(track) === 'youtube' ? 'YouTube' : 'Audiomack';
  const videoId = (track) => {
    const url = new URL(track.url);
    return url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).pop();
  };
  const time = (seconds) => {
    const value = Math.max(0, Math.floor(Number(seconds) || 0));
    return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
  };
  const save = (key, value) => { try { localStorage.setItem(`don3b-radio-${key}`, value); } catch (_) { /* Storage may be unavailable. */ } };
  const read = (key) => { try { return localStorage.getItem(`don3b-radio-${key}`); } catch (_) { return null; } };
  let index = Math.max(0, tracks.findIndex((track) => track.url === read('track')));
  let activePlayer = null;
  let request = 0;
  let state = 'idle';
  let apiPromise = null;
  let readinessTimer;
  let progressTimer;
  const queueButtons = [];
  el.autoplay.checked = read('autoplay') !== 'false';
  el.autoplay.addEventListener('change', () => save('autoplay', String(el.autoplay.checked)));

  const setState = (next, message) => {
    state = next;
    el.player.dataset.state = state;
    el.status.textContent = message;
    const labels = { idle: '▶ Reproducir', loading: 'Cargando…', playing: 'Ⅱ Pausar', paused: '▶ Continuar', embedded: '■ Detener', error: '↻ Reintentar' };
    el['main-play'].textContent = labels[state];
    el['main-play'].disabled = state === 'loading';
    el.play.disabled = state === 'loading';
    queueButtons.forEach((button, i) => {
      button.querySelector('.radio_queue-play').textContent = i === index && state === 'playing' ? 'Ⅱ' : '▶';
      button.setAttribute('aria-label', `${i === index && state === 'playing' ? 'Pausar' : 'Escuchar'} ${tracks[i].title}`);
    });
  };
  const clearPlayer = () => {
    request += 1;
    clearTimeout(readinessTimer);
    clearInterval(progressTimer);
    if (activePlayer) activePlayer.destroy();
    activePlayer = null;
    el.video.replaceChildren();
    el.video.hidden = true;
    el.play.hidden = false;
    el.seek.disabled = true;
    el.seek.value = 0;
    el.elapsed.textContent = '0:00';
    el.duration.textContent = '0:00';
  };
  const fail = () => {
    clearPlayer();
    setState('error', 'No pudimos abrir este lanzamiento. Reintenta o usa el enlace al original.');
  };
  const loadApi = () => {
    if (window.YT?.Player) return Promise.resolve(window.YT);
    if (apiPromise) return apiPromise;
    apiPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const previousReady = window.onYouTubeIframeAPIReady;
      let settled = false;
      const finish = (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (window.onYouTubeIframeAPIReady === ready) window.onYouTubeIframeAPIReady = previousReady;
        if (error) { script.remove(); reject(error); } else resolve(window.YT);
      };
      const ready = () => {
        try { if (typeof previousReady === 'function') previousReady(); }
        finally { finish(); }
      };
      const timer = setTimeout(() => finish(new Error('YouTube timeout')), 15000);
      window.onYouTubeIframeAPIReady = ready;
      script.src = 'https://www.youtube.com/iframe_api';
      script.onerror = () => finish(new Error('YouTube unavailable'));
      document.head.append(script);
    }).catch((error) => { apiPromise = null; throw error; });
    return apiPromise;
  };
  const updateProgress = () => {
    if (!activePlayer?.getDuration) return;
    const duration = activePlayer.getDuration();
    const elapsed = activePlayer.getCurrentTime();
    el.seek.disabled = !(duration > 0);
    el.seek.max = duration || 100;
    if (document.activeElement !== el.seek) el.seek.value = elapsed || 0;
    el.seek.setAttribute('aria-valuetext', `${time(elapsed)} de ${time(duration)}`);
    el.elapsed.textContent = time(elapsed);
    el.duration.textContent = time(duration);
  };
  const render = (nextIndex) => {
    clearPlayer();
    index = (nextIndex + tracks.length) % tracks.length;
    const track = tracks[index];
    const provider = platform(track);
    save('track', track.url);
    el.player.dataset.platform = provider;
    el['placeholder-title'].textContent = track.title;
    el.placeholder.hidden = false;
    el.cover.hidden = true;
    el.cover.onload = null;
    el.cover.onerror = null;
    el.cover.removeAttribute('src');
    if (provider === 'youtube') {
      const renderRequest = request;
      el.cover.onload = () => {
        if (renderRequest !== request) return;
        el.cover.hidden = false;
        el.placeholder.hidden = true;
      };
      el.cover.onerror = () => { el.cover.hidden = true; };
      el.cover.src = `https://i.ytimg.com/vi/${encodeURIComponent(videoId(track))}/hqdefault.jpg`;
    }
    el.cover.alt = `Portada de ${track.title}`;
    el.count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(tracks.length).padStart(2, '0')}`;
    el.style.textContent = track.style || 'Trap';
    el.title.textContent = track.title;
    el.artist.textContent = track.artist || 'Don 3B';
    el.link.href = track.url;
    el.link.hidden = false;
    el.link.textContent = `Abrir en ${platformLabel(track)} ↗`;
    el.link.setAttribute('aria-label', `Abrir ${track.title} en ${platformLabel(track)} (nueva pestaña)`);
    el.play.setAttribute('aria-label', `Reproducir ${track.title}`);
    el.progress.hidden = provider !== 'youtube';
    el.prev.disabled = el.next.disabled = tracks.length < 2;
    const upcoming = tracks[(index + 1) % tracks.length];
    el['up-next'].textContent = tracks.length > 1 ? upcoming.title : 'Sigue en sintonía';
    queueButtons.forEach((button, i) => {
      button.classList.toggle('is-current', i === index);
      if (i === index) button.setAttribute('aria-current', 'true'); else button.removeAttribute('aria-current');
    });
    setState('idle', provider === 'audiomack' ? 'Dale play y deja correr el trap.' : 'Dale play cuando estés listo.');
  };
  const move = (direction) => { render(index + direction); play(); };
  const play = async () => {
    if (state === 'loading') return;
    if (state === 'embedded') { render(index); return; }
    if (activePlayer) {
      if (state === 'playing') activePlayer.pauseVideo(); else activePlayer.playVideo();
      return;
    }
    const token = ++request;
    const track = tracks[index];
    setState('loading', 'Conectando con tu música…');
    el.play.hidden = true;
    const isCurrent = () => token === request;
    if (platform(track) === 'audiomack') {
      const iframe = document.createElement('iframe');
      const url = new URL(track.url);
      const [artist, kind, ...slug] = url.pathname.split('/').filter(Boolean);
      iframe.src = `https://audiomack.com/embed/${kind === 'album' ? 'album' : 'song'}/${artist}/${slug.join('/')}?autoplay=1`;
      iframe.title = `${track.title} — ${track.artist}`;
      iframe.allow = 'autoplay; encrypted-media; fullscreen';
      iframe.addEventListener('load', () => {
        if (!isCurrent()) return;
        clearTimeout(readinessTimer);
        setState('embedded', 'Dale play en el reproductor. Las canciones siguen ahí mismo.');
      });
      iframe.addEventListener('error', () => { if (isCurrent()) fail(); });
      readinessTimer = setTimeout(() => { if (isCurrent()) fail(); }, 20000);
      el.video.hidden = false;
      el.video.replaceChildren(iframe);
      return;
    }
    try {
      const YT = await loadApi();
      if (!isCurrent()) return;
      const mount = document.createElement('div');
      el.video.hidden = false;
      el.video.replaceChildren(mount);
      readinessTimer = setTimeout(() => { if (isCurrent()) fail(); }, 20000);
      activePlayer = new YT.Player(mount, {
        host: 'https://www.youtube-nocookie.com', videoId: videoId(track),
        playerVars: { autoplay: 1, rel: 0, playsinline: 1, origin: window.location.origin },
        events: {
          onReady: (event) => {
            if (!isCurrent()) return;
            clearTimeout(readinessTimer);
            const iframe = event.target.getIframe();
            if (iframe) iframe.title = `${track.title} — ${track.artist}`;
            setState('paused', 'Pulsa reproducir si tu navegador no inicia el audio.');
            progressTimer = setInterval(updateProgress, 500);
            event.target.playVideo();
          },
          onStateChange: (event) => {
            if (!isCurrent()) return;
            if (event.data === YT.PlayerState.PLAYING) setState('playing', 'Sonando. Quédate en esta página para seguir escuchando.');
            if (event.data === YT.PlayerState.PAUSED) setState('paused', 'En pausa. Sigue cuando quieras.');
            if (event.data === YT.PlayerState.ENDED) {
              if (el.autoplay.checked && tracks.length > 1) move(1);
              else setState('paused', 'La pista terminó. Puedes repetirla o elegir otra.');
            }
          },
          onAutoplayBlocked: () => { if (isCurrent()) setState('paused', 'Tu navegador requiere un toque más: pulsa reproducir en el video.'); },
          onError: () => { if (isCurrent()) fail(); }
        }
      });
    } catch (_) { if (isCurrent()) fail(); }
  };
  tracks.forEach((track, i) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.innerHTML = '<span class="radio_queue-number" aria-hidden="true"></span><span class="radio_queue-copy"><strong></strong><small></small></span><span class="radio_queue-play" aria-hidden="true">▶</span>';
    button.querySelector('.radio_queue-number').textContent = String(i + 1).padStart(2, '0');
    button.querySelector('strong').textContent = track.title;
    button.querySelector('small').textContent = `${track.artist || 'Don 3B'} · ${track.style || 'Trap'}`;
    button.addEventListener('click', () => {
      if (i === index && state === 'embedded') { el.video.querySelector('iframe')?.focus(); return; }
      if (i !== index) render(i);
      play();
    });
    queueButtons.push(button);
    item.append(button);
    el.queue.append(item);
  });
  el.play.addEventListener('click', play);
  el['main-play'].addEventListener('click', play);
  el.prev.addEventListener('click', () => move(-1));
  el.next.addEventListener('click', () => move(1));
  el.seek.addEventListener('input', () => {
    if (!activePlayer || el.seek.disabled) return;
    activePlayer.seekTo(Number(el.seek.value), true);
    el.elapsed.textContent = time(el.seek.value);
  });
  window.addEventListener('pagehide', clearPlayer);
  window.addEventListener('pageshow', (event) => { if (event.persisted) render(index); });
  render(index);
})();
