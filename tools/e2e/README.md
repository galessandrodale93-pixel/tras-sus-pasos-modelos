# Pruebas automáticas de Kids & Hero

`python3 tools/e2e/prueba.py` abre el juego con los archivos de este repositorio (sin publicar nada) en un Chrome
manejado por Playwright, entra como jugador nuevo y recorre lo principal como una persona:

| Prueba | Qué revisa |
|---|---|
| oficio | Cosechar cebada con la hoz gratis, que se junte y el campo desaparezca |
| panaderia | Pan de cebada y pan con levadura, con la espera de la masa |
| epica | La misión épica del panadero de punta a punta |
| aldea | Tres regalos de nivel 5 llevan a «Como familia» y dan la prenda |
| jope | Muelle con atún, pesca en la orilla y puesto del puerto |
| frutos | Escalón 6 practicando y 7 con una épica |
| celular | En pantalla de celular: sin zoom con doble toque y botones sin taparse |
| kids | Cosechar en Kids y que el campo vuelva a crecer |

Al final deja `tools/e2e/salida/informe.md` y una captura por prueba. Tarda unos 10 minutos.
Para correr solo algunas: `python3 tools/e2e/prueba.py jope kids`. La primera vez: `cd tools/e2e && npm i three@0.160.0`.
