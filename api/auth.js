// Étape 1 de la connexion GitHub pour l'administration : redirige vers GitHub.
import crypto from "node:crypto";

export default function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) { res.status(500).send("GITHUB_CLIENT_ID manquant dans les variables d'environnement Vercel."); return; }
  const state = crypto.randomBytes(16).toString("hex");
  res.setHeader("Set-Cookie", `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/api; Max-Age=600`);
  const params = new URLSearchParams({ client_id: clientId, scope: "repo,user", state });
  res.redirect(302, `https://github.com/login/oauth/authorize?${params}`);
}
