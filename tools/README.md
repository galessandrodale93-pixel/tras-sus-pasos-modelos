# Herramientas de Tras sus pasos

- **voice/**: narración grabada (voces aprobadas: narrador = em_santa, varón = em_alex, mujer = ef_dora; Kokoro es-419).
  1. `node voice/extract.js` → junta los textos del juego en `texts.json` (historias, desafíos, exámenes, instrucciones, lugares, misiones, tutorial, avisos).
  2. `python3 voice/gen.py` → genera `<hash>.mp3` (mono 64 kbps) solo para los textos nuevos; el hash es FNV-1a de "voz|texto", igual que en `app/game.js` (`voH`).
  3. `python3 voice/pack.py` → copia a `app/voice/` y escribe `app/voice/index.json`.
  Textos con el nombre del jugador u otros datos variables no se graban: los lee la voz del aparato.
- **ph/**: modelos de Poly Haven (CC0). `phdl.py` baja el glTF 1k, `phconv.py` reduce polígonos y texturas (webp) en Blender; después `gltfpack -kn -km` cuantiza. Salida en `ph/`.
- **anim/**: `mixretarget.py` pasa los FBX de Mixamo al esqueleto del héroe (`hero/hero_anims3.glb`).
