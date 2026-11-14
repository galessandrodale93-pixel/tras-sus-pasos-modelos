// Tras sus pasos · Worker "tsp-salas" (Cloudflare): el "presentador" propio de las salas multijugador.
// Habla el mismo idioma que el servidor de PeerJS, así el juego solo cambia a qué dirección se conecta.
// Todas las conexiones viven en un único Durable Object (Hub): pasa las ofertas, respuestas y candidatos
// de un jugador al otro. Después de presentarse, los jugadores se hablan directo (o por el relevo TURN).
// GET /ice → servidores STUN/TURN para conectar aunque la red sea difícil (colegios, datos móviles).

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': '*' };
const KEY = 'peerjs';

export default {
  async fetch(req, env) {
    const url = new URL(req.url), p = url.pathname;
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (p === '/' || p === '/salud') return new Response('ok', { headers: CORS });
    // un id al azar para quien entra a una sala (PeerJS lo pide antes de conectarse)
    if (p === `/${KEY}/id`) return new Response(crypto.randomUUID(), { headers: { ...CORS, 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' } });
    if (p === '/ice') return ice(env);
    if (p === '/peerjs') {
      if (req.headers.get('Upgrade') !== 'websocket') return new Response('Se espera WebSocket', { status: 426, headers: CORS });
      if (url.searchParams.get('key') !== KEY) return new Response('Clave inválida', { status: 401, headers: CORS });
      const hub = env.HUB.get(env.HUB.idFromName('salas'));
      return hub.fetch(req);
    }
    return new Response('No encontrado', { status: 404, headers: CORS });
  }
};

/* credenciales TURN de Cloudflare (Realtime), válidas por 24 h. Sin la clave configurada, solo STUN. */
async function ice(env) {
  const stun = [{ urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302'] }];
  let servers = stun;
  if (env.TURN_KEY_ID && env.TURN_KEY_TOKEN) {
    try {
      const r = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${env.TURN_KEY_ID}/credentials/generate-ice-servers`, {
        method: 'POST', headers: { Authorization: `Bearer ${env.TURN_KEY_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ttl: 86400 })
      });
      if (r.ok) { const j = await r.json(); servers = stun.concat(j.iceServers ? [].concat(j.iceServers) : []); }
    } catch (e) { }
  }
  return new Response(JSON.stringify({ iceServers: servers }), { headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

/* el punto de encuentro: un WebSocket por jugador, etiquetado con su id */
export class Hub {
  constructor(state) { this.state = state; }
  async fetch(req) {
    const url = new URL(req.url), id = url.searchParams.get('id') || '', token = url.searchParams.get('token') || '';
    if (!/^[\w\-]{1,64}$/.test(id)) return new Response('id inválido', { status: 400 });
    const pair = new WebSocketPair(), [client, server] = Object.values(pair);
    const prev = this.state.getWebSockets(id);
    // si el id ya está en uso por otra conexión viva, avisar (pasa al crear una sala con un código repetido)
    const alive = prev.filter(w => { try { const a = w.deserializeAttachment() || {}; return a.token !== token; } catch (e) { return true; } });
    this.state.acceptWebSocket(server, [id]);
    if (alive.length) { server.send(JSON.stringify({ type: 'ID-TAKEN', payload: { msg: 'ID is taken' } })); server.close(1000, 'id-taken'); }
    else {
      prev.forEach(w => { try { w.close(1000, 'reconectado'); } catch (e) { } }); // misma persona reconectando
      server.serializeAttachment({ id, token });
      server.send(JSON.stringify({ type: 'OPEN' }));
    }
    return new Response(null, { status: 101, webSocket: client });
  }
  async webSocketMessage(ws, raw) {
    let m; try { m = JSON.parse(typeof raw === 'string' ? raw : new TextDecoder().decode(raw)); } catch (e) { return; }
    if (!m || m.type === 'HEARTBEAT') return;
    const me = (ws.deserializeAttachment() || {}).id; if (!me || !m.dst) return;
    if (!['OFFER', 'ANSWER', 'CANDIDATE', 'LEAVE', 'EXPIRE'].includes(m.type)) return;
    const to = this.state.getWebSockets(m.dst).filter(w => { try { return (w.deserializeAttachment() || {}).id === m.dst; } catch (e) { return false; } });
    if (to.length) { const out = JSON.stringify({ type: m.type, src: me, dst: m.dst, payload: m.payload }); to.forEach(w => { try { w.send(out); } catch (e) { } }); }
    else if (m.type !== 'LEAVE' && m.type !== 'EXPIRE') ws.send(JSON.stringify({ type: 'EXPIRE', src: m.dst, dst: me })); // la sala no existe
  }
  async webSocketClose(ws) { try { ws.close(1000, 'chau'); } catch (e) { } }
  async webSocketError(ws) { try { ws.close(1011, 'error'); } catch (e) { } }
}
