/* Después de armar el programa y antes del instalador:
   1) "fusibles" de Electron: el programa no se puede abrir como Node, ni con herramientas de depuración, ni cargar
      código fuera de su paquete; las cookies (la sesión) quedan cifradas.
   2) Mac sin cuenta de Apple: firma "ad hoc". Sin ninguna firma, los Mac con chip Apple dicen que el programa está
      "dañado"; con esta firma muestran el aviso común de «desarrollador no verificado», que se saltea desde
      Configuración del Sistema → Privacidad y seguridad → «Abrir igual». */
const { execFileSync } = require('child_process');
const path = require('path');
const { flipFuses, FuseVersion, FuseV1Options } = require('@electron/fuses');
exports.default = async ctx => {
  const mac = ctx.electronPlatformName === 'darwin';
  if (mac && /-temp$/.test(ctx.appOutDir)) return; /* en la versión universal se toca solo la final */
  const nombre = ctx.packager.appInfo.productFilename;
  const exe = mac ? path.join(ctx.appOutDir, nombre + '.app') : path.join(ctx.appOutDir, nombre + '.exe');
  await flipFuses(exe, {
    version: FuseVersion.V1, resetAdHocDarwinSignature: mac,
    [FuseV1Options.RunAsNode]: false,
    [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
    [FuseV1Options.EnableNodeCliInspectArguments]: false,
    [FuseV1Options.EnableCookieEncryption]: true,
    [FuseV1Options.OnlyLoadAppFromAsar]: true
  });
  if (mac) {
    execFileSync('codesign', ['--force', '--deep', '--sign', '-', exe], { stdio: 'inherit' });
    execFileSync('codesign', ['--verify', '--deep', '--verbose=1', exe], { stdio: 'inherit' });
  }
};
