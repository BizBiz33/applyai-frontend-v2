# 🚀 ApplyAI - Frontend

Application d'automatisation de candidatures d'emploi avec IA.

## 📋 Structure des fichiers

```
ApplyAI/
├── index.html          # Page d'accueil / Landing page
├── inscription.html    # Formulaire d'inscription multi-étapes
├── dashboard.html      # Tableau de bord des candidatures
├── styles.css         # Styles globaux
├── form.css          # Styles du formulaire
├── form.js           # Logique du formulaire
├── dashboard.js      # Logique du tableau de bord
└── README.md         # Ce fichier
```

## 🛠️ Installation locale (optionnelle)

### 1. Installer un serveur web local

Si vous voulez tester localement avant de déployer :

**Option A : Python (si installé)**
```bash
# Dans le dossier ApplyAI
python -m http.server 8000
# Puis ouvrir http://localhost:8000
```

**Option B : VS Code**
- Installer l'extension "Live Server"
- Clic droit sur index.html → "Open with Live Server"

## 🌐 Déploiement sur GitHub + Vercel

### Étape 1 : Créer le repository GitHub

1. Allez sur [GitHub](https://github.com)
2. Cliquez sur le **+** en haut à droite → **New repository**
3. Configuration :
   - Repository name : `applyai-frontend`
   - Description : `Frontend pour l'application ApplyAI`
   - Public ou Private (au choix)
   - **NE PAS** cocher "Add a README file"
   - Cliquez sur **Create repository**

### Étape 2 : Upload des fichiers

Sur la page du nouveau repository :

1. Cliquez sur **"uploading an existing file"**
2. Glissez-déposez TOUS les fichiers de votre dossier ApplyAI :
   - index.html
   - inscription.html
   - dashboard.html
   - styles.css
   - form.css
   - form.js
   - dashboard.js
   - README.md
3. Message de commit : `Initial commit - ApplyAI frontend`
4. Cliquez sur **Commit changes**

### Étape 3 : Déployer sur Vercel

1. Allez sur [Vercel](https://vercel.com)
2. Connectez-vous avec GitHub
3. Cliquez sur **"Add New..."** → **"Project"**
4. Importez votre repository `applyai-frontend`
5. Configuration :
   - Framework Preset : **Other**
   - Root Directory : `./` (laissez vide)
   - Build Command : (laissez vide)
   - Output Directory : (laissez vide)
6. Cliquez sur **Deploy**

⏱️ Attendez 30-60 secondes...

✅ **Votre site est en ligne !**

Vercel vous donnera une URL comme : `https://applyai-frontend.vercel.app`

## 🔗 Configuration des webhooks

Pour que l'application fonctionne avec votre backend n8n, mettez à jour les endpoints dans :

**form.js** (ligne 5) :
```javascript
const API_ENDPOINT = 'https://bizbiz.app.n8n.cloud/webhook/user-registration';
```

**dashboard.js** (lignes 6-9) :
```javascript
const ENDPOINTS = {
    scrapeJobs: 'https://bizbiz.app.n8n.cloud/webhook/job-scraping',
    generateEmails: 'https://bizbiz.app.n8n.cloud/webhook/email-generation-sending'
};
```

Ces URLs sont déjà configurées avec vos workflows n8n !

## 📱 Fonctionnalités

### Landing Page (index.html)
- Présentation de l'application
- Vidéo démo / Animation
- Call-to-action vers l'inscription

### Inscription (inscription.html)
- Formulaire en 6 étapes :
  1. Email & Provider
  2. Informations personnelles
  3. Formation
  4. Expériences
  5. Compétences & Langues
  6. Upload CV

### Dashboard (dashboard.html)
- Statistiques des candidatures
- Lancer une recherche d'emploi
- Tableau des candidatures envoyées

## 🎨 Design

- **Style** : Moderne, minimaliste, futuriste
- **Couleurs** : Fond sombre avec accents bleu néon
- **Animations** : Transitions fluides et effets de glow
- **Responsive** : Adapté mobile, tablette et desktop

## ⚠️ Notes importantes

1. **Upload CV** : Actuellement simulé (génère une URL fictive)
2. **Authentification** : Pas encore implémentée
3. **Données utilisateur** : Simulées dans dashboard.js

## 🚀 Prochaines étapes

1. ✅ Tester l'inscription complète
2. ✅ Vérifier les emails envoyés
3. 🔄 Ajouter l'authentification
4. 🔄 Implémenter l'upload de CV réel
5. 🔄 Connecter avec de vraies données Supabase

## 🆘 Support

Si vous rencontrez des problèmes :
1. Vérifiez la console du navigateur (F12)
2. Assurez-vous que les workflows n8n sont actifs
3. Vérifiez les API keys dans n8n

---

**ApplyAI** - Automatisez vos candidatures avec l'IA 🤖✨