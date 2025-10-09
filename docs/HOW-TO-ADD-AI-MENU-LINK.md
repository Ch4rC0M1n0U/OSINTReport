# Guide d'ajout du lien "Paramètres IA" au menu d'administration

## 📍 Objectif

Ajouter un lien vers la nouvelle page "Paramètres IA" dans le menu d'administration de l'application.

## 🔍 Étapes

### 1. Trouver le composant de navigation

Le menu d'administration est probablement dans un des fichiers suivants :
- `frontend/src/components/navigation/AdminNavigation.vue`
- `frontend/src/components/navigation/Sidebar.vue`
- `frontend/src/components/layout/AdminLayout.vue`
- `frontend/src/pages/admin/AdminSettingsPage.vue`

### 2. Chercher les autres liens de paramètres

Recherchez dans le code des liens existants comme :
- "Paramètres système"
- "Paramètres SMTP"
- "Gestion de la recherche"

### 3. Ajouter le lien "Paramètres IA"

Exemple de code à ajouter (adapter selon votre structure) :

```vue
<router-link
  to="/admin/ai"
  class="menu-item"
  active-class="active"
>
  <svg><!-- Icône d'IA --></svg>
  <span>Paramètres IA</span>
</router-link>
```

Ou avec DaisyUI :

```vue
<li>
  <router-link to="/admin/ai">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
    Paramètres IA
  </router-link>
</li>
```

### 4. Vérifier les permissions

Assurez-vous que le lien est visible uniquement pour les utilisateurs avec la permission `system:settings` ou `system:admin`.

Exemple :

```vue
<li v-if="hasPermission(['system:settings', 'system:admin'])">
  <router-link to="/admin/ai">
    <!-- ... -->
  </router-link>
</li>
```

## 🎨 Icône recommandée

Pour l'icône IA, vous pouvez utiliser :

**Heroicons - Sparkles (étoiles scintillantes) :**
```vue
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
  <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
</svg>
```

**Ou une icône "cerveau" / "robot" :**
```vue
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
  <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
</svg>
```

## 📝 Exemple complet

Voici un exemple complet d'ajout dans un menu DaisyUI existant :

```vue
<!-- Quelque part dans AdminNavigation.vue ou Sidebar.vue -->
<ul class="menu bg-base-200 w-56 rounded-box">
  <li class="menu-title">
    <span>Administration</span>
  </li>
  
  <!-- Liens existants -->
  <li>
    <router-link to="/admin/users">
      <svg><!-- Icône utilisateurs --></svg>
      Utilisateurs
    </router-link>
  </li>
  
  <!-- Divider paramètres -->
  <li class="menu-title">
    <span>Paramètres</span>
  </li>
  
  <li>
    <router-link to="/admin/system">
      <svg><!-- Icône système --></svg>
      Paramètres système
    </router-link>
  </li>
  
  <li>
    <router-link to="/admin/smtp">
      <svg><!-- Icône email --></svg>
      Paramètres SMTP
    </router-link>
  </li>
  
  <!-- NOUVEAU : Lien IA -->
  <li v-if="hasPermission(['system:settings', 'system:admin'])">
    <router-link to="/admin/ai">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
      Paramètres IA
    </router-link>
  </li>
  
  <li>
    <router-link to="/admin/search">
      <svg><!-- Icône recherche --></svg>
      Gestion recherche
    </router-link>
  </li>
</ul>
```

## 🔧 Commandes pour trouver le fichier

```bash
# Chercher les fichiers contenant "Paramètres système"
grep -r "Paramètres système" frontend/src/

# Chercher les fichiers avec router-link vers admin
grep -r "to=\"/admin" frontend/src/components/

# Chercher les composants de navigation
find frontend/src/components -name "*Nav*.vue" -o -name "*Sidebar*.vue" -o -name "*Menu*.vue"
```

## ✅ Vérification

Après l'ajout du lien :
1. Redémarrer le serveur de développement : `npm run dev`
2. Se connecter en tant qu'admin
3. Vérifier que le lien "Paramètres IA" apparaît dans le menu
4. Cliquer dessus pour accéder à `/admin/ai`
5. Vérifier que la page se charge correctement

## 🎯 URL de la page

La page est accessible à :
- **URL** : `http://localhost:5173/admin/ai`
- **Route name** : `admin.ai`
- **Permissions** : `system:settings` ou `system:admin`

---

**Note** : Si vous ne trouvez pas de composant de navigation existant, la page est quand même accessible en tapant directement l'URL `/admin/ai` dans le navigateur. Le lien dans le menu n'est qu'une commodité pour les utilisateurs.
