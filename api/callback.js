// Étape 2 : GitHub renvoie ici, on échange le code contre un jeton et on le transmet à l'administration.
export default async function handler(req, res) {
  const { code, state } = req.query || {};
  const cookie = (req.headers.cookie || "").split(";").map((c) => c.trim()).find((c) => c.startsWith("oauth_state="));
  const saved = cookie ? cookie.split("=")[1] : "";
  if (!code || !state || state !== saved) { res.status(400).send("Connexion invalide ou expirée. Fermez cette fenêtre et réessayez."); return; }

  let result;
  try {
    const r = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ client_id: process.env.GITHUB_CLIENT_ID, client_secret: process.env.GITHUB_CLIENT_SECRET, code }),
    });
    const data = await r.json();
    result = data.access_token ? { status: "success", payload: { token: data.access_token, provider: "github" } } : { status: "error", payload: { message: data.error_description || "Échec de la connexion GitHub" } };
  } catch (e) {
    result = { status: "error", payload: { message: "Impossible de joindre GitHub" } };
  }
  const msg = `authorization:github:${result.status}:${JSON.stringify(result.payload)}`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Set-Cookie", "oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/api; Max-Age=0");
  res.send(`<!doctype html><html><body><p>Connexion en cours...</p><script>
(function(){
  var msg=${JSON.stringify(msg)};
  function receive(e){ window.opener.postMessage(msg, e.origin); window.removeEventListener("message", receive, false); }
  window.addEventListener("message", receive, false);
  window.opener.postMessage("authorizing:github", "*");
})();
</script></body></html>`);
}
