# Burdier Church

## Administrar la radio

Las publicaciones de la sección Radio se administran en `_data/radio.yml`. Cada entrada requiere `url`, `title`, `artist`, `style` y `platform`; actualmente el reproductor admite `youtube` y `audiomack`.

Cada canción ocupa una fila de la misma lista, incluidos los temas de Audiomack. Usa el enlace `/song/` individual para reproducirla con su embed. `available: false` muestra una canción no disponible y la omite al navegar.
