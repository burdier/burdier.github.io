# Burdier Church

## Administrar la radio

Las publicaciones de la sección Radio se administran en `_data/radio.yml`. Cada entrada requiere `url`, `title`, `artist`, `style` y `platform`; actualmente el reproductor admite `youtube` y `audiomack`.

Los WAV se sirven directamente desde Cloudflare R2 y cada archivo ocupa una fila. El reproductor usa audio nativo para reproducir, pausar y avanzar automáticamente al siguiente tema.
