/* Campus Habitat · sesión de alumno contra la web de Habitat (Wix headless, OAuth). */
(function () {
  var CLIENT = '5aef9a95-3bae-4199-b47d-0ef2db70dc76';
  var API = 'https://www.wixapis.com';
  var GOOGLE = '0e6a50f5-b523-4e29-990d-f37fa2ffdd69';
  var K = 'habitat:tok', KM = 'habitat:mtok', KP = 'habitat:pkce';
  var CB = location.origin + '/ingresar.html';

  function get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function now() { return Math.floor(Date.now() / 1000); }
  function pack(j) { return { a: j.access_token, r: j.refresh_token, e: now() + (j.expires_in || 14400) - 120 }; }

  async function post(url, body, auth) {
    var h = { 'content-type': 'application/json' };
    if (auth) h.authorization = auth;
    var r = await fetch(API + url, { method: 'POST', headers: h, body: JSON.stringify(body) });
    var t = await r.text(), j = {};
    try { j = t ? JSON.parse(t) : {}; } catch (e) { j = { raw: t }; }
    if (!r.ok) { var err = new Error((j.message || j.details && JSON.stringify(j.details) || ('HTTP ' + r.status))); err.status = r.status; err.body = j; throw err; }
    return j;
  }
  async function token(body) { return pack(await post('/oauth2/token', Object.assign({ clientId: CLIENT }, body))); }

  async function visitor() {
    var t = get(K);
    if (t && t.e > now()) return t.a;
    try { if (t && t.r) { t = await token({ grantType: 'refresh_token', refreshToken: t.r }); set(K, t); return t.a; } } catch (e) {}
    t = await token({ grantType: 'anonymous' }); set(K, t); return t.a;
  }
  async function member() {
    var t = get(KM);
    if (!t) return null;
    if (t.e > now()) return t.a;
    try { t = await token({ grantType: 'refresh_token', refreshToken: t.r }); set(KM, t); return t.a; }
    catch (e) { set(KM, null); return null; }
  }
  async function auth() { return (await member()) || (await visitor()); }

  function b64u(buf) { return btoa(String.fromCharCode.apply(null, new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function rnd(n) { var a = new Uint8Array(n); crypto.getRandomValues(a); return b64u(a); }
  async function pkce() {
    var v = rnd(48), s = rnd(16);
    var c = b64u(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v)));
    set(KP, { v: v, s: s }); return { verifier: v, challenge: c, state: s };
  }
  async function redirect(extra) {
    var p = await pkce();
    var req = Object.assign({ redirectUri: CB, clientId: CLIENT, codeChallenge: p.challenge, codeChallengeMethod: 'S256', responseMode: 'fragment', responseType: 'code', scope: 'offline_access', state: p.state }, extra);
    var r = await post('/_api/redirects-api/v1/redirect-session', { auth: { authRequest: req } }, await visitor());
    location.href = r.redirectSession.fullUrl;
  }

  var H = {
    async loginEmail(email, password) {
      var r = await post('/_api/iam/authentication/v2/login', { loginId: { email: email }, password: password }, await visitor());
      if (r.state === 'SUCCESS') return redirect({ sessionToken: r.sessionToken });
      return r.state;
    },
    loginGoogle() { return redirect({ idp: GOOGLE }); },
    async recover(email) {
      await post('/_api/iam/recovery/v1/send-email', { email: email, redirect: { url: CB, clientId: CLIENT } }, await visitor());
    },
    async callback() {
      var q = new URLSearchParams(location.hash.slice(1));
      if (!q.get('code') && !q.get('error')) return false;
      history.replaceState(null, '', location.pathname);
      try { sessionStorage.setItem('habitat:cb', JSON.stringify({ e: q.get('error'), d: q.get('error_description'), c: !!q.get('code'), s: q.get('state') })); } catch (e) {}
      if (q.get('error')) throw new Error(q.get('error_description') || q.get('error'));
      var p = get(KP); set(KP, null);
      if (!p || p.s !== q.get('state')) throw new Error('state');
      set(KM, await token({ grantType: 'authorization_code', code: q.get('code'), codeVerifier: p.v, redirectUri: CB }));
      return true;
    },
    async logout() {
      set(KM, null);
      try {
        var r = await post('/_api/redirects-api/v1/redirect-session', { logout: { clientId: CLIENT }, callbacks: { postFlowUrl: location.origin + '/index.html' } }, await visitor());
        location.href = r.redirectSession.fullUrl; return;
      } catch (e) {}
      location.href = '/index.html';
    },
    loggedIn() { return !!get(KM); },
    async api(method, url, body) {
      var a = await auth();
      var r = await fetch(API + url, { method: method, headers: { 'content-type': 'application/json', authorization: a }, body: body ? JSON.stringify(body) : undefined });
      var t = await r.text(), j = {};
      try { j = t ? JSON.parse(t) : {}; } catch (e) {}
      if (!r.ok) { var err = new Error(j.message || ('HTTP ' + r.status)); err.status = r.status; err.body = j; throw err; }
      return j;
    }
  };
  window.HabitatAuth = H;
})();
