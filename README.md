# Site de L'Alibi du Mardi

Site statique (aucune dépendance) généré par `build.mjs` à partir des fichiers de `content/`.
Hébergé sur Vercel, mis à jour par l'interface `/admin` (Decap CMS) qui modifie ce dépôt GitHub.

## Mettre à jour le site (pour les membres)

1. Aller sur `https://VOTRE-SITE/admin` et se connecter avec son compte GitHub.
2. Choisir une rubrique :
   - **Prochain spectacle** : titre, date, lieu, tarif. Le bandeau jaune de l'accueil et la page Spectacles se mettent à jour. Après la date, le site affiche tout seul « Bientôt annoncée ».
   - **Soirées passées** : ajouter une affiche (à placer en premier dans la liste).
   - **Photos**, **Ateliers**, **Spectacles**, **Association et accueil**, **Réglages du site**.
3. Cliquer sur **Publier**. Le site se met à jour en environ une minute.

Après un spectacle : ajouter son affiche dans « Soirées passées », puis renseigner la prochaine date dans « Prochain spectacle » (ou décocher « Afficher un prochain spectacle »).

## Mise en place (une seule fois)

### 1. GitHub
1. Créer un compte sur github.com, puis un dépôt **privé** vide, par exemple `lalibidumardi-site`.
2. Y envoyer le contenu de ce dossier (voir « Envoyer les fichiers » ci-dessous).

### 2. Vercel
1. Créer un compte sur vercel.com en choisissant « Continue with GitHub ».
2. « Add New… > Project », choisir le dépôt, ne rien changer, cliquer sur **Deploy**.
3. Le site est en ligne sur `https://nom-du-projet.vercel.app`.

### 3. Connexion à l'administration
1. Sur GitHub : Settings > Developer settings > OAuth Apps > **New OAuth App**.
   - Homepage URL : `https://VOTRE-SITE`
   - Authorization callback URL : `https://VOTRE-SITE/api/callback`
2. Copier le **Client ID**, générer un **Client secret**.
3. Sur Vercel : projet > Settings > Environment Variables, ajouter `GITHUB_CLIENT_ID` et `GITHUB_CLIENT_SECRET`, puis redéployer (Deployments > Redeploy).
4. Dans `public/admin/config.yml`, remplacer `VOTRE-COMPTE/lalibidumardi-site` par le vrai nom du dépôt et `https://VOTRE-SITE.vercel.app` par l'adresse du site. Enregistrer (commit).
5. Ajouter les autres membres comme collaborateurs du dépôt (GitHub : Settings > Collaborators). Seules les personnes ayant accès au dépôt peuvent publier.

### 4. Nom de domaine
Acheter un domaine (OVH, Gandi...), puis Vercel > projet > Settings > Domains > Add, et suivre les instructions DNS. Mettre ensuite l'adresse définitive dans `config.yml` (`base_url`) et dans l'application OAuth GitHub, et renseigner « Adresse du site » dans Réglages du site (utile pour le référencement).

## Envoyer les fichiers sur GitHub
- Simple : sur la page du dépôt vide, « uploading an existing file », glisser le contenu du dossier (par lots si GitHub limite à 100 fichiers : d'abord tout sauf `public/images`, puis les dossiers d'images un par un).
- Ou avec Git : `git init && git add . && git commit -m "Premier envoi" && git branch -M main && git remote add origin <adresse-du-depot> && git push -u origin main`.

## Tester en local
`node build.mjs` génère le site dans `dist/`. `npx serve dist` pour le voir sur http://localhost:3000.

## Ce qui reste à compléter (rubrique « Ateliers », « Association », « Réglages »)
Horaires, lieu et tarifs des ateliers, cotisation et inscription, date de création, adresse du siège, équipe (avec l'accord des personnes), mentions légales (directeur de la publication, adresse).
Les champs vides n'apparaissent pas sur le site.

## Structure
- `content/*.json` : tous les textes et listes éditables
- `public/` : images, polices, styles, script, administration
- `api/` : deux petites fonctions pour la connexion GitHub de l'administration
- `build.mjs` : génère les pages HTML
- `vercel.json` : configuration du déploiement
