# Tras Sus Pasos – modelos 3D

Modelos y animaciones de los personajes de Hero en el juego *Tras Sus Pasos* (Habitat CFM).

- Personajes, ropa, pelo y animaciones: [Quaternius](https://quaternius.com) — licencia CC0 (dominio público).
  - Universal Base Characters, Modular Character Outfits – Fantasy, Universal Animation Library.
- Optimizados para la web (texturas WebP, geometría cuantizada).
- `hero/gltf.js`: cargador glTF de three.js (MIT).

## Juego (carpeta `app/`)

Desde noviembre de 2026 la lógica del juego vive acá y el sitio de Wix solo la carga:

- `app/game.js`: lógica principal (perfiles, historia de cada etapa, minijuegos, exámenes).
- `app/walk3d.js` y `app/walk3d.css`: el mundo 3D, la música y los estilos.
- `index.html` del sitio tiene una sola línea con `<script type="module" src="https://cdn.jsdelivr.net/gh/galessandrodale93-pixel/tras-sus-pasos-modelos@COMMIT/app/game.js">` (y un respaldo en rawcdn.githack.com).

Para publicar una versión nueva: subir los cambios a `main`, copiar el hash del commit y reemplazarlo en esa línea del `index.html` del sitio.
La música de fondo está en la rama `musica` y se importó al Media Manager de Wix.

## Publicar la web de Habitat

El sitio del dominio habitat-cfm.org es el de Wix "Habitat" (metaSiteId `1a595c6b-303a-4413-b8cb-9146149fad06`). El build (`habitat-build.zip`) se sube ahí con UploadHeadlessWebsiteFiles (prepare + PUT + release). `habitat-astro/wix.config.json` apunta a ese sitio (appId `2f3ac74c-c10a-465d-b015-521a2e267af8`); para compilar hace falta `WIX_CLIENT_ID` con ese mismo appId.

## Capturas del juego para la web

Las de `app/lobby` y `promo` son viejas. Para sacar nuevas: abrir el juego en el Chrome de Gui con el link de tester, esperar 1–2 min a que cargue, ocultar la interfaz dejando visibles solo `#c3d` y `#fx`, y ubicar al personaje con `W3.tp(x, z)` (los lugares salen de `W3.pois()`). La cámara se controla con `W3.S().yaw / camDist / camPitch`. Al terminar, devolver al personaje a donde estaba.


## Pase Kids & Hero

Gratis hasta 4 horas de juego o hasta aprobar la etapa 6 (Parábolas). Después, modo recorrido: se recorre lo ya jugado, pero experiencia, niveles, atributos y denarios quedan congelados; los puntos quedan en espera y se acreditan al activar. Etapas nuevas cerradas. Hero: botón Pagar directo; Kids: detrás de una pregunta para grandes. El pago es una suscripción de Mercado Pago (plan "Kids & Hero · Pase familiar", $12.000/mes, cuenta 1 de Habitat) y el estado lo da `https://www.habitat-cfm.org/api/kh-pase` (colección KhPases del sitio Habitat). En Finanzas entra como tipo "Kids & Hero".
