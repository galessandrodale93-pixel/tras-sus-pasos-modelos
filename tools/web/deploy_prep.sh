#!/bin/bash
# Copia out/ al proyecto Astro, agrega ?v=<versión> a los assets propios y arma el zip de release.
set -e
V=$(date +%Y%m%d%H%M%S)
cd /home/claude/habitat-astro
mv public/js /tmp/jswix_keep && rm -rf public && cp -r /home/claude/habitat-site/out public && rm -rf public/js && mv /tmp/jswix_keep public/js
python3 - "$V" <<'PY'
import sys,glob,re
v=sys.argv[1]
for f in glob.glob('public/*.html'):
    s=open(f,encoding='utf-8').read()
    s=re.sub(r'((?:src|href)="/assets/[^"?]+\.(?:js|css))"', r'\1?v='+v+'"', s)
    open(f,'w',encoding='utf-8').write(s)
PY
rm -rf dist .wix
WIX_CLIENT_INSTANCE_ID=00000000-0000-0000-0000-000000000000 WIX_CLIENT_SECRET=x WIX_CLIENT_PUBLIC_KEY=x timeout 300 npx astro build >/tmp/astro_build.log 2>&1 || { tail -20 /tmp/astro_build.log; exit 1; }
find dist -name "*.map" -delete
cd /home/claude/tras-sus-pasos-modelos
rm -f habitat-build.zip
(cd /home/claude/habitat-astro && zip -qr /home/claude/tras-sus-pasos-modelos/habitat-build.zip .wix dist)
rm -rf habitat-web && cp -r /home/claude/habitat-site/out habitat-web
cp /home/claude/habitat-site/*.py tools/web/ && cp /home/claude/habitat-site/src/* tools/web/src/ && cp /home/claude/habitat-site/tools/deploy_prep.sh tools/web/
git add -A >/dev/null && git commit -qm "${1:-Web: actualización}

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01X8mVJQmvv7kVNXb6bWyxs2" && git push -q
echo "SIZE $(wc -c < habitat-build.zip) COMMIT $(git rev-parse HEAD)"
