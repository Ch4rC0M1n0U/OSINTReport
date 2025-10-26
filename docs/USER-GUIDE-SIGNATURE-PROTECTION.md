# 🔒 Guide utilisateur - Protection de signature renforcée

## Ce qui a changé

Votre signature est maintenant **beaucoup mieux protégée** contre les captures d'écran et le vol.

### Avant (v1.0)

```
┌─────────────────────────┐
│                         │
│       PROTÉGÉ           │  <- Un seul mot au centre
│                         │
│     [Signature]         │
│                         │
└─────────────────────────┘
```

### Maintenant (v2.0)

```
┌─────────────────────────┐
│🔒 Signature protégée... │  <- Message au survol
├─────────────────────────┤
│ PROTÉGÉ  PROTÉGÉ  ⚡    │
│ PROTÉGÉ  PROTÉGÉ  ⚡    │  <- 20 watermarks + motifs
│ PROTÉGÉ [Signature] 🔒  │  <- Badge visible
│ PROTÉGÉ  PROTÉGÉ  ⚡    │
│ PROTÉGÉ  PROTÉGÉ  ⚡    │
└─────────────────────────┘
```

## Ce que vous verrez

### 1. Dans la page Profil

Quand vous affichez votre signature, vous verrez :

- ✅ **20 "PROTÉGÉ"** en rouge clair, légèrement transparents, répartis sur toute la zone
- ✅ **Motif de lignes diagonales** qui bougent doucement (animation)
- ✅ **Badge cadenas 🔒** rouge dans le coin en bas à droite qui pulse
- ✅ **Message "🔒 Signature protégée contre les captures"** quand vous survolez avec la souris

### 2. Dans le menu profil (en haut à droite)

Même chose mais en plus petit (64px de hauteur max).

## Ce qui est maintenant bloqué

### ❌ Vous ne pourrez PAS :

1. **Faire une capture d'écran** avec :

   - `Print Screen` (Windows)
   - `Alt + Print Screen` (Windows - fenêtre active)
   - `Win + Shift + S` (Outil Capture Windows)
   - `Cmd + Shift + 3` (macOS - écran complet)
   - `Cmd + Shift + 4` (macOS - zone sélectionnée)
   - `Ctrl + Shift + S` (Firefox)

2. **Copier l'image** avec :

   - Clic droit → Copier
   - `Ctrl + C` / `Cmd + C`
   - Glisser-déposer (drag & drop)

3. **Sélectionner** quoi que ce soit dans la zone de signature

4. **Ouvrir le menu contextuel** (clic droit bloqué)

### ⚠️ Si vous essayez quand même

Vous verrez dans la console du navigateur :

```
🔒 Les captures d'écran de la signature sont désactivées pour des raisons de sécurité.
```

## Pourquoi cette protection ?

### Objectif

Empêcher que votre signature manuscrite soit :

- ❌ Copiée et utilisée sur de faux documents
- ❌ Volée et réutilisée par quelqu'un d'autre
- ❌ Extraite et partagée hors du système

### Ce qui reste possible (et c'est normal)

Une personne **très** déterminée et techniquement compétente pourrait :

- Prendre une photo de son écran avec un téléphone
- Utiliser des outils avancés pour contourner les protections
- Accéder au fichier directement sur le serveur (si admin)

**MAIS** dans tous ces cas :

- ✅ Les 20 watermarks "PROTÉGÉ" seront visibles sur la copie
- ✅ Le motif diagonal sera visible
- ✅ Le badge 🔒 sera présent
- ✅ La qualité sera dégradée

→ **L'image copiée sera inutilisable** pour contrefaçon car marquée comme protégée.

## Ce que vous devez faire

### ✅ Rien de spécial !

La protection est **automatique** et **transparente**. Utilisez votre signature normalement :

1. Ajoutez-la dans votre profil
2. Visualisez-la quand vous voulez
3. Elle apparaîtra sur vos rapports

### ❌ Ne pas s'inquiéter

Les watermarks et protections sont :

- **Normaux** : C'est voulu pour votre sécurité
- **Légers** : Ne gênent pas la lecture de votre signature
- **Nécessaires** : Protection contre le vol

## Questions fréquentes

### "Les watermarks 'PROTÉGÉ' sont-ils visibles sur les rapports PDF ?"

**Non.** Les protections visuelles (watermarks, badge 🔒) sont uniquement pour l'**affichage à l'écran** dans l'interface web.

Quand votre signature est intégrée dans un rapport PDF :

- ✅ Signature **propre** (sans watermarks)
- ✅ Qualité **optimale**
- ✅ Fond **transparent**

### "Pourquoi je ne peux pas faire de capture d'écran de ma propre signature ?"

Pour des raisons de **sécurité uniforme** :

- Si on permettait aux propriétaires de capturer, il faudrait détecter qui regarde quoi
- Un attaquant pourrait se faire passer pour le propriétaire
- La règle simple : **aucune capture, pour personne**

**Si vous avez besoin d'une copie** de votre signature :

1. Allez dans votre profil
2. Cliquez sur "Supprimer la signature"
3. Téléchargez le fichier original depuis vos documents personnels
4. Ajoutez-le à nouveau

### "Les animations sont-elles fluides ?"

Oui ! Les animations utilisent :

- **GPU acceleration** (pas de lag)
- **Transformations CSS** optimisées
- **60 FPS** sur les navigateurs modernes

Si vous constatez des ralentissements :

- Vérifiez que votre navigateur est à jour
- Fermez les onglets inutiles
- Essayez un autre navigateur (Chrome/Firefox recommandés)

### "Puis-je désactiver la protection ?"

**Non**, c'est une fonctionnalité de sécurité du système. Tous les utilisateurs bénéficient de la même protection.

### "Et sur mobile/tablette ?"

La protection fonctionne aussi sur mobile et tablette :

- ✅ Watermarks visibles
- ✅ Screenshot bloqué (selon OS et navigateur)
- ✅ Copier-coller bloqué
- ✅ Drag & drop bloqué

**Note** : Sur iOS/Android, certains raccourcis système de capture ne peuvent pas être totalement bloqués (limitation du navigateur), mais les watermarks restent visibles.

## Support technique

Si vous rencontrez un problème avec la protection de signature :

1. **Vérifiez** que vous utilisez un navigateur récent (Chrome 90+, Firefox 88+, Safari 14+)
2. **Rafraîchissez** la page (Ctrl+Shift+R)
3. **Videz le cache** du navigateur
4. **Contactez** l'administrateur système

---

**Version** : 2.0  
**Date** : 26 octobre 2025  
**Navigateurs supportés** : Chrome, Firefox, Safari, Edge (versions récentes)
