# ✅ Enrichissement module Entités - COMPLET

**Date** : 6 octobre 2025  
**Objectif** : Ajouter des champs spécifiques pour personnes physiques et sociétés

---

## 🎯 Fonctionnalités ajoutées

### 1. Personnes physiques (entityType = 'person')

**Nouveaux champs** :
- 📅 **Date de naissance** (type: date)
- 🆔 **Numéro de Registre National** (format: XX.XX.XX-XXX.XX)
- 📍 **Adresse physique** (textarea multi-lignes)
- 📞 **Numéros de téléphone** (liste dynamique)

**Exemple d'utilisation** :
```typescript
{
  label: "Jean Dupont",
  entityType: "person",
  personDetails: {
    dateOfBirth: "1985-03-15",
    nationalRegistryNumber: "85.03.15-123.45",
    physicalAddress: "Rue de la Loi 16\n1000 Bruxelles\nBelgique",
    phoneNumbers: ["+32 475 12 34 56", "+32 2 123 45 67"]
  }
}
```

---

### 2. Sociétés/Organisations (entityType = 'organization' | 'company')

**Nouveaux champs** :
- 🏢 **Numéro BCE** (Banque-Carrefour des Entreprises)
- 📍 **Adresse du siège social** (textarea)
- 🏭 **Adresses d'exploitation** (liste dynamique)
- 📞 **Numéros de téléphone** (liste dynamique)
- 🌐 **Site web** (URL avec lien cliquable)

**Exemple d'utilisation** :
```typescript
{
  label: "ACME Corporation",
  entityType: "company",
  companyDetails: {
    bceNumber: "0123.456.789",
    headquartersAddress: "Avenue Louise 54\n1050 Bruxelles",
    operationalAddresses: [
      "Rue du Commerce 12, 1000 Bruxelles",
      "Chaussée de Charleroi 45, 1060 Bruxelles"
    ],
    phoneNumbers: ["+32 2 555 12 34", "+32 2 555 56 78"],
    website: "https://acme-corp.be"
  }
}
```

---

## 📁 Fichiers modifiés

### 1. **frontend/src/services/api/reports.ts**

**Nouveaux types ajoutés** :

```typescript
export interface PersonDetails {
  dateOfBirth?: string;
  nationalRegistryNumber?: string;
  physicalAddress?: string;
  phoneNumbers?: string[];
}

export interface CompanyDetails {
  bceNumber?: string;
  headquartersAddress?: string;
  operationalAddresses?: string[];
  phoneNumbers?: string[];
  website?: string;
}

export interface EntityMetadata {
  entityType?: 'person' | 'organization' | 'company' | 'group' | 'alias' | 'other';
  aliases?: string[];
  isVerified?: boolean;
  personDetails?: PersonDetails;
  companyDetails?: CompanyDetails;
  relatedIdentifiers?: string[];
  relatedPlatforms?: string[];
  relatedMedia?: string[];
}
```

---

### 2. **frontend/src/components/modules/EntityEditModal.vue**

**Formulaire conditionnel** :

#### Section Personne (v-if="entityType === 'person'")
```vue
<div class="space-y-3 p-4 bg-base-200 rounded-lg">
  <h4>👤 Informations personnelles</h4>
  
  <!-- Date de naissance -->
  <input v-model="personDetails.dateOfBirth" type="date" />
  
  <!-- Numéro Registre National -->
  <input v-model="personDetails.nationalRegistryNumber" 
         placeholder="XX.XX.XX-XXX.XX" />
  
  <!-- Adresse physique -->
  <textarea v-model="personDetails.physicalAddress" 
            placeholder="Rue, numéro, code postal, ville, pays" />
  
  <!-- Téléphones (liste dynamique) -->
  <div v-for="(phone, index) in personDetails.phoneNumbers">
    <input :value="phone" @input="updatePersonPhone(index, $event)" />
    <button @click="removePersonPhone(index)">✕</button>
  </div>
  <button @click="addPersonPhone">+ Ajouter un numéro</button>
</div>
```

#### Section Société (v-if="entityType === 'organization' || 'company'")
```vue
<div class="space-y-3 p-4 bg-base-200 rounded-lg">
  <h4>🏢 Informations société</h4>
  
  <!-- Numéro BCE + Site web -->
  <input v-model="companyDetails.bceNumber" placeholder="0XXX.XXX.XXX" />
  <input v-model="companyDetails.website" type="url" />
  
  <!-- Siège social -->
  <textarea v-model="companyDetails.headquartersAddress" />
  
  <!-- Adresses d'exploitation (liste) -->
  <div v-for="(addr, index) in companyDetails.operationalAddresses">
    <input :value="addr" @input="updateOperationalAddress(index, $event)" />
    <button @click="removeOperationalAddress(index)">✕</button>
  </div>
  <button @click="addOperationalAddress">+ Ajouter une adresse</button>
  
  <!-- Téléphones (liste) -->
  <div v-for="(phone, index) in companyDetails.phoneNumbers">
    <input :value="phone" @input="updateCompanyPhone(index, $event)" />
    <button @click="removeCompanyPhone(index)">✕</button>
  </div>
  <button @click="addCompanyPhone">+ Ajouter un numéro</button>
</div>
```

**Fonctions ajoutées** :
- `addPersonPhone()`, `updatePersonPhone()`, `removePersonPhone()`
- `addCompanyPhone()`, `updateCompanyPhone()`, `removeCompanyPhone()`
- `addOperationalAddress()`, `updateOperationalAddress()`, `removeOperationalAddress()`

---

### 3. **frontend/src/components/modules/EntityCard.vue**

**Affichage conditionnel** :

#### Pour les personnes
```vue
<div v-if="entityType === 'person' && hasPersonDetails">
  <div>🎂 Né(e) le: {{ formatDate(dateOfBirth) }}</div>
  <div>🆔 RRN: {{ nationalRegistryNumber }}</div>
  <div>📍 Adresse: {{ physicalAddress }}</div>
  <div>📞 Tél: <span v-for="phone">{{ phone }}</span></div>
</div>
```

#### Pour les sociétés
```vue
<div v-if="(entityType === 'organization' || 'company') && hasCompanyDetails">
  <div>🏢 BCE: {{ bceNumber }}</div>
  <div>📍 Siège: {{ headquartersAddress }}</div>
  <div>🏭 Exploitation: 
    <div v-for="addr">{{ addr }}</div>
  </div>
  <div>📞 Tél: <span v-for="phone">{{ phone }}</span></div>
  <div>🌐 Site: <a :href="website">{{ website }}</a></div>
</div>
```

**Computed properties ajoutées** :
- `entityType` : Type de l'entité
- `hasPersonDetails` : Vérifie si au moins un champ personne est rempli
- `hasCompanyDetails` : Vérifie si au moins un champ société est rempli
- `formatDate()` : Formate la date en français

---

## 🎨 UX/UI

### Formulaire conditionnel
- ✅ Sections colorées (bg-base-200) pour distinguer les blocs
- ✅ Icônes contextuelles (👤 pour personne, 🏢 pour société)
- ✅ Champs adaptés au type (date picker, textarea, listes dynamiques)
- ✅ Font-mono pour numéros (RRN, BCE, téléphones)
- ✅ Validation URL pour site web

### Carte d'affichage
- ✅ Affichage compact avec icônes
- ✅ Format lisible (date en français: "15 mars 1985")
- ✅ Badges pour téléphones multiples
- ✅ Lien cliquable pour site web (target="_blank")
- ✅ Sections conditionnelles (n'affiche que si données présentes)

---

## 🧪 Tests à effectuer

### Test 1 : Personne physique

**Procédure** :
1. Ouvrir module "Entités concernées"
2. Cliquer "➕ Nouvelle entité"
3. Sélectionner "👤 Personne physique"
4. Remplir :
   - Nom : "Jean Dupont"
   - Date de naissance : 15/03/1985
   - RRN : 85.03.15-123.45
   - Adresse : "Rue de la Loi 16, 1000 Bruxelles"
   - Ajouter 2 téléphones : "+32 475 12 34 56", "+32 2 123 45 67"
5. Sauvegarder

**Résultat attendu** :
- ✅ Carte affiche "🎂 Né(e) le: 15 mars 1985"
- ✅ Carte affiche "🆔 RRN: 85.03.15-123.45"
- ✅ Carte affiche "📍 Adresse: Rue de la Loi 16, 1000 Bruxelles"
- ✅ Carte affiche "📞 Tél:" avec 2 badges

---

### Test 2 : Société

**Procédure** :
1. Créer nouvelle entité
2. Sélectionner "🏢 Organisation" ou "🏭 Entreprise"
3. Remplir :
   - Nom : "ACME Corporation"
   - BCE : 0123.456.789
   - Siège : "Avenue Louise 54, 1050 Bruxelles"
   - Ajouter 2 adresses d'exploitation
   - Ajouter 2 téléphones
   - Site web : https://acme-corp.be
4. Sauvegarder

**Résultat attendu** :
- ✅ Carte affiche "🏢 BCE: 0123.456.789"
- ✅ Carte affiche "📍 Siège: Avenue Louise 54..."
- ✅ Carte affiche "🏭 Exploitation:" avec 2 adresses
- ✅ Carte affiche "📞 Tél:" avec badges
- ✅ Carte affiche "🌐 Site:" avec lien cliquable

---

### Test 3 : Modification

**Procédure** :
1. Cliquer "✏️" sur une entité existante
2. Modifier type de "Personne" → "Entreprise"
3. Vérifier que les champs se mettent à jour

**Résultat attendu** :
- ✅ Champs personne disparaissent
- ✅ Champs société apparaissent
- ✅ Données précédentes ne sont pas perdues (stockées dans metadata)

---

## 🔮 Évolutions futures

### Phase 2 : Croisements avec autres modules

**Idées d'implémentation** :

#### 1. Lien Entité ↔ IdentifierLookup
```typescript
// Dans EntityMetadata
relatedIdentifiers?: string[]; // IDs des identifiants liés

// Exemple : Jean Dupont lié à son téléphone
entity.relatedIdentifiers = ["identifier-123"];

// Affichage dans EntityCard
<div v-if="relatedIdentifiers.length">
  🔗 Identifiants liés: 
  <router-link v-for="id in relatedIdentifiers" :to="...">
    Voir identifiant
  </router-link>
</div>
```

#### 2. Lien Entité ↔ PlatformAnalysis
```typescript
relatedPlatforms?: string[]; // IDs des analyses de plateforme

// Exemple : Jean Dupont présent sur Facebook, Instagram
entity.relatedPlatforms = ["platform-fb-123", "platform-ig-456"];
```

#### 3. Lien Entité ↔ MediaGallery
```typescript
relatedMedia?: string[]; // IDs des médias (photos, screenshots)

// Exemple : Photo de Jean Dupont
entity.relatedMedia = ["media-screenshot-789"];
```

#### 4. Auto-suggestion depuis téléphones
```typescript
// Si un téléphone dans personDetails existe déjà dans IdentifierLookup
// → Proposer de lier automatiquement

function checkPhoneCrossReferences(phoneNumber: string) {
  // Rechercher dans tous les IdentifierLookup du rapport
  const identifiers = report.modules
    .filter(m => m.type === 'identifier_lookup')
    .flatMap(m => m.payload.findings);
  
  const matches = identifiers.filter(i => i.label === phoneNumber);
  
  if (matches.length > 0) {
    // Afficher suggestion : "Ce numéro existe déjà dans le rapport, lier ?"
  }
}
```

---

## 📊 Impact

### Avant
```
Entité: Jean Dupont
Type: Personne
Description: Suspect principal
```

### Après
```
Entité: Jean Dupont
Type: Personne physique 👤

🎂 Né(e) le: 15 mars 1985
🆔 RRN: 85.03.15-123.45
📍 Adresse: Rue de la Loi 16, 1000 Bruxelles, Belgique
📞 Tél: +32 475 12 34 56, +32 2 123 45 67

📋 Description: Suspect principal
✓ Entité vérifiée
🔍 Niveau de confiance: Confirmé
📎 2 sources
```

**Gain** :
- 🎯 Informations structurées et exploitables
- 🎯 Recherche facilitée (par RRN, BCE, téléphone)
- 🎯 Export PDF avec toutes les données
- 🎯 Prêt pour croisements automatiques
- 🎯 Conformité procédurale (données officielles)

---

## ✅ Checklist de validation

- [x] Types PersonDetails et CompanyDetails créés
- [x] EntityMetadata enrichi
- [x] Formulaire conditionnel (personne vs société)
- [x] Listes dynamiques (téléphones, adresses)
- [x] Affichage dans EntityCard
- [x] Format de date français
- [x] Lien cliquable pour site web
- [x] Icônes contextuelles
- [ ] Tests utilisateur
- [ ] Validation format RRN (regex)
- [ ] Validation format BCE (regex)
- [ ] Auto-complétion adresses (Google Maps API ?)
- [ ] Croisements avec autres modules

---

**Status** : ✅ PHASE 1 TERMINÉE  
**Prochaine étape** : Tests utilisateur et croisements inter-modules

