/* Mac sin cuenta de Apple: firma "ad hoc" del programa antes de armar el .dmg. Sin ninguna firma, los Mac con chip Apple
   dicen que el programa está "dañado"; con esta firma muestran el aviso común de «desarrollador no verificado», que se
   saltea desde Configuración del Sistema → Privacidad y seguridad → «Abrir igual». */
const { execFileSync } = require('child_process');
const path = require('path');
exports.default = async ctx => {
  if (ctx.electronPlatformName !== 'darwin') return;
  const app = path.join(ctx.appOutDir, ctx.packager.appInfo.productFilename + '.app');
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', app], { stdio: 'inherit' });
  execFileSync('codesign', ['--verify', '--deep', '--verbose=1', app], { stdio: 'inherit' });
};
