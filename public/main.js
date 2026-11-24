(function () {
  "use strict";
  // 0. Menu burger (mobile)
  var header = document.querySelector(".header"), toggle = document.querySelector(".nav-toggle");
  if (header && toggle) {
    var setOpen = function (open) {
      header.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    };
    toggle.addEventListener("click", function () { setOpen(!header.classList.contains("is-open")); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") { setOpen(false); toggle.focus(); } });
    header.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { setOpen(false); }); });
  }
  // Consentement cookies : Google Tag Manager n'est chargé qu'après accord
  var gtm = document.body.getAttribute("data-gtm"), banner = document.getElementById("consent");
  if (gtm && banner) {
    var KEY = "alibi-consent", SIX_MONTHS = 182 * 864e5, loaded = false;
    var read = function () { try { var v = JSON.parse(localStorage.getItem(KEY) || "null"); return v && Date.now() - v.t < SIX_MONTHS ? v.v : null; } catch (e) { return null; } };
    var save = function (v) { try { localStorage.setItem(KEY, JSON.stringify({ v: v, t: Date.now() })); } catch (e) {} };
    var load = function () {
      if (loaded) return; loaded = true;
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
      var s = document.createElement("script"); s.async = true;
      s.src = "https://www.googletagmanager.com/gtm.js?id=" + encodeURIComponent(gtm);
      document.head.appendChild(s);
    };
    var state = read();
    if (state === "granted") load(); else if (state === null) banner.hidden = false;
    banner.addEventListener("click", function (e) {
      var b = e.target.closest("[data-consent]"); if (!b) return;
      var v = b.getAttribute("data-consent"); save(v); banner.hidden = true;
      if (v === "granted") load();
      else if (loaded) location.reload();
    });
    document.addEventListener("click", function (e) { if (e.target.closest("[data-consent-open]")) banner.hidden = false; });
  }
  // 1. Diaporama aléatoire derrière le titre de l'accueil
  var hero = document.getElementById("hero");
  if (hero) {
    var list;
    try { list = JSON.parse(hero.getAttribute("data-photos") || "[]"); } catch (e) { list = []; }
    var layers = hero.querySelectorAll("img.hs");
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (list.length > 1 && layers.length === 2 && !reduce) {
      for (var i = list.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = list[i]; list[i] = list[j]; list[j] = t; }
      var cur = 0, k = 0;
      layers[0].style.opacity = 1; layers[1].style.opacity = 0;
      setInterval(function () {
        if (document.hidden) return;
        k = (k + 1) % list.length;
        var next = layers[1 - cur], shown = layers[cur];
        next.onload = function () { next.style.opacity = 1; shown.style.opacity = 0; cur = 1 - cur; next.onload = null; };
        next.src = list[k];
      }, 5500);
    }
  }
  // 2. Bandeau "Prochaine soirée" : repasse en "bientôt annoncée" quand la date est dépassée
  var strip = document.querySelector(".strip[data-start]");
  if (strip) {
    var start = strip.getAttribute("data-start");
    var now = new Date(Date.now() - 4 * 3600e3).toLocaleString("sv-SE", { timeZone: "Europe/Paris" }).replace(" ", "T").slice(0, 16);
    var over = now > start;
    var on = strip.querySelector(".strip__on"), off = strip.querySelector(".strip__off");
    if (on && off) { on.hidden = over; off.hidden = !over; }
  }
})();
