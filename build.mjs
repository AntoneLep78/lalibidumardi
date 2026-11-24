// Générateur du site de L'Alibi du Mardi : lit content/*.json, écrit dist/*.html
import fs from "node:fs";
import path from "node:path";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const read = (n) => JSON.parse(fs.readFileSync(path.join(ROOT, "content", n + ".json"), "utf8"));
const site = read("site"), nextEv = read("next_event"), home = read("home"), events = read("events").events,
  formats = read("formats").formats, spotlights = read("spotlights").spotlights, galleries = read("galleries").galleries,
  ateliers = read("ateliers"), asso = read("association");

// ---------- utilitaires
const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>");
const paras = (s = "") => s.split(/\n\s*\n/).filter(Boolean).map((p) => `<p>${inline(p.trim())}</p>`).join("");
const BASE = (process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? "https://" + process.env.VERCEL_PROJECT_PRODUCTION_URL : "") || site.site_url || "").replace(/\/$/, "");
const mail = site.email;
const mailto = (subject, body = "") => `mailto:${mail}?subject=${encodeURIComponent(subject)}${body ? "&body=" + encodeURIComponent(body) : ""}`;

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
function parseLocal(s) { // "2027-01-23T20:30" (heure de Paris)
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(s || "");
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number);
  const wd = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
  const upper = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  return { iso: s.slice(0, 16), label: `${upper(JOURS[wd])} ${d === 1 ? "1er" : d} ${MOIS[mo - 1]} ${y}`, time: `${h}h${mi === 0 ? "00" : String(mi).padStart(2, "0")}`, y, mo, d, h, mi };
}
const parisNow = () => new Date().toLocaleString("sv-SE", { timeZone: "Europe/Paris" }).replace(" ", "T").slice(0, 16);
const nd = nextEv.active ? parseLocal(nextEv.date) : null;
// un spectacle reste "à venir" jusqu'à 4 h après son début
const isUpcoming = !!nd && nd.iso >= new Date(Date.now() - 4 * 3600e3).toLocaleString("sv-SE", { timeZone: "Europe/Paris" }).replace(" ", "T").slice(0, 16);
const GAL = Object.fromEntries(galleries.map((g) => [g.id, g]));

// ---------- briques HTML
const NAV = [["/", "Accueil"], ["/ateliers", "Ateliers"], ["/spectacles", "Spectacles"], ["/association", "L'association"]];
function layout({ file, title, desc, body, cur, ogImage = "/images/hero.jpg", jsonld = [] }) {
  const url = BASE ? BASE + (file === "index.html" ? "/" : "/" + file.replace(".html", "")) : "";
  const nav = NAV.map(([h, l]) => `<a href="${h}"${l === cur ? ' aria-current="page"' : ""}>${esc(l)}</a>`).join("");
  const ld = jsonld.map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join("\n");
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${url ? `<link rel="canonical" href="${url}">` : ""}
<meta property="og:type" content="website"><meta property="og:locale" content="fr_FR"><meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
${BASE ? `<meta property="og:image" content="${BASE}${ogImage}">` : ""}
<meta name="theme-color" content="#0A1426">
<link rel="icon" type="image/png" href="/images/favicon.png">
<link rel="preload" href="/fonts/montserrat-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/figtree-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/style.css">
${ld}
</head>
<body>
<a class="skip" href="#contenu">Aller au contenu</a>
<header class="header"><div class="wrap header__in">
<a class="header__logo" href="/" aria-label="${esc(site.name)}, accueil"><img src="/images/logo-small.png" alt="${esc(site.name)}, ligue d'improvisation théâtrale" width="105" height="64"></a>
<nav class="nav" aria-label="Navigation principale">${nav}</nav>
<a class="btn btn--primary btn--sm" href="/ateliers#inscription">S'inscrire</a>
</div></header>
<main id="contenu">
${body}
</main>
${footer()}
<script src="/main.js" defer></script>
</body>
</html>`;
}
function footer() {
  return `<footer class="footer"><div class="wrap footer__in">
<div><img src="/images/logo-small.png" alt="${esc(site.name)}" width="105" height="64"><p>Association d'improvisation théâtrale, Villennes-sur-Seine (Yvelines).</p></div>
<div class="footer__links"><a href="/ateliers">Ateliers</a><a href="/spectacles">Spectacles et réservations</a><a href="/association">L'association et contact</a></div>
<div class="footer__links"><a href="mailto:${mail}">${esc(mail)}</a>${site.instagram ? `<a href="${esc(site.instagram)}" rel="noopener">Instagram</a>` : ""}${site.facebook ? `<a href="${esc(site.facebook)}" rel="noopener">Facebook</a>` : ""}<a href="/mentions-legales">Mentions légales</a></div>
</div></footer>`;
}
const section = (inner, bg = "white", id = "") => `<section class="sec sec--${bg}"${id ? ` id="${id}"` : ""}><div class="wrap sec__in">${inner}</div></section>`;
const pagehead = (h1, sub, img = "") => {
  const html = section(`<h1 class="pagehead__h1">${esc(h1)}</h1><p class="pagehead__sub">${esc(sub)}</p>`, "deep");
  return img ? html.replace('class="sec sec--deep"', `class="sec sec--deep sec--img" style="background-image:url(${img})"`) : html;
};
const poster = (e) => `<article class="poster"><img src="${esc(e.poster)}" alt="${esc(e.alt)}" loading="lazy"><div><h3>${esc(e.title)}</h3><p>${esc([e.date_label, e.details].filter(Boolean).join(" · "))}</p></div></article>`;
const gallery = (g, pick) => {
  const list = pick ? pick.map((n) => g.photos.find((p) => p.endsWith("/" + n + ".jpg"))).filter(Boolean) : g.photos;
  const cls = g.photos.length === 1 ? "gallery gallery--single" : "gallery" + (g.crop ? " gallery--crop" : "") + (pick && list.length === 6 ? " gallery--3" : "");
  return `<div class="${cls}">${list.map((p) => `<img src="${esc(p)}" alt="${esc(g.alt)}" loading="lazy">`).join("")}</div>`;
};
const reserveHref = nd ? mailto(`Réservation ${nextEv.title} - ${nd.label}`, "Bonjour,\n\nJe souhaite réserver ___ place(s) pour " + nextEv.title + " le " + nd.label + ".\n\nNom :\n") : mailto("Réservation");

function strip() {
  const on = nd ? `<span class="strip__txt">${esc(nd.label)} · ${esc(nextEv.title)} · ${esc(nd.time)} · ${esc(nextEv.venue)}</span><a class="btn btn--dark btn--sm" href="${esc(reserveHref)}">Réserver</a>` : "";
  const off = `<span class="strip__txt">Bientôt annoncée : la date sera publiée ici et sur nos réseaux</span>${site.instagram ? `<a class="btn btn--dark btn--sm" href="${esc(site.instagram)}" rel="noopener">Nous suivre sur Instagram</a>` : ""}`;
  return `<section class="strip" aria-label="Prochaine soirée"${nd ? ` data-start="${nd.iso}"` : ""}><div class="wrap strip__in"><span class="strip__k">Prochaine soirée</span>
<div class="strip__on"${isUpcoming ? "" : " hidden"}>${on}</div><div class="strip__off"${isUpcoming ? " hidden" : ""}>${off}</div></div></section>`;
}

// ---------- JSON-LD
const orgLD = { "@context": "https://schema.org", "@type": "PerformingGroup", name: site.name, description: site.seo_description, email: mail, address: { "@type": "PostalAddress", addressLocality: "Villennes-sur-Seine", addressRegion: "Yvelines", addressCountry: "FR" }, sameAs: [site.instagram, site.facebook].filter(Boolean), ...(BASE ? { url: BASE, logo: BASE + "/images/logo.png" } : {}) };
function offsetFor(n) {
  const d = new Date(Date.UTC(n.y, n.mo - 1, n.d, 12));
  const part = new Intl.DateTimeFormat("en", { timeZone: "Europe/Paris", timeZoneName: "longOffset" }).formatToParts(d).find((p) => p.type === "timeZoneName").value;
  return part.replace("GMT", "") || "+00:00";
}
const eventLD = isUpcoming ? { "@context": "https://schema.org", "@type": "TheaterEvent", name: `${nextEv.title}, spectacle d'improvisation`, startDate: `${nd.iso}:00${offsetFor(nd)}`, eventStatus: "https://schema.org/EventScheduled", eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode", location: { "@type": "Place", name: nextEv.venue, address: { "@type": "PostalAddress", addressLocality: "Villennes-sur-Seine", addressCountry: "FR" } }, organizer: { "@type": "Organization", name: site.name }, ...(nextEv.price_eur != null && nextEv.price_eur !== "" ? { offers: { "@type": "Offer", price: String(nextEv.price_eur), priceCurrency: "EUR", availability: "https://schema.org/InStock" } } : {}) } : null;

const pages = [];

// ---------- ACCUEIL
{
  const slidePhotos = galleries.filter((g) => g.slideshow).flatMap((g) => g.photos);
  const hg = GAL[home.photos_gallery];
  const body = `<section class="hero" id="hero" data-photos='${esc(JSON.stringify(slidePhotos)).replace(/'/g, "&#39;")}'>
<img class="hero__img hs" src="/images/hero.jpg" alt="Photos des spectacles de L'Alibi du Mardi, en diaporama" fetchpriority="high"><img class="hero__img hs" alt="" aria-hidden="true">
<div class="hero__shade"></div>
<div class="wrap hero__in"><span class="eyebrow">${esc(site.eyebrow)}</span>
<h1>${esc(home.title_1)} <span>${esc(home.title_2)}</span></h1><p>${esc(home.intro)}</p>
<div class="hero__cta"><a class="btn btn--primary" href="/spectacles">Découvrir nos spectacles</a><a class="btn btn--outline" href="/ateliers#inscription">Rejoindre les ateliers</a></div></div></section>
${strip()}
${section(`<h2>Trois façons de rejoindre l'Alibi</h2><div class="cards">${home.cards.map((c) => `<div class="card"><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p><a href="${esc(c.link)}">${esc(c.cta)} →</a></div>`).join("")}</div>`, "white")}
${hg ? section(`<div class="sec__row"><h2>${esc(home.photos_title)}</h2><a class="more" href="/spectacles#photos">Voir toutes les photos →</a></div><p class="lead">${esc(home.photos_text)}</p>${gallery(hg, home.photos_pick)}`, "paper") : ""}
${section(`<div class="sec__row"><h2>Nos dernières soirées</h2><a class="more" href="/spectacles#affiches">Toutes les affiches →</a></div><div class="posters">${events.slice(0, 4).map(poster).join("")}</div>`, "white")}`;
  pages.push({ file: "index.html", title: site.seo_title, desc: site.seo_description, cur: "Accueil", body, jsonld: [orgLD, eventLD].filter(Boolean) });
}

// ---------- ATELIERS
{
  const group = (g) => {
    const infos = (g.infos || [g.day, g.time, g.place, g.fee]).filter(Boolean).map((x) => `<span>${esc(x)}</span>`).join("");
    return `<div class="card card--big"><span class="kicker">${esc(g.subtitle)}</span><h3>${esc(g.name)}</h3><ul>${g.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul><div class="card__infos">${infos}</div></div>`;
  };
  const body = pagehead(ateliers.title, ateliers.intro)
    + section(`<h2>${esc(ateliers.groups_title)}</h2>${ateliers.groups_text ? `<p class="lead">${esc(ateliers.groups_text)}</p>` : ""}<div class="cards">${ateliers.groups.map(group).join("")}</div>`, "paper")
    + (ateliers.kids ? section(`<h2>${esc(ateliers.kids_title)}</h2>${ateliers.kids_text ? `<p class="lead">${esc(ateliers.kids_text)}</p>` : ""}<div class="cards">${group(ateliers.kids)}</div>${ateliers.practical_note ? `<p class="lead">${esc(ateliers.practical_note)}</p>` : ""}`, "white") : "")
    + section(`<span class="eyebrow">Expérimenter</span><h2>${esc(ateliers.lab_title)}</h2><p class="lead lead--light">${esc(ateliers.lab_text)}</p>${ateliers.lab_details ? `<p class="lead lead--light">${esc(ateliers.lab_details)}</p>` : ""}`, "deep")
    + section(`<h2>S'inscrire</h2><p class="lead">${esc(ateliers.register_text)}</p>${ateliers.register_details ? `<p class="lead">${esc(ateliers.register_details)}</p>` : ""}<p><a class="btn btn--primary" href="${esc(mailto("Inscription aux ateliers d'improvisation", "Bonjour,\n\nJe souhaite m'inscrire à l'atelier (improvisation débutants / avancés, théâtre enfants) :\n\nNom et prénom :\nTéléphone :\nUn mot sur vous (facultatif) :\n"))}">Écrire pour s'inscrire</a></p><p class="small">Ou directement à ${esc(mail)}</p>`, "white", "inscription");
  pages.push({ file: "ateliers.html", title: "Ateliers d'improvisation à Villennes-sur-Seine", desc: "Cours et ateliers d'improvisation théâtrale à Villennes-sur-Seine (Yvelines) : improvisation pour débutants et avancés, et théâtre classique pour enfants.", cur: "Ateliers", body });
}

// ---------- SPECTACLES
{
  const used = new Set();
  const bgOf = (g) => g.background || "ink";
  const spot = (s) => {
    const next = s.show_next_date && isUpcoming ? `Prochaine représentation : ${nd.label.toLowerCase()}` : "";
    const kicker = [s.kicker, next].filter(Boolean).join(" · ");
    const gal = s.gallery && GAL[s.gallery];
    if (gal) used.add(gal.id);
    return section(`<div class="spot"><img class="spot__img" src="${esc(s.poster)}" alt="${esc(s.poster_alt)}" loading="lazy"><div class="spot__txt">${kicker ? `<span class="kicker">${esc(kicker)}</span>` : ""}<h2 id="${esc(s.id)}">${esc(s.title)}</h2>${paras(s.text)}${s.credits ? `<p class="small">${inline(s.credits)}</p>` : ""}</div></div>`, "white")
      + (gal ? gsec(gal) : "");
  };
  const gsec = (g) => section(`<h2${g.id === "cabaret-2026-10" ? ' id="photos"' : ""}>${esc(g.title)}</h2>${g.intro ? `<p class="lead${["ink", "deep"].includes(bgOf(g)) ? " lead--light" : ""}">${esc(g.intro)}</p>` : ""}${gallery(g)}`, bgOf(g));
  const spotHtml = spotlights.map(spot).join("");
  const rest = galleries.filter((g) => !used.has(g.id)).map(gsec).join("");
  const body = pagehead("Spectacles et réservations", "Cabarets, matchs et spectacles longs, à la Salle des Arts de Villennes-sur-Seine. Chaque représentation est unique.", "/images/fond-spectacles.jpg")
    + strip()
    + section(`<h2>Nos formats</h2><div class="cards cards--3">${formats.map((f) => `<div class="card"><h3>${esc(f.title)}</h3><p>${esc(f.text)}</p></div>`).join("")}</div>`, "paper")
    + spotHtml + rest
    + section(`<h2>Nos soirées en affiches</h2><div class="posters">${events.map(poster).join("")}</div>`, "white", "affiches")
    + section(`<div class="reserve"><div><h2>Réserver votre place</h2><p class="lead lead--light">Les réservations se font par e-mail : écrivez-nous à <strong>${esc(mail)}</strong> avec la date du spectacle, votre nom et le nombre de places.${isUpcoming ? ` Prochaine date : ${esc(nextEv.title)}, le ${esc(nd.label.toLowerCase())} à ${esc(nd.time)}, ${esc(nextEv.venue)}${nextEv.price_label ? `, entrée ${esc(nextEv.price_label)}` : ""}.` : ""} Le tarif est indiqué sur l'affiche de chaque soirée.</p></div><a class="btn btn--primary btn--lg" href="${esc(reserveHref)}">Écrire pour réserver</a></div>`, "deep", "reservation");
  pages.push({ file: "spectacles.html", title: "Spectacles d'improvisation à Villennes-sur-Seine", desc: "Cabarets, matchs et spectacles d'improvisation à la Salle des Arts de Villennes-sur-Seine : formats, photos, affiches et réservations.", cur: "Spectacles", body, jsonld: [eventLD].filter(Boolean) });
}

// ---------- ASSOCIATION
{
  const team = (asso.team || []).map((m) => `<div class="member">${m.photo ? `<img src="${esc(m.photo)}" alt="${esc(m.name)}" loading="lazy">` : ""}<strong>${esc(m.name)}</strong><span>${esc(m.role || "")}</span></div>`).join("");
  const body = pagehead(asso.title, asso.intro)
    + section(`<h2>Notre histoire</h2>${paras(asso.history)}${asso.founded ? `<p class="lead">${esc(asso.founded)}</p>` : ""}<div class="values">${asso.values.map((v) => `<div><h3>${esc(v.title)}</h3><p>${esc(v.text)}</p></div>`).join("")}</div>`, "white")
    + section(`<h2>L'équipe</h2>${asso.team_photo ? `<img class="team" src="${esc(asso.team_photo)}" alt="${esc(asso.team_photo_alt)}" loading="lazy">` : ""}${team ? `<div class="members">${team}</div>` : ""}`, "paper")
    + section(`<h2>Nous contacter</h2><div class="contact"><div><span class="kicker">E-mail</span><p><a href="mailto:${mail}">${esc(mail)}</a></p></div><div><span class="kicker">Salle de spectacle</span><p>${esc(site.venue)}</p></div>${asso.address ? `<div><span class="kicker">Adresse du siège</span><p>${esc(asso.address)}</p></div>` : ""}<div><span class="kicker">Réseaux</span><p>${[site.instagram && `<a href="${esc(site.instagram)}" rel="noopener">Instagram</a>`, site.facebook && `<a href="${esc(site.facebook)}" rel="noopener">Facebook</a>`].filter(Boolean).join(" · ")}</p></div></div><p><a class="btn btn--primary" href="${esc(mailto("Message depuis le site"))}">Nous écrire</a></p>`, "white");
  pages.push({ file: "association.html", title: "L'association", desc: "L'Alibi du Mardi, association de théâtre d'improvisation à Villennes-sur-Seine : notre histoire, notre équipe et comment nous contacter.", cur: "L'association", body });
}

// ---------- MENTIONS LÉGALES
{
  const body = pagehead("Mentions légales", "Informations légales du site de L'Alibi du Mardi.")
    + section(`<div class="legal"><h2>Éditeur</h2><p>${esc(site.name)}, association de théâtre d'improvisation, Villennes-sur-Seine (Yvelines).${site.legal_address ? `<br>${esc(site.legal_address)}` : ""}<br>Contact : <a href="mailto:${mail}">${esc(mail)}</a>${site.legal_publisher ? `<br>Directeur de la publication : ${esc(site.legal_publisher)}` : ""}</p>
<h2>Hébergement</h2><p>Site hébergé par Vercel Inc. (<a href="https://vercel.com" rel="noopener">vercel.com</a>).</p>
<h2>Données personnelles</h2><p>Ce site ne dépose aucun cookie de suivi et ne collecte aucune donnée par formulaire : les réservations et les inscriptions se font par e-mail. Les adresses e-mail reçues ne servent qu'à répondre à votre demande.</p>
<h2>Photographies</h2><p>Les photographies et affiches publiées sont la propriété de l'association ou de leurs auteurs. Pour toute demande de retrait, écrivez-nous.</p></div>`, "white");
  pages.push({ file: "mentions-legales.html", title: "Mentions légales", desc: "Mentions légales du site de L'Alibi du Mardi.", cur: "", body });
}

// ---------- écriture
const DIST = path.join(ROOT, "dist");
fs.rmSync(DIST, { recursive: true, force: true });
fs.cpSync(path.join(ROOT, "public"), DIST, { recursive: true });
for (const p of pages) fs.writeFileSync(path.join(DIST, p.file), layout(p));
const urls = ["/", "/ateliers", "/spectacles", "/association", "/mentions-legales"];
if (BASE) {
  fs.writeFileSync(path.join(DIST, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${BASE}${u}</loc></url>`).join("\n")}\n</urlset>\n`);
}
fs.writeFileSync(path.join(DIST, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: /admin/\n${BASE ? `Sitemap: ${BASE}/sitemap.xml\n` : ""}`);
console.log(`Site généré : ${pages.length} pages dans dist/ (prochain spectacle ${isUpcoming ? "affiché" : "non affiché"})`);
