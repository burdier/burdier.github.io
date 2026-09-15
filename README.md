# Burdier Church

## Administrar la radio

Las publicaciones de la sección Radio se administran en `_data/radio.yml`. Cada entrada requiere `url`, `title`, `artist`, `style` y `platform`; actualmente el reproductor admite `youtube` y `audiomack`.

Para un álbum, agrega `type: "album"`. Audiomack muestra su lista de canciones y sus controles dentro del reproductor. Al terminar el álbum, se pasa al siguiente lanzamiento con **Siguiente**; el avance automático entre lanzamientos está disponible al terminar una pista de YouTube. La selección y la preferencia de avance se recuerdan en este navegador, sin iniciar audio al abrir la página.
