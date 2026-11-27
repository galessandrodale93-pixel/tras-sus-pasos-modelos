/* El juego sabe que corre en el programa de Windows; la pantalla de descarga recibe el avance. */
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('KH_DESKTOP', {
  plataforma: process.platform === 'darwin' ? 'mac' : 'windows', version: '1.2.0',
  onProgreso: cb => ipcRenderer.on('kh-prog', (e, d) => cb(d)),
  jugar: () => ipcRenderer.send('kh-jugar'),
  reintentar: () => ipcRenderer.send('kh-reintentar'),
  minimizar: () => ipcRenderer.send('kh-min'),
  cerrar: () => ipcRenderer.send('kh-cerrar'),
  idioma: l => ipcRenderer.send('kh-lang', l)
});
/* en el juego: el programa ya guarda todo el mundo en la compu (no hace falta el «¿Descargar el mundo?» de la web), y recordamos el idioma */
try {
  if (/(^|\.)habitat-cfm\.org$/.test(location.hostname)) {
    try { localStorage.setItem('tsp:dlAsk', '1'); } catch (e) {}
    /* si eligió el idioma en el lanzador, el juego arranca en ese idioma */
    try { const p = ipcRenderer.sendSync('kh-lang-pend'); if (p) localStorage.setItem('tsp:lang', p); } catch (e) {}
    const env = () => { try { ipcRenderer.send('kh-lang', localStorage.getItem('tsp:lang') || 'es'); } catch (e) {} };
    env(); window.addEventListener('beforeunload', env);
  }
} catch (e) {}
