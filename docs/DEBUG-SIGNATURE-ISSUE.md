# 🔍 Guide de débogage - Problème d'enregistrement de signature

## Problème rapporté

Aucun enregistrement de signature et aucun log en console lors du clic sur "Enregistrer".

## ✅ Modifications apportées pour le débogage

J'ai ajouté des logs de débogage dans le code pour tracer le problème :

### 1. Dans SignaturePad.vue

- ✅ Log quand on commence à dessiner
- ✅ Log quand le premier trait est détecté
- ✅ Logs détaillés dans `saveSignature()`

### 2. Dans ProfilePage.vue

- ✅ Logs détaillés dans `handleSignatureSave()`
- ✅ Log de chaque étape (conversion blob, upload, etc.)

## 🧪 Comment tester et diagnostiquer

### Étape 1 : Ouvrez la console du navigateur

1. Appuyez sur `F12` ou `Ctrl+Shift+I` (Windows/Linux) ou `Cmd+Option+I` (Mac)
2. Allez dans l'onglet "Console"
3. Effacez les logs existants (icône poubelle)

### Étape 2 : Testez le dessin

1. Allez sur la page Profil
2. Cliquez sur "Ajouter une signature" ou "Modifier la signature"
3. **Dessinez quelque chose dans le canvas**
4. **Vérifiez la console** - Vous devriez voir :
   ```
   🎨 Start drawing
   🎨 First stroke detected, hasDrawn = true
   ```

### Étape 3 : Testez l'enregistrement

1. Cliquez sur le bouton "Enregistrer"
2. **Vérifiez la console** - Vous devriez voir :
   ```
   🖊️ SignaturePad: saveSignature called
   🖊️ Canvas: <canvas>
   🖊️ hasDrawn: true
   🖊️ SignaturePad: dataUrl generated, length: XXXXX
   🖊️ SignaturePad: Emitting save event
   📝 ProfilePage: handleSignatureSave called
   📝 dataUrl received: data:image/png;base64...
   📝 Converting dataUrl to blob...
   📝 Blob created: XXXX bytes, type: image/png
   📝 FormData created, sending to /users/me/signature...
   📝 Upload response: {...}
   📝 User updated, signatureUrl: /images/signatures/...
   ```

## 🚨 Scénarios possibles et solutions

### Scénario A : Aucun log du tout

**Symptôme** : Vous ne voyez AUCUN log, même pas "🎨 Start drawing"

**Cause probable** :

- Le serveur de développement n'a pas rechargé le code
- Le cache navigateur est actif

**Solution** :

```bash
# Dans le terminal
cd /workspaces/OSINTReport/frontend
# Arrêter le serveur (Ctrl+C)
# Redémarrer
npm run dev

# Dans le navigateur
# Faire un Hard Refresh : Ctrl+Shift+R (Windows/Linux) ou Cmd+Shift+R (Mac)
```

### Scénario B : Logs de dessin OK, mais pas de logs d'enregistrement

**Symptôme** : Vous voyez "🎨 Start drawing" mais rien quand vous cliquez sur "Enregistrer"

**Cause probable** :

- `hasDrawn.value` est resté à `false`
- Le bouton est désactivé

**Solution** :

1. Vérifiez dans la console si vous voyez "🎨 First stroke detected"
2. Si non, le problème est dans la détection du dessin
3. Essayez de dessiner plus lentement et de faire des traits plus longs

### Scénario C : Logs d'enregistrement OK, mais erreur réseau

**Symptôme** : Vous voyez les logs jusqu'à "📝 FormData created", puis erreur

**Cause probable** :

- La variable d'environnement VITE_API_URL est commentée
- Le frontend essaie de contacter le mauvais port

**Solution** :

```bash
# Éditez /workspaces/OSINTReport/frontend/.env
# Décommentez la ligne :
VITE_API_URL=http://localhost:4000

# Redémarrez le serveur frontend
cd /workspaces/OSINTReport/frontend
# Ctrl+C puis
npm run dev
```

### Scénario D : Erreur 401 Unauthorized

**Symptôme** : Erreur "❌ Error response: { message: 'Unauthorized' }"

**Cause probable** :

- Session expirée
- Cookies non envoyés

**Solution** :

1. Déconnectez-vous
2. Reconnectez-vous
3. Réessayez

### Scénario E : Erreur 500 côté serveur

**Symptôme** : Erreur "❌ Error response: { message: '...' }"

**Cause probable** :

- Problème avec le traitement de l'image côté backend
- Problème de permissions fichiers

**Solution** :

```bash
# Vérifiez les logs backend
cd /workspaces/OSINTReport
docker-compose logs backend -f

# OU si backend en local
cd /workspaces/OSINTReport/backend
# Regardez la console où tourne ts-node-dev
```

## 📋 Checklist de diagnostic

Cochez au fur et à mesure :

### Environnement

- [ ] Backend tourne sur le port 4000
- [ ] Frontend tourne sur le port 8080
- [ ] Console navigateur ouverte (F12)
- [ ] Aucune erreur dans la console au chargement

### Test de dessin

- [ ] Le canvas s'affiche correctement
- [ ] Je peux dessiner avec la souris
- [ ] Log "🎨 Start drawing" apparaît
- [ ] Log "🎨 First stroke detected" apparaît
- [ ] Le bouton "Enregistrer" n'est PAS grisé

### Test d'enregistrement

- [ ] Je clique sur "Enregistrer"
- [ ] Log "🖊️ SignaturePad: saveSignature called" apparaît
- [ ] Log "📝 ProfilePage: handleSignatureSave called" apparaît
- [ ] Pas d'erreur réseau (vérifier l'onglet Network)
- [ ] La signature apparaît après enregistrement

## 🛠️ Commandes utiles

### Redémarrer tout le projet

```bash
cd /workspaces/OSINTReport

# Arrêter les serveurs (Ctrl+C dans chaque terminal)

# Relancer
npm run dev
```

### Vérifier les ports

```bash
# Backend (doit être 4000)
ss -tlnp | grep 4000

# Frontend (doit être 8080)
ss -tlnp | grep 8080
```

### Voir les logs backend en temps réel

```bash
# Si en Docker
docker-compose logs backend -f

# Si en local
# Regardez le terminal où tourne npm run dev:backend
```

## 📞 Que faire si ça ne marche toujours pas

1. **Copiez TOUS les logs de la console** (depuis le moment où vous dessinez jusqu'à l'erreur)
2. **Faites une capture d'écran** de la console et du canvas
3. **Notez** :
   - Quel navigateur utilisez-vous ?
   - Voyez-vous des erreurs en rouge dans la console ?
   - Le bouton "Enregistrer" est-il grisé ou actif ?
   - Avez-vous bien dessiné quelque chose ?

---

**Note** : Les logs ajoutés sont **temporaires** et seront retirés une fois le problème résolu.
