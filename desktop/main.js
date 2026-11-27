/* Kids & Hero para Windows: abre el juego de habitat-cfm.org en una ventana propia, sin barras del navegador,
   usando la placa de video de la computadora. El juego y el progreso son los mismos que en la web: cada vez que se
   publica una versión nueva del juego, el programa la toma solo. */
const { app, BrowserWindow, shell, session, Menu, screen } = require('electron');
const path = require('path');
const fs = require('fs');

const START = 'https://www.habitat-cfm.org/jugar.html?app=win';
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

if (!app.requestSingleInstanceLock()) { app.quit(); }

let win = null;
const ESTADO = () => path.join(app.getPath('userData'), 'ventana.json');
const leerEstado = () => { try { return JSON.parse(fs.readFileSync(ESTADO(), 'utf8')); } catch (e) { return null; } };
const guardarEstado = () => { try { if (!win) return; const b = win.getNormalBounds(); fs.writeFileSync(ESTADO(), JSON.stringify({ b, max: win.isMaximized(), full: win.isFullScreen() })); } catch (e) {} };

function crear() {
  const st = leerEstado(), wa = screen.getPrimaryDisplay().workAreaSize;
  win = new BrowserWindow({
    width: (st && st.b && st.b.width) || Math.min(1600, wa.width), height: (st && st.b && st.b.height) || Math.min(900, wa.height),
    x: st && st.b ? st.b.x : undefined, y: st && st.b ? st.b.y : undefined,
    minWidth: 960, minHeight: 540, show: false, backgroundColor: '#0E0C08', title: 'Kids & Hero',
    icon: path.join(__dirname, 'build', 'icon.png'), autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false, spellcheck: false }
  });
  Menu.setApplicationMenu(null);
  /* que Google y los demás vean un Chrome común (el inicio de sesión con Google no acepta navegadores "incrustados") */
  const ua = win.webContents.getUserAgent().replace(/\s*Electron\/\S+/, '').replace(/\s*kids-and-hero\/\S+/i, '').replace(/\s*Kids & Hero\/\S+/i, '');
  win.webContents.setUserAgent(ua);
  if (!st || st.max !== false) win.maximize();
  win.once('ready-to-show', () => { win.show(); if (st && st.full) win.setFullScreen(true); });
  win.on('close', guardarEstado);

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (adentro(url)) return { action: 'allow', overrideBrowserWindowOptions: { autoHideMenuBar: true, backgroundColor: '#ffffff', width: 520, height: 720, parent: win } };
    shell.openExternal(url); return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => { if (!adentro(url)) { e.preventDefault(); shell.openExternal(url); } });

  /* sin conexión: una pantalla propia con «Reintentar» */
  win.webContents.on('did-fail-load', (e, code, desc, url, main) => { if (main && code !== -3) win.loadFile(path.join(__dirname, 'offline.html')); });

  /* teclas: F11 pantalla completa, F5 recargar, Ctrl+R recargar */
  win.webContents.on('before-input-event', (e, i) => {
    if (i.type !== 'keyDown') return;
    if (i.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    else if (i.key === 'F5' || (i.control && i.key.toLowerCase() === 'r')) { win.webContents.reload(); e.preventDefault(); }
    else if (i.control && i.shift && i.key.toLowerCase() === 'i') e.preventDefault();
  });
  win.loadURL(START);
}

app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.whenReady().then(() => {
  /* permisos que usa el juego: pantalla completa, bloquear el mouse, avisos, micrófono en las salas con amigos */
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb, det) => {
    const ok = ['fullscreen', 'pointerLock', 'notifications', 'media', 'clipboard-sanitized-write'].includes(perm) && adentro(det.requestingUrl || wc.getURL());
    cb(ok);
  });
  crear();
});
app.on('window-all-closed', () => app.quit());
