(function () {
  "use strict";
  // Suivi Google Tag Manager : n'envoie rien tant que le visiteur n'a pas accepté les cookies
  var track = function () {};
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
      track = function (name, params) {
        var o = { event: name };
        for (var k in params) if (Object.prototype.hasOwnProperty.call(params, k)) o[k] = params[k];
        window.dataLayer.push(o);
      };
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
  // 3. Agrandissement des photos et affiches (fenêtre plein écran)
  var zoomables = [].slice.call(document.querySelectorAll(".gallery img, .posters img, .spot__img, img.team"));
  if (zoomables.length && typeof HTMLDialogElement === "function") {
    var dlg = document.createElement("dialog");
    dlg.className = "lb";
    dlg.setAttribute("aria-label", "Photo agrandie");
    dlg.innerHTML = '<button type="button" class="lb__btn lb__close" aria-label="Fermer">&times;</button>' +
      '<button type="button" class="lb__btn lb__prev" aria-label="Photo précédente">&#8249;</button>' +
      '<figure class="lb__fig"><img class="lb__img" alt=""><figcaption class="lb__cap"></figcaption></figure>' +
      '<button type="button" class="lb__btn lb__next" aria-label="Photo suivante">&#8250;</button>';
    document.body.appendChild(dlg);
    var lbImg = dlg.querySelector(".lb__img"), lbCap = dlg.querySelector(".lb__cap");
    var prevB = dlg.querySelector(".lb__prev"), nextB = dlg.querySelector(".lb__next");
    var group = [], idx = 0;
    var groupOf = function (img) {
      var box = img.closest(".gallery, .posters");
      return box ? [].slice.call(box.querySelectorAll("img")) : [img];
    };
    var photoInfo = function (im) {
      var sec = im.closest("section"), h = sec && sec.querySelector("h2");
      var parts = (im.getAttribute("src") || "").split("?")[0].split("/");
      return {
        photo_name: parts.slice(-2).join("/"),
        photo_alt: (im.alt || "").slice(0, 100),
        photo_section: h ? h.textContent.trim().slice(0, 80) : "",
        photo_position: group.indexOf(im) + 1,
        photo_count: group.length,
        page_path: location.pathname
      };
    };
    var show = function (i, how) {
      idx = (i + group.length) % group.length;
      var im = group[idx];
      if (how) { var info = photoInfo(im); info.direction = how; track("photo_navigate", info); }
      lbImg.src = im.currentSrc || im.src;
      lbImg.alt = im.alt || "";
      lbCap.textContent = group.length > 1 ? (idx + 1) + " / " + group.length : "";
      prevB.hidden = nextB.hidden = group.length < 2;
    };
    var open = function (img) {
      group = groupOf(img);
      show(group.indexOf(img));
      track("photo_open", photoInfo(img));
      document.documentElement.classList.add("lb-open");
      dlg.showModal();
    };
    zoomables.forEach(function (img) {
      img.classList.add("zoomable");
      img.setAttribute("tabindex", "0");
      img.setAttribute("role", "button");
      img.setAttribute("aria-label", "Agrandir la photo" + (img.alt ? " : " + img.alt : ""));
      img.addEventListener("click", function () { open(img); });
      img.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(img); } });
    });
    dlg.addEventListener("click", function (e) {
      if (e.target === lbImg || e.target === lbCap) return;
      if (e.target === prevB) return show(idx - 1, "precedent");
      if (e.target === nextB) return show(idx + 1, "suivant");
      dlg.close();
    });
    dlg.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft" && group.length > 1) show(idx - 1, "precedent");
      if (e.key === "ArrowRight" && group.length > 1) show(idx + 1, "suivant");
    });
    dlg.addEventListener("close", function () { document.documentElement.classList.remove("lb-open"); lbImg.removeAttribute("src"); });
    var tx = null;
    dlg.addEventListener("touchstart", function (e) { tx = e.changedTouches[0].clientX; }, { passive: true });
    dlg.addEventListener("touchend", function (e) {
      if (tx === null || group.length < 2) return;
      var dx = e.changedTouches[0].clientX - tx; tx = null;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1), dx < 0 ? "suivant" : "precedent");
    }, { passive: true });
  }
  // 4. Suivi des clics utiles (e-mails, boutons, réseaux sociaux)
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a");
    if (!a) return;
    var href = a.getAttribute("href") || "", text = (a.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80);
    if (href.indexOf("mailto:") === 0) {
      var subject = "";
      try { subject = decodeURIComponent((/[?&]subject=([^&]*)/.exec(href) || [, ""])[1]); } catch (err) {}
      var type = /^r[ée]servation/i.test(subject) ? "reservation" : /^inscription/i.test(subject) ? "inscription" : /^match/i.test(subject) ? "match" : /^prochaines/i.test(subject) ? "prochaines_dates" : "contact";
      track("mailto_click", { mail_type: type, mail_subject: subject.slice(0, 100), link_text: text, page_path: location.pathname });
    } else if (/instagram\.com|facebook\.com/.test(href)) {
      track("social_click", { network: /instagram/.test(href) ? "instagram" : "facebook", page_path: location.pathname });
    } else if (a.classList.contains("btn") || a.classList.contains("choice__card") || a.classList.contains("spot__more") || a.classList.contains("card--link")) {
      track("cta_click", { link_text: text, link_url: href, page_path: location.pathname });
    }
  });
})();
