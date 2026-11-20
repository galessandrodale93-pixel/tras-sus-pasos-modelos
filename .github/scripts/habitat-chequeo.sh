#!/usr/bin/env bash
# Control de la web de Habitat: que abran las páginas clave y que el link de pago de cuotas llegue a Mercado Pago.
# Si algo falla, el job queda en rojo y GitHub avisa por mail. Reintenta unas veces (después de publicar, la web tarda en despertar).
set -u
W="https://www.habitat-cfm.org"
MES=$(TZ=America/Argentina/Buenos_Aires date +%Y-%m)
mal=0
chequear() { # nombre, url, código esperado, texto que debe aparecer en el destino (opcional)
  local n="$1" u="$2" esp="$3" dest="${4:-}" code="" loc=""
  for i in 1 2 3 4; do
    read -r code loc < <(curl -sS --max-time 60 -o /tmp/body -w '%{http_code} %{redirect_url}\n' "$u" || echo "000 -")
    if [ "$code" = "$esp" ] && { [ -z "$dest" ] || [[ "$loc" == *"$dest"* ]]; }; then echo "✓ $n ($code)"; return 0; fi
    sleep 20
  done
  echo "::error::$n: esperaba $esp${dest:+ hacia $dest} y respondió $code ${loc}"; head -c 300 /tmp/body; echo
  mal=1
}
chequear "Inicio" "$W/" 200
chequear "Campus" "$W/campus.html" 200
chequear "Ingresar" "$W/ingresar.html" 200
chequear "Link de pago de cuota → Mercado Pago" "$W/api/pagar?a=prueba&m=$MES" 302 "mercadopago"
echo "### Control de la web: $([ $mal = 0 ] && echo 'todo bien ✓' || echo 'hay fallas ✗')" >> "${GITHUB_STEP_SUMMARY:-/dev/null}"
exit $mal
