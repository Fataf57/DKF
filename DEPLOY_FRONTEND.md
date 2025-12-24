# Guide de déploiement du frontend React sur PythonAnywhere

## Problème actuel

Votre site `https://fataf.pythonanywhere.com/` affiche une page blanche avec "React App" dans le titre car le frontend React n'est pas déployé.

## Solution : Déployer le frontend React avec Django

### Étape 1 : Build du frontend React

Sur votre machine locale, dans le dossier `react-app` :

```bash
cd react-app
npm install
npm run build
```

Cela crée un dossier `build/` avec tous les fichiers statiques du frontend.

### Étape 2 : Uploader le build sur PythonAnywhere

1. **Option A - Via Git (recommandé)** :
   - Commitez le dossier `build/` (ou ajoutez-le à `.gitignore` et créez un script de build)
   - Sur PythonAnywhere, faites `git pull`

2. **Option B - Via Files** :
   - Compressez le dossier `build/`
   - Uploadez-le sur PythonAnywhere dans le bon emplacement

### Étape 3 : Configurer Django pour servir le frontend

Le fichier `urls.py` a déjà été modifié pour servir le frontend React. Assurez-vous que :

1. Le chemin vers le build React est correct dans `urls.py`
2. Les fichiers statiques sont configurés dans l'onglet **Web** de PythonAnywhere

### Étape 4 : Configuration sur PythonAnywhere

Dans l'onglet **Web** de PythonAnywhere :

1. **Static files** :
   - URL: `/static/`
   - Directory: `/home/fataf/votre-repo/Super-Dkf-main/react-app/build/static/`

2. **Redémarrer l'application** :
   - Cliquez sur le bouton vert **Reload**

### Étape 5 : Vérifier la configuration de l'API

Le fichier `api.js` a été modifié pour détecter automatiquement l'URL de l'API. Si vous êtes sur `fataf.pythonanywhere.com`, il utilisera automatiquement `https://fataf.pythonanywhere.com/api`.

## Structure recommandée sur PythonAnywhere

```
/home/fataf/
  └── votre-repo/
      └── Super-Dkf-main/
          ├── my_store/          # Backend Django
          │   ├── manage.py
          │   ├── my_store/
          │   └── ...
          └── react-app/
              └── build/          # Build React (à uploader)
                  ├── static/
                  ├── index.html
                  └── ...
```

## Alternative : Déployer le frontend séparément

Si vous préférez déployer le frontend ailleurs (Netlify, Vercel, etc.) :

1. Build le frontend : `npm run build`
2. Déployez le dossier `build/` sur votre plateforme
3. Configurez la variable d'environnement `REACT_APP_API_URL=https://fataf.pythonanywhere.com/api`
4. Mettez à jour CORS dans Django pour accepter votre domaine frontend

## Dépannage

### Page blanche après déploiement

1. Vérifiez la console du navigateur (F12) pour les erreurs
2. Vérifiez que les fichiers statiques sont bien servis
3. Vérifiez que l'URL de l'API est correcte dans la console

### Erreurs 404 pour les fichiers statiques

1. Vérifiez que le chemin dans l'onglet **Web** de PythonAnywhere est correct
2. Vérifiez que le dossier `build/static/` existe bien

### L'API ne répond pas

1. Vérifiez que le backend Django fonctionne : `https://fataf.pythonanywhere.com/api/`
2. Vérifiez les logs d'erreur dans l'onglet **Web** de PythonAnywhere
3. Vérifiez que CORS est bien configuré dans `settings.py`

