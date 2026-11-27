/* Kids & Hero para Windows: abre el juego de habitat-cfm.org en una ventana propia, sin barras del navegador,
   usando la placa de video de la computadora. El juego y el progreso son los mismos que en la web: cada vez que se
   publica una versión nueva del juego, el programa la toma solo. */
const { app, BrowserWindow, shell, session, Menu, screen, ipcMain } = require('electron');
const cache = require('./cache');
const path = require('path');
const fs = require('fs');

const START = process.env.KH_START || 'https://www.habitat-cfm.org/jugar.html?app=win'; /* KH_START: solo para probar */
/* lugares que se abren dentro del programa: el juego, el inicio de sesión y el pago; lo demás va al navegador */
const ADENTRO = [/(^|\.)habitat-cfm\.org$/, /(^|\.)wix\.com$/, /(^|\.)wixapis\.com$/, /(^|\.)wixstatic\.com$/, /(^|\.)wixsite\.com$/,
  /(^|\.)accounts\.google\.com$/, /(^|\.)google\.com$/, /(^|\.)facebook\.com$/, /(^|\.)mercadopago\.com(\.ar)?$/, /(^|\.)mercadolibre\.com(\.ar)?$/];
const adentro = u => { try { const h = new URL(u).hostname; return ADENTRO.some(r => r.test(h)); } catch (e) { return false; } };

/* rendimiento: usar la placa de video aunque Chromium la tenga en su lista de dudosas, y la más potente en notebooks con dos */
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('force_high_performance_gpu');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

/* instalador (Squirrel): al instalar, actualizar o desinstalar, Windows abre el programa con una orden; creamos o
   borramos los accesos directos y salimos sin abrir ventanas */
function squirrel() {
  if (process.platform !== 'win32') return false;
  const cmd = process.argv[1] || ''; if (!/^--squirrel-/.test(cmd)) return false;
  const upd = path.resolve(path.dirname(process.execPath), '..', 'Update.exe'), exe = path.basename(process.execPath);
  const run = args => { try { require('child_process').spawn(upd, args, { detached: true }); } catch (e) {} };
  if (cmd === '--squirrel-install' || cmd === '--squirrel-updated') run(['--createShortcut', exe]);
  else if (cmd === '--squirrel-uninstall') run(['--removeShortcut', exe]);
  else if (cmd === '--squirrel-firstrun') return false;
  setTimeout(() => app.quit(), 1200); return true;
}
const INSTALANDO = squirrel();
if (!INSTALANDO && !app.requestSingleInstanceLock()) { app.quit(); }
if (!INSTALANDO) cache.preparar();

/* dos ventanas: el lanzador (sin marco de Windows, con la portada y la descarga) y el juego (pantalla completa) */
let lan = null, win = null;
const ICON = path.join(__dirname, 'build', 'icon.png');
const WP = { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false, spellcheck: false };
const ESTADO = () => path.join(app.getPath('userData'), 'ventana.json');
const leerEstado = () => { try { return JSON.parse(fs.readFileSync(ESTADO(), 'utf8')); } catch (e) { return null; } };
const guardarEstado = () => { try { if (!win) return; fs.writeFileSync(ESTADO(), JSON.stringify({ b: win.getNormalBounds(), full: win.isFullScreen() })); } catch (e) {} };
const uaLimpio = wc => wc.setUserAgent(wc.getUserAgent().replace(/\s*Electron\/\S+/, '').replace(/\s*kids-and-hero\/\S+/i, '').replace(/\s*Kids & Hero\/\S+/i, ''));

function lanzador() {
  const wa = screen.getPrimaryDisplay().workAreaSize, w = Math.min(1280, Math.round(wa.width * .92)), h = Math.min(Math.round(w * 9 / 16), Math.round(wa.height * .92));
  lan = new BrowserWindow({ width: w, height: h, center: true, frame: false, resizable: false, maximizable: false, fullscreenable: false, show: false,
    backgroundColor: '#0B0805', title: 'Kids & Hero', icon: ICON, roundedCorners: true, webPreferences: WP });
  Menu.setApplicationMenu(null);
  lan.once('ready-to-show', () => lan.show());
  lan.on('closed', () => { lan = null; });
  lan.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  lan.webContents.on('will-navigate', e => e.preventDefault());
  sincronizar();
}

/* al abrir: bajar el juego completo (o lo nuevo) mientras se ve la portada; al terminar entra solo en pantalla completa */
let enJuego = false, corriendo = false, fallo = false;
const prog = d => { try { if (lan && !lan.isDestroyed()) lan.webContents.send('kh-prog', d); } catch (e) {} };
async function sincronizar() {
  if (corriendo || !lan) return; corriendo = true; enJuego = false;
  await lan.loadFile(path.join(__dirname, 'descarga.html'), { query: { l: cache.idioma() } });
  const r = await cache.sincronizar(prog); corriendo = false;
  if ((r && r.offline) || fallo) { fallo = false; prog({ fase: 'offline' }); return; }
  setTimeout(entrar, r && r.nada ? 1600 : 2200);
}

function entrar() {
  if (enJuego || !lan) return; enJuego = true; prog({ fase: 'entrando' });
  const st = leerEstado(), wa = screen.getPrimaryDisplay().workAreaSize;
  win = new BrowserWindow({
    width: (st && st.b && st.b.width) || Math.min(1600, wa.width), height: (st && st.b && st.b.height) || Math.min(900, wa.height),
    x: st && st.b ? st.b.x : undefined, y: st && st.b ? st.b.y : undefined,
    minWidth: 960, minHeight: 540, show: false, backgroundColor: '#0E0C08', title: 'Kids & Hero', icon: ICON, autoHideMenuBar: true, webPreferences: WP
  });
  uaLimpio(win.webContents);
  /* que la pantalla completa se note al entrar: se muestra recién cuando el juego ya pintó algo, y el lanzador se va */
  let listo = false;
  const mostrar = () => { if (listo || !win) return; listo = true; win.setFullScreen(true); win.show(); win.focus(); setTimeout(() => { if (lan) lan.close(); }, 350); };
  win.once('ready-to-show', mostrar); setTimeout(mostrar, 12000);
  win.on('close', guardarEstado);
  win.on('closed', () => { win = null; });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (adentro(url)) return { action: 'allow', overrideBrowserWindowOptions: { autoHideMenuBar: true, backgroundColor: '#ffffff', width: 520, height: 720, parent: win } };
    shell.openExternal(url); return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => { if (!adentro(url)) { e.preventDefault(); shell.openExternal(url); } });

  /* sin conexión: volvemos al lanzador, que muestra el aviso con «Reintentar» */
  win.webContents.on('did-fail-load', (e, code, desc, url, main) => { if (main && code !== -3 && /^https:/.test(url)) volver(); });

  /* teclas: F11 pantalla completa, F5 recargar, Ctrl+R recargar */
  win.webContents.on('before-input-event', (e, i) => {
    if (i.type !== 'keyDown') return;
    if (i.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    else if (i.key === 'F5' || (i.control && i.key.toLowerCase() === 'r')) { win.webContents.reload(); e.preventDefault(); }
    else if (i.control && i.shift && i.key.toLowerCase() === 'i') e.preventDefault();
  });
  win.loadURL(START);
}
function volver() { fallo = true; const w = win; win = null; enJuego = false; if (!lan) lanzador(); else sincronizar(); if (w) { w.removeAllListeners('close'); w.destroy(); } }

ipcMain.on('kh-jugar', entrar);
ipcMain.on('kh-reintentar', () => { fallo = false; if (lan) sincronizar(); });
let langPend = '';
ipcMain.on('kh-lang', (e, l) => { if (!/^(es|en|pt)$/.test(l || '')) return; cache.idioma(l); if (lan && e.sender === lan.webContents) langPend = l; });
ipcMain.on('kh-lang-pend', e => { e.returnValue = langPend; langPend = ''; });
ipcMain.on('kh-min', e => { const w = BrowserWindow.fromWebContents(e.sender); if (w) w.minimize(); });
ipcMain.on('kh-cerrar', e => { const w = BrowserWindow.fromWebContents(e.sender); if (w) w.close(); });

app.on('second-instance', () => { const w = win || lan; if (w) { if (w.isMinimized()) w.restore(); w.focus(); } });
app.whenReady().then(() => {
  if (INSTALANDO) return;
  cache.iniciar();
  /* permisos que usa el juego: pantalla completa, bloquear el mouse, avisos, micrófono en las salas con amigos */
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb, det) => {
    const ok = ['fullscreen', 'pointerLock', 'notifications', 'media', 'clipboard-sanitized-write'].includes(perm) && adentro(det.requestingUrl || wc.getURL());
    cb(ok);
  });
  lanzador();
});
app.on('window-all-closed', () => { if (!enJuego || !win) app.quit(); });
