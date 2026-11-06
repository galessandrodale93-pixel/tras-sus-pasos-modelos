# Bancos de preguntas de los exámenes de etapa

Cada etapa puede tener un archivo propio que **se suma** a las preguntas que ya trae el juego
(las 12 del examen y las preguntas de las paradas de esa etapa):

- `app/exams/hero/<etapa>.json` (Hero)
- `app/exams/kids/<etapa>.json` (Kids: solo se usan `mc`, `tf` y `match`)

Etapas: `nacimiento`, `infancia`, `bautismo`, `galilea`, `milagros`, `parabolas`, `jerusalen`, `cruz`, `resurreccion`.

El juego lee primero la versión de `main` en GitHub, así que **subir o cambiar un banco no necesita republicar el sitio**.
Si el archivo no existe, se usan solo las preguntas incluidas.

## Reglas del examen
- Hero: 12 preguntas + 1 reflexión; aprueba con 70 % (9 de 12). Kids: 8 preguntas; aprueba con 60 % (5 de 8).
- Si no aprueba, la etapa siguiente no se abre. Cada reintento elige preguntas nuevas al azar y evita las del intento anterior
  (hace falta un banco de al menos 3× el examen, unas 36 preguntas por etapa en Hero y 24 en Kids, para que no se repitan).
- Las opciones se mezclan en cada intento. El intento en curso se guarda: si sale del juego, sigue en la misma pregunta.
- Se guardan cantidad de intentos e historial (`progreso.exams.<etapa>`: `n`, `hist`, `last`, `best`, `passed`).

## Formato (un arreglo JSON, o `{ "questions": [ ... ] }`)
```json
[
  {"id":"nac-01","t":"mc","q":"¿Qué ángel le anunció a María…?","o":["Gabriel","Miguel","Rafael","Uriel"],"a":0,
   "exp":"Explicación corta que se muestra después de responder.","ref":"Lucas 1:26-27"},
  {"t":"tf","q":"Jesús nació en Nazaret.","a":false,"exp":"…","ref":"Mateo 2:1"},
  {"t":"match","q":"Uní cada personaje con lo que hizo","p":[["María","Aceptó…"],["José","Viajó…"]],"exp":"…"},
  {"t":"verse","parts":["¡El ",0," ha nacido hoy en Belén, la ciudad de ",1,"!"],"blanks":["Salvador","David"],
   "bank":["Salvador","David","Abraham","Moisés"],"exp":"…","ref":"Lucas 2:11"},
  {"t":"order","q":"Ordená lo que pasó","items":["Primero…","Después…","Al final…"],"exp":"…"},
  {"t":"app","q":"Situación real: …","o":["Respuesta buena","Otra","Otra"],"a":0,"exp":"…"},
  {"t":"reflect","q":"Pregunta personal, sin nota"}
]
```
- `t`: `mc` opción múltiple · `tf` verdadero/falso · `match` unir · `verse` completar pasaje · `order` ordenar · `app` situación · `reflect` reflexión.
- `a` en `mc`/`app` es el índice de la correcta (0 = la primera); también se acepta `"answer":"texto de la opción"`.
- `id` es opcional pero conviene (evita duplicados si se edita el texto).
- Citas bíblicas textuales solo en NTV verificada; si no, parafrasear sin comillas.
