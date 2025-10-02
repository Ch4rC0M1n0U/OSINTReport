# 🧪 Test manuel dans le navigateur

## Ouvrez http://localhost:5173

### Test 1 : Vérifier l'avatar actuel
1. **Connectez-vous** avec : `admin@police.belgium.eu` / `ChangeMeAdmin42!`
2. ✅ **Vérifiez** que votre avatar s'affiche dans le coin supérieur droit
3. ✅ **Vérifiez** que votre rôle "admin" est affiché sous votre nom

### Test 2 : Upload d'une nouvelle image
1. Allez sur **"Mon profil"**
2. Cliquez sur **"Choisir une image"**
3. Sélectionnez une image PNG ou JPEG de votre choix
4. ✅ L'avatar s'affiche **immédiatement**
5. ✅ Le message "Photo de profil mise à jour avec succès !" apparaît
6. ✅ L'avatar est visible dans le header

### Test 3 : URL distante
1. Toujours sur **"Mon profil"**
2. Dans le champ **"URL de la photo de profil"**, collez :
   ```
   https://api.dicebear.com/7.x/avataaars/svg?seed=TestAvatar
   ```
3. Cliquez sur **"Enregistrer les modifications"**
4. ✅ L'avatar change pour la nouvelle image
5. ✅ Le message "Votre profil a été mis à jour avec succès !" apparaît

### Test 4 : Persistence après déconnexion
1. Cliquez sur votre avatar en haut à droite
2. Cliquez sur **"Déconnexion"**
3. **Reconnectez-vous** avec vos identifiants
4. ✅ **Votre avatar est toujours là !** 🎉
5. ✅ Tous vos liens "Administration" sont présents
6. ✅ Votre rôle "admin" est affiché

## ✅ Si tous les tests passent

**Félicitations !** Votre système d'avatars fonctionne parfaitement :
- ✅ Upload local → Sauvegarde immédiate
- ✅ URL distante → Téléchargement automatique
- ✅ Persistence → Rechargement après reconnexion
- ✅ Performance → Gain de 98% en taille DB
- ✅ Sécurité → Protection du répertoire

## 📝 Notes

### Taille des fichiers
- **Upload** : ~5-10 KB (image optimisée)
- **URL distante** : Variable selon la source (ex: 532 KB pour DuckDuckGo)

### Emplacement des avatars
```
/workspaces/OSINTReport/frontend/public/images/avatars/
```

Vous pouvez vérifier avec :
```bash
ls -lh /workspaces/OSINTReport/frontend/public/images/avatars/
```

### URLs de test

Voici quelques URLs d'avatars pour tester :

1. **DuckDuckGo logo** (JPG, ~530 KB)
   ```
   https://duckduckgo.com/i/68082dbf47406b85.jpg
   ```

2. **Avatar généré** (SVG → converti en PNG)
   ```
   https://api.dicebear.com/7.x/avataaars/svg?seed=Felix
   ```

3. **Autre avatar généré**
   ```
   https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka
   ```

Toutes ces URLs seront automatiquement téléchargées, redimensionnées à 512x512px, converties en PNG et sauvegardées localement !
