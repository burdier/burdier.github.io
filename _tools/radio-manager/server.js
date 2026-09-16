'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile, spawn } = require('child_process');

const HOST = '127.0.0.1';
const PORT = Number(process.env.RADIO_MANAGER_PORT || 4317);
const ROOT = path.resolve(__dirname, '..', '..');
const DATA_FILE = path.join(ROOT, '_data', 'radio.yml');
const STATIC_DIR = __dirname;
const MAX_BODY = 5 * 1024 * 1024;

const staticFiles = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']]
]);

function send(response, status, body, type = 'text/plain; charset=utf-8') {
  response.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  response.end(body);
}

function sendJson(response, status, value) {
  send(response, status, JSON.stringify(value), 'application/json; charset=utf-8');
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body) > MAX_BODY) {
        reject(new Error('La solicitud es demasiado grande.'));
        request.destroy();
      }
    });
    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (_) {
        reject(new Error('Los datos enviados no son JSON válido.'));
      }
    });
    request.on('error', reject);
  });
}

function yamlValue(raw) {
  const value = raw.trim();
  if (value.startsWith('"')) return JSON.parse(value);
  return value;
}

function parseTracks(text) {
  const tracks = [];
  let current = null;

  for (const line of text.split(/\r?\n/)) {
    const start = line.match(/^-\s+url:\s*(.+)$/);
    if (start) {
      if (current) tracks.push(current);
      current = { url: yamlValue(start[1]) };
      continue;
    }

    const field = line.match(/^\s{2}([a-zA-Z0-9_]+):\s*(.+)$/);
    if (current && field) current[field[1]] = yamlValue(field[2]);
  }

  if (current) tracks.push(current);
  return tracks;
}

function validateTracks(value) {
  if (!Array.isArray(value) || value.length > 2000) {
    throw new Error('La lista de pistas no es válida.');
  }

  return value.map((track, index) => {
    const clean = {
      url: String(track.url || '').trim(),
      title: String(track.title || '').trim(),
      artist: String(track.artist || 'Don 3B').trim(),
      style: String(track.style || 'Trap').trim(),
      platform: 'audio'
    };

    if (!clean.title) throw new Error(`La pista ${index + 1} no tiene título.`);
    if (!/^https:\/\//i.test(clean.url)) {
      throw new Error(`La URL de “${clean.title}” debe comenzar con https://`);
    }
    for (const [key, field] of Object.entries(clean)) {
      if (field.length > 2000 || /[\r\n]/.test(field)) {
        throw new Error(`El campo ${key} de “${clean.title}” no es válido.`);
      }
    }
    return clean;
  });
}

function serializeTracks(tracks) {
  const blocks = tracks.map((track) => [
    `- url: ${JSON.stringify(track.url)}`,
    `  title: ${JSON.stringify(track.title)}`,
    `  artist: ${JSON.stringify(track.artist)}`,
    `  style: ${JSON.stringify(track.style)}`,
    '  platform: "audio"'
  ].join('\n'));

  return `# Archivos WAV servidos directamente desde Cloudflare R2.\n${blocks.join('\n')}\n`;
}

async function saveTracks(rawTracks) {
  const tracks = validateTracks(rawTracks);
  const temporary = `${DATA_FILE}.tmp`;
  await fs.promises.writeFile(temporary, serializeTracks(tracks), 'utf8');
  await fs.promises.rename(temporary, DATA_FILE);
  return tracks.length;
}

function git(args, allowExitOne = false) {
  return new Promise((resolve, reject) => {
    execFile('git', args, { cwd: ROOT, windowsHide: true }, (error, stdout, stderr) => {
      if (error && !(allowExitOne && error.code === 1)) {
        reject(new Error((stderr || stdout || error.message).trim()));
        return;
      }
      resolve({ code: error ? error.code : 0, stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}

async function publish(tracks, rawMessage) {
  const count = await saveTracks(tracks);
  const branch = (await git(['rev-parse', '--abbrev-ref', 'HEAD'])).stdout;
  if (branch !== 'master') throw new Error(`El repositorio está en “${branch}”; abre master antes de publicar.`);

  await git(['add', '--', '_data/radio.yml']);
  const diff = await git(['diff', '--cached', '--quiet'], true);
  if (diff.code === 0) return { count, changed: false, message: 'No había cambios nuevos para publicar.' };

  const message = String(rawMessage || 'Actualiza la emisora desde Radio Manager')
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .slice(0, 120) || 'Actualiza la emisora desde Radio Manager';

  const commit = await git(['commit', '-m', message]);
  await git(['push', 'origin', 'master']);
  const hash = (await git(['rev-parse', '--short', 'HEAD'])).stdout;
  return { count, changed: true, hash, message: commit.stdout.split(/\r?\n/)[0] || 'Publicado.' };
}

async function handleApi(request, response, pathname) {
  if (request.method === 'GET' && pathname === '/api/tracks') {
    const text = await fs.promises.readFile(DATA_FILE, 'utf8');
    const status = await git(['status', '--short', '--', '_data/radio.yml']);
    sendJson(response, 200, { tracks: parseTracks(text), dirtyOnDisk: Boolean(status.stdout) });
    return true;
  }

  if (request.method === 'POST' && pathname === '/api/save') {
    const body = await readJson(request);
    const count = await saveTracks(body.tracks);
    sendJson(response, 200, { ok: true, count, message: 'Cambios guardados en radio.yml.' });
    return true;
  }

  if (request.method === 'POST' && pathname === '/api/publish') {
    const body = await readJson(request);
    const result = await publish(body.tracks, body.message);
    sendJson(response, 200, { ok: true, ...result });
    return true;
  }

  return false;
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${HOST}:${PORT}`);

  try {
    if (url.pathname.startsWith('/api/')) {
      if (!await handleApi(request, response, url.pathname)) {
        sendJson(response, 404, { ok: false, error: 'Ruta no encontrada.' });
      }
      return;
    }

    if (url.pathname === '/cover.png') {
      const cover = await fs.promises.readFile(path.join(ROOT, 'assets', 'img', 'radio-horse.png'));
      send(response, 200, cover, 'image/png');
      return;
    }

    const file = staticFiles.get(url.pathname);
    if (!file) {
      send(response, 404, 'No encontrado.');
      return;
    }
    const content = await fs.promises.readFile(path.join(STATIC_DIR, file[0]));
    send(response, 200, content, file[1]);
  } catch (error) {
    sendJson(response, 500, { ok: false, error: error.message || 'Ocurrió un error.' });
  }
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`El puerto ${PORT} ya está ocupado. Cierra la otra ventana de Radio Manager.`);
  } else {
    console.error(error);
  }
  process.exitCode = 1;
});

server.listen(PORT, HOST, () => {
  const url = `http://${HOST}:${PORT}`;
  console.log(`\nDon 3B Radio Manager está abierto en ${url}`);
  console.log('Deja esta ventana abierta mientras editas. Presiona Ctrl+C para cerrar.\n');

  if (process.env.RADIO_MANAGER_NO_OPEN !== '1') {
    const opener = spawn('cmd.exe', ['/c', 'start', '', url], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true
    });
    opener.unref();
  }
});
