import { createFormStore, FORM_ERROR, otherText, otherValue } from "/js/wix/form-store.js";

function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function inputType(c) { return ({ email: "email", url: "url", phone: "tel", password: "password", number: "number", date: "date", time: "time", datetime: "datetime-local" })[c] || "text"; }

function mount(root) {
  var formId = root.getAttribute("data-form-id");
  var thanks = root.getAttribute("data-thanks") || "¡Gracias! Recibimos tus datos.";
  var store = createFormStore({ formId: formId });
  var built = false;
  root.innerHTML = '<p class="ld">Cargando formulario…</p>';

  function mark(f, form) {
    if (!f.required || form.requiredIndicator === "NONE") return "";
    return form.requiredIndicator === "TEXT" ? " (obligatorio)" : " *";
  }

  function fieldHTML(f, s) {
    var v = s.values[f.target], id = "f_" + f.target.replace(/[^a-z0-9_]/gi, "_");
    var lab = '<label for="' + id + '"' + (f.showLabel === false ? ' class="sr"' : "") + ">" + esc(f.label) + mark(f, s.form) + "</label>";
    var ro = f.readOnly ? " disabled" : "", ph = f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : "";
    var h = "";
    switch (f.control) {
      case "textarea":
        h = lab + '<textarea id="' + id + '" name="' + esc(f.target) + '"' + ph + ro + (f.validation && f.validation.maxLength ? ' maxlength="' + f.validation.maxLength + '"' : "") + ">" + esc(v || "") + "</textarea>";
        break;
      case "select":
        h = lab + '<select id="' + id + '" name="' + esc(f.target) + '"' + ro + '><option value="">Elegí una opción</option>' + (f.choices || []).map(function (c) { return '<option value="' + esc(c.value) + '"' + (v === c.value ? " selected" : "") + ">" + esc(c.label) + "</option>"; }).join("") + "</select>";
        break;
      case "radio":
        h = "<fieldset style=\"border:0;padding:0;margin:0;display:grid;gap:8px\"><legend style=\"padding:0;margin-bottom:6px\"><label>" + esc(f.label) + mark(f, s.form) + "</label></legend>" + (f.choices || []).map(function (c, i) { return '<label class="ch" style="text-transform:none;letter-spacing:0;font-weight:400"><input type="radio" name="' + esc(f.target) + '" value="' + esc(c.value) + '"' + (v === c.value ? " checked" : "") + "> " + esc(c.label) + "</label>"; }).join("") + "</fieldset>";
        break;
      case "checkboxGroup":
      case "tags":
        h = "<fieldset data-group=\"" + esc(f.target) + "\" style=\"border:0;padding:0;margin:0;display:grid;gap:8px\"><legend style=\"padding:0;margin-bottom:6px\"><label>" + esc(f.label) + mark(f, s.form) + "</label></legend>" + (f.choices || []).map(function (c) { return '<label class="ch" style="text-transform:none;letter-spacing:0;font-weight:400"><input type="checkbox" data-multi="' + esc(f.target) + '" value="' + esc(c.value) + '"' + (Array.isArray(v) && v.indexOf(c.value) >= 0 ? " checked" : "") + "> " + esc(c.label) + "</label>"; }).join("") + "</fieldset>";
        break;
      case "checkbox":
        h = '<label class="ch" style="text-transform:none;letter-spacing:0;font-weight:400"><input id="' + id + '" type="checkbox" name="' + esc(f.target) + '"' + (v === true ? " checked" : "") + "> " + esc(f.label) + mark(f, s.form) + "</label>";
        break;
      case "payment": case "appointment": case "unknown": case "file": case "signature": case "address":
        h = lab + '<p class="hint">Este campo no está disponible en esta página.</p>';
        break;
      default:
        h = lab + '<input id="' + id + '" name="' + esc(f.target) + '" type="' + inputType(f.control) + '" value="' + esc(v == null ? "" : v) + '"' + ph + ro + ">";
    }
    if (f.description) h += '<p class="hint">' + esc(f.description) + "</p>";
    h += '<p class="err" role="alert" data-err="' + esc(f.target) + '" hidden></p>';
    return '<div class="row" data-row="' + esc(f.target) + '">' + h + "</div>";
  }

  function build(s) {
    var f = s.form, st = f.steps[s.step] || f.steps[0];
    var fields = f.fields.filter(function (x) { return !st || !x.stepId || x.stepId === st.id; });
    var last = s.step >= f.steps.length - 1;
    root.innerHTML = '<form class="fx" novalidate>' + fields.map(function (x) { return fieldHTML(x, s); }).join("") +
      '<p class="fe" data-fe hidden></p><div style="display:flex;gap:12px;flex-wrap:wrap">' +
      (s.step > 0 ? '<button type="button" class="btn btn-line" data-prev>' + esc(f.previousText || "Volver") + "</button>" : "") +
      '<button type="submit" class="btn btn-gold">' + esc(last ? (f.submitText || "Enviar") : (f.nextText || "Siguiente")) + "</button></div></form>";
    built = s.step + ":" + fields.map(function (x) { return x.target; }).join(",");
    var el = root.querySelector("form");
    el.addEventListener("input", function (e) {
      var t = e.target;
      if (t.dataset.multi) { var arr = Array.prototype.slice.call(el.querySelectorAll('[data-multi="' + t.dataset.multi + '"]:checked')).map(function (c) { return c.value; }); store.setValue(t.dataset.multi, arr); return; }
      if (!t.name) return;
      store.setValue(t.name, t.type === "checkbox" ? t.checked : t.value);
    });
    el.addEventListener("change", function (e) { var t = e.target; if (t.type === "radio" || t.tagName === "SELECT") store.setValue(t.name, t.value); });
    el.addEventListener("focusout", function (e) { var n = e.target.name || e.target.dataset.multi; if (n) store.validate(n); });
    el.addEventListener("submit", function (e) { var s2 = store.getState(); if (s2.form && s2.step < s2.form.steps.length - 1) store.next(e); else store.submit(e); });
    var pv = el.querySelector("[data-prev]"); if (pv) pv.addEventListener("click", function () { store.previous(); });
  }

  function render(s) {
    if (s.outcome) {
      if (s.outcome.url) { if (s.outcome.newTab) window.open(s.outcome.url, "_blank"); else location.href = s.outcome.url; return; }
      var msg = s.outcome.message ? String(s.outcome.message).split("\n").map(esc).join("<br>") : esc(thanks);
      root.innerHTML = '<div class="fx"><p class="ok">' + msg + "</p></div>";
      built = false;
      return;
    }
    if (!s.form) {
      root.innerHTML = s.errors && s.errors[FORM_ERROR] ? '<p class="fe">' + esc(s.errors[FORM_ERROR]) + "</p>" : '<p class="ld">Cargando formulario…</p>';
      built = false;
      return;
    }
    if (s.closed) { root.innerHTML = '<p class="fe">' + esc(s.form.disabledMessage || "Este formulario no está recibiendo respuestas por ahora.") + "</p>"; built = false; return; }
    var st = s.form.steps[s.step] || s.form.steps[0];
    var key = s.step + ":" + s.form.fields.filter(function (x) { return !st || !x.stepId || x.stepId === st.id; }).map(function (x) { return x.target; }).join(",");
    if (built !== key) build(s);
    root.querySelectorAll("[data-err]").forEach(function (p) {
      var k = p.getAttribute("data-err"), m = s.errors[k];
      p.hidden = !m; p.textContent = m || "";
      var ctl = root.querySelector('[name="' + CSS.escape(k) + '"]'); if (ctl) { if (m) ctl.setAttribute("aria-invalid", "true"); else ctl.removeAttribute("aria-invalid"); }
    });
    var fe = root.querySelector("[data-fe]"); if (fe) { fe.hidden = !s.errors[FORM_ERROR]; fe.textContent = s.errors[FORM_ERROR] || ""; }
    var sb = root.querySelector('button[type="submit"]'); if (sb) { sb.disabled = !!s.loading; sb.setAttribute("aria-busy", s.loading ? "true" : "false"); }
  }

  store.subscribe(render);
  render(store.getState());
  store.start();
}

document.querySelectorAll("[data-form-id]").forEach(mount);
