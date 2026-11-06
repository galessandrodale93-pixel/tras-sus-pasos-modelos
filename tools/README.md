# Herramientas de Tras sus pasos

- **voice/**: narración grabada (voces aprobadas: narrador = em_santa, varón = em_alex, mujer = ef_dora; Kokoro es-419).
  1. `node voice/extract.js` → junta los textos del juego en `texts.json` (historias, desafíos, exámenes, instrucciones, lugares, misiones, tutorial, avisos).
  2. `python3 voice/gen.py` → genera `<hash>.mp3` (mono 64 kbps) solo para los textos nuevos; el hash es FNV-1a de "voz|texto", igual que en `app/game.js` (`voH`).
  3. `python3 voice/pack.py` → copia a `app/voice/` y escribe `app/voice/index.json`.
  Textos con el nombre del jugador u otros datos variables no se graban: los lee la voz del aparato.
- **ph/**: modelos de Poly Haven (CC0). `phdl.py` baja el glTF 1k, `phconv.py` reduce polígonos y texturas (webp) en Blender; después `gltfpack -kn -km` cuantiza. Salida en `ph/`.
- **anim/**: `mixretarget.py` pasa los FBX de Mixamo al esqueleto del héroe (`hero/hero_anims3.glb`).

## Assets de alta calidad (Poly Haven CC0) y compresión

Créditos: `CREDITOS-ASSETS.md`. Lista de archivos por calidad: `app/assets.json` (la usa "Descargar mundo completo").

- **Cielos (HDRI)**: los HDRI se bajan de `api.polyhaven.com/files/<id>` y se convierten con
  `python3 -I assets/hdr2sky.py <id>_<1k|2k|4k>.hdr app/sky/<sunrise|noon>_<res>.webp <exposición>` (tono ACES, el sol queda en el cielo).
- **Texturas PBR**: `python3 assets/phtex_dl.py id1,id2,...` (1k/2k/4k) y después
  `node assets/ktx.mjs <salida>` (KTX2: color en ETC1S sRGB, normales en UASTC+RDO+zstd). Las 4k (paquete HD) se codifican con `toktx` de KTX-Software
  (`toktx --t2 --encode etc1s --clevel 2 --qlevel 190 --genmipmap --assign_oetf srgb out.ktx2 in_4k.jpg`) porque el codificador wasm tiene un límite de 12 Mpx.
  Normales 1k: `toktx --t2 --encode uastc --uastc_quality 0 --uastc_rdo_l 5 --uastc_rdo_d 65536 --zcmp 20 --genmipmap --assign_oetf linear`.
  Carpetas: `tex/1k` (Bajo/Medio, y normales/rugosidad de todas), `tex/2k` (color de Alto), `hd/4k` (color de Ultra). `window.HD_BASE` permite mover el paquete HD a otro servidor (R2, Wix Media).
- **Modelos**: `python3 assets/phmod_dl.py id1,id2,...` y `gltfpack -i x.gltf -o ph/x.glb -kn -si <ratio> -cc -tc -tq 7 -ts 0.5` (gltfpack nativo, con meshopt y KTX2).
- **Lista de descarga**: `python3 tools/assets/manifest.py .` reescribe `app/assets.json` con el peso por calidad.
